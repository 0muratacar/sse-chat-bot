'use client';

import { use } from 'react';
import { UserDetail } from '@/components/admin/UserDetail';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Detail</h1>
      <UserDetail userId={id} />
    </div>
  );
}
