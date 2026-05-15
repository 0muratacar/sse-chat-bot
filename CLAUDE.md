# Project Rules

## Reference Documents

- Design spec: `docs/superpowers/specs/2026-05-13-sse-chat-bot-be-design.md`
- Task requirements: `docs/sse-chat-task.pdf` (not in git)

## Architecture Rules

- **Design spec is the source of truth.** All development follows the patterns and decisions in the design spec.
- **Decorator-based DI via tsyringe.** All services, repositories, and controllers use `@injectable()` or `@singleton()`. No manual wiring.
- **Declarative route definitions.** Routes are `RouteDefinition[]` arrays in `src/routes/*.routes.ts`. Never write Express router calls directly.
- **Layered architecture.** Controller → Service → Repository. Controllers never access Prisma directly. Services never handle HTTP concerns.
- **Feature flags drive behavior.** Use Strategy pattern. No hardcoded if/else for feature switching. All flags live in DB with Redis cache (write-through).
- **Singleton pattern** for PrismaService, RedisService (@singleton), Logger, Config.

## i18n Rules

- **All user-facing error messages MUST use `t()` from `src/i18n`.** Never hardcode error message strings in controllers or middlewares.
- **Message keys** are defined in `src/i18n/en.ts` and `src/i18n/tr.ts`. Add new keys to both files when adding new error cases.
- **Language is determined by `?lang=` query parameter.** Default is `en`. Supported: `en`, `tr`.

## Error Handling

- All errors follow format: `{ error: { code: string, message: string, status: number } }`
- Validation errors include `details[]` array with field-level messages.
- Express 5 catches async errors automatically — no try-catch in controllers.
- Global error handler (`error-handler.middleware.ts`) maps Prisma errors to proper HTTP status codes.

## Middleware Order

1. Body parsing (express.json)
2. Logging
3. Language detection (lang query)
4. App Check (route-specific)
5. Authentication (route-specific)
6. Admin check (route-specific)
7. Client type detection (route-specific)
8. Request validation (route-specific)
9. Error handler (global, last)

## Database

- Prisma ORM with PostgreSQL
- Migrations in `prisma/migrations/` — one migration per change, named descriptively
- Feature flags are seeded on first run AND ensured on every server boot (`ensureDefaults()`)
- Indexes on foreign keys and pagination columns

## Code Style

- TypeScript strict mode
- No comments unless explaining WHY (not what)
- Enum for fixed value sets (Role, etc.)
- Zod for all request validation
- OpenAPI spec auto-generated from RouteDefinition + Zod schemas

## Docker

- `docker compose up --build` runs everything
- App waits for postgres + redis health checks before starting
- Entrypoint runs migrations and seed before app start
