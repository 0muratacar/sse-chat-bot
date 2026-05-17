'use client';

import { use, useEffect } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { setActiveChat } from '@/lib/slices/chatSlice';
import { ChatStream } from '@/components/chat/ChatStream';

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setActiveChat(chatId));
  }, [chatId, dispatch]);

  return <ChatStream chatId={chatId} />;
}
