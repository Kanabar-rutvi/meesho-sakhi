import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

const standardRateLimitHandler = (req, res, next, options) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  res.status(options.statusCode).json({
    error: {
      code: "RATE_LIMITED",
      message: options.message,
      request_id: reqId
    }
  });
};

// Global API limiter (unauthenticated or general routes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: "Too many requests from this IP, please try again after 15 minutes.",
  handler: standardRateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for authentication routes (login, register, verify, resend)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 auth requests per hour
  message: "Too many authentication attempts, please try again after an hour.",
  handler: standardRateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoints daily quota (20 requests per day per verified user)
export const aiDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20, // 20 requests per day
  keyGenerator: (req) => {
    // Rely on the authenticated user ID set by `authenticateToken` middleware
    return req.user ? req.user.id.toString() : (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
  },
  message: "Daily AI quota exhausted. Please try again tomorrow.",
  handler: standardRateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoints per-minute burst quota (5 requests per minute per verified user)
export const aiMinuteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  keyGenerator: (req) => {
    return req.user ? req.user.id.toString() : (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
  },
  message: "Too many requests. Please slow down and try again in a minute.",
  handler: standardRateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});
