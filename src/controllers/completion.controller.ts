import { injectable } from 'tsyringe';
import { Response } from 'express';
import { CompletionService } from '../services/completion.service';
import { AuthenticatedRequest } from '../types';
import { t } from '../i18n';

@injectable()
export class CompletionController {
  constructor(private completionService: CompletionService) {}

  async complete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const chatId = req.params.chatId as string;
    const { message } = req.body;

    const result = await this.completionService.complete(chatId, userId, message, res);

    if (result === null) {
      res.status(404).json({
        error: { code: 'CHAT_NOT_FOUND', message: t('CHAT_NOT_FOUND', req.lang), status: 404 },
      });
      return;
    }

    if (!result.streamed) {
      res.json({ data: result });
    }
  }
}
