-- Add updated_at and ip_address columns to test_connections table
ALTER TABLE test_connections
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
