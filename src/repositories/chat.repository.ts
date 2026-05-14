import { injectable } from 'tsyringe';
import { PrismaClient, Chat } from '@prisma/client';
import prismaService from '../utils/prisma';

export interface PaginationParams {
  limit: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    total: number;
  };
}

@injectable()
export class ChatRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaService.getClient();
  }

  async findByUserId(userId: string, params: PaginationParams): Promise<PaginatedResult<Chat>> {
    const { limit, cursor } = params;

    const total = await this.prisma.chat.count({ where: { userId } });

    const chats = await this.prisma.chat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = chats.length > limit;
    const data = hasMore ? chats.slice(0, limit) : chats;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, pagination: { hasMore, nextCursor, total } };
  }

  async findById(chatId: string): Promise<Chat | null> {
    return this.prisma.chat.findUnique({ where: { id: chatId } });
  }

  async findByIdAndUserId(chatId: string, userId: string): Promise<Chat | null> {
    return this.prisma.chat.findFirst({ where: { id: chatId, userId } });
  }
}
