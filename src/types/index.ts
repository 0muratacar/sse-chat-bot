import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
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
  type: 'thinking' | 'content' | 'tool_execution' | 'done';
  data: unknown;
}
