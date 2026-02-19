-- ============================================================
-- 1STEIN Lead Finder — Database Schema
-- Phase 1: Core tables for permit ingestion & lead tracking
-- Phase 2: AI scoring & builder intelligence
-- Phase 3: Notification logs & proposal links
-- ============================================================

-- Enable PostGIS for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- fuzzy text matching for dedup

-- ============================================================
-- PHASE 1: Core Tables
-- ============================================================

-- Data source registry: each city/county API we pull from
CREATE TABLE data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,       -- 'fort_worth', 'tarrant_county', 'arlington'
    display_name VARCHAR(200) NOT NULL,
    api_base_url TEXT NOT NULL,
    dataset_id VARCHAR(100),
    adapter_type VARCHAR(50) NOT NULL,        -- 'socrata', 'accela', 'custom'
    field_mapping JSONB NOT NULL DEFAULT '{}', -- maps source fields → our schema
    is_active BOOLEAN DEFAULT TRUE,
    last_fetch_at TIMESTAMP,
    last_fetch_count INTEGER DEFAULT 0,
    fetch_errors INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Normalized permits from all sources
CREATE TABLE permits (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES data_sources(id),
    source_permit_id VARCHAR(200),           -- original permit ID from source
    permit_number VARCHAR(100),
    issued_date DATE,
    applied_date DATE,
    expiry_date DATE,
    permit_type VARCHAR(100),
    permit_category VARCHAR(50),             -- 'new_construction', 'addition', 'plumbing', 'mechanical', 'other'
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    zip_code VARCHAR(10),
    county VARCHAR(100),
    contractor_name VARCHAR(200),
    contractor_license VARCHAR(100),
    applicant_name VARCHAR(200),
    owner_name VARCHAR(200),
    estimated_cost NUMERIC(12,2),
    square_footage INTEGER,
    stories INTEGER,
    units INTEGER,                           -- number of dwelling units (duplex=2, fourplex=4)
    work_type VARCHAR(100),
    occupancy_type VARCHAR(100),             -- residential, commercial, mixed
    location GEOGRAPHY(POINT, 4326),         -- PostGIS point
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),

    -- Lead tracking (Phase 2 populates score/classification)
    lead_score INTEGER DEFAULT 0,            -- 1-100
    lead_tier VARCHAR(10) DEFAULT 'unscored', -- 'hot', 'warm', 'cold', 'unscored'
    lead_status VARCHAR(20) DEFAULT 'new',   -- 'new', 'contacted', 'quoted', 'won', 'lost', 'dismissed'
    lead_notes TEXT,
    contacted_at TIMESTAMP,
    quoted_at TIMESTAMP,
    won_at TIMESTAMP,

    -- AI analysis output
    ai_classification JSONB,                 -- full Ollama analysis
    ai_scored_at TIMESTAMP,

    -- Raw source data for debugging
    raw_data JSONB,
    fingerprint VARCHAR(64),                 -- SHA256 hash for dedup

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Prevent duplicate ingestion
    UNIQUE(source_id, source_permit_id)
);

-- Indexes for common queries
CREATE INDEX idx_permits_issued_date ON permits(issued_date DESC);
CREATE INDEX idx_permits_lead_score ON permits(lead_score DESC);
CREATE INDEX idx_permits_lead_status ON permits(lead_status);
CREATE INDEX idx_permits_lead_tier ON permits(lead_tier);
CREATE INDEX idx_permits_permit_type ON permits(permit_type);
CREATE INDEX idx_permits_zip_code ON permits(zip_code);
CREATE INDEX idx_permits_contractor ON permits(contractor_name);
CREATE INDEX idx_permits_fingerprint ON permits(fingerprint);
CREATE INDEX idx_permits_location ON permits USING GIST(location);
CREATE INDEX idx_permits_description_trgm ON permits USING GIN(description gin_trgm_ops);

-- ============================================================
-- PHASE 2: Builder Intelligence
-- ============================================================

-- Builder/contractor profiles built over time
CREATE TABLE builders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    company VARCHAR(200),
    normalized_name VARCHAR(200),            -- lowercase, trimmed for matching
    phone VARCHAR(20),
    email VARCHAR(200),
    website VARCHAR(300),
    license_number VARCHAR(100),

    -- Computed stats (updated by rollup job)
    total_permits INTEGER DEFAULT 0,
    permits_last_30d INTEGER DEFAULT 0,
    permits_last_90d INTEGER DEFAULT 0,
    avg_project_cost NUMERIC(12,2),
    primary_zip_codes TEXT[],
    project_types TEXT[],                    -- ['residential', 'duplex', 'commercial']
    first_permit_date DATE,
    last_permit_date DATE,
    activity_trend VARCHAR(20),              -- 'ramping_up', 'steady', 'slowing_down', 'inactive'

    -- Plumber relationship intel
    has_plumber BOOLEAN DEFAULT FALSE,
    known_plumber VARCHAR(200),              -- if we can identify from plumbing permits
    plumber_confidence NUMERIC(3,2),         -- 0.00-1.00

    -- Our relationship
    relationship_status VARCHAR(30) DEFAULT 'unknown',  -- 'unknown', 'prospecting', 'contacted', 'active_client', 'lost', 'do_not_contact'
    relationship_notes TEXT,
    priority_rank INTEGER,                   -- manual override for prioritization

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_builders_normalized_name ON builders(normalized_name);
CREATE INDEX idx_builders_company ON builders(company);
CREATE INDEX idx_builders_activity ON builders(activity_trend);
CREATE INDEX idx_builders_relationship ON builders(relationship_status);

