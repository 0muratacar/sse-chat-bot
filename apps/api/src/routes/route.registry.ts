import { Router, Request, Response } from 'express';
import container from '../container';
import { RouteDefinition } from './route.types';
import { appCheckMiddleware, authMiddleware, adminMiddleware, clientTypeMiddleware, validateBody, validateParams } from '../middlewares';
import { ChatController } from '../controllers/chat.controller';
import { CompletionController } from '../controllers/completion.controller';
import { AdminController } from '../controllers/admin.controller';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import { AuthenticatedRequest } from '../types';

const middlewareMap: Record<string, any> = {
  appCheck: appCheckMiddleware,
  auth: authMiddleware,
  admin: adminMiddleware,
  clientType: clientTypeMiddleware,
};

const controllerMap: Record<string, () => any> = {
  chatController: () => container.resolve(ChatController),
  adminController: () => container.resolve(AdminController),
  completionController: () => container.resolve(CompletionController),
  authController: () => container.resolve(AuthController),
  userController: () => container.resolve(UserController),
};

export function registerRoutes(router: Router, routes: RouteDefinition[]): void {
  for (const route of routes) {
    const handlers: any[] = [];

    if (route.config.middlewares) {
      for (const mw of route.config.middlewares) {
        if (middlewareMap[mw]) {
          handlers.push(middlewareMap[mw]);
        }
      }
    }

    if (route.config.validation?.params) {
      handlers.push(validateParams(route.config.validation.params));
    }
    if (route.config.validation?.body) {
      handlers.push(validateBody(route.config.validation.body));
    }

    const [controllerName, methodName] = route.controller.split('.');
    const getController = controllerMap[controllerName];

    handlers.push((req: Request, res: Response) => {
      const ctrl = getController();
      return ctrl[methodName](req as AuthenticatedRequest, res);
    });

    router[route.method](route.path, ...handlers);
  }
}
