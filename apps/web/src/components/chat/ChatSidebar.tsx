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
import { MessageSquarePlus, LogOut, Bot, X } from 'lucide-react';

interface ChatSidebarProps {
  onClose: () => void;
}

export function ChatSidebar({ onClose }: ChatSidebarProps) {
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
    <div className="flex h-full w-72 flex-col border-r border-border bg-sidebar-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Sohbetler</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInput(!showInput)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* New chat input */}
      {showInput && (
        <div className="flex gap-2 px-4 pb-3">
          <Input
            placeholder="Sohbet başlığı..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="h-9 border-glass-border bg-glass text-sm text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <Button
            size="sm"
            onClick={handleCreate}
            className="bg-primary text-white hover:bg-primary/80"
          >
            +
          </Button>
        </div>
      )}

      {/* Chat list */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          {isLoading && (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-sidebar-hover" />
              ))}
            </div>
          )}
          {data?.data?.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                dispatch(setActiveChat(chat.id));
                router.push(`/chat/${chat.id}`);
              }}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                activeChatId === chat.id
                  ? 'bg-sidebar-active text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-sidebar-hover hover:text-foreground'
              }`}
            >
              <span className="line-clamp-1">{chat.title}</span>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
              <span className="text-xs font-medium text-primary">
                {user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
