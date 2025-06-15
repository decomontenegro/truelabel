-- Migration: Add Validation Queue System
-- Purpose: Enable real-time validation assignment and tracking
-- Dependencies: Existing User, Product, Validation tables

-- Create validation queue status enum
CREATE TYPE "ValidationQueueStatus" AS ENUM (
  'PENDING',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED'
);

-- Create validation priority enum
CREATE TYPE "ValidationPriority" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

-- Create validation queue table
CREATE TABLE "ValidationQueue" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "assignedToId" TEXT,
  "status" "ValidationQueueStatus" NOT NULL DEFAULT 'PENDING',
  "priority" "ValidationPriority" NOT NULL DEFAULT 'NORMAL',
  "category" TEXT NOT NULL,
  "estimatedDuration" INTEGER, -- in minutes
  "actualDuration" INTEGER, -- in minutes
  "assignedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ValidationQueue_pkey" PRIMARY KEY ("id")
);

-- Create validation queue history for audit trail
CREATE TABLE "ValidationQueueHistory" (
  "id" TEXT NOT NULL,
  "queueId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "previousStatus" "ValidationQueueStatus",
  "newStatus" "ValidationQueueStatus",
  "performedById" TEXT NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ValidationQueueHistory_pkey" PRIMARY KEY ("id")
);

-- Create real-time analytics events table
CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT,
  "data" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "ValidationQueue" ADD CONSTRAINT "ValidationQueue_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ValidationQueue" ADD CONSTRAINT "ValidationQueue_requestedById_fkey" 
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ValidationQueue" ADD CONSTRAINT "ValidationQueue_assignedToId_fkey" 
  FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ValidationQueueHistory" ADD CONSTRAINT "ValidationQueueHistory_queueId_fkey" 
  FOREIGN KEY ("queueId") REFERENCES "ValidationQueue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ValidationQueueHistory" ADD CONSTRAINT "ValidationQueueHistory_performedById_fkey" 
  FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "ValidationQueue_status_idx" ON "ValidationQueue"("status");
CREATE INDEX "ValidationQueue_assignedToId_idx" ON "ValidationQueue"("assignedToId");
CREATE INDEX "ValidationQueue_priority_idx" ON "ValidationQueue"("priority");
CREATE INDEX "ValidationQueue_category_idx" ON "ValidationQueue"("category");
CREATE INDEX "ValidationQueue_dueDate_idx" ON "ValidationQueue"("dueDate");
CREATE INDEX "ValidationQueue_createdAt_idx" ON "ValidationQueue"("createdAt");

CREATE INDEX "ValidationQueueHistory_queueId_idx" ON "ValidationQueueHistory"("queueId");
CREATE INDEX "ValidationQueueHistory_createdAt_idx" ON "ValidationQueueHistory"("createdAt");

CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");
CREATE INDEX "AnalyticsEvent_entityType_idx" ON "AnalyticsEvent"("entityType");
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "AnalyticsEvent"("timestamp");
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- Create composite indexes for common queries
CREATE INDEX "ValidationQueue_status_priority_idx" ON "ValidationQueue"("status", "priority");
CREATE INDEX "ValidationQueue_assignedToId_status_idx" ON "ValidationQueue"("assignedToId", "status");
CREATE INDEX "AnalyticsEvent_entityType_entityId_idx" ON "AnalyticsEvent"("entityType", "entityId");
