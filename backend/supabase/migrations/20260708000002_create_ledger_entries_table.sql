-- Ledger entry type enum — each describes a money movement
DO $$ BEGIN
  CREATE TYPE ledger_entry_type AS ENUM (
    'customer_deposit',
    'escrow_lock',
    'escrow_release',
    'escrow_refund',
    'platform_commission'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Append-only double-entry ledger — NEVER update or delete rows
-- Balance is always derived via SUM queries, never stored as a column
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),           -- null for standalone wallet deposits
  entry_type ledger_entry_type NOT NULL,
  debit_account VARCHAR(100) NOT NULL,           -- e.g. 'customer_wallet', 'platform_holding'
  credit_account VARCHAR(100) NOT NULL,          -- e.g. 'platform_holding', 'freelancer_wallet'
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  meta JSONB DEFAULT '{}',                       -- optional: razorpay_payment_id, note, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_order ON ledger_entries (order_id);
CREATE INDEX IF NOT EXISTS idx_ledger_debit ON ledger_entries (debit_account);
CREATE INDEX IF NOT EXISTS idx_ledger_credit ON ledger_entries (credit_account);

-- Deduplicate Razorpay webhook events — prevents double-processing
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
