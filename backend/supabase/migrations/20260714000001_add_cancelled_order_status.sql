-- Adds a 'cancelled' terminal status so customers can cancel an order that is
-- still awaiting payment (pending_payment), instead of it sitting in the DB
-- forever with no way to close it out.
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled';
