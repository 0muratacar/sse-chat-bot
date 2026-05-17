import { injectable } from 'tsyringe';
import { Tier } from '@prisma/client';
import { FeatureFlagRepository } from '../repositories/feature-flag.repository';
import { FeatureFlagTierRepository } from '../repositories/feature-flag-tier.repository';
import { RedisService } from './redis.service';
import { FEATURE_FLAG_DEFAULTS, FEATURE_FLAG_DEFINITIONS, PAGINATION } from '../config/constants';
import logger from '../utils/logger';

const REDIS_PREFIX = 'feature_flag:';

@injectable()
export class FeatureFlagService {
  constructor(
    private featureFlagRepository: FeatureFlagRepository,
    private featureFlagTierRepository: FeatureFlagTierRepository,
    private redisService: RedisService
  ) {}

  async getBoolean(key: string, tier?: Tier): Promise<boolean> {
    const value = await this.getValue(key, tier);
    if (value === null) {
      return (FEATURE_FLAG_DEFAULTS as Record<string, unknown>)[key] as boolean ?? false;
    }
    return value === 'true';
  }

  async getNumber(key: string, tier?: Tier): Promise<number> {
    const value = await this.getValue(key, tier);
    if (value === null) {
      return (FEATURE_FLAG_DEFAULTS as Record<string, unknown>)[key] as number ?? 0;
    }
    const num = parseInt(value, 10);
    if (key === 'PAGINATION_LIMIT') {
      return Math.max(PAGINATION.MIN_LIMIT, Math.min(PAGINATION.MAX_LIMIT, num));
    }
    return num;
  }

  async getString(key: string, tier?: Tier): Promise<string | null> {
    return this.getValue(key, tier);
  }

  async getAll() {
    return this.featureFlagRepository.findAll();
  }

  async getByKey(key: string) {
    return this.featureFlagRepository.findByKey(key);
  }

  async update(key: string, value: string) {
    const flag = await this.featureFlagRepository.update(key, value);
    await this.redisService.set(`${REDIS_PREFIX}${key}`, value);
    logger.info('Feature flag updated', { key, value });
    return flag;
  }

  async create(data: { key: string; value: string; type: string; description?: string }) {
    const flag = await this.featureFlagRepository.create(data);
    await this.redisService.set(`${REDIS_PREFIX}${data.key}`, data.value);
    logger.info('Feature flag created', { key: data.key, value: data.value });
    return flag;
  }

  async delete(key: string) {
    const flag = await this.featureFlagRepository.delete(key);
    await this.redisService.del(`${REDIS_PREFIX}${key}`);
    logger.info('Feature flag deleted', { key });
    return flag;
  }

  async getTierOverrides(key: string) {
    return this.featureFlagTierRepository.findByKey(key);
  }

  async setTierOverride(key: string, tier: Tier, value: string) {
    const override = await this.featureFlagTierRepository.upsert(key, tier, value);
    await this.redisService.set(`${REDIS_PREFIX}${key}:${tier}`, value);
    logger.info('Feature flag tier override set', { key, tier, value });
    return override;
  }

  async deleteTierOverride(key: string, tier: Tier) {
    const override = await this.featureFlagTierRepository.delete(key, tier);
    await this.redisService.del(`${REDIS_PREFIX}${key}:${tier}`);
    logger.info('Feature flag tier override deleted', { key, tier });
    return override;
  }

  async ensureDefaults(): Promise<void> {
    for (const def of FEATURE_FLAG_DEFINITIONS) {
      const existing = await this.featureFlagRepository.findByKey(def.key);
      if (!existing) {
        await this.featureFlagRepository.create(def);
        logger.info('Feature flag created on init', { key: def.key, value: def.value });
      }
    }
  }

  private async getValue(key: string, tier?: Tier): Promise<string | null> {
    if (tier) {
      const tierCached = await this.redisService.get(`${REDIS_PREFIX}${key}:${tier}`);
      if (tierCached !== null) return tierCached;

      const tierFlag = await this.featureFlagTierRepository.findByKeyAndTier(key, tier);
      if (tierFlag) {
        await this.redisService.set(`${REDIS_PREFIX}${key}:${tier}`, tierFlag.value);
        return tierFlag.value;
      }
    }

    const cached = await this.redisService.get(`${REDIS_PREFIX}${key}`);
    if (cached !== null) return cached;

    const flag = await this.featureFlagRepository.findByKey(key);
    if (flag) {
      await this.redisService.set(`${REDIS_PREFIX}${key}`, flag.value);
      return flag.value;
    }

    return null;
  }
}
