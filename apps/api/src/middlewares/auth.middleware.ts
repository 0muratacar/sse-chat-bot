import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { t } from '../i18n';
import logger from '../utils/logger';
import { AuthenticatedRequest, Role, Tier } from '../types';
import prismaService from '../utils/prisma';

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: t('UNAUTHORIZED', req.lang), status: 401 },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.get('jwtSecret')) as { id: string; email: string; role: Role };
    const user = await prismaService.getClient().user.findUnique({ where: { id: payload.id } });

    if (!user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: t('INVALID_TOKEN', req.lang), status: 401 },
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      tier: (user.tier as Tier) || Tier.INDIVIDUAL,
    };
    next();
  } catch (err) {
    logger.warn('JWT verification failed', { error: (err as Error).message });
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: t('INVALID_TOKEN', req.lang), status: 401 },
    });
  }
}
