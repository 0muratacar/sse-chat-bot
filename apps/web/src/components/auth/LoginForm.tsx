'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequestOtpMutation } from '@/lib/api/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your email to receive a verification code</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && (
            <p className="text-sm text-red-500">
              {'data' in error ? (error.data as { error?: { message?: string } })?.error?.message : 'Failed to send OTP'}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
