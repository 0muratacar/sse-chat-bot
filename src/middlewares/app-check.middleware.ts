import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function appCheckMiddleware(req: Request, res: Response, next: NextFunction): void {
  const appCheckToken = req.headers['x-firebase-appcheck'] as string;

  if (!appCheckToken) {
    logger.warn('Missing App Check token', { ip: req.ip, path: req.path });
    res.status(403).json({
      error: { code: 'APP_CHECK_FAILED', message: 'Missing Firebase App Check token', status: 403 },
    });
    return;
  }

  if (appCheckToken === 'invalid') {
    logger.warn('Invalid App Check token', { ip: req.ip, path: req.path });
    res.status(403).json({
      error: { code: 'APP_CHECK_FAILED', message: 'Invalid Firebase App Check token', status: 403 },
    });
    return;
  }

  next();
}
