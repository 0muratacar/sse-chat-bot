import { injectable } from 'tsyringe';
import { Response } from 'express';
import { ChatService } from '../services/chat.service';
import { AuthenticatedRequest } from '../types';
import { t } from '../i18n';

@injectable()
export class ChatController {
  constructor(private chatService: ChatService) {}

  async getChats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const cursor = req.query.cursor as string | undefined;

    const result = await this.chatService.getChats(userId, cursor);
    res.json({ data: result.data, pagination: result.pagination });
  }

  async createChat(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { title } = req.body;

    const chat = await this.chatService.createChat(title, userId);
    res.status(201).json({ data: chat });
  }

  async getChatHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const chatId = req.params.chatId as string;

    const result = await this.chatService.getChatHistory(chatId, userId);

    if (!result) {
      res.status(404).json({
        error: { code: 'CHAT_NOT_FOUND', message: t('CHAT_NOT_FOUND', req.lang), status: 404 },
      });
      return;
    }

    res.json({
      data: {
        chat: result.chat,
        messages: result.messages,
        fullHistory: result.fullHistory,
      },
    });
  }
}
