export const FEATURE_FLAG_KEYS = {
  STREAMING_ENABLED: 'STREAMING_ENABLED',
  PAGINATION_LIMIT: 'PAGINATION_LIMIT',
  AI_TOOLS_ENABLED: 'AI_TOOLS_ENABLED',
  CHAT_HISTORY_ENABLED: 'CHAT_HISTORY_ENABLED',
} as const;

export const API_PATHS = {
  AUTH: {
    REQUEST_OTP: '/api/auth/request-otp',
    VERIFY_OTP: '/api/auth/verify-otp',
  },
  CHATS: {
    LIST: '/api/chats',
    CREATE: '/api/chats',
    HISTORY: (chatId: string) => `/api/chats/${chatId}/history`,
    COMPLETION: (chatId: string) => `/api/chats/${chatId}/completion`,
  },
  ADMIN: {
    FLAGS: '/api/admin/features',
    FLAG: (key: string) => `/api/admin/features/${key}`,
    FLAG_TIERS: (key: string) => `/api/admin/features/${key}/tiers`,
    FLAG_TIER: (key: string, tier: string) => `/api/admin/features/${key}/tiers/${tier}`,
    USER_TIER: (id: string) => `/api/admin/users/${id}/tier`,
  },
} as const;
