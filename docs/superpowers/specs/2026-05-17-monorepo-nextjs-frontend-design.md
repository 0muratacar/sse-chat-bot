# Monorepo + Next.js Frontend Design Spec

## Overview

Convert the existing Express backend into a Turborepo monorepo and add a Next.js 15 frontend application. The frontend provides admin dashboard, user authentication, and ChatGPT-style chat interface with SSE streaming.

## Technology Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Monorepo | Turborepo + pnpm workspaces | Native Next.js integration, build cache, simple config |
| Frontend | Next.js 15 (App Router) | SSR/SSG, route groups, middleware, Vercel-ready |
| UI | shadcn/ui + Tailwind CSS 4 | Copy-paste components, full control, modern look |
| State | Redux Toolkit + RTK Query | Predictable state, built-in API cache, SSE support |
| Auth UX | Email + OTP (matches backend) | No password, backend already implements this |
| App structure | Single app with route groups | Admin and user in one deployment, shared components |

## Monorepo Structure

```
sse-chat-bot-be/                    (root - Turborepo)
├── turbo.json
├── package.json                    (workspace root, scripts: dev/build/lint)
├── pnpm-workspace.yaml
├── apps/
│   ├── api/                        (Express backend, moved from root)
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── tsconfig.json
│   └── web/                        (Next.js frontend)
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── components.json         (shadcn config)
├── packages/
│   └── shared/                     (shared types, constants)
│       ├── src/
│       │   ├── types.ts            (User, Chat, Message, FeatureFlag types)
│       │   └── constants.ts        (API paths, feature flag keys)
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml
├── .env.example
└── CLAUDE.md
```

## Turborepo Configuration

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
```

## Next.js App Router Pages

### Route Groups

#### `(auth)` — Unauthenticated pages

| Route | File | Purpose |
|-------|------|---------|
| `/login` | `app/(auth)/login/page.tsx` | Email input form, triggers OTP |
| `/verify` | `app/(auth)/verify/page.tsx` | OTP code input, receives JWT |

Layout: Centered card on a minimal background. No sidebar/nav.

#### `(user)` — Authenticated chat pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/(user)/page.tsx` | Chat list + empty right panel |
| `/chat/[chatId]` | `app/(user)/chat/[chatId]/page.tsx` | Chat list + conversation |

Layout: ChatGPT-style split layout. Left sidebar (chat list, new chat button), right panel (messages + input).

#### `admin` — Admin dashboard (admin role required)

| Route | File | Purpose |
|-------|------|---------|
| `/admin` | `app/admin/page.tsx` | Dashboard summary (users, chats, flags) |
| `/admin/features` | `app/admin/features/page.tsx` | Feature flag table |
| `/admin/features/[key]` | `app/admin/features/[key]/page.tsx` | Flag detail + tier overrides |
| `/admin/users` | `app/admin/users/page.tsx` | User list with tier info |
| `/admin/users/[id]` | `app/admin/users/[id]/page.tsx` | User detail, tier change |

Layout: Admin shell with left nav (Dashboard, Features, Users). Header with user info.

### Route Protection

- Next.js middleware (`middleware.ts`) checks JWT cookie/header on protected routes.
- Redirects to `/login` if unauthenticated.
- Redirects to `/` if non-admin tries to access `/admin/*`.
- JWT token stored in both Redux state and `localStorage` (persisted across refreshes).

## Component Architecture

```
src/
├── components/
│   ├── ui/                         # shadcn/ui (Button, Input, Card, Dialog, etc.)
│   ├── chat/
│   │   ├── ChatSidebar.tsx         # Chat list sidebar with search + new chat
│   │   ├── ChatMessage.tsx         # Single message bubble (user/assistant)
│   │   ├── ChatInput.tsx           # Message input with send button
│   │   ├── ChatStream.tsx          # SSE streaming display (typewriter effect)
│   │   └── ChatLayout.tsx          # Split layout (sidebar + conversation)
│   ├── admin/
│   │   ├── FeatureFlagTable.tsx    # Feature flag list with toggle/edit
│   │   ├── TierOverrideForm.tsx    # Create/edit tier override
│   │   ├── UserTable.tsx           # User list table
│   │   └── StatsCards.tsx          # Dashboard summary cards
│   ├── auth/
│   │   ├── LoginForm.tsx           # Email form
│   │   └── OtpForm.tsx             # 6-digit OTP input
│   └── layout/
│       ├── AppShell.tsx            # Main app shell (nav + content)
│       ├── AdminNav.tsx            # Admin sidebar navigation
│       └── UserNav.tsx             # User header/nav
├── lib/
│   ├── store.ts                    # Redux store config + persistor
│   ├── api/
│   │   ├── baseApi.ts             # RTK Query createApi with baseQuery
│   │   ├── authApi.ts             # requestOtp, verifyOtp
│   │   ├── chatApi.ts             # getChats, createChat, getChatHistory
│   │   └── adminApi.ts            # flags CRUD, users, tier overrides
│   ├── slices/
│   │   ├── authSlice.ts           # token, user, role, isAuthenticated
│   │   └── chatSlice.ts           # activeChatId, streamingBuffer, isStreaming
│   └── hooks.ts                   # useAppDispatch, useAppSelector, useAuth
└── hooks/
    ├── useSSEStream.ts            # Custom hook for SSE streaming via fetch
    └── useProtectedRoute.ts       # Client-side auth guard
```

## State Management (RTK)

### Store Structure

