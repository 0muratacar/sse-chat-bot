import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, Role } from '../types';
import { t } from '../i18n';

export function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== Role.ADMIN) {
    res.status(403).json({
      error: { code: 'FORBIDDEN', message: t('FORBIDDEN', req.lang), status: 403 },
    });
    return;
  }

  next();
}
