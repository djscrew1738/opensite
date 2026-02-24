-- OpenSite Database Schema
-- PostgreSQL schema for future migration from in-memory storage

-- Leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    project_type VARCHAR(100),
    value DECIMAL(12, 2) DEFAULT 0,
    score INTEGER,
    status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    phase VARCHAR(50) DEFAULT 'rough-in',
    progress INTEGER DEFAULT 0,
    value DECIMAL(12, 2) DEFAULT 0,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_completion TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Estimates table
CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    tier VARCHAR(50) NOT NULL,
    sqft INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    units INTEGER NOT NULL,
    stories INTEGER NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    per_unit DECIMAL(12, 2) NOT NULL,
    breakdown JSONB,
    margin VARCHAR(20),
    analysis TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing tiers table (for future configurability)
CREATE TABLE pricing_tiers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    margin_range VARCHAR(20),
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(score);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_phase ON projects(phase);
CREATE INDEX idx_estimates_lead_id ON estimates(lead_id);

-- Insert default pricing tiers
INSERT INTO pricing_tiers (id, name, price_per_unit, margin_range, description) VALUES
('production', 'Production', 5600.00, '18-22%', 'High-volume multi-family projects with standardized layouts'),
('custom', 'Custom', 7200.00, '25-30%', 'Mid-rise buildings with custom layouts and fixtures'),
('premium', 'Premium', 10200.00, '30-38%', 'Luxury properties with high-end fixtures and complex systems');

-- Blueprints table (referenced by fixtures, pipe_runs, analysis_jobs)
CREATE TABLE blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT,
    extracted_data JSONB,
    ai_analysis TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials table (referenced by material_estimates)
CREATE TABLE materials (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_cost DECIMAL(10, 2) DEFAULT 0,
    supplier VARCHAR(255),
    part_number VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fixtures table (Detected plumbing fixtures)
CREATE TABLE fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    x_coord REAL,
    y_coord REAL,
    page_number INTEGER DEFAULT 1,
    confidence REAL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pipe Runs table (Estimated routing)
CREATE TABLE pipe_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
    material VARCHAR(50) NOT NULL,
    diameter VARCHAR(20),
    length_ft REAL,
    start_fixture_id UUID REFERENCES fixtures(id) ON DELETE SET NULL,
    end_fixture_id UUID REFERENCES fixtures(id) ON DELETE SET NULL,
    system_type VARCHAR(50), -- e.g., 'potable_water', 'sanitary_sewer', 'vent'
    code_compliance JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Material Estimates table
CREATE TABLE material_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
    material_id VARCHAR(50) REFERENCES materials(id) ON DELETE SET NULL,
    quantity REAL NOT NULL,
    unit VARCHAR(20),
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    tier VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analysis Jobs table
CREATE TABLE analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- e.g., 'ocr', 'fixture_detection', 'pipe_routing'
    status VARCHAR(20) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    result JSONB,
    error TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Blueprint Analysis Storage
CREATE TABLE IF NOT EXISTS blueprint_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    job_id TEXT UNIQUE,
    file_name TEXT,
    file_path TEXT,
    status TEXT DEFAULT 'pending',
    services_used TEXT, -- JSON array
    results TEXT, -- JSON
    confidence INTEGER,
    total_fixtures INTEGER,
    estimated_pipe_feet REAL,
    material_cost REAL,
    labor_cost REAL,
    total_estimate REAL,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blueprint_project ON blueprint_analysis(project_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_job ON blueprint_analysis(job_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_status ON blueprint_analysis(status);

-- Blueprint Analysis History/Versions
CREATE TABLE IF NOT EXISTS blueprint_analysis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER,
    version INTEGER,
    results TEXT,
    change_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES blueprint_analysis(id) ON DELETE CASCADE
);

-- Material Takeoff Cache
CREATE TABLE IF NOT EXISTS material_takeoff_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blueprint_analysis_id INTEGER,
    item_hash TEXT UNIQUE, -- hash of item+qty+project_type
    item_name TEXT,
    category TEXT,
    quantity REAL,
    unit TEXT,
    unit_cost REAL,
    supplier TEXT,
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (blueprint_analysis_id) REFERENCES blueprint_analysis(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_material_cache_hash ON material_takeoff_cache(item_hash);
