import { injectable } from 'tsyringe';
import { PrismaClient, FeatureFlagTier, Tier } from '@prisma/client';
import prismaService from '../utils/prisma';

@injectable()
export class FeatureFlagTierRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaService.getClient();
  }

  async findByKeyAndTier(flagKey: string, tier: Tier): Promise<FeatureFlagTier | null> {
    return this.prisma.featureFlagTier.findUnique({
      where: { flagKey_tier: { flagKey, tier } },
    });
  }

  async findByKey(flagKey: string): Promise<FeatureFlagTier[]> {
    return this.prisma.featureFlagTier.findMany({
      where: { flagKey },
      orderBy: { tier: 'asc' },
    });
  }

  async upsert(flagKey: string, tier: Tier, value: string): Promise<FeatureFlagTier> {
    return this.prisma.featureFlagTier.upsert({
      where: { flagKey_tier: { flagKey, tier } },
      update: { value },
      create: { flagKey, tier, value },
    });
  }

  async delete(flagKey: string, tier: Tier): Promise<FeatureFlagTier> {
    return this.prisma.featureFlagTier.delete({
      where: { flagKey_tier: { flagKey, tier } },
    });
  }
}
