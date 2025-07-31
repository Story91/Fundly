// Firebase configuration for campaign metadata
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Firebase config - replace with your values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use default Firestore database (since data is in default, not named 'fundly')
const db = getFirestore(app); // No second parameter = default database

// Update campaign metadata (complete structure)
export async function updateCampaignMetadata(blockchainId, { 
  twitterUrl, 
  websiteUrl, 
  extendedDescription,
  imageBlobUrl 
}) {
  try {
    // Można zmienić nazwę kolekcji dla różnych aplikacji
    const collectionName = process.env.REACT_APP_FIREBASE_COLLECTION || 'campaigns';
    const campaignRef = doc(db, collectionName, blockchainId.toString());
    
    const updateData = {
      blockchain_id: parseInt(blockchainId),
      twitter_url: twitterUrl || '',
      website_url: websiteUrl || '',
      extended_description: extendedDescription || '',
      image_blob_url: imageBlobUrl || '',
      updated_at: new Date().toISOString()
    };

    await setDoc(campaignRef, updateData, { merge: true });
    
    console.log('✅ Campaign metadata updated in Firebase!');
    console.log('🔥 Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
    console.log('🗄️ Database: (default)');
    console.log('📁 Collection:', collectionName);
    console.log('📄 Document ID:', blockchainId.toString());
    console.log('📝 Data:', updateData);
    return updateData;
  } catch (error) {
    console.error('❌ Error updating Firebase:', error);
    console.error('🔍 Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
    throw error;
  }
}

// Get campaign metadata
export async function getCampaignMetadata(blockchainId) {
  try {
    // Można zmienić nazwę kolekcji dla różnych aplikacji
    const collectionName = process.env.REACT_APP_FIREBASE_COLLECTION || 'campaigns';
    const campaignRef = doc(db, collectionName, blockchainId.toString());
    const docSnap = await getDoc(campaignRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Firebase data loaded from collection:', collectionName);
      console.log('🗄️ Database: (default)');
      console.log('📄 Document ID:', blockchainId.toString());
      console.log('📝 Data:', data);
      return {
        twitter_url: data.twitter_url,
        website_url: data.website_url,
        extended_description: data.extended_description,
        image_blob_url: data.image_blob_url
      };
    } else {
      console.log('No metadata found for campaign:', blockchainId, 'in collection:', collectionName, 'in (default) database');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting Firebase data:', error);
    return null;
  }
}

export { db };