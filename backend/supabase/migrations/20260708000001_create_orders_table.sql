-- Order status lifecycle enum
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending_payment',
    'payment_captured',
    'service_delivered',
    'completed',
    'disputed',
    'refunded',
    'payout_released'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  freelancer_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  commission_rate DECIMAL(5, 2) NOT NULL,        -- locked at time of order creation
  razorpay_order_id VARCHAR(255),                -- from Razorpay Checkout
  razorpay_payment_id VARCHAR(255),              -- set after payment.captured webhook
  status order_status NOT NULL DEFAULT 'pending_payment',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_freelancer ON orders (freelancer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
