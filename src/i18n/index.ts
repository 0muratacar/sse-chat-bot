import { en } from './en';
import { tr } from './tr';

export type MessageKey = keyof typeof en;
export type Lang = 'en' | 'tr';

const messages: Record<Lang, Record<MessageKey, string>> = { en, tr };

export function t(key: MessageKey, lang: Lang = 'en'): string {
  return messages[lang]?.[key] || messages.en[key];
}

export function isValidLang(value: string): value is Lang {
  return value === 'en' || value === 'tr';
}
