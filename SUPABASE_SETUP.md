# 🚀 Supabase Database Setup

## 📋 **Krok 1: Utwórz tabelę w Supabase**

1. Idź do swojego **Supabase Dashboard**
2. Kliknij **SQL Editor** w menu
3. Skopiuj i wklej poniższy kod SQL:

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

4. Kliknij **"Run"** żeby wykonać SQL

## ✅ **Krok 2: Sprawdź zmienne środowiskowe**

Upewnij się, że masz te zmienne w `.env.local`:

```bash
# Supabase (już masz!)
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Vercel Blob (już masz!)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Base Account (już masz!)
# ... pozostałe zmienne
```

## 🎯 **Krok 3: Testuj**

Po uruchomieniu SQL i restarcie aplikacji:

1. **Stwórz kampanię** - sprawdź czy pojawia się w Supabase Table Editor
2. **Upload zdjęcia** - sprawdź czy zapisuje się w Vercel Blob
3. **Lista kampanii** - sprawdź czy ładuje z database

## 🔍 **Debug**

Jeśli coś nie działa:

1. **Console log** - sprawdź błędy w przeglądarce 
2. **Supabase Logs** - sprawdź w Dashboard > Logs
3. **Network tab** - sprawdź requesty do Supabase

## 📊 **Co mamy teraz:**

- ✅ **Smart Contract** - na Base Sepolia
- ✅ **Supabase Database** - metadane, kategorie, zdjęcia  
- ✅ **Vercel Blob** - upload i storage zdjęć
- ✅ **Base Account SDK** - wallet i transakcje
- ✅ **Auto-sync** - blockchain → database

**Kompletny stack crowdfunding! 🚀**