```typescript
interface RootState {
  auth: {
    token: string | null;
    user: { id: string; email: string; name: string; role: Role; tier: Tier } | null;
    isAuthenticated: boolean;
  };
  chat: {
    activeChatId: string | null;
    streamingBuffer: string;
    isStreaming: boolean;
  };
  [baseApi.reducerPath]: ReturnType<typeof baseApi.reducer>;
}
```

### RTK Query Base

```typescript
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('X-Firebase-AppCheck', 'mock-token');
    headers.set('X-Client-Type', 'web');
    return headers;
  },
});
```

### API Slices

**authApi:**
- `requestOtp(email)` → mutation
- `verifyOtp({ email, otp })` → mutation → returns JWT

**chatApi:**
- `getChats()` → query (paginated)
- `createChat(title)` → mutation
- `getChatHistory(chatId)` → query

**adminApi:**
- `getAllFlags()` → query
- `getFlag(key)` → query
- `updateFlag({ key, value })` → mutation
- `createFlag(data)` → mutation
- `deleteFlag(key)` → mutation
- `getTierOverrides(key)` → query
- `setTierOverride({ key, tier, value })` → mutation
- `deleteTierOverride({ key, tier })` → mutation
- `getUsers()` → query
- `updateUserTier({ id, tier })` → mutation

## SSE Streaming Implementation

RTK Query cannot natively handle SSE. Custom approach:

```typescript
// hooks/useSSEStream.ts
function useSSEStream(chatId: string) {
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.auth.token);

  const sendMessage = async (content: string) => {
    dispatch(chatSlice.actions.startStreaming());

    const response = await fetch(`/api/chats/${chatId}/completion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Firebase-AppCheck': 'mock-token',
        'X-Client-Type': 'web',
      },
      body: JSON.stringify({ message: content }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      // Parse SSE format: "data: {...}\n\n"
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content') {
            dispatch(chatSlice.actions.appendToBuffer(data.content));
          }
          if (data.type === 'done') {
            dispatch(chatSlice.actions.finishStreaming());
          }
        }
      }
    }
  };

  return { sendMessage };
}
```

## API Communication

### Development

Next.js `rewrites` in `next.config.ts`:

```typescript
async rewrites() {
  return [
    { source: '/api/:path*', destination: 'http://localhost:3000/api/:path*' }
  ];
}
```

Frontend runs on port 3001, proxies `/api/*` to Express on port 3000.

### Production

`NEXT_PUBLIC_API_URL` environment variable points to the deployed API URL.

## Auth Flow

1. User navigates to `/login`
2. Enters email → `POST /api/auth/request-otp` → OTP sent to email
3. Redirected to `/verify?email=...`
4. Enters 6-digit OTP → `POST /api/auth/verify-otp` → JWT returned
5. JWT stored in Redux + localStorage
6. Redirect to `/` (user) or `/admin` (if admin role)
7. On page refresh: JWT loaded from localStorage → Redux hydration
8. Token expiry: RTK Query 401 response → clear auth state → redirect to `/login`

## Admin Dashboard

### Feature Flags Page

- Table with columns: Key, Value, Type, Description, Actions
- Click row → navigate to detail page
- Detail page shows: current value editor + tier override list
- Tier override: table per tier (INDIVIDUAL, STARTUP, ENTERPRISE) with value

### Users Page

- Table with columns: Email, Name, Role, Tier, Created, Actions
- Click row → user detail
- User detail: change tier dropdown, view chat list

## i18n Strategy

- Backend already handles i18n via `?lang=` query param
- Frontend appends `?lang=<locale>` to all API calls
- Frontend UI translations: simple dict object (no heavy library needed for 2 locales)
- Language selector in header/settings

## Responsive Design

- **Desktop (≥1024px):** Fixed left sidebar + content area
- **Tablet (768-1023px):** Collapsible sidebar (hamburger toggle)
- **Mobile (<768px):** Sidebar as drawer/overlay, full-width content

## Docker Compose (Updated)

```yaml
services:
  api:
    build:
      context: ./apps/api
    ports: ["3000:3000"]
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
    env_file: .env

  web:
    build:
      context: ./apps/web
    ports: ["3001:3001"]
    depends_on: [api]
    environment:
      - NEXT_PUBLIC_API_URL=http://api:3000

  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    healthcheck: ...

  redis:
    image: redis:7
    ports: ["6379:6379"]
    healthcheck: ...
```

## Shared Package

`packages/shared` exports TypeScript types and constants used by both apps:

```typescript
// types.ts
export type Role = 'USER' | 'ADMIN';
export type Tier = 'INDIVIDUAL' | 'STARTUP' | 'ENTERPRISE';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  tier: Tier;
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
}

// constants.ts
export const FEATURE_FLAG_KEYS = {
  STREAMING_ENABLED: 'STREAMING_ENABLED',
  PAGINATION_LIMIT: 'PAGINATION_LIMIT',
  AI_TOOLS_ENABLED: 'AI_TOOLS_ENABLED',
  CHAT_HISTORY_ENABLED: 'CHAT_HISTORY_ENABLED',
} as const;
```

## Migration Plan (High Level)

1. Initialize Turborepo at root, create `pnpm-workspace.yaml`
2. Move existing backend code to `apps/api/`
3. Create `packages/shared` with extracted types
4. Scaffold Next.js app in `apps/web/`
5. Implement auth pages (login + verify)
6. Implement chat layout and chat list
7. Implement SSE streaming chat
8. Implement admin dashboard
9. Update Docker Compose for monorepo structure
10. Update root CLAUDE.md for new structure
