import { singleton } from 'tsyringe';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';

@singleton()
export class GeminiService {
  private client: GoogleGenerativeAI;
  private modelName = 'gemini-flash-latest';

  constructor() {
    this.client = new GoogleGenerativeAI(config.get('geminiApiKey'));
  }

  async generateContent(messages: { role: string; content: string }[]): Promise<string> {
    const model = this.client.getGenerativeModel({ model: this.modelName });
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const result = await model.generateContent({ contents });
    return result.response.text();
  }

  async *streamContent(messages: { role: string; content: string }[]): AsyncGenerator<string> {
    const model = this.client.getGenerativeModel({ model: this.modelName });
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const result = await model.generateContentStream({ contents });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  get isConfigured(): boolean {
    return config.get('geminiApiKey') !== '';
  }
}
