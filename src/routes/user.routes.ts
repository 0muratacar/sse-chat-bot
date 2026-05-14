import { RouteDefinition } from './route.types';

export const userRoutes: RouteDefinition[] = [
  {
    path: '/me',
    method: 'get',
    controller: 'userController.getMe',
    config: {
      description: 'Get current user profile',
      middlewares: ['appCheck', 'auth'],
      tags: ['user'],
    },
  },
];
