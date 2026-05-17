'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequestOtpMutation } from '@/lib/api/authApi';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Sparkles, ArrowRight } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [requestOtp, { isLoading, error }] = useRequestOtpMutation();
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!email.trim()) {
      setValidationError(t('auth.emailRequired'));
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setValidationError(t('auth.invalidEmail'));
      return;
    }

    try {
      await requestOtp({ email }).unwrap();
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch {
      // error is handled by RTK Query state
    }
  };

  const apiError = error && 'data' in error
    ? (error.data as { error?: { message?: string } })?.error?.message
    : error ? t('auth.otpFailed') : null;

  const displayError = validationError || apiError;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl glass glow" style={{ animation: 'float 4s ease-in-out infinite' }}>
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold gradient-text">{t('auth.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('auth.subtitle')}
        </p>
      </div>

      <div className="glass-strong rounded-2xl p-8">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-xs text-muted-foreground">
            {t('auth.hint')}
          </span>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('auth.email')}</label>
            <Input
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setValidationError(''); }}
              className={`h-12 border-glass-border bg-glass text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 ${displayError ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}`}
            />
          </div>

          {displayError && (
            <p className="text-sm text-destructive">{displayError}</p>
          )}

          <Button
            type="submit"
            className="h-12 w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('auth.sending')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {t('auth.sendOtp')}
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t('auth.footer')}
      </p>
    </div>
  );
}
