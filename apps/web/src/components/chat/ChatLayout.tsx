'use client';

import { ChatSidebar } from './ChatSidebar';
import { useAuth } from '@/hooks/useAuth';

export function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
