import 'dotenv/config';

interface AppConfig {
  nodeEnv: string;
  port: number;
  local: boolean;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  openaiApiKey: string | undefined;
  geminiApiKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
}

class Config {
  private static instance: Config;
  private config: AppConfig;

  private constructor() {
    this.config = {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      local: process.env.LOCAL === 'true',
      databaseUrl: this.requireEnv('DATABASE_URL'),
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
      openaiApiKey: process.env.OPENAI_API_KEY || undefined,
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || '',
      smtpFrom: process.env.SMTP_FROM || '',
    };
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  get isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  private requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }
}

export default Config.getInstance();
