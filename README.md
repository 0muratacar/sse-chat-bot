# AI Chat System Backend

AI-powered chat backend with runtime feature flagging, SSE streaming, and design pattern implementation.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Auth:** JWT (simplified)
- **Testing:** Jest

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+

### Setup

```bash
# Install dependencies
npm install

# Start infrastructure (PostgreSQL + Redis)
docker compose up -d postgres redis

# Run database migration
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Generate a test JWT token
npm run generate-token

# Start development server
npm run dev
```

### Full Docker Setup

```bash
docker compose up --build
```

This starts PostgreSQL, Redis, and the app. The app runs migrations and seeds automatically.

## API Endpoints

### Core

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/chats` | List user's chats (paginated) |
| GET | `/api/chats/:chatId/history` | Message history for a chat |
| POST | `/api/chats/:chatId/completion` | AI completion (SSE or JSON) |

### Admin (Feature Flags)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/features` | List all feature flags |
| GET | `/api/admin/features/:key` | Get specific flag |
| PUT | `/api/admin/features/:key` | Update flag value |
| POST | `/api/admin/features` | Create new flag |

## Authentication

All `/api/chats/*` endpoints require:
- `X-Firebase-AppCheck` header (any non-"invalid" value)
- `Authorization: Bearer <jwt_token>` header

Generate a token:
```bash
npm run generate-token
```

## Feature Flags

Runtime-configurable flags that change behavior without restart:

| Flag | Type | Default | Effect |
|------|------|---------|--------|
| `STREAMING_ENABLED` | boolean | true | SSE stream vs JSON response |
| `PAGINATION_LIMIT` | number | 20 | Max items in chat list (10-100) |
| `AI_TOOLS_ENABLED` | boolean | true | Enable mock AI tool execution |
| `CHAT_HISTORY_ENABLED` | boolean | true | Full vs last 10 messages |

### Change a flag at runtime:
```bash
curl -X PUT http://localhost:3000/api/admin/features/STREAMING_ENABLED \
  -H "Content-Type: application/json" \
  -d '{"value": "false"}'
```

## Architecture

### Design Patterns

- **Dependency Injection** — Manual DI via `container.ts`
- **Service Pattern** — Business logic in service classes
- **Repository Pattern** — Database access abstraction
- **Singleton Pattern** — PrismaService, RedisService, Logger, Config
- **Strategy Pattern** — Feature flag-based behavior switching

### Middleware Chain (Order)

1. Logging (request timing)
2. Firebase App Check (mock verification)
3. Authentication (JWT validation)
4. Client Type Detection (Web/Mobile/Desktop)
5. Request Validation (Zod schemas)
6. Error Handler (catches all unhandled errors)

### Feature Flag Flow

```
Admin PUT → DB write → Redis write (write-through)
                ↓
Request → Redis read (fast) → Strategy selection → Response
```

## Testing

```bash
npm test              # Run all tests
npm run test:coverage # Run with coverage report
```

## Project Structure

```
src/
├── config/          # Environment config, constants
├── controllers/     # HTTP request handlers (class-based)
├── middlewares/      # Middleware chain + validation schemas
├── repositories/    # Database access layer
├── services/        # Business logic
├── strategies/      # Strategy pattern implementations
├── types/           # TypeScript interfaces
├── utils/           # Logger, Prisma client, helpers
├── container.ts     # DI container wiring
├── routes.ts        # Route registration
└── app.ts           # Express app setup
```

## Environment Variables

See `.env.example` for all required variables.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm test` | Run tests |
| `npm run test:coverage` | Tests with coverage |
| `npm run generate-token` | Generate JWT for testing |
