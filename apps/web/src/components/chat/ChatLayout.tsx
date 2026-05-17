'use client';

import { useState } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { useAuth } from '@/hooks/useAuth';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-72' : 'w-0'
        } overflow-hidden`}
      >
        <ChatSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
          <LanguageSwitcher />
        </div>

        {/* Chat content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
