import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { t } from '../i18n';
import logger from '../utils/logger';

export function errorHandlerMiddleware(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({
          error: { code: 'CONFLICT', message: t('CONFLICT', req.lang), status: 409 },
        });
        return;
      case 'P2025':
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: t('NOT_FOUND', req.lang), status: 404 },
        });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    logger.error('Database connection failed', { error: err.message });
    res.status(503).json({
      error: { code: 'SERVICE_UNAVAILABLE', message: t('SERVICE_UNAVAILABLE', req.lang), status: 503 },
    });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: t('INTERNAL_SERVER_ERROR', req.lang),
      status: 500,
    },
  });
}
