'use client';

import { useEffect, useRef } from 'react';
import { useGetChatHistoryQuery } from '@/lib/api/chatApi';
import { useSSEStream } from '@/hooks/useSSEStream';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { clearBuffer } from '@/lib/slices/chatSlice';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message } from '@sse-chat-bot/shared';

interface ChatStreamProps {
  chatId: string;
}

export function ChatStream({ chatId }: ChatStreamProps) {
  const { data, refetch } = useGetChatHistoryQuery(chatId);
  const { sendMessage, isStreaming } = useSSEStream(chatId);
  const streamingBuffer = useAppSelector((state) => state.chat.streamingBuffer);
  const dispatch = useAppDispatch();
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages: Message[] = data?.data || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingBuffer]);

  useEffect(() => {
    if (!isStreaming && streamingBuffer) {
      refetch();
      dispatch(clearBuffer());
    }
  }, [isStreaming, streamingBuffer, refetch, dispatch]);

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role as 'user' | 'assistant'} content={msg.content} />
          ))}
          {isStreaming && streamingBuffer && (
            <ChatMessage role="assistant" content={streamingBuffer} />
          )}
        </div>
      </ScrollArea>
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
