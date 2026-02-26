-- Cedar Sells Property Database Schema
-- This will be run in Supabase to create the tables

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    price DECIMAL(12,2),
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    square_footage INTEGER,
    lot_size DECIMAL(10,2),
    year_built INTEGER,
    property_type TEXT,
    description TEXT,
    status TEXT DEFAULT 'Active',
    images JSONB DEFAULT '[]'::jsonb,
    tier TEXT CHECK (tier IN ('public', 'registered', 'vip')) DEFAULT 'public',
    salesforce_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Transaction-specific fields for filtering and display
    lead_source TEXT,
    investment_path TEXT,
    actual_profit DECIMAL(12,2),
    projected_profit DECIMAL(12,2),
    sales_date DATE,
    salesforce_status TEXT
);

-- Sync status table to track when we last synced with Salesforce
CREATE TABLE IF NOT EXISTS sync_status (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_tier ON properties(tier);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_updated_at ON properties(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_salesforce_id ON properties(salesforce_id);
CREATE INDEX IF NOT EXISTS idx_properties_lead_source ON properties(lead_source);
CREATE INDEX IF NOT EXISTS idx_properties_investment_path ON properties(investment_path);
CREATE INDEX IF NOT EXISTS idx_properties_salesforce_status ON properties(salesforce_status);
CREATE INDEX IF NOT EXISTS idx_properties_sales_date ON properties(sales_date);

-- Row Level Security (RLS) policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- Allow public read access to properties
CREATE POLICY "Public properties are viewable by everyone"
ON properties FOR SELECT
USING (true);

-- Allow service role to manage properties (for sync operations)
CREATE POLICY "Service role can manage properties"
ON properties FOR ALL
TO service_role
USING (true);

-- Allow service role to manage sync status
CREATE POLICY "Service role can manage sync status"
ON sync_status FOR ALL
TO service_role
USING (true);

-- Allow public read access to sync status
CREATE POLICY "Sync status is viewable by everyone"
ON sync_status FOR SELECT
USING (true);

-- Insert initial sync status record
INSERT INTO sync_status (id, last_sync_at)
VALUES (1, NOW())
ON CONFLICT (id) DO NOTHING;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on properties
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();