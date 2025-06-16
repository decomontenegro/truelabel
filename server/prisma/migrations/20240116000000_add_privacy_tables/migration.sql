-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('MARKETING', 'ANALYTICS', 'NECESSARY');

-- CreateEnum
CREATE TYPE "PrivacyRequestType" AS ENUM ('ACCESS', 'DELETION', 'RECTIFICATION', 'PORTABILITY', 'OBJECTION');

-- CreateEnum
CREATE TYPE "PrivacyRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PrivacyRequestType" NOT NULL,
    "status" "PrivacyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "performedBy" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "userId" TEXT,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- Add columns to User table
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "cpf" TEXT;

-- CreateIndex
CREATE INDEX "Consent_userId_idx" ON "Consent"("userId");
CREATE INDEX "Consent_type_idx" ON "Consent"("type");

-- CreateIndex
CREATE INDEX "PrivacyRequest_userId_idx" ON "PrivacyRequest"("userId");
CREATE INDEX "PrivacyRequest_status_idx" ON "PrivacyRequest"("status");
CREATE INDEX "PrivacyRequest_type_idx" ON "PrivacyRequest"("type");

-- CreateIndex
CREATE INDEX "PrivacyLog_userId_idx" ON "PrivacyLog"("userId");
CREATE INDEX "PrivacyLog_action_idx" ON "PrivacyLog"("action");
CREATE INDEX "PrivacyLog_createdAt_idx" ON "PrivacyLog"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityLog_userId_idx" ON "SecurityLog"("userId");
CREATE INDEX "SecurityLog_event_idx" ON "SecurityLog"("event");
CREATE INDEX "SecurityLog_createdAt_idx" ON "SecurityLog"("createdAt");
CREATE INDEX "SecurityLog_ipAddress_idx" ON "SecurityLog"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;