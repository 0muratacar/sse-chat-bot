import { ChatService } from '../../src/services/chat.service';
import { ChatRepository } from '../../src/repositories/chat.repository';
import { MessageRepository } from '../../src/repositories/message.repository';
import { FeatureFlagService } from '../../src/services/feature-flag.service';

jest.mock('../../src/repositories/chat.repository');
jest.mock('../../src/repositories/message.repository');
jest.mock('../../src/services/feature-flag.service');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('ChatService', () => {
  let service: ChatService;
  let mockChatRepo: jest.Mocked<ChatRepository>;
  let mockMessageRepo: jest.Mocked<MessageRepository>;
  let mockFeatureFlagService: jest.Mocked<FeatureFlagService>;

  beforeEach(() => {
    mockChatRepo = new ChatRepository() as jest.Mocked<ChatRepository>;
    mockMessageRepo = new MessageRepository() as jest.Mocked<MessageRepository>;
    mockFeatureFlagService = {
      getBoolean: jest.fn(),
      getNumber: jest.fn(),
    } as unknown as jest.Mocked<FeatureFlagService>;

    service = new ChatService(mockChatRepo, mockMessageRepo, mockFeatureFlagService);
  });

  describe('getChats', () => {
    it('should use PAGINATION_LIMIT from feature flag', async () => {
      mockFeatureFlagService.getNumber.mockResolvedValue(30);
      mockChatRepo.findByUserId.mockResolvedValue({
        data: [],
        pagination: { hasMore: false, nextCursor: null, total: 0 },
      });

      await service.getChats('user-1');
      expect(mockChatRepo.findByUserId).toHaveBeenCalledWith('user-1', { limit: 30, cursor: undefined });
    });
  });

  describe('getChatHistory', () => {
    it('should return null if chat not found', async () => {
      mockChatRepo.findByIdAndUserId.mockResolvedValue(null);
      const result = await service.getChatHistory('chat-1', 'user-1');
      expect(result).toBeNull();
    });

    it('should return full history when flag enabled', async () => {
      mockChatRepo.findByIdAndUserId.mockResolvedValue({
        id: 'chat-1', title: 'Test', userId: 'user-1', createdAt: new Date(), updatedAt: new Date(),
      });
      mockFeatureFlagService.getBoolean.mockResolvedValue(true);
      mockMessageRepo.findByChatId.mockResolvedValue([]);

      const result = await service.getChatHistory('chat-1', 'user-1');
      expect(result!.fullHistory).toBe(true);
      expect(mockMessageRepo.findByChatId).toHaveBeenCalledWith('chat-1');
    });

    it('should return limited history when flag disabled', async () => {
      mockChatRepo.findByIdAndUserId.mockResolvedValue({
        id: 'chat-1', title: 'Test', userId: 'user-1', createdAt: new Date(), updatedAt: new Date(),
      });
      mockFeatureFlagService.getBoolean.mockResolvedValue(false);
      mockMessageRepo.findByChatIdLimited.mockResolvedValue([]);

      const result = await service.getChatHistory('chat-1', 'user-1');
      expect(result!.fullHistory).toBe(false);
      expect(mockMessageRepo.findByChatIdLimited).toHaveBeenCalledWith('chat-1', 10);
    });
  });
});
