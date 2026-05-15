import { injectable } from 'tsyringe';
import { FeatureFlagRepository } from '../repositories/feature-flag.repository';
import { RedisService } from './redis.service';
import { FEATURE_FLAG_DEFAULTS, FEATURE_FLAG_DEFINITIONS, PAGINATION } from '../config/constants';
import logger from '../utils/logger';

const REDIS_PREFIX = 'feature_flag:';

@injectable()
export class FeatureFlagService {
  constructor(
    private featureFlagRepository: FeatureFlagRepository,
    private redisService: RedisService
  ) {}

  async getBoolean(key: string): Promise<boolean> {
    const value = await this.getValue(key);
    if (value === null) {
      return (FEATURE_FLAG_DEFAULTS as Record<string, unknown>)[key] as boolean ?? false;
    }
    return value === 'true';
  }

  async getNumber(key: string): Promise<number> {
    const value = await this.getValue(key);
    if (value === null) {
      return (FEATURE_FLAG_DEFAULTS as Record<string, unknown>)[key] as number ?? 0;
    }
    const num = parseInt(value, 10);
    if (key === 'PAGINATION_LIMIT') {
      return Math.max(PAGINATION.MIN_LIMIT, Math.min(PAGINATION.MAX_LIMIT, num));
    }
    return num;
  }

  async getString(key: string): Promise<string | null> {
    return this.getValue(key);
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

  async ensureDefaults(): Promise<void> {
    for (const def of FEATURE_FLAG_DEFINITIONS) {
      const existing = await this.featureFlagRepository.findByKey(def.key);
      if (!existing) {
        await this.featureFlagRepository.create(def);
        logger.info('Feature flag created on init', { key: def.key, value: def.value });
      }
    }
  }

  private async getValue(key: string): Promise<string | null> {
    const cached = await this.redisService.get(`${REDIS_PREFIX}${key}`);
    if (cached !== null) {
      return cached;
    }

    const flag = await this.featureFlagRepository.findByKey(key);
    if (flag) {
      await this.redisService.set(`${REDIS_PREFIX}${key}`, flag.value);
      return flag.value;
    }

    return null;
  }
}
