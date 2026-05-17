import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('X-Firebase-AppCheck', 'mock-token');
      headers.set('X-Client-Type', 'web');
      return headers;
    },
  }),
  tagTypes: ['Chat', 'FeatureFlag', 'User'],
  endpoints: () => ({}),
});
