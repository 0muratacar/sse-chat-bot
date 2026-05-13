import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      clientType: req.headers['x-client-type'] || 'unknown',
    });
  });

  next();
}
