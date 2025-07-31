-- Migration: Add social media and metadata columns to existing campaigns table
-- Run this in Supabase SQL Editor

-- Add new columns for campaign metadata (safe - IF NOT EXISTS)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS extended_description TEXT;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
  AND column_name IN ('twitter_url', 'website_url', 'extended_description');