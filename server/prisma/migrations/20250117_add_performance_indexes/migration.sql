-- Create indexes for performance optimization

-- User indexes
CREATE INDEX idx_users_email ON "User"(email);
CREATE INDEX idx_users_role ON "User"(role);
CREATE INDEX idx_users_created_at ON "User"("createdAt" DESC);

-- Product indexes
CREATE INDEX idx_products_brand_id ON "Product"("brandId");
CREATE INDEX idx_products_status ON "Product"(status);
CREATE INDEX idx_products_category ON "Product"(category);
CREATE INDEX idx_products_sku ON "Product"(sku);
CREATE INDEX idx_products_created_at ON "Product"("createdAt" DESC);
CREATE INDEX idx_products_validation_score ON "Product"("validationScore" DESC);
CREATE INDEX idx_products_status_brand ON "Product"(status, "brandId");

-- Composite index for common queries
CREATE INDEX idx_products_brand_status_created ON "Product"("brandId", status, "createdAt" DESC);

-- Validation indexes
CREATE INDEX idx_validations_product_id ON "Validation"("productId");
CREATE INDEX idx_validations_laboratory_id ON "Validation"("laboratoryId");
CREATE INDEX idx_validations_validator_id ON "Validation"("validatorId");
CREATE INDEX idx_validations_status ON "Validation"(status);
CREATE INDEX idx_validations_created_at ON "Validation"("createdAt" DESC);
CREATE INDEX idx_validations_expires_at ON "Validation"("expiresAt");

-- Composite indexes for validation queries
CREATE INDEX idx_validations_product_status ON "Validation"("productId", status);
CREATE INDEX idx_validations_lab_status_created ON "Validation"("laboratoryId", status, "createdAt" DESC);

-- QR Code indexes
CREATE INDEX idx_qr_codes_code ON "QRCode"(code);
CREATE INDEX idx_qr_codes_product_id ON "QRCode"("productId");
CREATE INDEX idx_qr_codes_type ON "QRCode"(type);
CREATE INDEX idx_qr_codes_active ON "QRCode"("isActive");
CREATE INDEX idx_qr_codes_created_at ON "QRCode"("createdAt" DESC);

-- QR Scan indexes
CREATE INDEX idx_qr_scans_qr_code_id ON "QRScan"("qrCodeId");
CREATE INDEX idx_qr_scans_scanned_at ON "QRScan"("scannedAt" DESC);
CREATE INDEX idx_qr_scans_device_type ON "QRScan"("deviceType");
CREATE INDEX idx_qr_scans_location ON "QRScan"(location);

-- Report indexes
CREATE INDEX idx_reports_validation_id ON "Report"("validationId");
CREATE INDEX idx_reports_laboratory_id ON "Report"("laboratoryId");
CREATE INDEX idx_reports_type ON "Report"(type);
CREATE INDEX idx_reports_uploaded_at ON "Report"("uploadedAt" DESC);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON "Notification"("userId");
CREATE INDEX idx_notifications_type ON "Notification"(type);
CREATE INDEX idx_notifications_read ON "Notification"("isRead");
CREATE INDEX idx_notifications_created_at ON "Notification"("createdAt" DESC);
CREATE INDEX idx_notifications_user_unread ON "Notification"("userId", "isRead") WHERE "isRead" = false;

-- Analytics indexes
CREATE INDEX idx_analytics_events_product_id ON "AnalyticsEvent"("productId");
CREATE INDEX idx_analytics_events_event_type ON "AnalyticsEvent"("eventType");
CREATE INDEX idx_analytics_events_created_at ON "AnalyticsEvent"("createdAt" DESC);
CREATE INDEX idx_analytics_events_type_date ON "AnalyticsEvent"("eventType", "createdAt" DESC);

-- Brand indexes
CREATE INDEX idx_brands_name ON "Brand"(name);
CREATE INDEX idx_brands_cnpj ON "Brand"(cnpj);
CREATE INDEX idx_brands_active ON "Brand"("isActive");

-- Laboratory indexes
CREATE INDEX idx_laboratories_name ON "Laboratory"(name);
CREATE INDEX idx_laboratories_cnpj ON "Laboratory"(cnpj);
CREATE INDEX idx_laboratories_active ON "Laboratory"("isActive");
CREATE INDEX idx_laboratories_specialties ON "Laboratory" USING GIN (specialties);

-- Full text search indexes (PostgreSQL specific)
CREATE INDEX idx_products_search ON "Product" USING GIN (
  to_tsvector('portuguese', 
    coalesce(name, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(claims, '')
  )
);

CREATE INDEX idx_brands_search ON "Brand" USING GIN (
  to_tsvector('portuguese', 
    coalesce(name, '') || ' ' || 
    coalesce(description, '')
  )
);

-- Partial indexes for common filters
CREATE INDEX idx_products_active_validated ON "Product"(id) 
  WHERE status = 'VALIDATED' AND "isActive" = true;

CREATE INDEX idx_validations_pending ON "Validation"(id) 
  WHERE status = 'PENDING';

CREATE INDEX idx_notifications_unread ON "Notification"("userId", "createdAt" DESC) 
  WHERE "isRead" = false;

-- JSON field indexes (if using PostgreSQL)
CREATE INDEX idx_products_metadata ON "Product" USING GIN (metadata);
CREATE INDEX idx_validations_results ON "Validation" USING GIN (results);

-- Add indexes for foreign key relationships if not already present
CREATE INDEX IF NOT EXISTS idx_fk_product_brand ON "Product"("brandId");
CREATE INDEX IF NOT EXISTS idx_fk_validation_product ON "Validation"("productId");
CREATE INDEX IF NOT EXISTS idx_fk_validation_laboratory ON "Validation"("laboratoryId");
CREATE INDEX IF NOT EXISTS idx_fk_report_validation ON "Report"("validationId");
CREATE INDEX IF NOT EXISTS idx_fk_qrcode_product ON "QRCode"("productId");
CREATE INDEX IF NOT EXISTS idx_fk_qrscan_qrcode ON "QRScan"("qrCodeId");

-- Analyze tables to update statistics
ANALYZE "User";
ANALYZE "Product";
ANALYZE "Validation";
ANALYZE "QRCode";
ANALYZE "QRScan";
ANALYZE "Report";
ANALYZE "Notification";
ANALYZE "Brand";
ANALYZE "Laboratory";