import { injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { t } from '../i18n';

@injectable()
export class AuthController {
  constructor(private authService: AuthService) {}

  async requestOtp(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    await this.authService.requestOtp(email);
    res.json({ data: { message: t('OTP_SENT', req.lang) } });
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    const { email, otp } = req.body;
    const result = await this.authService.verifyOtp(email, otp);

    if ('error' in result) {
      if (result.error === 'BLOCKED') {
        res.status(429).json({
          error: { code: 'TOO_MANY_ATTEMPTS', message: t('TOO_MANY_ATTEMPTS', req.lang), retryAfter: result.retryAfter },
        });
        return;
      }
      res.status(401).json({
        error: { code: 'INVALID_OTP', message: t('INVALID_OTP', req.lang), status: 401 },
      });
      return;
    }

    res.json({ data: result });
  }
}
