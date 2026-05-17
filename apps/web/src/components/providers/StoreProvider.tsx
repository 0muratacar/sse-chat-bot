'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '@/lib/store';
import { setCredentials } from '@/lib/slices/authSlice';
import { setLang, Lang } from '@/lib/slices/langSlice';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          storeRef.current.dispatch(setCredentials({ token, user }));
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      const savedLang = localStorage.getItem('lang') as Lang | null;
      if (savedLang === 'en' || savedLang === 'tr') {
        storeRef.current.dispatch(setLang(savedLang));
      }
    }
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
