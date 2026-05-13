import { Message } from '@prisma/client';
import { MessageRepository } from '../repositories/message.repository';
import { FeatureFlagService } from '../services/feature-flag.service';
import { CHAT_HISTORY } from '../config/constants';

export interface ChatHistoryStrategy {
  getMessages(chatId: string): Promise<Message[]>;
}

export class FullHistoryStrategy implements ChatHistoryStrategy {
  constructor(private messageRepository: MessageRepository) {}

  async getMessages(chatId: string): Promise<Message[]> {
    return this.messageRepository.findByChatId(chatId);
  }
}

export class LimitedHistoryStrategy implements ChatHistoryStrategy {
  constructor(private messageRepository: MessageRepository) {}

  async getMessages(chatId: string): Promise<Message[]> {
    return this.messageRepository.findByChatIdLimited(chatId, CHAT_HISTORY.LIMITED_MESSAGE_COUNT);
  }
}

export class ChatHistoryStrategyFactory {
  constructor(
    private featureFlagService: FeatureFlagService,
    private messageRepository: MessageRepository
  ) {}

  async getStrategy(): Promise<ChatHistoryStrategy> {
    const fullHistory = await this.featureFlagService.getBoolean('CHAT_HISTORY_ENABLED');
    return fullHistory
      ? new FullHistoryStrategy(this.messageRepository)
      : new LimitedHistoryStrategy(this.messageRepository);
  }
}
