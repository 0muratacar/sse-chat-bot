# Monorepo + Next.js Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing Express backend into a Turborepo monorepo and build a complete Next.js frontend with auth, chat (SSE streaming), and admin dashboard.

**Architecture:** Turborepo at root with pnpm workspaces. Backend moves to `apps/api/`, new Next.js app in `apps/web/`, shared types in `packages/shared/`. Frontend uses RTK Query for API communication and custom fetch-based SSE for streaming.

**Tech Stack:** Turborepo, pnpm, Next.js 15 (App Router), shadcn/ui, Tailwind CSS 4, Redux Toolkit, RTK Query, TypeScript

---

## Task 1: Initialize Turborepo + pnpm Workspaces

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Modify: `package.json` (convert to workspace root)
- Modify: `.gitignore`
- Modify: `.npmrc` (if needed)

- [ ] **Step 1: Install pnpm globally if not present**

Run: `npm install -g pnpm`

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create turbo.json**

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
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 4: Convert root package.json to workspace root**

```json
{
  "name": "sse-chat-bot",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "^2"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 5: Update .gitignore for monorepo**

Append:

```
# Turborepo
.turbo/

# pnpm
.pnpm-store/
```

- [ ] **Step 6: Commit**

```bash
git add pnpm-workspace.yaml turbo.json package.json .gitignore
git commit -m "feat: initialize turborepo monorepo with pnpm workspaces"
```

---

## Task 2: Move Backend to apps/api

**Files:**
- Create: `apps/api/` (moved from root)
- Modify: `apps/api/package.json`
- Modify: `apps/api/tsconfig.json`
- Modify: `apps/api/nodemon.json`
- Modify: `docker-compose.yml` (update build context)

- [ ] **Step 1: Create apps directory and move backend**

```bash
mkdir -p apps
git mv src apps/api/src
git mv prisma apps/api/prisma
git mv tests apps/api/tests
git mv Dockerfile apps/api/Dockerfile
git mv docker apps/api/docker
git mv tsconfig.json apps/api/tsconfig.json
git mv tsconfig.test.json apps/api/tsconfig.test.json
git mv jest.config.ts apps/api/jest.config.ts
git mv nodemon.json apps/api/nodemon.json
git mv prisma.config.ts apps/api/prisma.config.ts
```

- [ ] **Step 2: Create apps/api/package.json**

```json
{
  "name": "@sse-chat-bot/api",
  "version": "1.0.0",
  "private": true,
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "type-check": "tsc --noEmit",
    "generate-token": "ts-node src/utils/generate-token.ts",
    "db:migrate": "prisma migrate deploy",
    "db:generate": "prisma generate",
    "db:seed": "prisma db seed"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "@prisma/client": "^6.19.3",
    "bcrypt": "^6.0.0",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "ioredis": "^5.10.1",
    "jsonwebtoken": "^9.0.3",
    "nodemailer": "^8.0.7",
    "prisma": "^6.19.3",
    "reflect-metadata": "^0.2.2",
    "tsyringe": "^4.10.0",
    "winston": "^3.19.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@types/bcrypt": "^6.0.0",
    "@types/express": "^5.0.6",
    "@types/ioredis": "^4.28.10",
    "@types/jest": "^30.0.0",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^25.7.0",
    "@types/nodemailer": "^8.0.0",
    "jest": "^29.7.0",
    "nodemon": "^3.1.14",
    "ts-jest": "^29.4.9",
    "ts-node": "^10.9.2",
    "typescript": "^6.0.3"
  }
}
```

- [ ] **Step 3: Update apps/api/Dockerfile build context paths**

```dockerfile
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

COPY src ./src/
RUN pnpm run build

FROM node:24-alpine AS runner

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
RUN apk add --no-cache postgresql-client

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
```

- [ ] **Step 4: Update root docker-compose.yml**

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6381:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./apps/api
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - DATABASE_URL=postgresql://postgres:postgres123@host.docker.internal:5432/chatbot_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy

  web:
    build:
      context: ./apps/web
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:3000
    depends_on:
      - api

volumes:
  redis_data:
```

- [ ] **Step 5: Remove old root package-lock.json (pnpm replaces it)**

```bash
rm package-lock.json
```

- [ ] **Step 6: Install dependencies from workspace root**

```bash
cd /path/to/root
pnpm install
```

- [ ] **Step 7: Verify backend still works**

Run: `cd apps/api && pnpm dev`
Expected: Server starts on port 3000 without errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: move backend to apps/api for monorepo structure"
```

---

## Task 3: Create packages/shared

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/constants.ts`

- [ ] **Step 1: Create packages/shared/package.json**

```json
{
  "name": "@sse-chat-bot/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^6.0.3"
  }
}
```

- [ ] **Step 2: Create packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create packages/shared/src/types.ts**

