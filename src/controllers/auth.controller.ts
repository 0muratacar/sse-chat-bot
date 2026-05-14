import { injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

@injectable()
export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const result = await this.authService.login(email, password);

    if (!result) {
      res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', status: 401 },
      });
      return;
    }

    res.json({ data: result });
  }
}
