import { FeatureFlagService } from '../../src/services/feature-flag.service';
import { FeatureFlagRepository } from '../../src/repositories/feature-flag.repository';
import { RedisService } from '../../src/services/redis.service';

jest.mock('../../src/repositories/feature-flag.repository');
jest.mock('../../src/services/redis.service');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let mockRepo: jest.Mocked<FeatureFlagRepository>;
  let mockRedis: jest.Mocked<RedisService>;

  beforeEach(() => {
    mockRepo = new FeatureFlagRepository() as jest.Mocked<FeatureFlagRepository>;
    mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn() } as unknown as jest.Mocked<RedisService>;
    service = new FeatureFlagService(mockRepo, mockRedis);
  });

  describe('getBoolean', () => {
    it('should return cached value from Redis', async () => {
      mockRedis.get.mockResolvedValue('true');
      const result = await service.getBoolean('STREAMING_ENABLED');
      expect(result).toBe(true);
      expect(mockRepo.findByKey).not.toHaveBeenCalled();
    });

    it('should fall back to DB when Redis misses', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRepo.findByKey.mockResolvedValue({
        id: '1', key: 'STREAMING_ENABLED', value: 'false',
        type: 'BOOLEAN', description: null, createdAt: new Date(), updatedAt: new Date(),
      });
      const result = await service.getBoolean('STREAMING_ENABLED');
      expect(result).toBe(false);
      expect(mockRedis.set).toHaveBeenCalledWith('feature_flag:STREAMING_ENABLED', 'false');
    });

    it('should return default when not in Redis or DB', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRepo.findByKey.mockResolvedValue(null);
      const result = await service.getBoolean('STREAMING_ENABLED');
      expect(result).toBe(true); // default from constants
    });
  });

  describe('getNumber', () => {
    it('should clamp PAGINATION_LIMIT within range', async () => {
      mockRedis.get.mockResolvedValue('500');
      const result = await service.getNumber('PAGINATION_LIMIT');
      expect(result).toBe(100); // max
    });

    it('should enforce minimum limit', async () => {
      mockRedis.get.mockResolvedValue('1');
      const result = await service.getNumber('PAGINATION_LIMIT');
      expect(result).toBe(10); // min
    });
  });

  describe('update', () => {
    it('should write to both DB and Redis (write-through)', async () => {
      mockRepo.update.mockResolvedValue({
        id: '1', key: 'STREAMING_ENABLED', value: 'false',
        type: 'BOOLEAN', description: null, createdAt: new Date(), updatedAt: new Date(),
      });
      await service.update('STREAMING_ENABLED', 'false');
      expect(mockRepo.update).toHaveBeenCalledWith('STREAMING_ENABLED', 'false');
      expect(mockRedis.set).toHaveBeenCalledWith('feature_flag:STREAMING_ENABLED', 'false');
    });
  });
});
