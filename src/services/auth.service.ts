import { injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { OtpService } from './otp.service';
import { MailService } from './mail.service';
import config from '../config';

@injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private otpService: OtpService,
    private mailService: MailService,
  ) {}

  async requestOtp(email: string): Promise<void> {
    const otp = await this.otpService.generate(email);
    await this.mailService.sendOtp(email, otp);
  }

  async verifyOtp(email: string, otp: string) {
    const result = await this.otpService.verify(email, otp);

    if (result.blocked) {
      return { error: 'BLOCKED', retryAfter: result.retryAfter };
    }

    if (!result.valid) {
      return { error: 'INVALID_OTP' };
    }

    let user = await this.userRepository.findByEmail(email);
    if (!user) {
      user = await this.userRepository.create(email);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.get('jwtSecret'),
      { expiresIn: '7d' },
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
