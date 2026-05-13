import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function errorHandlerMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      status: 500,
    },
  });
}
