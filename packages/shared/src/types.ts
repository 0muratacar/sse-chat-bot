export type Role = 'USER' | 'ADMIN';
export type Tier = 'INDIVIDUAL' | 'STARTUP' | 'ENTERPRISE';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  tier: Tier;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  value: string;
  type: 'BOOLEAN' | 'NUMBER' | 'STRING';
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagTierOverride {
  id: string;
  flagKey: string;
  tier: Tier;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    status: number;
    details?: { field: string; message: string }[];
  };
}

export interface SSEEvent {
  type: 'thinking' | 'content' | 'tool_execution' | 'done' | 'error';
  content?: string;
  data?: unknown;
}

export interface AuthResponse {
  token: string;
  user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'tier'>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}
