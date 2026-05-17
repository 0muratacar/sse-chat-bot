'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetChatsQuery, useCreateChatMutation } from '@/lib/api/chatApi';
import { useAppDispatch } from '@/lib/hooks';
import { setActiveChat } from '@/lib/slices/chatSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, MessageSquarePlus, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { data, isLoading } = useGetChatsQuery();
  const [createChat] = useCreateChatMutation();
  const [showDialog, setShowDialog] = useState(false);
  const [title, setTitle] = useState('');
  const dispatch = useAppDispatch();
  const router = useRouter();

  const chats = data?.data || [];

  const handleCreate = async () => {
    if (!title.trim()) return;
    const chat = await createChat({ title: title.trim() }).unwrap();
    setTitle('');
    setShowDialog(false);
    dispatch(setActiveChat(chat.id));
    router.push(`/chat/${chat.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (chats.length === 0 && !showDialog) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl glass glow" style={{ animation: 'float 4s ease-in-out infinite' }}>
            <Bot className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Hoş Geldiniz!</h2>
            <p className="mt-2 text-muted-foreground">
              AI asistanınızla sohbet etmeye başlayın. Yeni bir sohbet oluşturun ve sorularınızı sorun.
            </p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="h-12 bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity px-8"
          >
            <MessageSquarePlus className="mr-2 h-5 w-5" />
            Sohbet Başlat
          </Button>
        </div>
      </div>
    );
  }

  if (showDialog || chats.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl glass">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Yeni Sohbet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sohbetinize bir başlık verin
            </p>
          </div>

          <div className="glass-strong rounded-2xl p-6">
            <div className="space-y-4">
              <Input
                placeholder="Örn: React hakkında sorular..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="h-12 border-glass-border bg-glass text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                autoFocus
              />
              <div className="flex gap-3">
                {chats.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowDialog(false)}
                    className="flex-1 text-muted-foreground hover:text-foreground"
                  >
                    İptal
                  </Button>
                )}
                <Button
                  onClick={handleCreate}
                  disabled={!title.trim()}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity"
                >
                  Oluştur
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl glass">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">AI Chat Bot</h2>
        <p className="text-sm text-muted-foreground">
          Sol menüden bir sohbet seçin veya yeni bir sohbet başlatın
        </p>
      </div>
    </div>
  );
}
