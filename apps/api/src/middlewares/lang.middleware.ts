import { Request, Response, NextFunction } from 'express';
import { isValidLang, Lang } from '../i18n';

declare global {
  namespace Express {
    interface Request {
      lang: Lang;
    }
  }
}

export function langMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const lang = req.query.lang as string;
  req.lang = isValidLang(lang) ? lang : 'en';
  next();
}
