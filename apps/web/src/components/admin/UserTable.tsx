'use client';

import { useRouter } from 'next/navigation';
import { useGetUsersQuery } from '@/lib/api/adminApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function UserTable() {
  const { data, isLoading } = useGetUsersQuery();
  const router = useRouter();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const users = data?.data || [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow
            key={user.id}
            className="cursor-pointer"
            onClick={() => router.push(`/admin/users/${user.id}`)}
          >
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.name || '—'}</TableCell>
            <TableCell><Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
            <TableCell><Badge variant="outline">{user.tier}</Badge></TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
