# 🚀 Vercel + Supabase Integration Fix

## 📋 **Problem:**
- ✅ Blockchain transaction works
- ❌ Supabase sync fails (env vars not loaded)

## 🔧 **Solution - Vercel Environment Variables:**

### **Step 1: Link to Vercel project**
```bash
vercel link
```

### **Step 2: Pull environment variables**
```bash
vercel env pull .env.local
```

### **Step 3: Restart development server**
```bash
npm start
```

## 📊 **Setup Supabase Database Schema:**

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Create campaigns table for crowdfunding platform
CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  blockchain_id INTEGER UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Technology',
  creator_nickname VARCHAR(100) NOT NULL,
  creator_address VARCHAR(42) NOT NULL,
  image_url TEXT,
  image_blob_url TEXT,
  goal_usdc DECIMAL(18,6) NOT NULL,
  current_pledged DECIMAL(18,6) DEFAULT 0,
  backers_count INTEGER DEFAULT 0,
  deadline TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_blockchain_id ON campaigns(blockchain_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(creator_address);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public can read campaigns" ON campaigns 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Create policy for authenticated users to insert campaigns
CREATE POLICY "Authenticated users can create campaigns" ON campaigns 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Insert some sample data for testing
INSERT INTO campaigns (
  blockchain_id, title, description, category, creator_nickname, 
  creator_address, image_url, goal_usdc, deadline
) VALUES 
  (
    999, 
    'Clean Water for Villages', 
    'Help us bring clean water to remote villages in need.',
    'Environment',
    'WaterHelp Foundation',
    '0x1234567890123456789012345678901234567890',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop',
    50000.00,
    NOW() + INTERVAL '30 days'
  ),
  (
    998,
    'Solar Panel Education Kit',
    'Educational solar panel kits for schools.',
    'Education',
    'GreenEdu Initiative',
    '0x0987654321098765432109876543210987654321',
    'https://images.unsplash.com/photo-1509391366360-2e959784a4b2?w=800&h=600&fit=crop',
    25000.00,
    NOW() + INTERVAL '45 days'
  )
ON CONFLICT (blockchain_id) DO NOTHING;
```

## ✅ **Expected Result:**

After running these commands:

```javascript
// Console logs should show:
✅ Supabase client initialized
✅ Campaign created! Transaction: 0x1234...
✅ Campaign synced to Supabase successfully
```

## 🎯 **Test Flow:**

1. **Vercel env pull** - Get correct environment variables
2. **Restart app** - Load new environment variables  
3. **Create campaign** - Should work with both blockchain + database
4. **Check Supabase Table Editor** - New campaign record

## 💡 **Why This Fixes It:**

- **Vercel** manages environment variables centrally
- **Local .env.local** may be outdated or missing NEXT_PUBLIC_ prefixes
- **`vercel env pull`** downloads latest variables with correct formatting