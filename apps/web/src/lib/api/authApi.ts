import { baseApi } from './baseApi';
import type { AuthResponse } from '@sse-chat-bot/shared';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    requestOtp: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/request-otp',
        method: 'POST',
        body,
      }),
    }),
    verifyOtp: builder.mutation<AuthResponse, { email: string; otp: string }>({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useRequestOtpMutation, useVerifyOtpMutation } = authApi;
