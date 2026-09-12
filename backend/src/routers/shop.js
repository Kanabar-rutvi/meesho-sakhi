import express from 'express';
import crypto from 'crypto';
import { authenticateToken } from './auth.js';
import { aiDailyLimiter, aiMinuteLimiter } from '../middlewares/rateLimiter.js';
import { createErrorResponse } from '../middlewares/errorHandler.js';
import { AgentOrchestrator } from '../utils/orchestrator.js';
import CATALOG from '../utils/catalog.js';
import { getContext } from '../utils/conversationContext.js';

const router = express.Router();

// Apply authentication and rate limits to all shop endpoints
router.use(authenticateToken);
router.use(aiDailyLimiter);
router.use(aiMinuteLimiter);

// ─── Idempotency tracking (in-memory; swap to Redis in production) ───────────
const activeRequests = new Map(); // userId -> Set<requestId>

router.post('/', async (req, res) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  const userId = req.user.id;

  try {
    const { query, session_id, conversation_id } = req.body || {};
    if (!query || !query.trim()) {
      return res.status(400).json(createErrorResponse("VALIDATION_ERROR", "Shopping query cannot be empty.", requestId));
    }

    // Idempotency: prevent duplicate concurrent requests from the same user
    if (!activeRequests.has(userId)) {
      activeRequests.set(userId, new Set());
    }
    const userActive = activeRequests.get(userId);
    if (userActive.size >= 2) {
      return res.status(409).json(createErrorResponse("DUPLICATE_REQUEST", "You already have an active shopping request. Please wait for it to complete.", requestId));
    }
    userActive.add(requestId);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Request-Id', requestId);

    // Generate conversation ID if not provided
    const conversationId = conversation_id || crypto.randomUUID();

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', request_id: requestId, conversation_id: conversationId })}\n\n`);

    // Handle client disconnect
    let clientDisconnected = false;
    req.on('close', () => {
      clientDisconnected = true;
      userActive.delete(requestId);
      if (userActive.size === 0) activeRequests.delete(userId);
    });

    // Retrieve previous conversation context if available
    const conversationContext = getContext(conversationId);

    const orchestrator = new AgentOrchestrator(CATALOG, userId, session_id || null, conversationId, conversationContext);
    let eventIndex = 0;

    for await (const chunk of orchestrator.executeFullPlan(query)) {
      if (clientDisconnected) break;

      // Inject event ID and request ID into every SSE chunk
      try {
        // Parse the chunk to inject metadata
        const dataMatch = chunk.match(/^data: (.+)$/m);
        if (dataMatch) {
          const parsed = JSON.parse(dataMatch[1]);
          parsed.event_id = eventIndex++;
          parsed.request_id = requestId;
          res.write(`data: ${JSON.stringify(parsed)}\n\n`);
        } else {
          res.write(chunk);
        }
      } catch {
        // If we can't parse/enrich the chunk, send it raw
        res.write(chunk);
      }
    }

    // Send completion marker
    if (!clientDisconnected) {
      res.write(`data: ${JSON.stringify({ type: 'stream_end', request_id: requestId })}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error(`[shop] Pipeline error (request_id=${requestId}):`, error.message);
    // Log stack trace server-side only
    if (process.env.NODE_ENV !== 'production') {
      console.error(error.stack);
    }

    // Determine a safe user-facing error message
    let userMessage = "Something went wrong while planning your cart. Please try again.";
    let errorCode = "PIPELINE_ERROR";

    if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      userMessage = "AI service quota reached. Please try again later.";
      errorCode = "PROVIDER_RATE_LIMITED";
    } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      userMessage = "The request timed out. Please try again.";
      errorCode = "TIMEOUT";
    } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ENOTFOUND')) {
      userMessage = "Unable to reach the AI service. Please try again shortly.";
      errorCode = "SERVICE_UNAVAILABLE";
    }

    // If headers not yet sent, we can send JSON error
    if (!res.headersSent) {
      return res.status(500).json(createErrorResponse(errorCode, userMessage, requestId));
    }

    // If SSE stream is already open, send error as SSE event
    try {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: { code: errorCode, message: userMessage, request_id: requestId }
      })}\n\n`);
    } catch { /* client may have disconnected */ }
    res.end();
  } finally {
    // Clean up idempotency tracker
    const userActive = activeRequests.get(userId);
    if (userActive) {
      userActive.delete(requestId);
      if (userActive.size === 0) activeRequests.delete(userId);
    }
  }
});

export default router;
