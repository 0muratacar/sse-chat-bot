export const FEATURE_FLAG_DEFAULTS = {
  STREAMING_ENABLED: true,
  PAGINATION_LIMIT: 20,
  AI_TOOLS_ENABLED: true,
  CHAT_HISTORY_ENABLED: true,
  RATE_LIMIT_PER_MINUTE: 60,
} as const;

export const FEATURE_FLAG_DEFINITIONS = [
  { key: 'STREAMING_ENABLED', value: 'true', type: 'BOOLEAN', description: 'Enable SSE streaming for completion endpoint' },
  { key: 'PAGINATION_LIMIT', value: '20', type: 'NUMBER', description: 'Max items returned in chat list (10-100)' },
  { key: 'AI_TOOLS_ENABLED', value: 'true', type: 'BOOLEAN', description: 'Enable AI tool usage in completions' },
  { key: 'CHAT_HISTORY_ENABLED', value: 'true', type: 'BOOLEAN', description: 'Return full message history vs last N messages' },
  { key: 'RATE_LIMIT_PER_MINUTE', value: '60', type: 'NUMBER', description: 'Max requests per minute per user' },
] as const;

export const PAGINATION = {
  MIN_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_LIMIT: 20,
} as const;

export const CHAT_HISTORY = {
  LIMITED_MESSAGE_COUNT: 10,
} as const;

export const CLIENT_TYPES = ['web', 'mobile', 'desktop'] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];
