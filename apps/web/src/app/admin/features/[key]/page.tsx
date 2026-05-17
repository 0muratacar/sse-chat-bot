'use client';

import { use } from 'react';
import { FlagDetail } from '@/components/admin/TierOverrideForm';

export default function FlagDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Feature Flag: {key}</h1>
      <FlagDetail flagKey={key} />
    </div>
  );
}