-- Many-to-many: permits ↔ builders
CREATE TABLE permit_builder_map (
    permit_id INTEGER REFERENCES permits(id) ON DELETE CASCADE,
    builder_id INTEGER REFERENCES builders(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,               -- 'contractor', 'applicant', 'owner'
    PRIMARY KEY (permit_id, builder_id, role)
);

-- Builder contact log
CREATE TABLE builder_contacts (
    id SERIAL PRIMARY KEY,
    builder_id INTEGER REFERENCES builders(id) ON DELETE CASCADE,
    contact_type VARCHAR(30),                -- 'call', 'email', 'text', 'in_person', 'proposal_sent'
    notes TEXT,
    outcome VARCHAR(30),                     -- 'interested', 'not_interested', 'callback', 'no_answer', 'won', 'lost'
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PHASE 3: Notifications & Proposal Links
-- ============================================================

-- Notification log
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    permit_id INTEGER REFERENCES permits(id),
    channel VARCHAR(20) NOT NULL,            -- 'sms', 'email', 'push', 'webhook'
    recipient VARCHAR(200),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',    -- 'pending', 'sent', 'failed', 'delivered'
    external_id VARCHAR(200),                -- Twilio SID, email message ID, etc.
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_permit ON notifications(permit_id);

-- Proposals generated from leads
CREATE TABLE proposals (
    id SERIAL PRIMARY KEY,
    permit_id INTEGER REFERENCES permits(id),
    builder_id INTEGER REFERENCES builders(id),
    proposal_number VARCHAR(50),
    tier VARCHAR(20) DEFAULT 'production',   -- 'production', 'custom', 'premium'
    total_amount NUMERIC(12,2),
    fixture_config JSONB,                    -- snapshot of fixture selections
    pdf_path TEXT,
    status VARCHAR(20) DEFAULT 'draft',      -- 'draft', 'sent', 'accepted', 'rejected', 'expired'
    sent_at TIMESTAMP,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Service area polygons for geographic scoring
CREATE TABLE service_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,              -- 'primary', 'secondary', 'extended'
    priority INTEGER DEFAULT 1,              -- higher = more preferred
    score_modifier INTEGER DEFAULT 0,        -- added to lead score
    boundary GEOGRAPHY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_service_areas_boundary ON service_areas USING GIST(boundary);

-- ============================================================
-- SEED DATA: Register initial data sources
-- ============================================================

INSERT INTO data_sources (name, display_name, api_base_url, dataset_id, adapter_type, field_mapping) VALUES
('fort_worth', 'City of Fort Worth', 'https://data.fortworthtexas.gov/resource', '9c4v-ngai', 'socrata', '{
    "permit_number": "permit_number",
    "issued_date": "issued_date",
    "permit_type": "permit_type_mapped",
    "description": "description",
    "address": "address",
    "city": "city",
    "zip_code": "zip_code",
    "contractor_name": "contractor_company_name",
    "applicant_name": "applicant_name",
    "estimated_cost": "estimated_cost",
    "square_footage": "square_footage",
    "work_type": "work_type",
    "latitude": "latitude",
    "longitude": "longitude",
    "status": "status"
}'),
('tarrant_county', 'Tarrant County', 'https://data.tarrantcounty.com/resource', NULL, 'socrata', '{}'),
('arlington', 'City of Arlington', 'https://data.arlingtontx.gov/resource', NULL, 'socrata', '{}');

-- ============================================================
-- VIEWS: Useful query shortcuts
-- ============================================================

-- Active hot leads
CREATE VIEW v_hot_leads AS
SELECT p.*, b.company as builder_company, b.relationship_status, b.activity_trend
FROM permits p
LEFT JOIN permit_builder_map pbm ON p.id = pbm.permit_id AND pbm.role = 'contractor'
LEFT JOIN builders b ON pbm.builder_id = b.id
WHERE p.lead_tier = 'hot'
  AND p.lead_status = 'new'
ORDER BY p.lead_score DESC, p.issued_date DESC;

-- Builder leaderboard by recent activity
CREATE VIEW v_builder_activity AS
SELECT
    b.*,
    COUNT(DISTINCT p.id) FILTER (WHERE p.issued_date >= CURRENT_DATE - INTERVAL '30 days') as recent_permits,
    SUM(p.estimated_cost) FILTER (WHERE p.issued_date >= CURRENT_DATE - INTERVAL '90 days') as recent_value,
    ARRAY_AGG(DISTINCT p.zip_code) FILTER (WHERE p.zip_code IS NOT NULL) as active_zips
FROM builders b
JOIN permit_builder_map pbm ON b.id = pbm.builder_id
JOIN permits p ON pbm.permit_id = p.id
GROUP BY b.id
ORDER BY recent_permits DESC;

-- Daily ingestion summary
CREATE VIEW v_daily_summary AS
SELECT
    DATE(created_at) as ingest_date,
    ds.display_name as source,
    COUNT(*) as total_permits,
    COUNT(*) FILTER (WHERE lead_tier = 'hot') as hot_leads,
    COUNT(*) FILTER (WHERE lead_tier = 'warm') as warm_leads,
    COUNT(*) FILTER (WHERE permit_category = 'new_construction') as new_construction
FROM permits p
JOIN data_sources ds ON p.source_id = ds.id
GROUP BY DATE(created_at), ds.display_name
ORDER BY ingest_date DESC;
