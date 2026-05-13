import { z } from 'zod';

export const completionBodySchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000),
});

export const createFlagSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().min(1),
  type: z.enum(['BOOLEAN', 'NUMBER', 'STRING']),
  description: z.string().optional(),
});

export const updateFlagSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]).transform(String),
});

export const chatIdParamsSchema = z.object({
  chatId: z.string().uuid('Invalid chat ID format'),
});
