import { baseApi } from './baseApi';
import type { Chat, Message } from '@sse-chat-bot/shared';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query<{ data: Chat[] }, void>({
      query: () => '/chats',
      providesTags: ['Chat'],
    }),
    createChat: builder.mutation<Chat, { title: string }>({
      query: (body) => ({
        url: '/chats',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: Chat }) => response.data,
      invalidatesTags: ['Chat'],
    }),
    getChatHistory: builder.query<Message[], string>({
      query: (chatId) => `/chats/${chatId}/history`,
      transformResponse: (response: { data: { messages: Message[] } }) => response.data.messages,
    }),
  }),
});

export const { useGetChatsQuery, useCreateChatMutation, useGetChatHistoryQuery } = chatApi;
