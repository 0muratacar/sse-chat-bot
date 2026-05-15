import { injectable } from 'tsyringe';
import crypto from 'crypto';
import { RedisService } from './redis.service';

const OTP_TTL = 300; // 5 minutes
const RATE_LIMIT_WINDOW = 30; // 30 seconds
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 60; // 1 minute

@injectable()
export class OtpService {
  constructor(private redis: RedisService) {}

  async generate(email: string): Promise<string> {
    const otp = crypto.randomInt(100000, 999999).toString();
    await this.redis.set(`otp:${email}`, otp, OTP_TTL);
    return otp;
  }

  async verify(email: string, otp: string): Promise<{ valid: boolean; blocked?: boolean; retryAfter?: number }> {
    const blockKey = `otp:block:${email}`;
    const blocked = await this.redis.get(blockKey);
    if (blocked) {
      const ttl = await this.redis.ttl(blockKey);
      return { valid: false, blocked: true, retryAfter: ttl };
    }

    const stored = await this.redis.get(`otp:${email}`);
    if (stored && stored === otp) {
      await this.redis.del(`otp:${email}`);
      await this.redis.del(`otp:attempts:${email}`);
      return { valid: true };
    }

    const attemptKey = `otp:attempts:${email}`;
    const attempts = await this.redis.incr(attemptKey);
    if (attempts === 1) {
      await this.redis.expire(attemptKey, RATE_LIMIT_WINDOW);
    }

    if (attempts >= MAX_ATTEMPTS) {
      await this.redis.set(blockKey, '1', BLOCK_DURATION);
      await this.redis.del(attemptKey);
      return { valid: false, blocked: true, retryAfter: BLOCK_DURATION };
    }

    return { valid: false };
  }
}
