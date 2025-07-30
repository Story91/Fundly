import { sql } from '@vercel/postgres';

// Database schema for campaigns
export async function createCampaignsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        blockchain_id INTEGER UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        creator_nickname VARCHAR(100) NOT NULL,
        creator_address VARCHAR(42) NOT NULL,
        image_url TEXT,
        image_blob_url TEXT,
        goal_usdc DECIMAL(18,6) NOT NULL,
        current_pledged DECIMAL(18,6) DEFAULT 0,
        backers_count INTEGER DEFAULT 0,
        deadline TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaigns_blockchain_id 
      ON campaigns(blockchain_id);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaigns_status 
      ON campaigns(status);
    `;
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
  }
}

// Create new campaign in database
export async function createCampaign({
  blockchainId,
  title,
  description,
  category,
  creatorNickname,
  creatorAddress,
  imageUrl,
  imageBlobUrl,
  goalUsdc,
  deadline
}) {
  try {
    const result = await sql`
      INSERT INTO campaigns (
        blockchain_id, title, description, category, 
        creator_nickname, creator_address, image_url, image_blob_url,
        goal_usdc, deadline
      ) VALUES (
        ${blockchainId}, ${title}, ${description}, ${category},
        ${creatorNickname}, ${creatorAddress}, ${imageUrl}, ${imageBlobUrl},
        ${goalUsdc}, ${deadline}
      )
      RETURNING *;
    `;
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating campaign in database:', error);
    throw error;
  }
}

// Get campaign by blockchain ID
export async function getCampaignByBlockchainId(blockchainId) {
  try {
    const result = await sql`
      SELECT * FROM campaigns 
      WHERE blockchain_id = ${blockchainId}
      LIMIT 1;
    `;
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting campaign:', error);
    return null;
  }
}

// Get all campaigns with pagination
export async function getCampaigns(page = 1, limit = 10, status = null) {
  try {
    const offset = (page - 1) * limit;
    
    let query = sql`
      SELECT * FROM campaigns 
    `;
    
    if (status) {
      query = sql`
        SELECT * FROM campaigns 
        WHERE status = ${status}
      `;
    }
    
    const result = await sql`
      ${query}
      ORDER BY created_at DESC 
      LIMIT ${limit} 
      OFFSET ${offset};
    `;
    
    return result.rows;
  } catch (error) {
    console.error('Error getting campaigns:', error);
    return [];
  }
}

// Update campaign stats from blockchain
export async function updateCampaignStats(blockchainId, { currentPledged, backersCount, status }) {
  try {
    const result = await sql`
      UPDATE campaigns 
      SET 
        current_pledged = ${currentPledged},
        backers_count = ${backersCount},
        status = ${status},
        updated_at = NOW()
      WHERE blockchain_id = ${blockchainId}
      RETURNING *;
    `;
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating campaign stats:', error);
    throw error;
  }
}

// Get campaigns by creator
export async function getCampaignsByCreator(creatorAddress) {
  try {
    const result = await sql`
      SELECT * FROM campaigns 
      WHERE creator_address = ${creatorAddress}
      ORDER BY created_at DESC;
    `;
    
    return result.rows;
  } catch (error) {
    console.error('Error getting campaigns by creator:', error);
    return [];
  }
}