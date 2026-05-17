import { singleton } from 'tsyringe';
import Redis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';

@singleton()
export class RedisService {
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

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    logger.info('Redis disconnected');
  }
}
