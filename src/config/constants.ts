export const FEATURE_FLAG_DEFAULTS = {
  STREAMING_ENABLED: true,
  PAGINATION_LIMIT: 20,
  AI_TOOLS_ENABLED: true,
  CHAT_HISTORY_ENABLED: true,
} as const;

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
