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