```typescript
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
```

- [ ] **Step 4: Create packages/shared/src/constants.ts**

```typescript
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
```

- [ ] **Step 5: Create packages/shared/src/index.ts**

```typescript
export * from './types';
export * from './constants';
```

- [ ] **Step 6: Commit**

```bash
git add packages/
git commit -m "feat: add shared package with types and constants"
```

---

## Task 4: Scaffold Next.js App

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/Dockerfile`

- [ ] **Step 1: Create apps/web/package.json**

```json
{
  "name": "@sse-chat-bot/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@sse-chat-bot/shared": "workspace:*",
    "@reduxjs/toolkit": "^2.6.1",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-redux": "^9.2.0",
    "next": "^15.3.2",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.0",
    "class-variance-authority": "^0.7.1",
    "lucide-react": "^0.511.0"
  },
  "devDependencies": {
    "@types/node": "^25.7.0",
    "@types/react": "^19.1.6",
    "@types/react-dom": "^19.1.6",
    "typescript": "^6.0.3",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "postcss": "^8"
  }
}
```

- [ ] **Step 2: Create apps/web/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "ES2020"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create apps/web/next.config.ts**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create apps/web/postcss.config.mjs**

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 5: Create apps/web/src/app/globals.css**

```css
@import "tailwindcss";
```

- [ ] **Step 6: Create apps/web/src/app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Chat Bot',
  description: 'AI-powered chat application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Create apps/web/src/app/page.tsx (temporary landing)**

```tsx
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">AI Chat Bot</h1>
    </div>
  );
}
```

- [ ] **Step 8: Create apps/web/Dockerfile**

```dockerfile
FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:24-alpine AS runner

WORKDIR /app

RUN corepack enable

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
```

- [ ] **Step 9: Install dependencies and verify**

```bash
cd /path/to/root
pnpm install
cd apps/web
pnpm dev
```

Expected: Next.js starts on port 3001, shows "AI Chat Bot" at localhost:3001.

- [ ] **Step 10: Commit**

```bash
git add apps/web/
git commit -m "feat: scaffold Next.js 15 app with Tailwind CSS 4"
```

---

## Task 5: Setup shadcn/ui

**Files:**
- Create: `apps/web/components.json`
- Create: `apps/web/src/lib/utils.ts`
- Create: `apps/web/src/components/ui/button.tsx`
- Create: `apps/web/src/components/ui/input.tsx`
- Create: `apps/web/src/components/ui/card.tsx`
- Create: `apps/web/src/components/ui/dialog.tsx`
- Create: `apps/web/src/components/ui/table.tsx`
- Create: `apps/web/src/components/ui/badge.tsx`
- Create: `apps/web/src/components/ui/select.tsx`
- Create: `apps/web/src/components/ui/separator.tsx`
- Create: `apps/web/src/components/ui/scroll-area.tsx`
- Create: `apps/web/src/components/ui/skeleton.tsx`
- Create: `apps/web/src/components/ui/tooltip.tsx`

- [ ] **Step 1: Create apps/web/src/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create apps/web/components.json**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 3: Install shadcn/ui components**

Run from `apps/web`:

```bash
pnpm dlx shadcn@latest add button input card dialog table badge select separator scroll-area skeleton tooltip
```

This generates all component files in `src/components/ui/`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/
git commit -m "feat: setup shadcn/ui with core components"
```

---

## Task 6: Redux Toolkit + RTK Query Setup

**Files:**
- Create: `apps/web/src/lib/store.ts`
- Create: `apps/web/src/lib/hooks.ts`
- Create: `apps/web/src/lib/api/baseApi.ts`
- Create: `apps/web/src/lib/slices/authSlice.ts`
- Create: `apps/web/src/lib/slices/chatSlice.ts`
- Create: `apps/web/src/components/providers/StoreProvider.tsx`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Create apps/web/src/lib/api/baseApi.ts**

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('X-Firebase-AppCheck', 'mock-token');
      headers.set('X-Client-Type', 'web');
      return headers;
    },
  }),
  tagTypes: ['Chat', 'FeatureFlag', 'User'],
  endpoints: () => ({}),
});
```

- [ ] **Step 2: Create apps/web/src/lib/slices/authSlice.ts**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Role, Tier } from '@sse-chat-bot/shared';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  tier: Tier;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; user: AuthUser }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
```

- [ ] **Step 3: Create apps/web/src/lib/slices/chatSlice.ts**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
  activeChatId: string | null;
  streamingBuffer: string;
  isStreaming: boolean;
}

