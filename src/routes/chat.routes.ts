import { RouteDefinition } from './route.types';
import { chatIdParamsSchema, completionBodySchema, createChatSchema } from '../middlewares/schemas';

export const chatRoutes: RouteDefinition[] = [
  {
    path: '/',
    method: 'get',
    controller: 'chatController.getChats',
    config: {
      description: 'Get paginated chat list for authenticated user',
      middlewares: ['appCheck', 'auth', 'clientType'],
      tags: ['chat'],
    },
  },
  {
    path: '/',
    method: 'post',
    controller: 'chatController.createChat',
    config: {
      description: 'Create a new chat',
      middlewares: ['appCheck', 'auth', 'clientType'],
      validation: { body: createChatSchema },
      tags: ['chat'],
    },
  },
  {
    path: '/:chatId/history',
    method: 'get',
    controller: 'chatController.getChatHistory',
    config: {
      description: 'Get chat message history',
      middlewares: ['appCheck', 'auth', 'clientType'],
      validation: { params: chatIdParamsSchema },
      tags: ['chat'],
    },
  },
  {
    path: '/:chatId/completion',
    method: 'post',
    controller: 'completionController.complete',
    config: {
      description: 'Send message and get AI completion (SSE or JSON)',
      middlewares: ['appCheck', 'auth', 'clientType'],
      validation: { params: chatIdParamsSchema, body: completionBodySchema },
      tags: ['chat', 'completion'],
    },
  },
];
