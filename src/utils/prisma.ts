import { PrismaClient } from '@prisma/client';
import logger from './logger';

class PrismaService {
  private static instance: PrismaService;
  private client: PrismaClient;

  private constructor() {
    this.client = new PrismaClient({
      log: [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    this.client.$on('error' as never, (e: unknown) => {
      logger.error('Prisma error', { error: e });
    });

    this.client.$on('warn' as never, (e: unknown) => {
      logger.warn('Prisma warning', { warning: e });
    });
  }

  static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  getClient(): PrismaClient {
    return this.client;
  }

  async connect(): Promise<void> {
    await this.client.$connect();
    logger.info('Database connected');
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
    logger.info('Database disconnected');
  }
}

export default PrismaService.getInstance();
