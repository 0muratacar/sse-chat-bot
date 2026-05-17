'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetChatsQuery, useCreateChatMutation } from '@/lib/api/chatApi';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setActiveChat } from '@/lib/slices/chatSlice';
import { logout } from '@/lib/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquarePlus, LogOut } from 'lucide-react';

export function ChatSidebar() {
  const [newTitle, setNewTitle] = useState('');
  const [showInput, setShowInput] = useState(false);
  const { data, isLoading } = useGetChatsQuery();
  const [createChat] = useCreateChatMutation();
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const chat = await createChat({ title: newTitle.trim() }).unwrap();
    setNewTitle('');
    setShowInput(false);
    dispatch(setActiveChat(chat.id));
    router.push(`/chat/${chat.id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-neutral-50">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-sm font-semibold">Chats</h2>
        <Button variant="ghost" size="icon" onClick={() => setShowInput(!showInput)}>
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      </div>

      {showInput && (
        <div className="flex gap-2 px-4 pb-2">
          <Input
            placeholder="Chat title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="h-8 text-sm"
          />
          <Button size="sm" onClick={handleCreate}>+</Button>
        </div>
      )}

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading && <p className="p-2 text-sm text-muted-foreground">Loading...</p>}
          {data?.data?.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                dispatch(setActiveChat(chat.id));
                router.push(`/chat/${chat.id}`);
              }}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-100 ${
                activeChatId === chat.id ? 'bg-neutral-200 font-medium' : ''
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </ScrollArea>

      <Separator />
      <div className="flex items-center justify-between p-4">
        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
