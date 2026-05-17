'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated) return null;

  return (
    <div className="gradient-bg relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Floating orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" style={{ animation: 'float 6s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-secondary/20 blur-[100px]" style={{ animation: 'float 8s ease-in-out infinite 2s' }} />
        <div className="absolute left-1/2 top-1/2 h-48 w-48 rounded-full bg-accent/15 blur-[80px]" style={{ animation: 'float 7s ease-in-out infinite 1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        {children}
      </div>
    </div>
  );
}
