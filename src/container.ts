import { UserRepository } from './repositories/user.repository';
import { ChatRepository } from './repositories/chat.repository';
import { MessageRepository } from './repositories/message.repository';
import { FeatureFlagRepository } from './repositories/feature-flag.repository';
import { RedisService } from './services/redis.service';
import { FeatureFlagService } from './services/feature-flag.service';
import { ChatService } from './services/chat.service';
import { CompletionService } from './services/completion.service';

class Container {
  private static instance: Container;

  readonly userRepository: UserRepository;
  readonly chatRepository: ChatRepository;
  readonly messageRepository: MessageRepository;
  readonly featureFlagRepository: FeatureFlagRepository;

  readonly redisService: RedisService;
  readonly featureFlagService: FeatureFlagService;
  readonly chatService: ChatService;
  readonly completionService: CompletionService;

  private constructor() {
    this.userRepository = new UserRepository();
    this.chatRepository = new ChatRepository();
    this.messageRepository = new MessageRepository();
    this.featureFlagRepository = new FeatureFlagRepository();

    this.redisService = RedisService.getInstance();

    this.featureFlagService = new FeatureFlagService(
      this.featureFlagRepository,
      this.redisService
    );

    this.chatService = new ChatService(
      this.chatRepository,
      this.messageRepository,
      this.featureFlagService
    );

    this.completionService = new CompletionService(
      this.messageRepository,
      this.chatRepository,
      this.featureFlagService
    );
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
}

export default Container.getInstance();
