# AI Chat System Backend - Design Spec

## Overview

AI-powered chat system backend for AppNation. Supports enterprise, startup, and individual developer segments with runtime feature flagging for A/B testing and gradual rollouts.

## Technology Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Node.js + TypeScript | Required by spec |
| Framework | Express | Most familiar, strong middleware ecosystem |
| Controller Style | Class-based | Best for demonstrating DI, Service, Repository patterns |
| ORM | Prisma | Required by spec |
| Database | PostgreSQL | Required by spec |
| Cache | Redis | Feature flag read performance, write-through strategy |
| Feature Flags | DB + Redis + Admin API | Runtime changes without restart, persistent, fast reads |
| AI Provider | OpenAI with mock fallback | Real AI when key available, mock otherwise |
| Streaming | Server-Sent Events (SSE) | Required by spec |
| Auth | JWT (simplified) | Mock-friendly, demonstrates middleware pattern |
| Security | Firebase App Check (mock) | Header-based mock, demonstrates middleware ordering |
| Testing | Jest | Most common, good mock support |
| DevOps | Docker Compose | PostgreSQL + Redis + App in one command |

## Architecture

### Folder Structure

```
src/
├── config/
│   ├── index.ts              # Main config loader (env vars)
│   └── constants.ts          # App constants (non-sensitive)
├── controllers/
│   ├── chat.controller.ts
│   ├── completion.controller.ts
│   └── admin.controller.ts   # Feature flag admin CRUD
├── middlewares/
│   ├── app-check.middleware.ts
│   ├── auth.middleware.ts
│   ├── client-type.middleware.ts
│   ├── validation.middleware.ts
│   ├── error-handler.middleware.ts
│   ├── logging.middleware.ts
│   └── feature-flag.middleware.ts  # Route-specific
├── repositories/
│   ├── chat.repository.ts
│   ├── message.repository.ts
│   ├── user.repository.ts
│   └── feature-flag.repository.ts
├── services/
│   ├── chat.service.ts
│   ├── completion.service.ts
│   ├── feature-flag.service.ts
│   └── redis.service.ts
├── strategies/
│   ├── completion.strategy.ts     # Streaming vs JSON
│   ├── pagination.strategy.ts    # Limit based on flag
│   └── chat-history.strategy.ts  # Full vs limited
├── types/
│   └── index.ts              # All shared interfaces
├── utils/
│   ├── logger.ts             # Structured logger (singleton)
│   └── prisma.ts             # Prisma client (singleton)
├── container.ts              # tsyringe DI container (auto-resolves dependencies)
├── routes.ts                 # Route registration
└── app.ts                    # Express app bootstrap
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
docker-compose.yml
Dockerfile
jest.config.ts
tsconfig.json
.env.example
README.md
```

### Design Patterns

**Dependency Injection:** Decorator-based DI via `tsyringe`. Classes are marked `@injectable()` and dependencies are auto-resolved from constructor parameters — no manual wiring needed. Adding a new service requires only the decorator; `container.resolve(ClassName)` handles the rest.

**Service Pattern:** Business logic in service classes. Controllers only handle HTTP concerns (parse request, call service, format response).

**Repository Pattern:** All Prisma calls isolated in repository classes. Services never touch Prisma directly.

**Singleton Pattern:** `@singleton()` for RedisService (one connection pool). PrismaService, Logger, Config use module-level singleton instances.

**Strategy Pattern:** Feature flags drive strategy selection at runtime:
- `CompletionStrategy` → SSE stream or JSON response
- `PaginationStrategy` → dynamic limit from flag
- `ChatHistoryStrategy` → full history or last N messages

### Middleware Chain (Order)

```
Request
  → 1. Logging (request start)
  → 2. Firebase App Check (mock: checks X-Firebase-AppCheck header)
  → 3. Authentication (JWT from Authorization header)
  → 4. Client Type Detection (X-Client-Type header → web/mobile/desktop)
  → 5. Request Validation (Zod schemas, route-specific)
  → 6. [Route-specific] Feature Flag middleware
  → Controller → Service → Repository → DB
  → Error Handler (catches all, formats response)
```

