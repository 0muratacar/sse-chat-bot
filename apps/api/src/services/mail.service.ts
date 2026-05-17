import { singleton } from 'tsyringe';
import nodemailer, { Transporter } from 'nodemailer';
import config from '../config';
import logger from '../utils/logger';

@singleton()
export class MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.get('smtpHost'),
      port: config.get('smtpPort'),
      secure: false,
      auth: {
        user: config.get('smtpUser'),
        pass: config.get('smtpPass'),
      },
    });
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"SSE Chat Bot" <${config.get('smtpFrom')}>`,
      to,
      subject: 'Giriş Kodunuz - SSE Chat Bot',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">SSE Chat Bot</h2>
          <p>Giriş kodunuz:</p>
          <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">Bu kod 5 dakika geçerlidir.</p>
        </div>
      `,
    });
    logger.info('OTP email sent', { to });
  }
}
