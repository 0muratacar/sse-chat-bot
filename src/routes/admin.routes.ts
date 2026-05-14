import { RouteDefinition } from './route.types';
import { createFlagSchema, updateFlagSchema } from '../middlewares/schemas';

export const adminRoutes: RouteDefinition[] = [
  {
    path: '/features',
    method: 'get',
    controller: 'adminController.getAllFlags',
    config: {
      description: 'List all feature flags',
      middlewares: ['appCheck', 'auth', 'admin'],
      tags: ['admin', 'feature-flag'],
    },
  },
  {
    path: '/features/:key',
    method: 'get',
    controller: 'adminController.getFlag',
    config: {
      description: 'Get a single feature flag by key',
      middlewares: ['appCheck', 'auth', 'admin'],
      tags: ['admin', 'feature-flag'],
    },
  },
  {
    path: '/features/:key',
    method: 'put',
    controller: 'adminController.updateFlag',
    config: {
      description: 'Update feature flag value',
      middlewares: ['appCheck', 'auth', 'admin'],
      validation: { body: updateFlagSchema },
      tags: ['admin', 'feature-flag'],
    },
  },
  {
    path: '/features',
    method: 'post',
    controller: 'adminController.createFlag',
    config: {
      description: 'Create a new feature flag',
      middlewares: ['appCheck', 'auth', 'admin'],
      validation: { body: createFlagSchema },
      tags: ['admin', 'feature-flag'],
    },
  },
];
