import { Response } from 'express';
import { FeatureFlagService } from '../services/feature-flag.service';

export interface CompletionStrategy {
  execute(res: Response, content: string, toolResult: object | null): Promise<void>;
}

export class StreamingStrategy implements CompletionStrategy {
  async execute(res: Response, content: string, toolResult: object | null): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`data: ${JSON.stringify({ type: 'thinking', data: { message: 'Processing...' } })}\n\n`);

    if (toolResult) {
      res.write(`data: ${JSON.stringify({ type: 'tool_execution', data: toolResult })}\n\n`);
    }

    const words = content.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ type: 'content', data: { content: word + ' ' } })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    res.write(`data: ${JSON.stringify({ type: 'done', data: { message: 'Complete' } })}\n\n`);
    res.end();
  }
}

export class JsonStrategy implements CompletionStrategy {
  async execute(res: Response, content: string, toolResult: object | null): Promise<void> {
    res.json({
      data: {
        message: { role: 'assistant', content },
        ...(toolResult && { toolExecution: toolResult }),
      },
    });
  }
}

export class CompletionStrategyFactory {
  constructor(private featureFlagService: FeatureFlagService) {}

  async getStrategy(): Promise<CompletionStrategy> {
    const streamingEnabled = await this.featureFlagService.getBoolean('STREAMING_ENABLED');
    return streamingEnabled ? new StreamingStrategy() : new JsonStrategy();
  }
}
