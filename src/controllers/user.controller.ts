import { injectable } from 'tsyringe';
import { Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { AuthenticatedRequest } from '../types';
import { t } from '../i18n';

@injectable()
export class UserController {
  constructor(private userRepository: UserRepository) {}

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    const user = await this.userRepository.findById(userId);

    if (!user) {
      res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: t('USER_NOT_FOUND', req.lang), status: 404 },
      });
      return;
    }

    res.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }
}
