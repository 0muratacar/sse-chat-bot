import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { CLIENT_TYPES, ClientType } from '../config/constants';

export function clientTypeMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const clientType = (req.headers['x-client-type'] as string)?.toLowerCase();

  if (clientType && CLIENT_TYPES.includes(clientType as ClientType)) {
    req.clientType = clientType as ClientType;
  } else {
    req.clientType = 'web';
  }

  next();
}
