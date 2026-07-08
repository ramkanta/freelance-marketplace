-- Reviews: one per completed order, customer → service/freelancer
CREATE TABLE IF NOT EXISTS reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  service_id        UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  freelancer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recompute freelancer_profiles.rating_avg via trigger
CREATE OR REPLACE FUNCTION update_freelancer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE freelancer_profiles
  SET rating_avg = (
    SELECT COALESCE(AVG(r.rating::DECIMAL), 5.0)
    FROM reviews r
    WHERE r.freelancer_id = NEW.freelancer_id
  )
  WHERE user_id = NEW.freelancer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_freelancer_rating ON reviews;
CREATE TRIGGER trg_update_freelancer_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_freelancer_rating();
