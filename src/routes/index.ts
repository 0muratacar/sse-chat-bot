import { Router } from 'express';
import { registerRoutes } from './route.registry';
import { chatRoutes } from './chat.routes';
import { adminRoutes } from './admin.routes';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';

const router = Router();

const routeGroups = [
  { prefix: '/chats', routes: chatRoutes },
  { prefix: '/admin', routes: adminRoutes },
  { prefix: '/auth', routes: authRoutes },
  { prefix: '/users', routes: userRoutes },
];

for (const group of routeGroups) {
  const subRouter = Router();
  registerRoutes(subRouter, group.routes);
  router.use(group.prefix, subRouter);
}

export default router;
