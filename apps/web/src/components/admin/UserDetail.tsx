'use client';

import { useState } from 'react';
import { useUpdateUserTierMutation } from '@/lib/api/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tier } from '@sse-chat-bot/shared';

const TIERS: Tier[] = ['INDIVIDUAL', 'STARTUP', 'ENTERPRISE'];

interface UserDetailProps {
  userId: string;
}

export function UserDetail({ userId }: UserDetailProps) {
  const [selectedTier, setSelectedTier] = useState<Tier>('INDIVIDUAL');
  const [updateTier, { isLoading }] = useUpdateUserTierMutation();

  const handleUpdate = () => {
    updateTier({ id: userId, tier: selectedTier });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change User Tier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as Tier)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Tier'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
