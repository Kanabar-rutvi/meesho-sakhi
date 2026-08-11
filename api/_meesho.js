// Vercel Serverless Function Entry Point
// Mounts the Express app (backend/src/app.js) into a single serverless handler
// In production, all routes (/shop, /auth, /learn, /admin) come here via /api/* rewrites
// We strip the "/api" prefix before passing to Express (routes are mounted as /auth, /shop, etc.)

import expressApp from '../backend/src/app.js';
import serverless from '@vendia/serverless-express';

export const config = {
  // Shop SSE can be long — bump maxDuration to avoid cold-start timeouts
  maxDuration: 60,
};

// Lazy-init so cold start happens once per container
let handler;
function createHandler() {
  return serverless({ app: expressApp });
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
  return handler(event, context);
}