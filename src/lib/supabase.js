import { createClient } from '@supabase/supabase-js'

// Read environment variables at module level (Next.js uses NEXT_PUBLIC_ prefix)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client
let supabase;

function getSupabaseClient() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials missing!');
      console.error('URL:', supabaseUrl ? 'Present' : 'Missing');
      console.error('Key:', supabaseKey ? 'Present' : 'Missing');
      throw new Error('Supabase credentials not found');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  }
  return supabase;
}

// Initialize database schema
export async function initializeCampaignsTable() {
  try {
    const client = getSupabaseClient();
    // Create campaigns table if it doesn't exist
    const { data, error } = await client.rpc('create_campaigns_table')
    
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating campaigns table:', error)
      return false
    }
    
    console.log('✅ Campaigns table ready')
    return true
  } catch (error) {
    console.error('Error initializing campaigns table:', error)
    return false
  }
}

// Create new campaign in Supabase
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
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('campaigns')
      .insert([
        {
          blockchain_id: blockchainId,
          title,
          description,
          category,
          creator_nickname: creatorNickname,
          creator_address: creatorAddress,
          image_url: imageUrl,
          image_blob_url: imageBlobUrl,
          goal_usdc: goalUsdc,
          current_pledged: 0,
          backers_count: 0,
          deadline: new Date(deadline * 1000).toISOString(),
          status: 'active'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      throw error
    }

    console.log('✅ Campaign created in Supabase:', data)
    return data
  } catch (error) {
    console.error('Error creating campaign in Supabase:', error)
    throw error
  }
}

// Get campaign by blockchain ID
export async function getCampaignByBlockchainId(blockchainId) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('campaigns')
      .select('*')
      .eq('blockchain_id', blockchainId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error getting campaign:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting campaign by blockchain ID:', error)
    return null
  }
}

// Get all campaigns with pagination
export async function getCampaigns(page = 1, limit = 20, status = null) {
  try {
    const client = getSupabaseClient();
    const offset = (page - 1) * limit
    
    let query = client
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error getting campaigns:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting campaigns:', error)
    return []
  }
}

// Update campaign stats from blockchain
export async function updateCampaignStats(blockchainId, { currentPledged, backersCount, status }) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('campaigns')
      .update({
        current_pledged: currentPledged,
        backers_count: backersCount,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('blockchain_id', blockchainId)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign stats:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating campaign stats:', error)
    throw error
  }
}

// Get campaigns by creator
export async function getCampaignsByCreator(creatorAddress) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('campaigns')
      .select('*')
      .eq('creator_address', creatorAddress)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting campaigns by creator:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting campaigns by creator:', error)
    return []
  }
}

// Update campaign metadata (for editing campaigns)
export async function updateCampaignMetadata(blockchainId, { 
  imageUrl, 
  imageBlobUrl, 
  twitterUrl, 
  websiteUrl, 
  extendedDescription 
}) {
  try {
    const client = getSupabaseClient();
    
    // Prepare update object - only include defined values
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (imageBlobUrl !== undefined) updateData.image_blob_url = imageBlobUrl;
    if (twitterUrl !== undefined) updateData.twitter_url = twitterUrl;
    if (websiteUrl !== undefined) updateData.website_url = websiteUrl;
    if (extendedDescription !== undefined) updateData.extended_description = extendedDescription;

    const { data, error } = await client
      .from('campaigns')
      .update(updateData)
      .eq('blockchain_id', blockchainId)
      .select()
      .single();

    if (error) {
      console.error('Error updating campaign metadata:', error);
      throw error;
    }

    console.log('✅ Campaign metadata updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating campaign metadata:', error);
    throw error;
  }
}

// Get campaign metadata by blockchain ID
export async function getCampaignMetadata(blockchainId) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('campaigns')
      .select('image_url, image_blob_url, twitter_url, website_url, extended_description')
      .eq('blockchain_id', blockchainId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error getting campaign metadata:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting campaign metadata:', error);
    return null;
  }
}