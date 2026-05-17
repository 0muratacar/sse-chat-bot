import { baseApi } from './baseApi';
import type { FeatureFlag, FeatureFlagTierOverride, User, Tier } from '@sse-chat-bot/shared';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllFlags: builder.query<{ data: FeatureFlag[] }, void>({
      query: () => '/admin/features',
      providesTags: ['FeatureFlag'],
    }),
    getFlag: builder.query<FeatureFlag, string>({
      query: (key) => `/admin/features/${key}`,
      providesTags: (_result, _error, key) => [{ type: 'FeatureFlag', id: key }],
    }),
    createFlag: builder.mutation<FeatureFlag, { key: string; value: string; type: string; description?: string }>({
      query: (body) => ({
        url: '/admin/features',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FeatureFlag'],
    }),
    updateFlag: builder.mutation<FeatureFlag, { key: string; value: string }>({
      query: ({ key, ...body }) => ({
        url: `/admin/features/${key}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { key }) => [{ type: 'FeatureFlag', id: key }, 'FeatureFlag'],
    }),
    deleteFlag: builder.mutation<void, string>({
      query: (key) => ({
        url: `/admin/features/${key}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FeatureFlag'],
    }),
    getTierOverrides: builder.query<{ data: FeatureFlagTierOverride[] }, string>({
      query: (key) => `/admin/features/${key}/tiers`,
      providesTags: (_result, _error, key) => [{ type: 'FeatureFlag', id: `${key}-tiers` }],
    }),
    setTierOverride: builder.mutation<FeatureFlagTierOverride, { key: string; tier: Tier; value: string }>({
      query: ({ key, tier, ...body }) => ({
        url: `/admin/features/${key}/tiers/${tier}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { key }) => [{ type: 'FeatureFlag', id: `${key}-tiers` }],
    }),
    deleteTierOverride: builder.mutation<void, { key: string; tier: Tier }>({
      query: ({ key, tier }) => ({
        url: `/admin/features/${key}/tiers/${tier}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { key }) => [{ type: 'FeatureFlag', id: `${key}-tiers` }],
    }),
    getUsers: builder.query<{ data: User[] }, void>({
      query: () => '/admin/users',
      providesTags: ['User'],
    }),
    updateUserTier: builder.mutation<User, { id: string; tier: Tier }>({
      query: ({ id, ...body }) => ({
        url: `/admin/users/${id}/tier`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetAllFlagsQuery,
  useGetFlagQuery,
  useCreateFlagMutation,
  useUpdateFlagMutation,
  useDeleteFlagMutation,
  useGetTierOverridesQuery,
  useSetTierOverrideMutation,
  useDeleteTierOverrideMutation,
  useGetUsersQuery,
  useUpdateUserTierMutation,
} = adminApi;
