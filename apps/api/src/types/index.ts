import { Request } from 'express';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum Tier {
  INDIVIDUAL = 'INDIVIDUAL',
  STARTUP = 'STARTUP',
  ENTERPRISE = 'ENTERPRISE',
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    tier: Tier;
  };
  clientType?: 'web' | 'mobile' | 'desktop';
}

export interface FeatureFlagValue {
  key: string;
  value: string;
  type: 'BOOLEAN' | 'NUMBER' | 'STRING';
  description?: string;
}

export interface CompletionRequest {
  message: string;
}

export interface SSEEvent {
  type: 'thinking' | 'content' | 'tool_execution' | 'done' | 'error';
  data: unknown;
}
