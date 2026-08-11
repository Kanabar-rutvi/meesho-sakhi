// Vercel Serverless Function Entry Point
// Mounts the Express app (backend/src/app.js) into a single serverless handler
// Catch-all route [[...meesho]] matches ALL /api/* paths (including /api itself)
// We strip the "/api" prefix before passing to Express (routes are mounted as /auth, /shop, etc.)

import dotenv from 'dotenv';
dotenv.config({ path: new URL('../backend/.env', import.meta.url).pathname });

import expressApp from '../backend/src/app.js';
import serverless from '@vendia/serverless-express';

export const config = {
  maxDuration: 60,
  includeFiles: [
    "backend/prisma/schema.prisma",
    "backend/catalog.json",
    "backend/prisma/dev.db",
  ],
};

// Lazy-init so cold start happens once per container
let handler;
function createHandler() {
  return serverless({
    app: expressApp,
    // Binary mode is REQUIRED so SSE streams (shop/ endpoint)
    // aren't double-base64-encoded / truncated by API Gateway.
    binary: true,
    binaryMimeTypes: [
      'application/octet-stream',
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/avif',
      'text/event-stream',
      'application/json',
    ],
  });
}

export default function (event, context) {
  if (!handler) {
    handler = createHandler();
  }
  // Strip /api prefix before handing the event to the Express adapter
  // (Vercel routes /api/* here, but our Express routes live at /*)
  const path = event.path || event.rawPath || '';
  event.path = path.replace(/^\/api/, '') || '/';
  event.rawPath = event.path;
  if (event.requestContext && event.requestContext.http) {
    event.requestContext.http.path = event.path;
  }
  // Ensure callbackWaitsForEmptyEventLoop = false so SSE streams flush
  // and Prisma client doesn't hang the function lifecycle
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }
  return handler(event, context);
}