const initialState: ChatState = {
  activeChatId: null,
  streamingBuffer: '',
  isStreaming: false,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeChatId = action.payload;
    },
    startStreaming: (state) => {
      state.isStreaming = true;
      state.streamingBuffer = '';
    },
    appendToBuffer: (state, action: PayloadAction<string>) => {
      state.streamingBuffer += action.payload;
    },
    finishStreaming: (state) => {
      state.isStreaming = false;
    },
    clearBuffer: (state) => {
      state.streamingBuffer = '';
    },
  },
});

export const { setActiveChat, startStreaming, appendToBuffer, finishStreaming, clearBuffer } = chatSlice.actions;
```

- [ ] **Step 4: Create apps/web/src/lib/store.ts**

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import { authSlice } from './slices/authSlice';
import { chatSlice } from './slices/chatSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: authSlice.reducer,
      chat: chatSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
```

- [ ] **Step 5: Create apps/web/src/lib/hooks.ts**

```typescript
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

- [ ] **Step 6: Create apps/web/src/components/providers/StoreProvider.tsx**

```tsx
'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '@/lib/store';
import { setCredentials } from '@/lib/slices/authSlice';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          storeRef.current.dispatch(setCredentials({ token, user }));
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
```

- [ ] **Step 7: Update apps/web/src/app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import { StoreProvider } from '@/components/providers/StoreProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Chat Bot',
  description: 'AI-powered chat application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Verify store setup**

Run: `cd apps/web && pnpm dev`
Expected: No errors, page renders.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/lib/ apps/web/src/components/providers/ apps/web/src/app/layout.tsx
git commit -m "feat: setup Redux Toolkit + RTK Query with auth and chat slices"
```

---

## Task 7: RTK Query API Slices

**Files:**
- Create: `apps/web/src/lib/api/authApi.ts`
- Create: `apps/web/src/lib/api/chatApi.ts`
- Create: `apps/web/src/lib/api/adminApi.ts`

- [ ] **Step 1: Create apps/web/src/lib/api/authApi.ts**

```typescript
import { baseApi } from './baseApi';
import type { AuthResponse } from '@sse-chat-bot/shared';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    requestOtp: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/request-otp',
        method: 'POST',
        body,
      }),
    }),
    verifyOtp: builder.mutation<AuthResponse, { email: string; otp: string }>({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useRequestOtpMutation, useVerifyOtpMutation } = authApi;
```

- [ ] **Step 2: Create apps/web/src/lib/api/chatApi.ts**

```typescript
import { baseApi } from './baseApi';
import type { Chat, Message } from '@sse-chat-bot/shared';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query<{ data: Chat[] }, void>({
      query: () => '/chats',
      providesTags: ['Chat'],
    }),
    createChat: builder.mutation<Chat, { title: string }>({
      query: (body) => ({
        url: '/chats',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Chat'],
    }),
    getChatHistory: builder.query<{ data: Message[] }, string>({
      query: (chatId) => `/chats/${chatId}/history`,
    }),
  }),
});

export const { useGetChatsQuery, useCreateChatMutation, useGetChatHistoryQuery } = chatApi;
```

- [ ] **Step 3: Create apps/web/src/lib/api/adminApi.ts**

