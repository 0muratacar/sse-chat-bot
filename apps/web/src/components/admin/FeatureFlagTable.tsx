'use client';

import { useRouter } from 'next/navigation';
import { useGetAllFlagsQuery, useDeleteFlagMutation } from '@/lib/api/adminApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export function FeatureFlagTable() {
  const { data, isLoading } = useGetAllFlagsQuery();
  const [deleteFlag] = useDeleteFlagMutation();
  const router = useRouter();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const flags = data?.data || [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="w-20">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flags.map((flag) => (
          <TableRow
            key={flag.key}
            className="cursor-pointer"
            onClick={() => router.push(`/admin/features/${flag.key}`)}
          >
            <TableCell className="font-mono text-sm">{flag.key}</TableCell>
            <TableCell>
              <Badge variant="secondary">{flag.value}</Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{flag.type}</TableCell>
            <TableCell className="text-sm">{flag.description || '—'}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFlag(flag.key);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
