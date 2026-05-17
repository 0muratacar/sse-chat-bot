import express from 'express';
import cors from 'cors';
import { loggingMiddleware, langMiddleware, errorHandlerMiddleware } from './middlewares';
import routes from './routes';
import { swaggerSpec } from './config/swagger';

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

// Body parsing
app.use(express.json());

// Global middlewares
app.use(loggingMiddleware);
app.use(langMiddleware);

// Health check (no auth required)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// OpenAPI spec + Scalar docs UI
app.get('/docs.json', (_req, res) => { res.json(swaggerSpec); });
app.get('/docs', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html>
<html>
<head><title>SSE Chat Bot API</title><meta charset="utf-8"/></head>
<body>
  <script id="api-reference" data-url="/docs.json"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`);
});

// API routes
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandlerMiddleware);

export default app;
