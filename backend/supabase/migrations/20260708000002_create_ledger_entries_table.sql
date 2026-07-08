-- Ledger entry type enum — each describes a money movement
CREATE TYPE ledger_entry_type AS ENUM (
  'customer_deposit',      -- customer tops up wallet via Razorpay
  'escrow_lock',           -- funds move from customer_wallet → platform_holding on order
  'escrow_release',        -- funds move from platform_holding → freelancer + platform_revenue on completion
  'escrow_refund',         -- funds move from platform_holding → customer_wallet on refund
  'platform_commission'    -- platform revenue slice split out during escrow_release
);

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