### Feature Flag System

**Storage:** PostgreSQL `FeatureFlag` table + Redis cache.

**Model:**
```
FeatureFlag {
  id: uuid
  key: string (unique) — e.g., "STREAMING_ENABLED"
  value: string — stored as string, parsed by type
  type: enum (BOOLEAN, NUMBER, STRING)
  description: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Read path:** Redis first → DB fallback → write to Redis.

**Write path (admin):** Write to DB → write to Redis (write-through). Guarantees consistency.

**Required flags:**
1. `STREAMING_ENABLED` (boolean) — SSE vs JSON
2. `PAGINATION_LIMIT` (number, 10-100, default 20) — chat list limit
3. `AI_TOOLS_ENABLED` (boolean) — mock tool usage
4. `CHAT_HISTORY_ENABLED` (boolean) — full vs last 10 messages

**Admin Endpoints:**
- `GET /api/admin/features` — list all flags
- `GET /api/admin/features/:key` — get single flag
- `PUT /api/admin/features/:key` — update flag value
- `POST /api/admin/features` — create new flag

### Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  chats     Chat[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Chat {
  id        String    @id @default(uuid())
  title     String
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId, createdAt])
}

model Message {
  id        String   @id @default(uuid())
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id])
  role      String   // 'user' | 'assistant'
  content   String   @db.Text
  createdAt DateTime @default(now())

  @@index([chatId, createdAt])
}

model FeatureFlag {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String
  type        String   // 'BOOLEAN' | 'NUMBER' | 'STRING'
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### API Endpoints

**Core:**
- `GET /api/chats` — User's chat list (paginated by PAGINATION_LIMIT flag)
- `GET /api/chats/:chatId/history` — Message history (full or limited by CHAT_HISTORY_ENABLED)
- `POST /api/chats/:chatId/completion` — AI completion (SSE or JSON by STREAMING_ENABLED)

**Admin:**
- `GET /api/admin/features` — List all feature flags
- `GET /api/admin/features/:key` — Get specific flag
- `PUT /api/admin/features/:key` — Update flag
- `POST /api/admin/features` — Create flag

**Health:**
- `GET /health` — Basic health check

### Completion Endpoint (Strategy Pattern)

When `STREAMING_ENABLED = true`:
- Response: `Content-Type: text/event-stream`
- Events: `thinking`, `content`, `tool_execution` (if AI_TOOLS_ENABLED), `done`
- Format: `data: {"type": "content", "content": "..."}\n\n`

When `STREAMING_ENABLED = false`:
- Response: `Content-Type: application/json`
- Body: `{ "message": { "role": "assistant", "content": "..." } }`

### AI Tools (Mock)

When `AI_TOOLS_ENABLED = true`, AI can "call" a mock `getCurrentWeather` tool:
- Input: `{ "city": "Istanbul" }`
- Output: `{ "temperature": 22, "condition": "sunny" }`
- Shown in streaming events as `tool_execution` event type

### Error Response Format

```json
{
  "error": {
    "code": "CHAT_NOT_FOUND",
    "message": "Chat with id xyz not found",
    "status": 404
  }
}
```

### Docker Compose Services

- `app` — Node.js application (port 3000)
- `postgres` — PostgreSQL 16 (port 5432)
- `redis` — Redis 7 (port 6379)

## Commit Plan

1. **Project Scaffolding & Express Setup** — TS config, Express hello world, health endpoint
2. **Docker Compose & Database** — Containers, Prisma schema, migrations, seed
3. **Configuration & Logger** — Env config singleton, structured logging (winston)
4. **Repository Layer** — Prisma singleton, all repository classes
5. **Service Layer & DI Container** — Service classes, tsyringe decorator-based DI
6. **Middleware Chain** — All 6 middlewares in correct order
7. **Feature Flag System** — Redis service, DB model, admin API, write-through cache
8. **Core Endpoints (chats + history)** — Controllers, pagination, chat history strategies
9. **Completion Endpoint & SSE** — Streaming, Strategy pattern, OpenAI + mock, AI tools
10. **Tests, README & Final** — Jest tests, documentation, .env.example
