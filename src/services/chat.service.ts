import { ChatRepository } from '../repositories/chat.repository';
import { MessageRepository } from '../repositories/message.repository';
import { FeatureFlagService } from './feature-flag.service';
import { CHAT_HISTORY } from '../config/constants';

export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private messageRepository: MessageRepository,
    private featureFlagService: FeatureFlagService
  ) {}

  async getChats(userId: string, cursor?: string) {
    const limit = await this.featureFlagService.getNumber('PAGINATION_LIMIT');
    return this.chatRepository.findByUserId(userId, { limit, cursor });
  }

  async getChatHistory(chatId: string, userId: string) {
    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      return null;
    }

    const fullHistory = await this.featureFlagService.getBoolean('CHAT_HISTORY_ENABLED');

    const messages = fullHistory
      ? await this.messageRepository.findByChatId(chatId)
      : await this.messageRepository.findByChatIdLimited(chatId, CHAT_HISTORY.LIMITED_MESSAGE_COUNT);

    return { chat, messages, fullHistory };
  }
}
