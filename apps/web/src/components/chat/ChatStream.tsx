'use client';

import { useEffect, useRef } from 'react';
import { useGetChatHistoryQuery } from '@/lib/api/chatApi';
import { useSSEStream } from '@/hooks/useSSEStream';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { clearBuffer } from '@/lib/slices/chatSlice';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot } from 'lucide-react';
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

  const messages: Message[] = data || [];

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
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl glass">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Bir mesaj göndererek sohbete başlayın
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role as 'user' | 'assistant'} content={msg.content} />
          ))}
          {isStreaming && streamingBuffer && (
            <ChatMessage role="assistant" content={streamingBuffer} />
          )}
          {isStreaming && !streamingBuffer && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="glass rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
