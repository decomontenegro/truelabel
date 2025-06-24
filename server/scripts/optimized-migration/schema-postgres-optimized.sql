-- PostgreSQL Optimized Schema for True Label
-- Version: 2.0
-- Description: Production-ready schema with performance optimizations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types (Enums)
CREATE TYPE user_role AS ENUM ('ADMIN', 'BRAND', 'LABORATORY', 'VALIDATOR', 'CONSUMER');
CREATE TYPE product_status AS ENUM ('DRAFT', 'PENDING', 'VALIDATED', 'REJECTED', 'EXPIRED');
CREATE TYPE validation_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PARTIAL', 'VALIDATED', 'VALIDATED_WITH_REMARKS');
CREATE TYPE validation_type AS ENUM ('MANUAL', 'LABORATORY', 'AUTOMATED');
CREATE TYPE queue_status AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');
CREATE TYPE priority_level AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE seal_status AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'INVALID');

-- Function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table with optimizations
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'BRAND',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional fields for optimization
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Indexes for users
CREATE INDEX idx_users_email_lower ON users(LOWER(email)) WHERE is_active = true;
CREATE INDEX idx_users_role ON users(role) WHERE is_active = true;
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_metadata ON users USING GIN(metadata jsonb_path_ops);

-- Laboratories table
CREATE TABLE laboratories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    accreditation VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional fields
    accreditations TEXT[],
    certifications JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    CONSTRAINT laboratories_email_unique UNIQUE (email)
);

-- Indexes for laboratories
CREATE INDEX idx_laboratories_email ON laboratories(email) WHERE is_active = true;
CREATE INDEX idx_laboratories_active ON laboratories(is_active);
CREATE INDEX idx_laboratories_accreditations ON laboratories USING GIN(accreditations);

-- Products table with full-text search
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    batch_number VARCHAR(100),
    nutritional_info JSONB,
    claims TEXT[],
    image_url TEXT,
    qr_code VARCHAR(100),
    status product_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Computed columns
    validation_score DECIMAL(3,2) GENERATED ALWAYS AS (
        CASE 
            WHEN status = 'VALIDATED' THEN 1.0
            WHEN status = 'PENDING' THEN 0.5
            ELSE 0.0
        END
    ) STORED,
    
    -- Full-text search vector
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('portuguese', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(brand, '')), 'B') ||
        setweight(to_tsvector('portuguese', coalesce(description, '')), 'C')
    ) STORED,
    
    -- Constraints
    CONSTRAINT products_sku_unique UNIQUE (sku),
    CONSTRAINT products_qr_code_unique UNIQUE (qr_code)
);

-- Indexes for products
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_status ON products(status) WHERE status != 'DRAFT';
CREATE INDEX idx_products_category_status ON products(category, status);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_nutritional ON products USING GIN(nutritional_info jsonb_path_ops);
CREATE INDEX idx_products_claims ON products USING GIN(claims);
CREATE INDEX idx_products_brand_lower ON products(LOWER(brand));

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    laboratory_id UUID NOT NULL REFERENCES laboratories(id),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    analysis_type VARCHAR(100) NOT NULL,
    results JSONB NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_hash VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional optimization fields
    metadata JSONB DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ,
    
    -- Indexes in table definition for better organization
    CONSTRAINT reports_verification_unique UNIQUE (verification_hash)
);

-- Indexes for reports
CREATE INDEX idx_reports_product_id ON reports(product_id);
CREATE INDEX idx_reports_laboratory_id ON reports(laboratory_id);
CREATE INDEX idx_reports_analysis_type ON reports(analysis_type);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_results ON reports USING GIN(results jsonb_path_ops);

-- Validations table
CREATE TABLE validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    status validation_status NOT NULL DEFAULT 'PENDING',
    type validation_type NOT NULL DEFAULT 'MANUAL',
    claims_validated JSONB,
    summary TEXT,
    notes TEXT,
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional fields
    score DECIMAL(3,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ
);

