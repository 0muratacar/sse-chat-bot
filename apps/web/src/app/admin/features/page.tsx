import { FeatureFlagTable } from '@/components/admin/FeatureFlagTable';

export default function FeaturesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Feature Flags</h1>
      <FeatureFlagTable />
    </div>
  );
}
