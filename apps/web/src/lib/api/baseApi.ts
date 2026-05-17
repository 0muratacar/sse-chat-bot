import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '../store';

const rawBaseQuery = fetchBaseQuery({
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
});

const baseQueryWithLang: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (
  args,
  api,
  extraOptions,
) => {
  const lang = (api.getState() as RootState).lang.lang;
  const separator = (typeof args === 'string' ? args : args.url).includes('?') ? '&' : '?';

  if (typeof args === 'string') {
    args = `${args}${separator}lang=${lang}`;
  } else {
    args = { ...args, url: `${args.url}${separator}lang=${lang}` };
  }

  return rawBaseQuery(args, api, extraOptions);
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithLang,
  tagTypes: ['Chat', 'FeatureFlag', 'User'],
  endpoints: () => ({}),
});