```typescript
import { baseApi } from './baseApi';
import type { FeatureFlag, FeatureFlagTierOverride, User, Tier } from '@sse-chat-bot/shared';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllFlags: builder.query<{ data: FeatureFlag[] }, void>({
      query: () => '/admin/features',
      providesTags: ['FeatureFlag'],
    }),
    getFlag: builder.query<FeatureFlag, string>({
      query: (key) => `/admin/features/${key}`,
      providesTags: (_result, _error, key) => [{ type: 'FeatureFlag', id: key }],
    }),
    createFlag: builder.mutation<FeatureFlag, { key: string; value: string; type: string; description?: string }>({
      query: (body) => ({
        url: '/admin/features',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FeatureFlag'],
    }),
    updateFlag: builder.mutation<FeatureFlag, { key: string; value: string }>({
      query: ({ key, ...body }) => ({
        url: `/admin/features/${key}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { key }) => [{ type: 'FeatureFlag', id: key }, 'FeatureFlag'],
    }),
    deleteFlag: builder.mutation<void, string>({
      query: (key) => ({
        url: `/admin/features/${key}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FeatureFlag'],
    }),
    getTierOverrides: builder.query<{ data: FeatureFlagTierOverride[] }, string>({
      query: (key) => `/admin/features/${key}/tiers`,
      providesTags: (_result, _error, key) => [{ type: 'FeatureFlag', id: `${key}-tiers` }],
    }),
    setTierOverride: builder.mutation<FeatureFlagTierOverride, { key: string; tier: Tier; value: string }>({
      query: ({ key, tier, ...body }) => ({
        url: `/admin/features/${key}/tiers/${tier}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { key }) => [{ type: 'FeatureFlag', id: `${key}-tiers` }],
    }),
    deleteTierOverride: builder.mutation<void, { key: string; tier: Tier }>({
      query: ({ key, tier }) => ({
        url: `/admin/features/${key}/tiers/${tier}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { key }) => [{ type: 'FeatureFlag', id: `${key}-tiers` }],
    }),
    getUsers: builder.query<{ data: User[] }, void>({
      query: () => '/admin/users',
      providesTags: ['User'],
    }),
    updateUserTier: builder.mutation<User, { id: string; tier: Tier }>({
      query: ({ id, ...body }) => ({
        url: `/admin/users/${id}/tier`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetAllFlagsQuery,
  useGetFlagQuery,
  useCreateFlagMutation,
  useUpdateFlagMutation,
  useDeleteFlagMutation,
  useGetTierOverridesQuery,
  useSetTierOverrideMutation,
  useDeleteTierOverrideMutation,
  useGetUsersQuery,
  useUpdateUserTierMutation,
} = adminApi;
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/api/
git commit -m "feat: add RTK Query API slices for auth, chat, and admin"
```

---

## Task 8: Auth Pages (Login + OTP Verify)

**Files:**
- Create: `apps/web/src/app/(auth)/layout.tsx`
- Create: `apps/web/src/app/(auth)/login/page.tsx`
- Create: `apps/web/src/app/(auth)/verify/page.tsx`
- Create: `apps/web/src/components/auth/LoginForm.tsx`
- Create: `apps/web/src/components/auth/OtpForm.tsx`

- [ ] **Step 1: Create apps/web/src/app/(auth)/layout.tsx**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md p-6">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create apps/web/src/components/auth/LoginForm.tsx**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequestOtpMutation } from '@/lib/api/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [requestOtp, { isLoading, error }] = useRequestOtpMutation();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestOtp({ email }).unwrap();
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch {
      // error is handled by RTK Query state
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your email to receive a verification code</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && (
            <p className="text-sm text-red-500">
              {'data' in error ? (error.data as { error?: { message?: string } })?.error?.message : 'Failed to send OTP'}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create apps/web/src/app/(auth)/login/page.tsx**

```tsx
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 4: Create apps/web/src/components/auth/OtpForm.tsx**

```tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyOtpMutation } from '@/lib/api/authApi';
import { useAppDispatch } from '@/lib/hooks';
import { setCredentials } from '@/lib/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function OtpForm() {
  const [otp, setOtp] = useState('');
  const [verifyOtp, { isLoading, error }] = useVerifyOtpMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await verifyOtp({ email, otp }).unwrap();
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      dispatch(setCredentials({ token: result.token, user: result.user }));

      if (result.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch {
      // error handled by RTK Query state
    }
  };

  if (!email) {
    router.push('/login');
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Code</CardTitle>
        <CardDescription>Enter the 6-digit code sent to {email}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className="text-center text-2xl tracking-widest"
            required
          />
          {error && (
            <p className="text-sm text-red-500">
              {'data' in error ? (error.data as { error?: { message?: string } })?.error?.message : 'Invalid code'}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Create apps/web/src/app/(auth)/verify/page.tsx**

```tsx
import { Suspense } from 'react';
import { OtpForm } from '@/components/auth/OtpForm';

export default function VerifyPage() {
  return (
    <Suspense>
      <OtpForm />
    </Suspense>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\(auth\)/ apps/web/src/components/auth/
git commit -m "feat: add auth pages with login and OTP verification"
```

---

## Task 9: Chat Layout + Sidebar

**Files:**
- Create: `apps/web/src/app/(user)/layout.tsx`
- Create: `apps/web/src/app/(user)/page.tsx`
- Create: `apps/web/src/components/chat/ChatLayout.tsx`
- Create: `apps/web/src/components/chat/ChatSidebar.tsx`
- Create: `apps/web/src/hooks/useAuth.ts`

- [ ] **Step 1: Create apps/web/src/hooks/useAuth.ts**

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';

export function useAuth(requiredRole?: 'ADMIN') {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (requiredRole && user?.role !== requiredRole) {
      router.push('/');
    }
  }, [isAuthenticated, user, requiredRole, router]);

  return { isAuthenticated, user };
}
```

- [ ] **Step 2: Create apps/web/src/components/chat/ChatSidebar.tsx**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetChatsQuery, useCreateChatMutation } from '@/lib/api/chatApi';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { setActiveChat } from '@/lib/slices/chatSlice';
import { logout } from '@/lib/slices/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquarePlus, LogOut } from 'lucide-react';

export function ChatSidebar() {
  const [newTitle, setNewTitle] = useState('');
  const [showInput, setShowInput] = useState(false);
  const { data, isLoading } = useGetChatsQuery();
  const [createChat] = useCreateChatMutation();
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const chat = await createChat({ title: newTitle.trim() }).unwrap();
    setNewTitle('');
    setShowInput(false);
    dispatch(setActiveChat(chat.id));
    router.push(`/chat/${chat.id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-neutral-50">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-sm font-semibold">Chats</h2>
        <Button variant="ghost" size="icon" onClick={() => setShowInput(!showInput)}>
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      </div>

      {showInput && (
        <div className="flex gap-2 px-4 pb-2">
          <Input
            placeholder="Chat title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="h-8 text-sm"
          />
          <Button size="sm" onClick={handleCreate}>+</Button>
        </div>
      )}

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading && <p className="p-2 text-sm text-muted-foreground">Loading...</p>}
          {data?.data?.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                dispatch(setActiveChat(chat.id));
                router.push(`/chat/${chat.id}`);
              }}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-100 ${
                activeChatId === chat.id ? 'bg-neutral-200 font-medium' : ''
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </ScrollArea>

      <Separator />
      <div className="flex items-center justify-between p-4">
        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create apps/web/src/components/chat/ChatLayout.tsx**

```tsx
'use client';

import { ChatSidebar } from './ChatSidebar';
import { useAuth } from '@/hooks/useAuth';

export function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/src/app/(user)/layout.tsx**

```tsx
import { ChatLayout } from '@/components/chat/ChatLayout';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <ChatLayout>{children}</ChatLayout>;
}
```

- [ ] **Step 5: Create apps/web/src/app/(user)/page.tsx**

```tsx
export default function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-neutral-700">Welcome to AI Chat</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a chat from the sidebar or create a new one
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\(user\)/ apps/web/src/components/chat/ apps/web/src/hooks/
git commit -m "feat: add chat layout with sidebar and auth guard"
```

---

## Task 10: Chat Conversation Page + SSE Streaming

**Files:**
- Create: `apps/web/src/app/(user)/chat/[chatId]/page.tsx`
- Create: `apps/web/src/components/chat/ChatMessage.tsx`
- Create: `apps/web/src/components/chat/ChatInput.tsx`
- Create: `apps/web/src/components/chat/ChatStream.tsx`
- Create: `apps/web/src/hooks/useSSEStream.ts`

- [ ] **Step 1: Create apps/web/src/hooks/useSSEStream.ts**

```typescript
'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { startStreaming, appendToBuffer, finishStreaming } from '@/lib/slices/chatSlice';

export function useSSEStream(chatId: string) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const isStreaming = useAppSelector((state) => state.chat.isStreaming);

  const sendMessage = useCallback(async (content: string) => {
    dispatch(startStreaming());

    try {
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

      if (!response.ok) {
        dispatch(finishStreaming());
        return;
      }

      const contentType = response.headers.get('content-type');

      if (contentType?.includes('text/event-stream')) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'content') {
                  dispatch(appendToBuffer(data.content));
                } else if (data.type === 'done') {
                  dispatch(finishStreaming());
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        }
        dispatch(finishStreaming());
      } else {
        const json = await response.json();
        if (json.message?.content) {
          dispatch(appendToBuffer(json.message.content));
        }
        dispatch(finishStreaming());
      }
    } catch {
      dispatch(finishStreaming());
    }
  }, [chatId, token, dispatch]);

  return { sendMessage, isStreaming };
}
```

- [ ] **Step 2: Create apps/web/src/components/chat/ChatMessage.tsx**

```tsx
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={cn('flex w-full', role === 'user' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm',
          role === 'user'
            ? 'bg-neutral-900 text-white'
            : 'bg-neutral-100 text-neutral-900'
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create apps/web/src/components/chat/ChatInput.tsx**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 rounded-lg border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
      />
      <Button type="submit" size="icon" disabled={disabled || !message.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Create apps/web/src/components/chat/ChatStream.tsx**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useGetChatHistoryQuery } from '@/lib/api/chatApi';
import { useSSEStream } from '@/hooks/useSSEStream';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { clearBuffer } from '@/lib/slices/chatSlice';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message } from '@sse-chat-bot/shared';

interface ChatStreamProps {
  chatId: string;
}

export function ChatStream({ chatId }: ChatStreamProps) {
  const { data, refetch } = useGetChatHistoryQuery(chatId);
  const { sendMessage, isStreaming } = useSSEStream(chatId);
  const streamingBuffer = useAppSelector((state) => state.chat.streamingBuffer);
  const dispatch = useAppDispatch();
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages: Message[] = data?.data || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingBuffer]);

  useEffect(() => {
    if (!isStreaming && streamingBuffer) {
      refetch();
      dispatch(clearBuffer());
    }
  }, [isStreaming, streamingBuffer, refetch, dispatch]);

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role as 'user' | 'assistant'} content={msg.content} />
          ))}
          {isStreaming && streamingBuffer && (
            <ChatMessage role="assistant" content={streamingBuffer} />
          )}
        </div>
      </ScrollArea>
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
```

- [ ] **Step 5: Create apps/web/src/app/(user)/chat/[chatId]/page.tsx**

```tsx
'use client';

