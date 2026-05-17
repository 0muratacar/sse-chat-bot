'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequestOtpMutation } from '@/lib/api/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Sparkles, ArrowRight } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [requestOtp, { isLoading, error }] = useRequestOtpMutation();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestOtp({ email }).unwrap();
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch {
      // error is handled by RTK Query state
    }
  };

  return (
    <div className="space-y-8">
      {/* Branding */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl glass glow" style={{ animation: 'float 4s ease-in-out infinite' }}>
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold gradient-text">AI Chat Bot</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Yapay zeka destekli sohbet asistanınız
        </p>
      </div>

      {/* Login Card */}
      <div className="glass-strong rounded-2xl p-8">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-xs text-muted-foreground">
            Admin veya kullanıcı — email adresinizle giriş yapın
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 border-glass-border bg-glass text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {'data' in error ? (error.data as { error?: { message?: string } })?.error?.message : 'Failed to send OTP'}
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
                Gönderiliyor...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Doğrulama Kodu Gönder
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground">
        Güvenli OTP doğrulama ile giriş yapın
      </p>
    </div>
  );
}
