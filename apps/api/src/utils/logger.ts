import winston from 'winston';
import config from '../config';

const { combine, timestamp, json, colorize, simple } = winston.format;

class Logger {
  private static instance: Logger;
  private logger: winston.Logger;

  private constructor() {
    this.logger = winston.createLogger({
      level: config.isProduction ? 'info' : 'debug',
      defaultMeta: { service: 'sse-chat-bot-be' },
      format: combine(timestamp(), json()),
      transports: [
        new winston.transports.Console({
          format: config.isDevelopment
            ? combine(colorize(), simple())
            : combine(timestamp(), json()),
        }),
      ],
    });
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }
}

export default Logger.getInstance();
