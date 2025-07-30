import { put, del } from '@vercel/blob';

// Upload campaign image to Vercel Blob
export async function uploadCampaignImage(file, campaignId) {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `campaigns/${campaignId}-${timestamp}.${extension}`;
    
    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    console.log('Image uploaded to blob:', blob.url);
    return {
      url: blob.url,
      filename: filename,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('Error uploading image to blob:', error);
    throw error;
  }
}

// Upload image from URL (for Unsplash images)
export async function uploadImageFromUrl(imageUrl, campaignId) {
  try {
    // Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const filename = `campaigns/${campaignId}-${Date.now()}.jpg`;
    
    // Upload to Vercel Blob
    const uploadedBlob = await put(filename, blob, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    console.log('Image uploaded from URL to blob:', uploadedBlob.url);
    return {
      url: uploadedBlob.url,
      filename: filename,
      size: blob.size,
      type: blob.type
    };
  } catch (error) {
    console.error('Error uploading image from URL:', error);
    throw error;
  }
}

// Delete campaign image
export async function deleteCampaignImage(filename) {
  try {
    await del(filename);
    console.log('Image deleted from blob:', filename);
    return true;
  } catch (error) {
    console.error('Error deleting image from blob:', error);
    return false;
  }
}

// Generate thumbnail
export async function generateThumbnail(originalUrl, campaignId) {
  try {
    // This would typically use an image processing service
    // For now, we'll return the original URL
    // In production, you might use services like Cloudinary or similar
    
    return {
      thumbnail: originalUrl,
      medium: originalUrl,
      large: originalUrl
    };
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
}