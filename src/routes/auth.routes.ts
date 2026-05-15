import { RouteDefinition } from './route.types';
import { requestOtpSchema, verifyOtpSchema } from '../middlewares/schemas';

export const authRoutes: RouteDefinition[] = [
  {
    path: '/auth/request-otp',
    method: 'post',
    controller: 'authController.requestOtp',
    config: {
      description: 'Send OTP code to email',
      middlewares: [],
      validation: { body: requestOtpSchema },
      tags: ['auth'],
    },
  },
  {
    path: '/auth/verify-otp',
    method: 'post',
    controller: 'authController.verifyOtp',
    config: {
      description: 'Verify OTP and get JWT token',
      middlewares: [],
      validation: { body: verifyOtpSchema },
      tags: ['auth'],
    },
  },
];
