-- ============================================
-- AI Assistant - Database Schema
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -------------------------------------------
-- Projects
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    status          VARCHAR(50) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------
-- Sessions (recordings)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id              SERIAL PRIMARY KEY,
    project_id      INTEGER REFERENCES projects(id),
    title           VARCHAR(500),
    duration_secs   INTEGER,
    audio_path      VARCHAR(1000),
    transcript      TEXT,
    summary         TEXT,
    summary_json    JSONB,
    status          VARCHAR(50) DEFAULT 'uploaded',
    error_message   TEXT,
    recorded_at     TIMESTAMPTZ,
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_project ON sessions(project_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- -------------------------------------------
-- Attachments (files linked to sessions)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS attachments (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    project_id      INTEGER REFERENCES projects(id),
    file_type       VARCHAR(50),
    file_name       VARCHAR(500),
    file_path       VARCHAR(1000),
    file_size       INTEGER,
    analysis        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_session ON attachments(session_id);

-- -------------------------------------------
-- Text Chunks (for RAG / vector search)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS chunks (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    project_id      INTEGER REFERENCES projects(id),
    chunk_type      VARCHAR(50) DEFAULT 'transcript',
    content         TEXT NOT NULL,
    embedding       vector(768),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chunks_session ON chunks(session_id);
CREATE INDEX idx_chunks_project ON chunks(project_id);
CREATE INDEX idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- -------------------------------------------
-- Action Items (extracted from sessions)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS action_items (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    project_id      INTEGER REFERENCES projects(id),
    description     TEXT NOT NULL,
    priority        VARCHAR(20) DEFAULT 'normal',
    completed       BOOLEAN DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_action_items_project ON action_items(project_id);
CREATE INDEX idx_action_items_open ON action_items(completed) WHERE completed = FALSE;

-- -------------------------------------------
-- Chat History
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id              SERIAL PRIMARY KEY,
    role            VARCHAR(20) NOT NULL,
    content         TEXT NOT NULL,
    context_used    JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------
-- Full-text search indexes
-- -------------------------------------------
CREATE INDEX idx_sessions_transcript_search 
    ON sessions USING gin(to_tsvector('english', COALESCE(transcript, '')));

CREATE INDEX idx_sessions_summary_search 
    ON sessions USING gin(to_tsvector('english', COALESCE(summary, '')));

-- -------------------------------------------
-- Helper function: update timestamp
-- -------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
