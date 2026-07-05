-- Create test_connections table
CREATE TABLE IF NOT EXISTS test_connections (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payload JSONB
);
