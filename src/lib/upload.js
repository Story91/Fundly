// Upload function for Vercel Blob (CRA compatible)
import { put } from '@vercel/blob';

export async function uploadImageToBlob(file, campaignId) {
  try {
    // Debug: Check if token is available
    const token = process.env.REACT_APP_BLOB_READ_WRITE_TOKEN;
    console.log('🔍 Token available:', token ? 'YES' : 'NO');
    console.log('🔍 Token length:', token ? token.length : 0);
    
    if (!token) {
      throw new Error('REACT_APP_BLOB_READ_WRITE_TOKEN not found in environment variables');
    }

    // Generate unique filename
    const uniqueFilename = `campaign-${campaignId}-${Date.now()}-${file.name}`;
    
    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, file, {
      access: 'public',
      token: token,
    });

    console.log('✅ Image uploaded to Vercel Blob:', blob.url);
    return { success: true, url: blob.url, filename: uniqueFilename };
  } catch (error) {
    console.error('❌ Error uploading to Vercel Blob:', error);
    throw new Error('Failed to upload image');
  }
}