# Tier-Based Feature Flag Targeting - Design Spec

## Overview

Extend the existing global feature flag system with user tier (subscription segment) support. Feature flags gain tier-specific overrides so different user segments see different feature configurations at runtime, without redeployment.

## Problem

Current feature flags are global: a flag is either on or off for all users. The business requires per-segment control to:
- Limit expensive features (streaming, AI tools) to premium tiers
- A/B test capabilities with specific user groups
- Gradually enable features tier-by-tier

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tier storage | Prisma enum on User model | Type-safe, DB-enforced, extensible via migration |
| Tier assignment | Admin-only, default INDIVIDUAL | Simplest flow, no self-service tier change |
| Targeting granularity | Tier-based only (no per-user, no percentage) | Matches business need without over-engineering |
| Override model | Separate join table (FeatureFlagTier) | Geriye uyumlu, mevcut FeatureFlag tablosu değişmez |
| Fallback strategy | Tier override → global default | No tier override = global value applies |
| Cache strategy | Write-through, tier-specific Redis keys | Same pattern as existing, extended with tier suffix |

## Data Model

### User Model Change

```prisma
enum Tier {
  INDIVIDUAL
  STARTUP
  ENTERPRISE
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  tier      Tier     @default(INDIVIDUAL)
  chats     Chat[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### New Table: FeatureFlagTier

```prisma
model FeatureFlagTier {
  id        String   @id @default(uuid())
  flagKey   String
  tier      Tier
  value     String
  flag      FeatureFlag @relation(fields: [flagKey], references: [key], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([flagKey, tier])
  @@index([flagKey])
  @@map("feature_flag_tiers")
}
```

### FeatureFlag Model Update

Add relation only (no column changes):

```prisma
model FeatureFlag {
  // ... existing fields unchanged
  tierOverrides FeatureFlagTier[]
}
```

## Redis Cache Structure

```
feature_flag:{KEY}              → global default value
feature_flag:{KEY}:{TIER}       → tier-specific override value
```

Examples:
```
feature_flag:STREAMING_ENABLED              → "true"
feature_flag:STREAMING_ENABLED:ENTERPRISE   → "true"
feature_flag:STREAMING_ENABLED:INDIVIDUAL   → "false"
```

## Service Layer

### FeatureFlagService Changes

All getter methods gain an optional `tier` parameter:

```typescript
async getBoolean(key: string, tier?: Tier): Promise<boolean>
async getNumber(key: string, tier?: Tier): Promise<number>
async getString(key: string, tier?: Tier): Promise<string | null>
```

### Lookup Algorithm

1. If `tier` provided → check Redis `feature_flag:{key}:{tier}`
2. Cache hit → return value
3. Cache miss → query `FeatureFlagTier` table for (key, tier)
4. DB hit → write to Redis, return value
5. DB miss → fall through to global lookup
6. Global lookup (existing logic): Redis `feature_flag:{key}` → DB → FEATURE_FLAG_DEFAULTS

### Tier Override CRUD (new methods)

```typescript
async setTierOverride(key: string, tier: Tier, value: string): Promise<FeatureFlagTier>
async deleteTierOverride(key: string, tier: Tier): Promise<void>
async getTierOverrides(key: string): Promise<FeatureFlagTier[]>
```

Write-through: DB write/delete → corresponding Redis key write/delete.

## API Endpoints

### New Admin Endpoints — Tier Override Management

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/admin/features/:key/tiers` | - | List all tier overrides for a flag |
| PUT | `/api/admin/features/:key/tiers/:tier` | `{ value: string }` | Set/update tier override |
| DELETE | `/api/admin/features/:key/tiers/:tier` | - | Remove tier override (fallback to global) |

### New Admin Endpoint — User Tier Management

| Method | Path | Body | Description |
|--------|------|------|-------------|
| PUT | `/api/admin/users/:id/tier` | `{ tier: Tier }` | Change user's subscription tier |

### Validation Schemas

```typescript
const updateTierOverrideSchema = z.object({
  value: z.string().min(1),
});

const updateUserTierSchema = z.object({
  tier: z.enum(['INDIVIDUAL', 'STARTUP', 'ENTERPRISE']),
});
```

## Integration Points

### CompletionService

Currently:
```typescript
const streamingEnabled = await this.featureFlagService.getBoolean('STREAMING_ENABLED');
```

After:
```typescript
const user = await this.userRepository.findById(userId);
const streamingEnabled = await this.featureFlagService.getBoolean('STREAMING_ENABLED', user.tier);
const toolsEnabled = await this.featureFlagService.getBoolean('AI_TOOLS_ENABLED', user.tier);
```

### ChatService (pagination)

Pass user tier when reading pagination limit:
```typescript
const limit = await this.featureFlagService.getNumber('PAGINATION_LIMIT', user.tier);
```

### Strategy Factories

Strategy factories receive tier parameter to resolve correct strategy:
```typescript
async getStrategy(tier?: Tier): Promise<CompletionStrategy>
```

## Migration Strategy

1. Add `Tier` enum and `tier` column to User (default INDIVIDUAL)
2. Create `feature_flag_tiers` table
3. Add relation to FeatureFlag model
4. No data migration needed — all existing users get INDIVIDUAL, no tier overrides exist

## Error Handling

- `PUT /admin/features/:key/tiers/:tier` with invalid tier → 400 validation error
- `PUT /admin/features/:key/tiers/:tier` where flag key doesn't exist → 404
- `PUT /admin/users/:id/tier` with non-existent user → 404
- Tier enum in URL validated via Zod

## i18n Keys to Add

```typescript
INVALID_TIER: 'Invalid tier value'
USER_TIER_UPDATED: 'User tier updated successfully'
TIER_OVERRIDE_NOT_FOUND: 'Tier override not found'
```
