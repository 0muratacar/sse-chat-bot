import express from 'express';
import { loggingMiddleware, errorHandlerMiddleware } from './middlewares';

const app = express();

// Body parsing
app.use(express.json());

// Global middleware: logging (applied to all routes)
app.use(loggingMiddleware);

// Health check (no auth required)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes will be registered here in next commits

// Error handler (must be last)
app.use(errorHandlerMiddleware);

export default app;