import { use } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { setActiveChat } from '@/lib/slices/chatSlice';
import { ChatStream } from '@/components/chat/ChatStream';
import { useEffect } from 'react';

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setActiveChat(chatId));
  }, [chatId, dispatch]);

  return <ChatStream chatId={chatId} />;
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\(user\)/chat/ apps/web/src/components/chat/ apps/web/src/hooks/useSSEStream.ts
git commit -m "feat: add chat conversation page with SSE streaming"
```

---

## Task 11: Admin Layout + Dashboard

**Files:**
- Create: `apps/web/src/app/admin/layout.tsx`
- Create: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/components/layout/AdminNav.tsx`
- Create: `apps/web/src/components/admin/StatsCards.tsx`

- [ ] **Step 1: Create apps/web/src/components/layout/AdminNav.tsx**

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logout } from '@/lib/slices/authSlice';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Flag, Users, LogOut, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/features', label: 'Feature Flags', icon: Flag },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="flex h-full w-56 flex-col border-r bg-neutral-50">
      <div className="p-4">
        <h1 className="text-sm font-bold">Admin Panel</h1>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-neutral-100',
              pathname === item.href && 'bg-neutral-200 font-medium'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <Separator />
      <div className="space-y-2 p-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-neutral-100"
        >
          <MessageSquare className="h-4 w-4" />
          Back to Chat
        </Link>
      </div>
      <Separator />
      <div className="flex items-center justify-between p-4">
        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/admin/layout.tsx**

