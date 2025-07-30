import { createCampaign, updateCampaignStats, getCampaignByBlockchainId } from './database.js';
import { uploadImageFromUrl, uploadCampaignImage } from './blob-storage.js';

// Sync campaign creation: Blockchain → Database
export async function syncCampaignCreation({
  blockchainId,
  title,
  description,
  category,
  creatorNickname,
  creatorAddress,
  imageFile,
  imageUrl,
  goalUsdc,
  deadline
}) {
  try {
    console.log('Syncing campaign creation to database...');
    
    let imageBlobUrl = null;
    let finalImageUrl = imageUrl;
    
    // Upload image to blob storage
    if (imageFile) {
      // User uploaded file
      const uploadResult = await uploadCampaignImage(imageFile, blockchainId);
      imageBlobUrl = uploadResult.url;
      finalImageUrl = uploadResult.url;
    } else if (imageUrl) {
      // Unsplash or external URL
      const uploadResult = await uploadImageFromUrl(imageUrl, blockchainId);
      imageBlobUrl = uploadResult.url;
      finalImageUrl = uploadResult.url;
    }
    
    // Create database record
    const dbCampaign = await createCampaign({
      blockchainId,
      title,
      description,
      category,
      creatorNickname,
      creatorAddress,
      imageUrl: finalImageUrl,
      imageBlobUrl,
      goalUsdc,
      deadline: new Date(deadline * 1000) // Convert timestamp to Date
    });
    
    console.log('Campaign synced to database:', dbCampaign);
    return dbCampaign;
    
  } catch (error) {
    console.error('Error syncing campaign creation:', error);
    throw error;
  }
}

// Sync campaign stats from blockchain
export async function syncCampaignStats(blockchainId, blockchainData) {
  try {
    const {
      totalPledged,
      goalReached,
      claimed,
      cancelled,
      deadline
    } = blockchainData;
    
    // Calculate status
    let status = 'active';
    if (cancelled) status = 'cancelled';
    else if (claimed) status = 'completed-funded';
    else if (Date.now() / 1000 > deadline) {
      status = goalReached ? 'completed-funded' : 'completed-unfunded';
    } else if (goalReached) {
      status = 'nearly-funded';
    }
    
    // Update database
    const updatedCampaign = await updateCampaignStats(blockchainId, {
      currentPledged: Number(totalPledged) / 1000000, // Convert from wei
      backersCount: 0, // TODO: Calculate from blockchain events
      status
    });
    
    console.log('Campaign stats synced:', updatedCampaign);
    return updatedCampaign;
    
  } catch (error) {
    console.error('Error syncing campaign stats:', error);
    throw error;
  }
}

// Get enhanced campaign data (blockchain + database)
export async function getEnhancedCampaign(blockchainId, blockchainData) {
  try {
    // Get database record
    const dbCampaign = await getCampaignByBlockchainId(blockchainId);
    
    if (!dbCampaign) {
      console.warn(`No database record found for blockchain campaign ${blockchainId}`);
      return null;
    }
    
    // Merge blockchain and database data
    const enhanced = {
      id: blockchainId,
      title: dbCampaign.title,
      description: dbCampaign.description,
      category: dbCampaign.category,
      creator: dbCampaign.creator_nickname,
      creatorAddress: dbCampaign.creator_address,
      image: dbCampaign.image_url,
      imageBlobUrl: dbCampaign.image_blob_url,
      
      // Blockchain data (live)
      raised: Number(blockchainData.totalPledged) / 1000000,
      goal: Number(blockchainData.goal) / 1000000,
      deadline: Number(blockchainData.deadline),
      goalReached: blockchainData.goalReached,
      claimed: blockchainData.claimed,
      cancelled: blockchainData.cancelled,
      
      // Calculated fields
      progress: (Number(blockchainData.totalPledged) / Number(blockchainData.goal)) * 100,
      daysLeft: Math.max(0, Math.ceil((Number(blockchainData.deadline) - Date.now() / 1000) / (24 * 60 * 60))),
      backers: dbCampaign.backers_count,
      
      // Status
      status: dbCampaign.status,
      
      // Timestamps
      createdAt: dbCampaign.created_at,
      updatedAt: dbCampaign.updated_at
    };
    
    return enhanced;
    
  } catch (error) {
    console.error('Error getting enhanced campaign:', error);
    return null;
  }
}