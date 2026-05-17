import { Request, Response, NextFunction } from 'express';
import { appCheckMiddleware } from '../../src/middlewares/app-check.middleware';
import { clientTypeMiddleware } from '../../src/middlewares/client-type.middleware';
import { AuthenticatedRequest } from '../../src/types';

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('appCheckMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {}, ip: '127.0.0.1', path: '/test' };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should pass with valid token', () => {
    req.headers = { 'x-firebase-appcheck': 'valid-token' };
    appCheckMiddleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject missing token', () => {
    appCheckMiddleware(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject invalid token', () => {
    req.headers = { 'x-firebase-appcheck': 'invalid' };
    appCheckMiddleware(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('clientTypeMiddleware', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
  });

  it('should detect mobile client', () => {
    req.headers = { 'x-client-type': 'mobile' };
    clientTypeMiddleware(req as AuthenticatedRequest, res as Response, next);
    expect(req.clientType).toBe('mobile');
  });

  it('should default to web for unknown client type', () => {
    req.headers = { 'x-client-type': 'unknown' };
    clientTypeMiddleware(req as AuthenticatedRequest, res as Response, next);
    expect(req.clientType).toBe('web');
  });

  it('should default to web when header missing', () => {
    clientTypeMiddleware(req as AuthenticatedRequest, res as Response, next);
    expect(req.clientType).toBe('web');
  });
});
