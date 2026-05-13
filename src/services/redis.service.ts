import Redis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';

export class RedisService {
  private static instance: RedisService;
  private client: Redis;

  constructor() {
    this.client = new Redis(config.get('redisUrl'), {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => logger.info('Redis connected'));
    this.client.on('error', (err) => logger.error('Redis error', { error: err.message }));
  }

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    logger.info('Redis disconnected');
  }
}