-- Indexes for validations
CREATE INDEX idx_validations_product_id ON validations(product_id);
CREATE INDEX idx_validations_user_id ON validations(user_id);
CREATE INDEX idx_validations_status ON validations(status);
CREATE INDEX idx_validations_type_status ON validations(type, status);
CREATE INDEX idx_validations_created_at ON validations(created_at DESC);
CREATE INDEX idx_validations_validated_at ON validations(validated_at DESC) WHERE validated_at IS NOT NULL;

-- Product Seals table
CREATE TABLE product_seals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    seal_id VARCHAR(100) NOT NULL,
    certificate_number VARCHAR(255),
    issued_date DATE,
    expiry_date DATE,
    validating_laboratory VARCHAR(255),
    document_url TEXT,
    status seal_status NOT NULL DEFAULT 'PENDING',
    verified_by VARCHAR(255),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT product_seals_unique UNIQUE (product_id, seal_id)
);

-- Indexes for product_seals
CREATE INDEX idx_product_seals_product_id ON product_seals(product_id);
CREATE INDEX idx_product_seals_status ON product_seals(status);
CREATE INDEX idx_product_seals_expiry ON product_seals(expiry_date) WHERE status = 'VERIFIED';

-- QR Code Access table with partitioning
CREATE TABLE qr_code_accesses (
    id UUID DEFAULT uuid_generate_v4(),
    qr_code VARCHAR(100) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional fields
    device_info JSONB,
    referrer TEXT,
    session_id UUID,
    
    PRIMARY KEY (id, accessed_at)
) PARTITION BY RANGE (accessed_at);

-- Create initial partitions
CREATE TABLE qr_code_accesses_2024_01 PARTITION OF qr_code_accesses
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE qr_code_accesses_2024_02 PARTITION OF qr_code_accesses
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Continue creating partitions for each month...

-- Indexes for QR code access (on parent table)
CREATE INDEX idx_qr_accesses_qr_code ON qr_code_accesses(qr_code);
CREATE INDEX idx_qr_accesses_time ON qr_code_accesses USING BRIN(accessed_at);
CREATE INDEX idx_qr_accesses_session ON qr_code_accesses(session_id) WHERE session_id IS NOT NULL;

-- Validation Queue table
CREATE TABLE validation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    requested_by_id UUID NOT NULL REFERENCES users(id),
    assigned_to_id UUID REFERENCES users(id),
    status queue_status NOT NULL DEFAULT 'PENDING',
    priority priority_level NOT NULL DEFAULT 'NORMAL',
    category VARCHAR(100) NOT NULL,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    assigned_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for validation_queue
CREATE INDEX idx_queue_status_priority ON validation_queue(status, priority DESC) 
    WHERE status IN ('PENDING', 'ASSIGNED');
CREATE INDEX idx_queue_assigned_to ON validation_queue(assigned_to_id) 
    WHERE status IN ('ASSIGNED', 'IN_PROGRESS');
CREATE INDEX idx_queue_due_date ON validation_queue(due_date) 
    WHERE status NOT IN ('COMPLETED', 'CANCELLED');
CREATE INDEX idx_queue_category ON validation_queue(category);

-- Validation Queue History table
CREATE TABLE validation_queue_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID NOT NULL REFERENCES validation_queue(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    previous_status queue_status,
    new_status queue_status,
    performed_by_id UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for queue history
CREATE INDEX idx_queue_history_queue_id ON validation_queue_history(queue_id);
CREATE INDEX idx_queue_history_created ON validation_queue_history(created_at DESC);

-- Analytics Events table with partitioning
CREATE TABLE analytics_events (
    id UUID DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID,
    data JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create partitions for analytics
CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes for analytics events
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_entity ON analytics_events(entity_type, entity_id);
CREATE INDEX idx_analytics_user ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_analytics_time ON analytics_events USING BRIN(timestamp);
CREATE INDEX idx_analytics_data ON analytics_events USING GIN(data jsonb_path_ops);

-- Materialized Views for Performance

-- Brand Dashboard Stats
CREATE MATERIALIZED VIEW brand_dashboard_stats AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT CASE WHEN p.status = 'VALIDATED' THEN p.id END) as validated_products,
    COUNT(DISTINCT v.id) as total_validations,
    COUNT(DISTINCT CASE WHEN v.status = 'APPROVED' THEN v.id END) as approved_validations,
    COUNT(DISTINCT qa.id) as total_scans,
    MAX(qa.accessed_at) as last_scan_at,
    AVG(CASE WHEN v.validated_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (v.validated_at - v.created_at))/3600 
        END)::numeric(10,2) as avg_validation_hours
