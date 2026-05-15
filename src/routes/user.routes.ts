import { RouteDefinition } from './route.types';
import { updateProfileSchema } from '../middlewares/schemas';

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
  {
    path: '/me',
    method: 'patch',
    controller: 'userController.updateProfile',
    config: {
      description: 'Update current user name',
      middlewares: ['appCheck', 'auth'],
      validation: { body: updateProfileSchema },
      tags: ['user'],
    },
  },
];
