import React, { useState, useEffect } from 'react';
import { createBaseAccountSDK } from '@base-org/account';
import { parseUnits, encodeFunctionData, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
// Removed @vercel/blob import - image upload will be added to campaign editing later
import { CONTRACT_CONFIG, getContractAddress } from '../contracts/contract-config';
import contractAbi from '../contracts/CrowdfundingPlatform.abi.json';

const CreateCampaignButton = ({ 
  newCampaign, 
  setNewCampaign, 
  setShowCreateModal, 
  addToast,
  onCampaignCreated,
  isSignedIn,
  universalAddress
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [txHash, setTxHash] = useState(null);
  // Removed image upload states - will be added to campaign editing later

  // Use Alchemy RPC if available for better performance
  const alchemyBaseRpcUrl = process.env.REACT_APP_ALCHEMY_BASE_RPC_URL;
  const rpcUrl = alchemyBaseRpcUrl || 'https://mainnet.base.org';
  
  console.log('🔧 CreateCampaignButton RPC:', alchemyBaseRpcUrl ? 'ALCHEMY (fast)' : 'PUBLIC (slower)');
  
  // Initialize SDK with Base Mainnet network
  const sdk = createBaseAccountSDK({
    appName: 'Fundly - Crowdfunding Platform',
    appLogo: 'https://base.org/logo.png',
    chain: {
      id: 8453, // Base Mainnet
      name: 'Base Mainnet',
      network: 'base',
      nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      },
      rpcUrls: {
        public: { http: [rpcUrl] },
        default: { http: [rpcUrl] },
      },
      blockExplorers: {
        etherscan: { name: 'BaseScan', url: 'https://basescan.org' },
        default: { name: 'BaseScan', url: 'https://basescan.org' },
      },
    },
  });

  // Image upload functionality removed - will be added to campaign editing later

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

    // Image validation removed - images will be added via campaign editing later

    if (!isSignedIn || !universalAddress) {
      alert('Please sign in with Base Account first to create a campaign');
      return;
    }

    // We'll use Base Mainnet (chainId 8453) as default for Base Account users
    const targetChainId = 8453;

    try {
      // Image upload removed - will be added to campaign editing later
      // Validation
      const goalAmount = parseFloat(newCampaign.goal);
      if (goalAmount < CONTRACT_CONFIG.settings.minGoal) {
        alert(`Minimum goal is ${CONTRACT_CONFIG.settings.minGoal} USDC`);
        return;
      }

      // Convert to contract format
      const goalInWei = parseUnits(newCampaign.goal, 6); // USDC has 6 decimals
      const durationInSeconds = Number(newCampaign.duration) * 24 * 60 * 60; // Convert days to seconds
      
      addToast('Creating campaign on blockchain...', 'info');

      setIsCreating(true);

      // Use viem to create a public client for Base Mainnet - use Alchemy if available
      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl) // Use same optimized RPC
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
      
      addToast('🌐 Switching to Base Mainnet network...', 'info');
      
      // First switch to Base Mainnet network
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
              chainName: 'Base Mainnet',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [rpcUrl],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
        }
      }

      addToast('📝 Creating campaign on blockchain...', 'info');
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
      addToast(`✅ Campaign created! Transaction: ${txHash.slice(0, 10)}...`, 'success');
      
      // Skip Supabase sync for now - need to get real campaign ID from contract
      console.log('ℹ️ Campaign created on blockchain - Supabase sync temporarily disabled');

    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign: ' + error.message);
      addToast('❌ Campaign creation failed', 'error');
      setIsCreating(false);
    }
  };

  // Handle successful campaign creation
  useEffect(() => {
    if (txHash && typeof txHash === 'string') {
      setShowCreateModal(false);
      setNewCampaign({ title: '', description: '', goal: '', category: 'Technology', creatorNickname: '', duration: '30' });
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
      disabled={isCreating}
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
      {isCreating ? '🔄 Creating...' : '🚀 Create Campaign'}
    </button>
  );
};

export default CreateCampaignButton;