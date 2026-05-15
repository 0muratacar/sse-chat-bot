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

export const requestOtpSchema = z.object({
  email: z.string().max(254, 'Email must be at most 254 characters').email('Invalid email format'),
});

export const verifyOtpSchema = z.object({
  email: z.string().max(254, 'Email must be at most 254 characters').email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
});

export const createChatSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
});
