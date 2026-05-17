import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={cn('flex w-full gap-3', role === 'user' ? 'justify-end' : 'justify-start')}>
      {role === 'assistant' && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-3 text-sm',
          role === 'user'
            ? 'bg-primary text-white'
            : 'glass text-foreground'
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
      {role === 'user' && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/20">
          <User className="h-4 w-4 text-secondary" />
        </div>
      )}
    </div>
  );
}
