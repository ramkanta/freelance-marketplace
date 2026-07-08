CREATE TYPE dispute_status AS ENUM (
  'open',
  'under_review',
  'resolved_refund',
  'resolved_release',
  'resolved_split',
  'escalated'
);

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  filed_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES users(id),          -- support agent assigned
  resolution_note TEXT,
  evidence_urls JSONB DEFAULT '[]',               -- Supabase Storage file URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes (order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes (status);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned ON disputes (assigned_to);
