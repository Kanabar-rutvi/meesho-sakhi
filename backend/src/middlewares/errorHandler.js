import crypto from 'crypto';

/**
 * Standardized API error response format.
 * 
 * Every error returned by this API will have the shape:
 * {
 *   error: {
 *     code: "ERROR_CODE",
 *     message: "Human-readable message",
 *     request_id: "uuid"
 *   }
 * }
 * 
 * Stack traces, SQL, filesystem paths, and provider internals are NEVER exposed.
 */

// Map Prisma error codes to safe, generic messages
const PRISMA_ERROR_MAP = {
  P2002: { status: 409, code: "CONFLICT", message: "A record with this information already exists." },
  P2025: { status: 404, code: "NOT_FOUND", message: "The requested resource was not found." },
  P2003: { status: 400, code: "INVALID_REFERENCE", message: "Invalid reference in request data." },
  P2010: { status: 500, code: "INTERNAL_ERROR", message: "Something went wrong on our side. Please try again." },
};

/**
 * Helper to create a standardized error response JSON object.
 * Can be used by any route handler to send consistent errors.
 */
export function createErrorResponse(code, message, requestId) {
  return {
    error: {
      code,
      message,
      request_id: requestId || crypto.randomUUID(),
    }
  };
}

/**
 * Express global error handler middleware.
 * Must be registered LAST with app.use().
 */
export const errorHandler = (err, req, res, _next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();

  // Log full details server-side (never sent to client)
  console.error(`[ERROR] request_id=${requestId} path=${req.path}`, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // If headers are already sent (e.g. mid-SSE stream), we can't send JSON
  if (res.headersSent) {
    return;
  }

  // Handle Prisma-specific errors
  if (err.constructor?.name === 'PrismaClientKnownRequestError' && PRISMA_ERROR_MAP[err.code]) {
    const mapped = PRISMA_ERROR_MAP[err.code];
    return res.status(mapped.status).json(createErrorResponse(mapped.code, mapped.message, requestId));
  }

  // Handle Prisma validation errors
  if (err.constructor?.name === 'PrismaClientValidationError') {
    return res.status(400).json(createErrorResponse("VALIDATION_ERROR", "Invalid request data.", requestId));
  }

  // Handle Prisma connection errors
  if (err.constructor?.name === 'PrismaClientInitializationError' || 
      err.constructor?.name === 'PrismaClientRustPanicError') {
    return res.status(503).json(createErrorResponse("SERVICE_UNAVAILABLE", "Service is temporarily unavailable. Please try again shortly.", requestId));
  }

  // Handle known application errors (with explicit status)
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");
  
  // Never expose raw error messages for 5xx errors
  const safeMessage = status >= 500
    ? "Something went wrong on our side. Please try again."
    : (err.message || "An error occurred.");

  res.status(status).json(createErrorResponse(code, safeMessage, requestId));
};
