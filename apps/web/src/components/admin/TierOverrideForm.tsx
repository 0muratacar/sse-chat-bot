'use client';

import { useState } from 'react';
import {
  useGetFlagQuery,
  useUpdateFlagMutation,
  useGetTierOverridesQuery,
  useSetTierOverrideMutation,
  useDeleteTierOverrideMutation,
} from '@/lib/api/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import type { Tier } from '@sse-chat-bot/shared';

const TIERS: Tier[] = ['INDIVIDUAL', 'STARTUP', 'ENTERPRISE'];

interface FlagDetailProps {
  flagKey: string;
}

export function FlagDetail({ flagKey }: FlagDetailProps) {
  const { data: flag } = useGetFlagQuery(flagKey);
  const { data: overridesData } = useGetTierOverridesQuery(flagKey);
  const [updateFlag] = useUpdateFlagMutation();
  const [setOverride] = useSetTierOverrideMutation();
  const [deleteOverride] = useDeleteTierOverrideMutation();

  const [newValue, setNewValue] = useState('');
  const [overrideTier, setOverrideTier] = useState<Tier>('INDIVIDUAL');
  const [overrideValue, setOverrideValue] = useState('');

  if (!flag) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const overrides = overridesData?.data || [];

  const handleUpdateValue = () => {
    if (!newValue.trim()) return;
    updateFlag({ key: flagKey, value: newValue.trim() });
    setNewValue('');
  };

  const handleAddOverride = () => {
    if (!overrideValue.trim()) return;
    setOverride({ key: flagKey, tier: overrideTier, value: overrideValue.trim() });
    setOverrideValue('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-lg">{flag.key}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Type: {flag.type}</p>
            <p className="text-sm text-muted-foreground">Description: {flag.description || '—'}</p>
            <p className="mt-2 text-sm">
              Current value: <Badge variant="secondary">{flag.value}</Badge>
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleUpdateValue}>Update</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tier Overrides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.map((o) => (
                <TableRow key={o.id}>
                  <TableCell><Badge>{o.tier}</Badge></TableCell>
                  <TableCell>{o.value}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteOverride({ key: flagKey, tier: o.tier })}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex gap-2">
            <select
              value={overrideTier}
              onChange={(e) => setOverrideTier(e.target.value as Tier)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <Input
              placeholder="Override value"
              value={overrideValue}
              onChange={(e) => setOverrideValue(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleAddOverride}>Add Override</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
