import { Router } from 'express';
import container from './container';
import { AdminController } from './controllers/admin.controller';
import { ChatController } from './controllers/chat.controller';
import { CompletionController } from './controllers/completion.controller';
import { appCheckMiddleware, authMiddleware, clientTypeMiddleware, validateBody, validateParams } from './middlewares';
import { createFlagSchema, updateFlagSchema, chatIdParamsSchema, completionBodySchema } from './middlewares/schemas';
import { AuthenticatedRequest } from './types';

const router = Router();

const adminController = new AdminController(container.featureFlagService);
const chatController = new ChatController(container.chatService);
const completionController = new CompletionController(container.completionService);

// Middleware chain for protected routes: App Check → Auth → Client Type
const protectedChain = [appCheckMiddleware, authMiddleware, clientTypeMiddleware];

// Chat routes
router.get('/chats', ...protectedChain, (req, res) => chatController.getChats(req as AuthenticatedRequest, res));
router.get('/chats/:chatId/history', ...protectedChain, validateParams(chatIdParamsSchema), (req, res) => chatController.getChatHistory(req as AuthenticatedRequest, res));
router.post('/chats/:chatId/completion', ...protectedChain, validateParams(chatIdParamsSchema), validateBody(completionBodySchema), (req, res) => completionController.complete(req as AuthenticatedRequest, res));

// Admin routes - Feature Flag Management (no auth for demo purposes)
router.get('/admin/features', (req, res) => adminController.getAllFlags(req, res));
router.get('/admin/features/:key', (req, res) => adminController.getFlag(req, res));
router.put('/admin/features/:key', validateBody(updateFlagSchema), (req, res) => adminController.updateFlag(req, res));
router.post('/admin/features', validateBody(createFlagSchema), (req, res) => adminController.createFlag(req, res));

export default router;
