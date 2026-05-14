import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, Role } from '../types';

export function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== Role.ADMIN) {
    res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Admin access required', status: 403 },
    });
    return;
  }

  next();
}
