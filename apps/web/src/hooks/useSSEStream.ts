'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  startStreaming,
  appendToBuffer,
  finishStreaming,
  addOptimisticMessage,
  markMessageFailed,
} from '@/lib/slices/chatSlice';

export function useSSEStream(chatId: string) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const lang = useAppSelector((state) => state.lang.lang);
  const isStreaming = useAppSelector((state) => state.chat.isStreaming);

  const sendMessage = useCallback(async (content: string) => {
    const optimisticId = `opt-${Date.now()}`;
    dispatch(addOptimisticMessage({ id: optimisticId, content }));
    dispatch(startStreaming());

    try {
      const response = await fetch(`/api/chats/${chatId}/completion?lang=${lang}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Firebase-AppCheck': 'mock-token',
          'X-Client-Type': 'web',
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        dispatch(markMessageFailed(optimisticId));
        dispatch(finishStreaming());
        return;
      }

      const contentType = response.headers.get('content-type');

      if (contentType?.includes('text/event-stream')) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === 'content') {
                  dispatch(appendToBuffer(event.data.content));
                } else if (event.type === 'done') {
                  dispatch(finishStreaming());
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        }
        dispatch(finishStreaming());
      } else {
        const json = await response.json();
        if (json.message?.content) {
          dispatch(appendToBuffer(json.message.content));
        }
        dispatch(finishStreaming());
      }
    } catch {
      dispatch(markMessageFailed(optimisticId));
      dispatch(finishStreaming());
    }
  }, [chatId, token, lang, dispatch]);

  return { sendMessage, isStreaming };
}
