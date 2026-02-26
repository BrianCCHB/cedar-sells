-- Migration to add indexes for better performance on Left_Main__Path__c and Property_Status__c fields
-- Run this in Supabase SQL Editor to add indexes to your existing database

-- Add indexes for the Salesforce transaction fields
CREATE INDEX IF NOT EXISTS idx_properties_lead_source ON properties(lead_source);
CREATE INDEX IF NOT EXISTS idx_properties_investment_path ON properties(investment_path);
CREATE INDEX IF NOT EXISTS idx_properties_salesforce_status ON properties(salesforce_status);
CREATE INDEX IF NOT EXISTS idx_properties_sales_date ON properties(sales_date);

-- Verify the indexes were created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'properties'
ORDER BY indexname;