import { RouteDefinition } from './route.types';
import { loginSchema } from '../middlewares/schemas';

export const authRoutes: RouteDefinition[] = [
  {
    path: '/login',
    method: 'post',
    controller: 'authController.login',
    config: {
      description: 'Login with email and password, returns JWT token',
      middlewares: [],
      validation: { body: loginSchema },
      tags: ['auth'],
    },
  },
];
