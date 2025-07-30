import { createCampaignsTable, createCampaign } from '../../lib/database.js';
import { uploadCampaignImage, uploadImageFromUrl } from '../../lib/blob-storage.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure database tables exist
    await createCampaignsTable();

    const {
      blockchainId,
      title,
      description,
      category,
      creatorNickname,
      creatorAddress,
      imageUrl,
      goalUsdc,
      deadline
    } = req.body;

    // Validate required fields
    if (!blockchainId || !title || !description || !creatorAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: blockchainId, title, description, creatorAddress' 
      });
    }

    let imageBlobUrl = null;
    let finalImageUrl = imageUrl;

    // Upload image to blob storage if provided
    if (imageUrl) {
      try {
        const uploadResult = await uploadImageFromUrl(imageUrl, blockchainId);
        imageBlobUrl = uploadResult.url;
        finalImageUrl = uploadResult.url;
      } catch (uploadError) {
        console.warn('Failed to upload image to blob:', uploadError);
        // Continue without blob upload
      }
    }

    // Create database record
    const dbCampaign = await createCampaign({
      blockchainId,
      title,
      description,
      category: category || 'Technology',
      creatorNickname: creatorNickname || 'Anonymous',
      creatorAddress,
      imageUrl: finalImageUrl,
      imageBlobUrl,
      goalUsdc,
      deadline: new Date(deadline * 1000) // Convert timestamp to Date
    });

    console.log('Campaign created in database:', dbCampaign);

    res.status(201).json({
      success: true,
      campaign: dbCampaign
    });

  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ 
      error: 'Failed to create campaign',
      details: error.message 
    });
  }
}