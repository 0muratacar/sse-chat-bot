import { Router } from 'express';
import { registerRoutes } from './route.registry';
import { chatRoutes } from './chat.routes';
import { adminRoutes } from './admin.routes';

const router = Router();

const routeGroups = [
  { prefix: '/chats', routes: chatRoutes },
  { prefix: '/admin', routes: adminRoutes },
];

for (const group of routeGroups) {
  const subRouter = Router();
  registerRoutes(subRouter, group.routes);
  router.use(group.prefix, subRouter);
}

export default router;
