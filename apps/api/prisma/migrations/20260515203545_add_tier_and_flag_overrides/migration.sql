-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('INDIVIDUAL', 'STARTUP', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tier" "Tier" NOT NULL DEFAULT 'INDIVIDUAL';

-- CreateTable
CREATE TABLE "feature_flag_tiers" (
    "id" TEXT NOT NULL,
    "flagKey" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flag_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feature_flag_tiers_flagKey_idx" ON "feature_flag_tiers"("flagKey");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flag_tiers_flagKey_tier_key" ON "feature_flag_tiers"("flagKey", "tier");

-- AddForeignKey
ALTER TABLE "feature_flag_tiers" ADD CONSTRAINT "feature_flag_tiers_flagKey_fkey" FOREIGN KEY ("flagKey") REFERENCES "feature_flags"("key") ON DELETE CASCADE ON UPDATE CASCADE;
