-- True Label Database Schema for PostgreSQL
-- Execute this in Supabase SQL Editor if migrations fail

-- Create ENUMs
CREATE TYPE "Role" AS ENUM ('ADMIN', 'BRAND', 'LAB');
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');
CREATE TYPE "QRStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED');
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "ValidationType" AS ENUM ('FULL', 'PARTIAL', 'RENEWAL', 'UPDATE');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Create tables
CREATE TABLE "User" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Laboratory" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" TEXT UNIQUE NOT NULL,
    "cnpj" TEXT UNIQUE NOT NULL,
    "accreditation" TEXT NOT NULL,
    "responsibleName" TEXT NOT NULL,
    "responsibleCpf" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Product" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "sku" TEXT UNIQUE NOT NULL,
    "barcode" TEXT,
    "description" TEXT,
    "category" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Report" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "results" JSONB DEFAULT '{}',
    "verificationHash" TEXT NOT NULL,
    "isVerified" BOOLEAN DEFAULT false,
    "isParsed" BOOLEAN DEFAULT false,
    "parsedAt" TIMESTAMP(3),
    "productId" UUID NOT NULL REFERENCES "Product"("id") ON DELETE RESTRICT,
    "laboratoryId" UUID NOT NULL REFERENCES "Laboratory"("id") ON DELETE RESTRICT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Validation" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "status" "ValidationStatus" DEFAULT 'PENDING',
    "validatedAt" TIMESTAMP(3),
    "notes" TEXT,
    "reportId" UUID NOT NULL REFERENCES "Report"("id") ON DELETE RESTRICT,
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
    "type" "ValidationType" DEFAULT 'FULL',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "QRCode" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "code" TEXT UNIQUE NOT NULL,
    "validationUrl" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "status" "QRStatus" DEFAULT 'ACTIVE',
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "accessCount" INTEGER DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "productId" UUID NOT NULL REFERENCES "Product"("id") ON DELETE RESTRICT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Seal" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "criteria" JSONB DEFAULT '{}',
    "validityDays" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ProductSeal" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "productId" UUID NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "sealId" UUID NOT NULL REFERENCES "Seal"("id") ON DELETE CASCADE,
    "grantedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN DEFAULT true,
    "certificateUrl" TEXT,
    "notes" TEXT,
    UNIQUE("productId", "sealId")
);

CREATE TABLE "Notification" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "QRAccess" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "qrCodeId" UUID NOT NULL REFERENCES "QRCode"("id") ON DELETE CASCADE,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "city" TEXT,
    "country" TEXT,
    "accessedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX "Product_userId_idx" ON "Product"("userId");
CREATE INDEX "Product_sku_idx" ON "Product"("sku");
CREATE INDEX "Report_productId_idx" ON "Report"("productId");
CREATE INDEX "Report_laboratoryId_idx" ON "Report"("laboratoryId");
CREATE INDEX "Validation_reportId_idx" ON "Validation"("reportId");
CREATE INDEX "Validation_userId_idx" ON "Validation"("userId");
CREATE INDEX "QRCode_productId_idx" ON "QRCode"("productId");
CREATE INDEX "QRCode_code_idx" ON "QRCode"("code");
CREATE INDEX "ProductSeal_productId_idx" ON "ProductSeal"("productId");
CREATE INDEX "ProductSeal_sealId_idx" ON "ProductSeal"("sealId");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "QRAccess_qrCodeId_idx" ON "QRAccess"("qrCodeId");

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updatedAt
CREATE TRIGGER set_timestamp_user BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_laboratory BEFORE UPDATE ON "Laboratory" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_product BEFORE UPDATE ON "Product" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_report BEFORE UPDATE ON "Report" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_validation BEFORE UPDATE ON "Validation" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_qrcode BEFORE UPDATE ON "QRCode" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_seal BEFORE UPDATE ON "Seal" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();