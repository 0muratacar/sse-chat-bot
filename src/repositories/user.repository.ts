import { injectable } from 'tsyringe';
import { PrismaClient, User } from '@prisma/client';
import prismaService from '../utils/prisma';

@injectable()
export class UserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prismaService.getClient();
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(email: string): Promise<User> {
    return this.prisma.user.create({ data: { email, password: '' } });
  }
}
