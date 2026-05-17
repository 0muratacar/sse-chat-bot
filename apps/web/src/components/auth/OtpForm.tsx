'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyOtpMutation } from '@/lib/api/authApi';
import { useAppDispatch } from '@/lib/hooks';
import { setCredentials } from '@/lib/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export function OtpForm() {
  const [otp, setOtp] = useState('');
  const [verifyOtp, { isLoading, error }] = useVerifyOtpMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await verifyOtp({ email, otp }).unwrap();
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      dispatch(setCredentials({ token: result.token, user: result.user }));

      if (result.user.role === 'ADMIN') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    } catch {
      // error handled by RTK Query state
    }
  };

  if (!email) {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Branding */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl glass glow">
          <ShieldCheck className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Doğrulama Kodu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="text-primary">{email}</span> adresine gönderilen 6 haneli kodu girin
        </p>
      </div>

      {/* OTP Card */}
      <div className="glass-strong rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className="h-14 border-glass-border bg-glass text-center text-2xl tracking-[0.5em] text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
            required
          />

          {error && (
            <p className="text-sm text-destructive">
              {'data' in error ? (error.data as { error?: { message?: string } })?.error?.message : 'Geçersiz kod'}
            </p>
          )}

          <Button
            type="submit"
            className="h-12 w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Doğrulanıyor...
              </span>
            ) : (
              'Doğrula'
            )}
          </Button>
        </form>
      </div>

      {/* Back link */}
      <button
        onClick={() => router.push('/login')}
        className="mx-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Farklı email ile giriş yap
      </button>
    </div>
  );
}
