'use client';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { setLang, Lang } from '@/lib/slices/langSlice';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.lang.lang);

  const toggle = () => {
    const next: Lang = lang === 'en' ? 'tr' : 'en';
    localStorage.setItem('lang', next);
    dispatch(setLang(next));
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium uppercase">{lang}</span>
    </Button>
  );
}
