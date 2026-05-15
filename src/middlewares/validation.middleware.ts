import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
import { t } from '../i18n';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: t('VALIDATION_ERROR', req.lang),
            status: 400,
            details: (err as ZodError).issues.map((e: ZodIssue) => ({ path: e.path.join('.'), message: e.message })),
          },
        });
        return;
      }
      next(err);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: t('INVALID_PARAMS', req.lang),
            status: 400,
            details: (err as ZodError).issues.map((e: ZodIssue) => ({ path: e.path.join('.'), message: e.message })),
          },
        });
        return;
      }
      next(err);
    }
  };
}
