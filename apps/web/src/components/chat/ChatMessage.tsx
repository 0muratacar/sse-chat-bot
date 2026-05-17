import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { Bot, User, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  failed?: boolean;
}

export function ChatMessage({ role, content, failed }: ChatMessageProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex w-full gap-2 sm:gap-3', role === 'user' ? 'justify-end' : 'justify-start')}>
      {role === 'assistant' && (
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 mt-1">
          <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        </div>
      )}
      <div className={cn('flex flex-col gap-1', role === 'user' ? 'items-end' : 'items-start', 'min-w-0 max-w-[85%] sm:max-w-[75%]')}>
        <div
          className={cn(
            'rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm',
            role === 'user'
              ? 'bg-primary text-white'
              : 'glass text-foreground',
            failed && 'opacity-70'
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed break-words">{content}</p>
        </div>
        {failed && (
          <div className="group relative flex items-center gap-1 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span className="absolute bottom-full right-0 mb-1 hidden w-max max-w-[220px] rounded-lg bg-red-500/90 px-3 py-1.5 text-xs text-white group-hover:block">
              {t('chat.failed')}
            </span>
          </div>
        )}
      </div>
      {role === 'user' && (
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/20 mt-1">
          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
        </div>
      )}
    </div>
  );
}
