import { useCallback } from 'react';
import { useAppSelector } from '@/lib/hooks';
import { t, TranslationKey } from '@/lib/i18n';

export function useTranslation() {
  const lang = useAppSelector((state) => state.lang.lang);
  const translate = useCallback((key: TranslationKey) => t(key, lang), [lang]);
  return { t: translate, lang };
}
