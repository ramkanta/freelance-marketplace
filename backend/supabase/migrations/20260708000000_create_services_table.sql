-- Services / gig listings created by freelancers
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    delivery_days INTEGER NOT NULL DEFAULT 3 CHECK (delivery_days > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast category + active listing queries
CREATE INDEX IF NOT EXISTS idx_services_category ON services (category) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_freelancer ON services (freelancer_id);
