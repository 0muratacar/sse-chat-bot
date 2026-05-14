import { injectable } from 'tsyringe';
import { PrismaClient, Message } from '@prisma/client';
import prismaService from '../utils/prisma';

@injectable()
export class MessageRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaService.getClient();
  }

  async findByChatId(chatId: string, limit?: number): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      ...(limit && { take: limit, orderBy: { createdAt: 'desc' } }),
    });
  }

  async findByChatIdLimited(chatId: string, count: number): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: count,
    });
    return messages.reverse();
  }

  async create(data: { chatId: string; role: string; content: string }): Promise<Message> {
    return this.prisma.message.create({ data });
  }
}
