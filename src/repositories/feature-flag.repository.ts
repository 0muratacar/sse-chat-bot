import { injectable } from 'tsyringe';
import { PrismaClient, FeatureFlag } from '@prisma/client';
import prismaService from '../utils/prisma';

@injectable()
export class FeatureFlagRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaService.getClient();
  }

  async findByKey(key: string): Promise<FeatureFlag | null> {
    return this.prisma.featureFlag.findUnique({ where: { key } });
  }

  async findAll(): Promise<FeatureFlag[]> {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async create(data: { key: string; value: string; type: string; description?: string }): Promise<FeatureFlag> {
    return this.prisma.featureFlag.create({ data });
  }

  async update(key: string, value: string): Promise<FeatureFlag> {
    return this.prisma.featureFlag.update({
      where: { key },
      data: { value },
    });
  }
}
