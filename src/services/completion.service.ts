import { injectable } from 'tsyringe';
import { Response } from 'express';
import { MessageRepository } from '../repositories/message.repository';
import { ChatRepository } from '../repositories/chat.repository';
import { FeatureFlagService } from './feature-flag.service';
import { GeminiService } from './gemini.service';
import { SSEEvent } from '../types';
import logger from '../utils/logger';

@injectable()
export class CompletionService {
  constructor(
    private messageRepository: MessageRepository,
    private chatRepository: ChatRepository,
    private featureFlagService: FeatureFlagService,
    private geminiService: GeminiService,
  ) {}

  async complete(chatId: string, userId: string, userMessage: string, res: Response) {
    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      return null;
    }

    await this.messageRepository.create({ chatId, role: 'user', content: userMessage });

    const streamingEnabled = await this.featureFlagService.getBoolean('STREAMING_ENABLED');
    const toolsEnabled = await this.featureFlagService.getBoolean('AI_TOOLS_ENABLED');

    const history = await this.messageRepository.findByChatIdLimited(chatId, 20);
    const messages = history.map((m) => ({ role: m.role, content: m.content }));

    if (streamingEnabled) {
      return this.streamResponse(res, messages, toolsEnabled, chatId);
    } else {
      return this.jsonResponse(messages, toolsEnabled, chatId);
    }
  }

  private async streamResponse(res: Response, messages: { role: string; content: string }[], toolsEnabled: boolean, chatId: string) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    this.sendEvent(res, { type: 'thinking', data: { message: 'Processing your request...' } });

    if (toolsEnabled) {
      const toolResult = this.executeMockTool(messages[messages.length - 1].content);
      if (toolResult) {
        this.sendEvent(res, { type: 'tool_execution', data: toolResult });
      }
    }

    let fullContent = '';

    if (this.geminiService.isConfigured) {
      try {
        for await (const chunk of this.geminiService.streamContent(messages)) {
          fullContent += chunk;
          this.sendEvent(res, { type: 'content', data: { content: chunk } });
        }
      } catch (err) {
        logger.error('Gemini stream failed, falling back to mock', { error: (err as Error).message });
        this.sendEvent(res, { type: 'error', data: { message: (err as Error).message } });
        fullContent = this.generateMockResponse(messages[messages.length - 1].content);
        const words = fullContent.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
          this.sendEvent(res, { type: 'content', data: { content: chunk } });
          await this.delay(50);
        }
      }
    } else {
      fullContent = this.generateMockResponse(messages[messages.length - 1].content);
      const words = fullContent.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
        this.sendEvent(res, { type: 'content', data: { content: chunk } });
        await this.delay(50);
      }
    }

    await this.messageRepository.create({ chatId, role: 'assistant', content: fullContent });

    this.sendEvent(res, { type: 'done', data: { message: 'Completion finished' } });
    res.end();

    return { streamed: true };
  }

  private async jsonResponse(messages: { role: string; content: string }[], toolsEnabled: boolean, chatId: string) {
    let toolResult = null;
    if (toolsEnabled) {
      toolResult = this.executeMockTool(messages[messages.length - 1].content);
    }

    let responseContent: string;

    if (this.geminiService.isConfigured) {
      try {
        responseContent = await this.geminiService.generateContent(messages);
      } catch (err) {
        logger.error('Gemini generation failed, falling back to mock', { error: (err as Error).message });
        responseContent = this.generateMockResponse(messages[messages.length - 1].content);
      }
    } else {
      responseContent = this.generateMockResponse(messages[messages.length - 1].content);
    }

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