```tsx
'use client';

import { AdminNav } from '@/components/layout/AdminNav';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth('ADMIN');

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create apps/web/src/components/admin/StatsCards.tsx**

```tsx
'use client';

import { useGetAllFlagsQuery } from '@/lib/api/adminApi';
import { useGetChatsQuery } from '@/lib/api/chatApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flag, MessageSquare } from 'lucide-react';

export function StatsCards() {
  const { data: flagsData } = useGetAllFlagsQuery();
  const { data: chatsData } = useGetChatsQuery();

  const stats = [
    { label: 'Feature Flags', value: flagsData?.data?.length ?? '...', icon: Flag },
    { label: 'Total Chats', value: chatsData?.data?.length ?? '...', icon: MessageSquare },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/src/app/admin/page.tsx**

```tsx
import { StatsCards } from '@/components/admin/StatsCards';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <StatsCards />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/admin/ apps/web/src/components/layout/ apps/web/src/components/admin/
git commit -m "feat: add admin layout with navigation and dashboard"
```

---

## Task 12: Admin Feature Flags Pages

**Files:**
- Create: `apps/web/src/app/admin/features/page.tsx`
- Create: `apps/web/src/app/admin/features/[key]/page.tsx`
- Create: `apps/web/src/components/admin/FeatureFlagTable.tsx`
- Create: `apps/web/src/components/admin/TierOverrideForm.tsx`

- [ ] **Step 1: Create apps/web/src/components/admin/FeatureFlagTable.tsx**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useGetAllFlagsQuery, useDeleteFlagMutation } from '@/lib/api/adminApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export function FeatureFlagTable() {
  const { data, isLoading } = useGetAllFlagsQuery();
  const [deleteFlag] = useDeleteFlagMutation();
  const router = useRouter();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const flags = data?.data || [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="w-20">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flags.map((flag) => (
          <TableRow
            key={flag.key}
            className="cursor-pointer"
            onClick={() => router.push(`/admin/features/${flag.key}`)}
          >
            <TableCell className="font-mono text-sm">{flag.key}</TableCell>
            <TableCell>
              <Badge variant="secondary">{flag.value}</Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{flag.type}</TableCell>
            <TableCell className="text-sm">{flag.description || '—'}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFlag(flag.key);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/admin/features/page.tsx**

```tsx
import { FeatureFlagTable } from '@/components/admin/FeatureFlagTable';

export default function FeaturesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Feature Flags</h1>
      <FeatureFlagTable />
    </div>
  );
}
```

- [ ] **Step 3: Create apps/web/src/components/admin/TierOverrideForm.tsx**

```tsx
'use client';

import { useState } from 'react';
import {
  useGetFlagQuery,
  useUpdateFlagMutation,
  useGetTierOverridesQuery,
  useSetTierOverrideMutation,
  useDeleteTierOverrideMutation,
} from '@/lib/api/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import type { Tier } from '@sse-chat-bot/shared';

const TIERS: Tier[] = ['INDIVIDUAL', 'STARTUP', 'ENTERPRISE'];

interface FlagDetailProps {
  flagKey: string;
}

export function FlagDetail({ flagKey }: FlagDetailProps) {
  const { data: flag } = useGetFlagQuery(flagKey);
  const { data: overridesData } = useGetTierOverridesQuery(flagKey);
  const [updateFlag] = useUpdateFlagMutation();
  const [setOverride] = useSetTierOverrideMutation();
  const [deleteOverride] = useDeleteTierOverrideMutation();

  const [newValue, setNewValue] = useState('');
  const [overrideTier, setOverrideTier] = useState<Tier>('INDIVIDUAL');
  const [overrideValue, setOverrideValue] = useState('');

  if (!flag) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const overrides = overridesData?.data || [];

  const handleUpdateValue = () => {
    if (!newValue.trim()) return;
    updateFlag({ key: flagKey, value: newValue.trim() });
    setNewValue('');
  };

  const handleAddOverride = () => {
    if (!overrideValue.trim()) return;
    setOverride({ key: flagKey, tier: overrideTier, value: overrideValue.trim() });
    setOverrideValue('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-lg">{flag.key}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Type: {flag.type}</p>
            <p className="text-sm text-muted-foreground">Description: {flag.description || '—'}</p>
            <p className="mt-2 text-sm">
              Current value: <Badge variant="secondary">{flag.value}</Badge>
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleUpdateValue}>Update</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tier Overrides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.map((o) => (
                <TableRow key={o.id}>
                  <TableCell><Badge>{o.tier}</Badge></TableCell>
                  <TableCell>{o.value}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteOverride({ key: flagKey, tier: o.tier })}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex gap-2">
            <select
              value={overrideTier}
              onChange={(e) => setOverrideTier(e.target.value as Tier)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <Input
              placeholder="Override value"
              value={overrideValue}
              onChange={(e) => setOverrideValue(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleAddOverride}>Add Override</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/src/app/admin/features/[key]/page.tsx**

```tsx
'use client';

import { use } from 'react';
import { FlagDetail } from '@/components/admin/TierOverrideForm';

export default function FlagDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Feature Flag: {key}</h1>
      <FlagDetail flagKey={key} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/admin/features/ apps/web/src/components/admin/
git commit -m "feat: add admin feature flags list and detail pages"
```

---

## Task 13: Admin Users Pages

**Files:**
- Create: `apps/web/src/app/admin/users/page.tsx`
- Create: `apps/web/src/app/admin/users/[id]/page.tsx`
- Create: `apps/web/src/components/admin/UserTable.tsx`
- Create: `apps/web/src/components/admin/UserDetail.tsx`

- [ ] **Step 1: Create apps/web/src/components/admin/UserTable.tsx**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useGetUsersQuery } from '@/lib/api/adminApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function UserTable() {
  const { data, isLoading } = useGetUsersQuery();
  const router = useRouter();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const users = data?.data || [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow
            key={user.id}
            className="cursor-pointer"
            onClick={() => router.push(`/admin/users/${user.id}`)}
          >
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.name || '—'}</TableCell>
            <TableCell><Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
            <TableCell><Badge variant="outline">{user.tier}</Badge></TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/admin/users/page.tsx**

```tsx
import { UserTable } from '@/components/admin/UserTable';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <UserTable />
    </div>
  );
}
```

- [ ] **Step 3: Create apps/web/src/components/admin/UserDetail.tsx**

```tsx
'use client';

import { useState } from 'react';
import { useUpdateUserTierMutation } from '@/lib/api/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tier } from '@sse-chat-bot/shared';

const TIERS: Tier[] = ['INDIVIDUAL', 'STARTUP', 'ENTERPRISE'];

interface UserDetailProps {
  userId: string;
}

export function UserDetail({ userId }: UserDetailProps) {
  const [selectedTier, setSelectedTier] = useState<Tier>('INDIVIDUAL');
  const [updateTier, { isLoading }] = useUpdateUserTierMutation();

  const handleUpdate = () => {
    updateTier({ id: userId, tier: selectedTier });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change User Tier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as Tier)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Tier'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create apps/web/src/app/admin/users/[id]/page.tsx**

```tsx
'use client';

import { use } from 'react';
import { UserDetail } from '@/components/admin/UserDetail';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Detail</h1>
      <UserDetail userId={id} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/admin/users/ apps/web/src/components/admin/UserTable.tsx apps/web/src/components/admin/UserDetail.tsx
git commit -m "feat: add admin users list and detail pages with tier management"
```

---

## Task 14: Next.js Middleware (Route Protection)

**Files:**
- Create: `apps/web/src/middleware.ts`

- [ ] **Step 1: Create apps/web/src/middleware.ts**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth pages are always accessible
  if (pathname.startsWith('/login') || pathname.startsWith('/verify')) {
    return NextResponse.next();
  }

  // For protected routes, we rely on client-side auth guard (useAuth hook)
  // since JWT is stored in localStorage (not cookies).
  // This middleware handles only basic redirects for unauthenticated API calls.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/middleware.ts
git commit -m "feat: add Next.js middleware for route matching"
```

---

## Task 15: Update Root Config + CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`
- Modify: `.env.example` (move to root, add web vars)
- Remove: old root `package-lock.json` (if still present)

- [ ] **Step 1: Update .env.example at root**

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://chatbot:chatbot_secret@localhost:5432/chatbot_db

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=dev-secret-key-change-in-production

# AI (optional - falls back to mock if not set)
OPENAI_API_KEY=

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

- [ ] **Step 2: Update CLAUDE.md with monorepo info**

Add to the top of CLAUDE.md after existing content:

```markdown
## Monorepo Structure

- **Root:** Turborepo + pnpm workspaces
- **apps/api:** Express backend (original project)
- **apps/web:** Next.js 15 frontend (App Router, shadcn/ui, RTK)
- **packages/shared:** Shared TypeScript types and constants

### Running

```bash
pnpm dev          # Runs both api and web concurrently
pnpm build        # Builds all packages
pnpm --filter @sse-chat-bot/api dev    # Backend only
pnpm --filter @sse-chat-bot/web dev    # Frontend only
```
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md .env.example
git commit -m "docs: update CLAUDE.md and .env.example for monorepo"
```

---

## Task 16: Backend Users List Endpoint (Admin)

The admin frontend needs a `GET /api/admin/users` endpoint that doesn't exist yet.

**Files:**
- Modify: `apps/api/src/routes/admin.routes.ts`
- Modify: `apps/api/src/controllers/admin.controller.ts`
- Modify: `apps/api/src/services/auth.service.ts` (or create a user service)

- [ ] **Step 1: Check if users list endpoint exists**

Check `apps/api/src/routes/admin.routes.ts` — if there's no `GET /users` route, add one:

Add to `adminRoutes` array:

```typescript
{
  path: '/users',
  method: 'get',
  controller: 'adminController.getUsers',
  config: {
    description: 'List all users',
    middlewares: ['appCheck', 'auth', 'admin'],
    tags: ['admin', 'user'],
  },
},
```

- [ ] **Step 2: Add getUsers to AdminController**

```typescript
async getUsers(req: AuthenticatedRequest, res: Response) {
  const users = await this.userRepository.findAll();
  res.json({ data: users });
}
```

- [ ] **Step 3: Add findAll to UserRepository**

```typescript
async findAll() {
  return this.prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, tier: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
  });
}
```

- [ ] **Step 4: Verify endpoint works**

Run: `curl -H "Authorization: Bearer <admin-token>" -H "X-Firebase-AppCheck: mock-token" http://localhost:3000/api/admin/users`
Expected: JSON array of users (without password field).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/
git commit -m "feat: add GET /api/admin/users endpoint for admin dashboard"
```

---

## Task 17: Final Integration Test

- [ ] **Step 1: Run full monorepo**

```bash
pnpm install
pnpm dev
```

Expected: Both `api` (port 3000) and `web` (port 3001) start without errors.

- [ ] **Step 2: Test auth flow**

1. Open `http://localhost:3001/login`
2. Enter an email → OTP sent
3. Enter OTP at `/verify` → redirected to `/`

- [ ] **Step 3: Test chat flow**

1. Create a new chat from sidebar
2. Send a message → SSE stream response appears token by token
3. Verify message history persists on page refresh

- [ ] **Step 4: Test admin flow**

1. Login with admin account → redirected to `/admin`
2. View dashboard stats
3. Navigate to Features → see flag list
4. Click a flag → edit value, add tier override
5. Navigate to Users → see user list
6. Click user → change tier

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration fixes for monorepo frontend"
```

---

## Summary

| Task | Description | Estimated Time |
|------|-------------|---------------|
| 1 | Turborepo + pnpm init | 5 min |
| 2 | Move backend to apps/api | 10 min |
| 3 | Create packages/shared | 5 min |
| 4 | Scaffold Next.js app | 10 min |
| 5 | Setup shadcn/ui | 5 min |
| 6 | RTK + RTK Query setup | 10 min |
| 7 | API slices (auth, chat, admin) | 10 min |
| 8 | Auth pages (login + verify) | 10 min |
| 9 | Chat layout + sidebar | 10 min |
| 10 | Chat conversation + SSE | 15 min |
| 11 | Admin layout + dashboard | 10 min |
| 12 | Admin feature flags pages | 10 min |
| 13 | Admin users pages | 10 min |
| 14 | Next.js middleware | 5 min |
| 15 | Root config + docs | 5 min |
| 16 | Backend users endpoint | 10 min |
| 17 | Integration testing | 15 min |

**Total: ~2.5 hours**
