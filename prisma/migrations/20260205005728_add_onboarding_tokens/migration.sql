-- CreateTable
CREATE TABLE "onboarding_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_tokens_token_key" ON "onboarding_tokens"("token");

-- CreateIndex
CREATE INDEX "onboarding_tokens_token_idx" ON "onboarding_tokens"("token");

-- CreateIndex
CREATE INDEX "onboarding_tokens_usedAt_idx" ON "onboarding_tokens"("usedAt");
