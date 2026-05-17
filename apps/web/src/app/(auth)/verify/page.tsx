import { Suspense } from 'react';
import { OtpForm } from '@/components/auth/OtpForm';

export default function VerifyPage() {
  return (
    <Suspense>
      <OtpForm />
    </Suspense>
  );
}