FROM users u
LEFT JOIN products p ON u.id = p.user_id
LEFT JOIN validations v ON p.id = v.product_id
LEFT JOIN qr_code_accesses qa ON p.qr_code = qa.qr_code AND qa.accessed_at > CURRENT_DATE - INTERVAL '30 days'
WHERE u.role = 'BRAND'
GROUP BY u.id;

CREATE UNIQUE INDEX idx_brand_stats_user ON brand_dashboard_stats(user_id);

-- Popular Products View
CREATE MATERIALIZED VIEW popular_products AS
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    p.qr_code,
    COUNT(DISTINCT qa.id) as scan_count,
    COUNT(DISTINCT DATE(qa.accessed_at)) as days_scanned,
    MAX(qa.accessed_at) as last_scanned
FROM products p
JOIN qr_code_accesses qa ON p.qr_code = qa.qr_code
WHERE qa.accessed_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.name, p.brand, p.category, p.qr_code
HAVING COUNT(DISTINCT qa.id) > 10;

CREATE INDEX idx_popular_products_scans ON popular_products(scan_count DESC);

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_laboratories_updated_at BEFORE UPDATE ON laboratories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_validations_updated_at BEFORE UPDATE ON validations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_seals_updated_at BEFORE UPDATE ON product_seals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_validation_queue_updated_at BEFORE UPDATE ON validation_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for maintenance

-- Auto-create monthly partitions
CREATE OR REPLACE FUNCTION create_monthly_partitions(table_name text, months_ahead int DEFAULT 3)
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
BEGIN
    FOR i IN 0..months_ahead LOOP
        start_date := date_trunc('month', CURRENT_DATE + (i || ' months')::interval);
        end_date := start_date + interval '1 month';
        partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
        
        -- Check if partition exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                partition_name, table_name, start_date, end_date
            );
            
            RAISE NOTICE 'Created partition % for % to %', partition_name, start_date, end_date;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Drop old partitions
CREATE OR REPLACE FUNCTION drop_old_partitions(table_name text, older_than timestamp)
RETURNS void AS $$
DECLARE
    partition record;
BEGIN
    FOR partition IN 
        SELECT 
            schemaname,
            tablename 
        FROM pg_tables 
        WHERE tablename LIKE table_name || '_%'
        AND tablename ~ '\d{4}_\d{2}$'
    LOOP
        IF to_date(right(partition.tablename, 7), 'YYYY_MM') < date_trunc('month', older_than) THEN
            EXECUTE format('DROP TABLE IF EXISTS %I.%I', partition.schemaname, partition.tablename);
            RAISE NOTICE 'Dropped old partition %.%', partition.schemaname, partition.tablename;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Performance optimization settings
ALTER DATABASE truelabel SET random_page_cost = 1.1;
ALTER DATABASE truelabel SET effective_cache_size = '4GB';
ALTER DATABASE truelabel SET shared_buffers = '1GB';
ALTER DATABASE truelabel SET work_mem = '64MB';
ALTER DATABASE truelabel SET maintenance_work_mem = '256MB';

-- Create initial partitions
SELECT create_monthly_partitions('qr_code_accesses', 12);
SELECT create_monthly_partitions('analytics_events', 12);

-- Comments for documentation
COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON TABLE products IS 'Product catalog with validation tracking';
COMMENT ON TABLE validations IS 'Product validation records and results';
COMMENT ON TABLE qr_code_accesses IS 'QR code scan tracking with partitioning by month';
COMMENT ON TABLE analytics_events IS 'General analytics events with partitioning by month';
COMMENT ON COLUMN products.search_vector IS 'Full-text search index for Portuguese language';
COMMENT ON COLUMN products.validation_score IS 'Computed score based on validation status';