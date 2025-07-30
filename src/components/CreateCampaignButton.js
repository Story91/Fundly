import React, { useState, useEffect } from 'react';
import { createBaseAccountSDK } from '@base-org/account';
import { parseUnits, encodeFunctionData, createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { put } from '@vercel/blob';
import { CONTRACT_CONFIG, getContractAddress } from '../contracts/contract-config';
import contractAbi from '../contracts/CrowdfundingPlatform.abi.json';

const CreateCampaignButton = ({ 
  newCampaign, 
  setNewCampaign, 
  setShowCreateModal, 
  setPaymentStatus,
  onCampaignCreated,
  isSignedIn,
  universalAddress
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  // Initialize SDK with Base Sepolia network
  const sdk = createBaseAccountSDK({
    appName: 'Fundly - Crowdfunding Platform',
    appLogo: 'https://base.org/logo.png',
    chain: {
      id: 84532, // Base Sepolia
      name: 'Base Sepolia',
      network: 'base-sepolia',
      nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      },
      rpcUrls: {
        public: { http: ['https://sepolia.base.org'] },
        default: { http: ['https://sepolia.base.org'] },
      },
      blockExplorers: {
        etherscan: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
        default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
      },
    },
  });

  // Upload image to Vercel Blob
  const uploadImageToBlob = async (imageUrl, campaignTitle) => {
    try {
      setIsUploadingImage(true);
      console.log('Uploading image to Vercel Blob:', imageUrl);
      
      // If it's a file object, upload directly
      if (imageUrl instanceof File) {
        const timestamp = Date.now();
        const extension = imageUrl.name.split('.').pop();
        const filename = `campaigns/${campaignTitle.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}.${extension}`;
        
        const { url } = await put(filename, imageUrl, { 
          access: 'public',
          addRandomSuffix: false,
        });
        
        console.log('File uploaded to blob:', url);
        setUploadedImageUrl(url);
        return url;
      }
      
      // If it's a URL, fetch and upload
      if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to fetch image');
        
        const blob = await response.blob();
        const timestamp = Date.now();
        const filename = `campaigns/${campaignTitle.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}.jpg`;
        
        const { url } = await put(filename, blob, { 
          access: 'public',
          addRandomSuffix: false,
        });
        
        console.log('URL image uploaded to blob:', url);
        setUploadedImageUrl(url);
        return url;
      }
      
      return imageUrl; // Return original if no upload needed
    } catch (error) {
      console.error('Error uploading to blob:', error);
      return imageUrl; // Fallback to original URL
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle Create Campaign form submission - WITH REAL CONTRACT!
  const handleCreateCampaignSubmit = async () => {
    if (!newCampaign.title || !newCampaign.description || !newCampaign.goal || !newCampaign.creatorNickname || !newCampaign.duration) {
      alert('Please fill in all required fields (Title, Description, Goal, Creator Nickname, and Duration)');
      return;
    }

    if (Number(newCampaign.duration) < 1 || Number(newCampaign.duration) > 365) {
      alert('Campaign duration must be between 1 and 365 days');
      return;
    }

    if (!newCampaign.image) {
      alert('Please select an image for your campaign');
      return;
    }

    if (!isSignedIn || !universalAddress) {
      alert('Please sign in with Base Account first to create a campaign');
      return;
    }

    // We'll use Base Sepolia (chainId 84532) as default for Base Account users
    const targetChainId = 84532;

    try {
      // 1. Upload image to Vercel Blob first (if provided)
      let finalImageUrl = newCampaign.image;
      if (newCampaign.image) {
        setPaymentStatus('📸 Uploading image to storage...');
        finalImageUrl = await uploadImageToBlob(newCampaign.image, newCampaign.title);
      }
      // Validation
      const goalAmount = parseFloat(newCampaign.goal);
      if (goalAmount < CONTRACT_CONFIG.settings.minGoal) {
        alert(`Minimum goal is ${CONTRACT_CONFIG.settings.minGoal} USDC`);
        return;
      }

      // Convert to contract format
      const goalInWei = parseUnits(newCampaign.goal, 6); // USDC has 6 decimals
      const durationInSeconds = Number(newCampaign.duration) * 24 * 60 * 60; // Convert days to seconds
      
      setPaymentStatus('Creating campaign on blockchain...');

      setIsCreating(true);

      // Use viem to create a public client for Base Sepolia
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http('https://sepolia.base.org')
      });

      // Get the provider from Base Account SDK
      const provider = sdk.getProvider();
      
      // MUST call eth_requestAccounts first!
      console.log('Requesting accounts...');
      await provider.request({ method: 'eth_requestAccounts' });
      
      // Encode the function call data using viem
      const data = encodeFunctionData({
        abi: contractAbi,
        functionName: 'createCampaign',
        args: [newCampaign.title, newCampaign.description, goalInWei, durationInSeconds],
      });
      
      console.log('Encoded data:', data);
      console.log('Contract address:', getContractAddress(targetChainId));
      console.log('Args:', [newCampaign.title, newCampaign.description, goalInWei.toString(), durationInSeconds]);
      
      setPaymentStatus('🌐 Switching to Base Sepolia network...');
      
      // First switch to Base Sepolia network
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
      } catch (switchError) {
        console.log('Switch error:', switchError);
        // If the chain hasn't been added yet, add it
        if (switchError.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            }],
          });
        }
      }

      setPaymentStatus('📝 Creating campaign on blockchain...');
      console.log('Sending transaction...');
      
      // Now send the transaction
      const tx = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: universalAddress,
          to: getContractAddress(targetChainId),
          data: data,
          gas: '0x76c0', // 30400 gas limit
        }]
      });
      
      console.log('Transaction sent:', tx);
      console.log('Transaction type:', typeof tx);
      console.log('Transaction object:', tx);

      // tx might be an object, extract hash
      const txHash = typeof tx === 'string' ? tx : tx.hash || tx.transactionHash || tx;
      
      setTxHash(txHash);
      setPaymentStatus(`✅ Campaign created! Transaction: ${txHash.slice(0, 10)}...`);
      
      // Skip Supabase sync for now - need to get real campaign ID from contract
      console.log('ℹ️ Campaign created on blockchain - Supabase sync temporarily disabled');

    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign: ' + error.message);
      setPaymentStatus('❌ Campaign creation failed');
      setIsCreating(false);
    }
  };

  // Handle successful campaign creation
  useEffect(() => {
    if (txHash && typeof txHash === 'string') {
      setShowCreateModal(false);
      setNewCampaign({ title: '', description: '', goal: '', category: 'Technology', image: '', creatorNickname: '', duration: '30' });
      setIsCreating(false);
      
      // Notify parent component to refresh campaigns
      if (onCampaignCreated) {
        onCampaignCreated();
      }
    }
  }, [txHash, setShowCreateModal, setNewCampaign, onCampaignCreated]);

  return (
    <button
      onClick={handleCreateCampaignSubmit}
      disabled={isCreating || isUploadingImage}
      style={{
        padding: '16px 32px',
        borderRadius: '16px',
        border: 'none',
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        cursor: isCreating ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
        opacity: isCreating ? 0.7 : 1
      }}
    >
      {isUploadingImage ? '📸 Uploading Image...' : isCreating ? '🔄 Creating...' : '🚀 Create Campaign'}
    </button>
  );
};

export default CreateCampaignButton;