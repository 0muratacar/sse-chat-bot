import { RouteDefinition } from './route.types';
import { createFlagSchema, updateFlagSchema, updateTierOverrideSchema, updateUserTierSchema, tierParamSchema, userIdParamSchema } from '../middlewares/schemas';

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
  {
    path: '/features/:key',
    method: 'delete',
    controller: 'adminController.deleteFlag',
    config: {
      description: 'Delete a feature flag',
      middlewares: ['appCheck', 'auth', 'admin'],
      tags: ['admin', 'feature-flag'],
    },
  },
  {
    path: '/features/:key/tiers',
    method: 'get',
    controller: 'adminController.getTierOverrides',
    config: {
      description: 'List all tier overrides for a feature flag',
      middlewares: ['appCheck', 'auth', 'admin'],
      tags: ['admin', 'feature-flag', 'tier'],
    },
  },
  {
    path: '/features/:key/tiers/:tier',
    method: 'put',
    controller: 'adminController.setTierOverride',
    config: {
      description: 'Set or update a tier override for a feature flag',
      middlewares: ['appCheck', 'auth', 'admin'],
      validation: { params: tierParamSchema, body: updateTierOverrideSchema },
      tags: ['admin', 'feature-flag', 'tier'],
    },
  },
  {
    path: '/features/:key/tiers/:tier',
    method: 'delete',
    controller: 'adminController.deleteTierOverride',
    config: {
      description: 'Delete a tier override (falls back to global value)',
      middlewares: ['appCheck', 'auth', 'admin'],
      validation: { params: tierParamSchema },
      tags: ['admin', 'feature-flag', 'tier'],
    },
  },
  {
    path: '/users/:id/tier',
    method: 'put',
    controller: 'adminController.updateUserTier',
    config: {
      description: 'Update a user subscription tier',
      middlewares: ['appCheck', 'auth', 'admin'],
      validation: { params: userIdParamSchema, body: updateUserTierSchema },
      tags: ['admin', 'user', 'tier'],
    },
  },
];
