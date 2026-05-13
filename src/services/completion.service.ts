import { Response } from 'express';
import { MessageRepository } from '../repositories/message.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { FeatureFlagService } from './feature-flag.service';
import { SSEEvent } from '../types';
import logger from '../utils/logger';

export class CompletionService {
  constructor(
    private messageRepository: MessageRepository,
    private chatRepository: ChatRepository,
    private featureFlagService: FeatureFlagService
  ) {}

  async complete(chatId: string, userId: string, userMessage: string, res: Response) {
    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      return null;
    }

    await this.messageRepository.create({ chatId, role: 'user', content: userMessage });

    const streamingEnabled = await this.featureFlagService.getBoolean('STREAMING_ENABLED');
    const toolsEnabled = await this.featureFlagService.getBoolean('AI_TOOLS_ENABLED');

    if (streamingEnabled) {
      return this.streamResponse(res, userMessage, toolsEnabled, chatId);
    } else {
      return this.jsonResponse(userMessage, toolsEnabled, chatId);
    }
  }

  private async streamResponse(res: Response, userMessage: string, toolsEnabled: boolean, chatId: string) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    this.sendEvent(res, { type: 'thinking', data: { message: 'Processing your request...' } });

    if (toolsEnabled) {
      const toolResult = this.executeMockTool(userMessage);
      if (toolResult) {
        this.sendEvent(res, { type: 'tool_execution', data: toolResult });
      }
    }

    const responseContent = this.generateMockResponse(userMessage);
    const words = responseContent.split(' ');

    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
      this.sendEvent(res, { type: 'content', data: { content: chunk } });
      await this.delay(50);
    }

    await this.messageRepository.create({ chatId, role: 'assistant', content: responseContent });

    this.sendEvent(res, { type: 'done', data: { message: 'Completion finished' } });
    res.end();

    return { streamed: true };
  }

  private async jsonResponse(userMessage: string, toolsEnabled: boolean, chatId: string) {
    let toolResult = null;
    if (toolsEnabled) {
      toolResult = this.executeMockTool(userMessage);
    }

    const responseContent = this.generateMockResponse(userMessage);
    await this.messageRepository.create({ chatId, role: 'assistant', content: responseContent });

    return {
      streamed: false,
      message: { role: 'assistant', content: responseContent },
      ...(toolResult && { toolExecution: toolResult }),
    };
  }

  private sendEvent(res: Response, event: SSEEvent): void {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  private executeMockTool(message: string): object | null {
    const weatherKeywords = ['weather', 'temperature', 'hava', 'sıcaklık'];
    const hasWeatherIntent = weatherKeywords.some((kw) => message.toLowerCase().includes(kw));

    if (hasWeatherIntent) {
      logger.debug('Executing mock tool: getCurrentWeather');
      return {
        tool: 'getCurrentWeather',
        input: { city: 'Istanbul' },
        output: { temperature: 22, condition: 'sunny', humidity: 45 },
      };
    }
    return null;
  }

  private generateMockResponse(userMessage: string): string {
    const responses = [
      `I understand you're asking about "${userMessage.slice(0, 50)}". Let me help you with that.`,
      'Based on my analysis, here are some key points to consider.',
      'This is a complex topic that involves multiple aspects of software engineering.',
      'I recommend approaching this step by step for the best results.',
    ];
    return responses.join(' ');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
