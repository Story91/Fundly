import React, { useState, useEffect } from 'react';
import { createBaseAccountSDK, pay, getPaymentStatus } from '@base-org/account';
import { SignInWithBaseButton, BasePayButton } from '@base-org/account-ui/react';

// Wagmi imports for real contract integration
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, encodeFunctionData } from 'viem';
import { CONTRACT_CONFIG, getContractAddress } from './contracts/contract-config';
import contractAbi from './contracts/CrowdfundingPlatform.abi.json';

// Import our modular components
import ContractStatus from './components/ContractStatus';
import CampaignManager from './components/CampaignManager';
import CreateCampaignButton from './components/CreateCampaignButton';
import UserDashboard from './components/UserDashboard';
import ImageUploadField from './components/ImageUploadField';
import CampaignListSupabase from './components/CampaignListSupabase';
import ToastContainer, { addToast } from './components/ToastContainer';
import { updateCampaignMetadata, getCampaignMetadata } from './lib/firebase';
import { uploadImageToBlob } from './lib/upload';

function App() {
  // Wagmi hooks for contract integration
  const { address: walletAddress, isConnected: isWalletConnected, chainId } = useAccount();
  
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [theme, setTheme] = useState('light');
  
  // Real contract data - managed by CampaignManager component
  const [campaignData, setCampaignData] = useState({
    campaigns: [],
    loading: true,
    refetch: null
  });

  // Log when campaign data changes
  useEffect(() => {
    console.log('📡 App.js received campaign data update:', {
      campaigns: campaignData.campaigns.length,
      loading: campaignData.loading,
      hasRefetch: !!campaignData.refetch
    });
  }, [campaignData]);

  // Sub Account states
  const [subAccount, setSubAccount] = useState(null);
  const [hasSubAccount, setHasSubAccount] = useState(false);
  const [subAccountLoading, setSubAccountLoading] = useState(false);
  const [universalAddress, setUniversalAddress] = useState('');

  // Crowdfunding states
  const [selectedAmounts, setSelectedAmounts] = useState({});

  // Toast notification system
  const [toasts, setToasts] = useState([]);

  // Toast management functions
  const addToast = (message, type = 'info', autoRemove = true) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, autoRemove };
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Quick amount options
  const quickAmounts = [1, 5, 10, 100];

  // Campaign filter states
  const [selectedFilter, setSelectedFilter] = useState('Active');
  const campaignFilters = ['Active', 'Nearly Funded', 'Completed - Funded', 'Completed - Unfunded'];

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  // Edit campaign form states
  const [editFormData, setEditFormData] = useState({
    twitterUrl: '',
    websiteUrl: '',
    extendedDescription: '',
    imageUrl: ''
  });
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Create Campaign form states
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    goal: '',
    category: 'Technology',
    creatorNickname: '',
    duration: '30' // Duration in days, default 30 days
  });

  // Removed image upload functionality - will be added to campaign editing later

    // Use Alchemy RPC if available for better performance
  const alchemyBaseRpcUrl = process.env.REACT_APP_ALCHEMY_BASE_RPC_URL;
  const rpcUrl = alchemyBaseRpcUrl || 'https://mainnet.base.org';
  
  console.log('🔧 App.js RPC:', alchemyBaseRpcUrl ? 'ALCHEMY (fast)' : 'PUBLIC (slower)');
  
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

  // Campaign data management is now handled by CampaignManager component
  const handleCampaignsUpdate = (data) => {
    setCampaignData(data);
  };

  const handleCampaignCreated = () => {
    // Refresh campaigns when a new one is created
    if (campaignData.refetch) {
      campaignData.refetch();
    }
  };

  // Mock campaigns removed - using only real blockchain campaigns now
  /* Example campaign structure for reference:
    {
      id: 1,
      title: "Clean Water for Rural Communities",
      description: "Help us build water wells in underserved communities across East Africa.",
      image: "https://images.unsplash.com/photo-1541919329513-35f7af297129?w=400&h=300&fit=crop",
      creator: "WaterHope Foundation",
      raised: 12450,
      goal: 50000,
      backers: 89,
      daysLeft: 23,
      category: "Environment",
      status: "Active"
  } */

  // Use real campaigns if we have them and not loading, otherwise use mock data
  // Debug campaign data
  console.log('🔍 App.js Campaign Data Debug:');
  console.log('campaignData:', campaignData);
  console.log('campaignData.loading:', campaignData.loading);
  console.log('campaignData.campaigns:', campaignData.campaigns);
  console.log('campaignData.campaigns.length:', campaignData.campaigns?.length);
  
  // Demo campaigns removed - showing only real blockchain campaigns

  // Only real blockchain campaigns - no mock/demo campaigns
  const finalCampaigns = campaignData.campaigns || [];
  
  console.log('✅ SHOWING REAL BLOCKCHAIN CAMPAIGNS ONLY');
  console.log('Real campaigns available:', finalCampaigns.length);
  console.log('Campaign data loading:', campaignData.loading);

  // Filter campaigns based on status
  const getFilteredCampaigns = () => {
    switch (selectedFilter) {
      case 'Active':
        return finalCampaigns.filter(c => c.status === 'Active');
      case 'Nearly Funded':
        return finalCampaigns.filter(c => c.status === 'Nearly Funded');
      case 'Completed - Funded':
        return finalCampaigns.filter(c => c.status === 'Completed - Funded');
      case 'Completed - Unfunded':
        return finalCampaigns.filter(c => c.status === 'Completed - Unfunded');
      default:
        return finalCampaigns;
    }
  };

  const filteredCampaigns = getFilteredCampaigns();

  // Popular campaigns for right sidebar
  const popularCampaigns = finalCampaigns
    .filter(c => c.status === 'Active')
    .sort((a, b) => b.backers - a.backers)
    .slice(0, 3);

  // Handle sign in
  const handleSignIn = async () => {
    try {
      const accounts = await sdk.getProvider().request({ 
        method: 'eth_requestAccounts',
        params: []
      });
      
      const universalAddr = accounts[0];
      setUniversalAddress(universalAddr);
      setIsSignedIn(true);
      await checkForSubAccount(universalAddr);
      addToast('✅ Connected to Base Account', 'success');
    } catch (error) {
      console.error('Sign in failed:', error);
      addToast('❌ Connection failed', 'error');
    }
  };

  // Check if user has existing Sub Account
  const checkForSubAccount = async (universalAddr) => {
    try {
      const provider = sdk.getProvider();
      const response = await provider.request({
        method: 'wallet_getSubAccounts',
        params: [{
          account: universalAddr,
          domain: window.location.origin,
        }]
      });

      const existingSubAccount = response.subAccounts[0];
      if (existingSubAccount) {
        setSubAccount(existingSubAccount);
        setHasSubAccount(true);
      } else {
        setHasSubAccount(false);
      }
    } catch (error) {
      console.error('Failed to check Sub Account:', error);
      setHasSubAccount(false);
    }
  };

  // Create new Sub Account
  const createSubAccount = async () => {
    if (!universalAddress) {
      console.error('No universal address available');
      return;
    }

    setSubAccountLoading(true);
    try {
      const provider = sdk.getProvider();
      const newSubAccount = await provider.request({
        method: 'wallet_addSubAccount',
        params: [{
          account: {
            type: 'create',
          },
        }]
      });

      setSubAccount(newSubAccount);
      setHasSubAccount(true);
      addToast('✅ Sub Account created! Now you can make seamless donations.', 'success');
    } catch (error) {
      console.error('Sub Account creation failed:', error);
      addToast('❌ Sub Account creation failed', 'error');
    } finally {
      setSubAccountLoading(false);
    }
  };

  // Set donation amount for specific campaign
  const setAmountForCampaign = (campaignId, amount) => {
    setSelectedAmounts(prev => ({ ...prev, [campaignId]: amount }));
  };

  // Get selected amount for campaign (default to 1 USDC)
  const getAmountForCampaign = (campaignId) => {
    return selectedAmounts[campaignId] || '1';
  };

  // OLD 3-step version (keeping for reference)
  const handleBasePayOld = async (campaign) => {
    if (!isSignedIn) {
      alert('Please sign in with Base Account first to use BasePay');
      return;
    }

    if (!universalAddress) {
      alert('Base Account address not found. Please try signing in again.');
      return;
    }

    try {
      const selectedAmount = getAmountForCampaign(campaign.id);
      const amountInWei = parseUnits(selectedAmount, 6); // USDC has 6 decimals
      
      // USDC token address on Base Mainnet
      const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      const PLATFORM_ADDRESS = getContractAddress(8453);
      const provider = sdk.getProvider(); // Define provider once at the top
      
      addToast(`💰 Step 1/3: Getting ${selectedAmount} USDC via BasePay for campaign "${campaign.title}"...`, 'info');
      
      // Step 1: Use BasePay to get USDC to the user's Base Account wallet
      // NOTE: BasePay doesn't know this is for crowdfunding - it just shows "+X USDC" 
      // The actual pledge to campaign happens in Steps 2-3
      const { id } = await pay({
        amount: selectedAmount, // Use selected amount (1, 5, 10, or 100)
        to: universalAddress, // Send to Base Account address
        testnet: false
      });

      setPaymentId(id);
      addToast(`✅ Step 1/3: BasePay successful! (You saw "+${selectedAmount} USDC" - that's normal) Now approving for campaign pledge...`, 'success');
      
      // Wait a moment for BasePay to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check USDC balance before approve
      addToast(`🔍 Checking USDC balance before approve...`, 'info');
      const erc20BalanceAbi = [
        {
          name: 'balanceOf',
          type: 'function',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ];
      
      const balanceData = encodeFunctionData({
        abi: erc20BalanceAbi,
        functionName: 'balanceOf',
        args: [universalAddress]
      });
      
      try {
        const balanceResult = await provider.request({
          method: 'eth_call',
          params: [{
            to: USDC_ADDRESS,
            data: balanceData
          }, 'latest']
        });
        
        const balance = BigInt(balanceResult);
        const balanceUsdc = Number(balance) / 1000000;
        console.log('💰 Current USDC balance:', balanceUsdc, 'USDC');
        
        if (balance < amountInWei) {
          throw new Error(`Insufficient USDC balance. Have: ${balanceUsdc} USDC, Need: ${selectedAmount} USDC`);
        }
      } catch (error) {
        console.error('Error checking balance:', error);
        addToast(`❌ Balance check failed: ${error.message}`, 'error');
        return;
      }
      
      // Step 2: Approve USDC spending by the crowdfunding contract
      addToast(`🔐 Step 2/3: Approving USDC spending...`, 'info');
      
      // MUST call eth_requestAccounts first!
      console.log('🔐 Requesting accounts for approve transaction...');
      await provider.request({ method: 'eth_requestAccounts' });
      
      // Switch to Base Mainnet if needed
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }], // Base Mainnet chainId in hex
        });
      } catch (switchError) {
        console.log('Network switch error (might be already on Base Mainnet):', switchError);
      }
      
      // USDC approve transaction using proper encoding
      const erc20ApproveAbi = [
        {
          name: 'approve',
          type: 'function',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ name: '', type: 'bool' }]
        }
      ];
      
      const approveData = encodeFunctionData({
        abi: erc20ApproveAbi,
        functionName: 'approve',
        args: [PLATFORM_ADDRESS, amountInWei]
      });
      
      console.log('🔐 Sending approve transaction for', selectedAmount, 'USDC...');
      console.log('🔐 Approve args:', {
        spender: PLATFORM_ADDRESS,
        amount: amountInWei.toString(),
        amountHex: '0x' + amountInWei.toString(16)
      });
      
      const approveTxHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: universalAddress,
          to: USDC_ADDRESS,
          data: approveData,
          gas: '0x15f90', // 90000 gas
        }]
      });
      
      console.log('🔐 Approve transaction sent:', approveTxHash);
      addToast(`✅ Step 2/3: USDC approve sent! Waiting for confirmation...`, 'success');
      
      // Wait longer for approve transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 8000)); // Increased from 3 to 8 seconds
      
      // Verify that approve worked by checking allowance
      addToast(`🔍 Verifying USDC approval...`, 'info');
      const erc20AllowanceAbi = [
        {
          name: 'allowance',
          type: 'function',
          inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
          ],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ];
      
      const allowanceData = encodeFunctionData({
        abi: erc20AllowanceAbi,
        functionName: 'allowance',
        args: [universalAddress, PLATFORM_ADDRESS]
      });
      
      try {
        const allowanceResult = await provider.request({
          method: 'eth_call',
          params: [{
            to: USDC_ADDRESS,
            data: allowanceData
          }, 'latest']
        });
        
        const allowance = BigInt(allowanceResult);
        const allowanceUsdc = Number(allowance) / 1000000;
        console.log('🔐 Current allowance:', allowanceUsdc, 'USDC');
        
        if (allowance < amountInWei) {
          throw new Error(`Insufficient allowance. Approved: ${allowanceUsdc} USDC, Need: ${selectedAmount} USDC. Approve transaction may have failed.`);
        }
      } catch (error) {
        console.error('Error checking allowance:', error);
        addToast(`❌ Allowance verification failed: ${error.message}`, 'error');
        return;
      }
      
      addToast(`✅ Step 2/3: USDC approved! Now pledging to campaign...`, 'success');
      
      // Step 3: Call pledge() function on crowdfunding contract
      addToast(`🎯 Step 3/3: Pledging ${selectedAmount} USDC to "${campaign.title}"...`, 'info');
      
      // Ensure accounts are still available
      console.log('🎯 Ensuring accounts for pledge transaction...');
      await provider.request({ method: 'eth_requestAccounts' });
      
      // Use the same provider approach as Steps 1-2 instead of wagmi
      const pledgeData = encodeFunctionData({
        abi: contractAbi,
        functionName: 'pledge',
        args: [Number(campaign.id), amountInWei]
      });
      
      console.log('🎯 Sending pledge transaction for campaign', campaign.id, 'with amount', selectedAmount, 'USDC...');
      await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: universalAddress,
          to: PLATFORM_ADDRESS,
          data: pledgeData,
          gas: '0x76c0', // 30400 gas limit (same as CreateCampaignButton)
        }]
      });

      addToast(`🎉 Pledge successful! ${selectedAmount} USDC pledged to "${campaign.title}"`, 'success');
      
      // Refresh campaigns to show updated amounts - wait longer for blockchain confirmation
      if (campaignData.refetch) {
        addToast(`🎉 Pledge successful! Refreshing campaign data...`, 'success');
        setTimeout(() => campaignData.refetch(), 5000); // Longer delay for blockchain confirmation
      }
      
    } catch (error) {
      console.error('BasePay pledge failed:', error);
      addToast(`❌ Pledge failed: ${error.message}`, 'error');
    }
  };

  // BasePay = Direct pledge to campaign (no faucet!)
  const handleBasePay = async (campaign) => {
    if (!isSignedIn) {
      alert('Please sign in with Base Account first to pledge');
      return;
    }

    if (!universalAddress) {
      alert('Base Account address not found. Please try signing in again.');
      return;
    }

    try {
      const selectedAmount = getAmountForCampaign(campaign.id);
      const amountInWei = parseUnits(selectedAmount, 6); // USDC has 6 decimals
      
      // Base Mainnet addresses
      const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      const PLATFORM_ADDRESS = getContractAddress(8453);
      const provider = sdk.getProvider();
      
      addToast(`🎯 Pledging ${selectedAmount} USDC to "${campaign.title}" via BasePay...`, 'info');
      
      // FORCE Base Mainnet network first!
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }], // Base Mainnet
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base Mainnet',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: [rpcUrl],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
        }
      }
      
      await provider.request({ method: 'eth_requestAccounts' });
      
      // Check current allowance first
      addToast(`🔍 Checking USDC allowance...`, 'info');
      
      const allowanceData = encodeFunctionData({
        abi: [{
          name: 'allowance',
          type: 'function', 
          inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
          ],
          outputs: [{ name: '', type: 'uint256' }]
        }],
        functionName: 'allowance',
        args: [universalAddress, PLATFORM_ADDRESS]
      });
      
      const allowanceResult = await provider.request({
        method: 'eth_call',
        params: [{
          to: USDC_ADDRESS,
          data: allowanceData
        }, 'latest']
      });
      
      const currentAllowance = BigInt(allowanceResult);
      console.log('Current allowance:', Number(currentAllowance) / 1000000, 'USDC');
      
      // If allowance is insufficient, approve once for a large amount
      if (currentAllowance < amountInWei) {
        addToast(`🔐 One-time USDC approval needed...`, 'info');
        
        const largeAmount = parseUnits('1000000', 6); // 1M USDC allowance
        
        const approveData = encodeFunctionData({
          abi: [{
            name: 'approve',
            type: 'function',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }],
          functionName: 'approve',
          args: [PLATFORM_ADDRESS, largeAmount]
        });
        
        await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: universalAddress,
            to: USDC_ADDRESS,
            data: approveData,
            gas: '0x15f90',
          }]
        });
        
        addToast(`✅ Approved! Now pledging...`, 'success');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Now pledge directly to campaign
      addToast(`🎯 Pledging ${selectedAmount} USDC to "${campaign.title}"...`, 'info');
      
      const pledgeData = encodeFunctionData({
        abi: contractAbi,
        functionName: 'pledge',
        args: [Number(campaign.id), amountInWei]
      });
      
      const pledgeTx = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: universalAddress,
          to: PLATFORM_ADDRESS,
          data: pledgeData,
          gas: '0x76c0',
        }]
      });
      
      console.log('✅ Pledge transaction:', pledgeTx);
      addToast(`🎉 Success! ${selectedAmount} USDC pledged to "${campaign.title}"`, 'success');
      
      // Refresh campaigns
      if (campaignData.refetch) {
        setTimeout(() => campaignData.refetch(), 3000);
      }
      
    } catch (error) {
      console.error('BasePay pledge failed:', error);
      addToast(`❌ Pledge failed: ${error.message}`, 'error');
    }
  };



  // Hook for writing to contract
  const { writeContractAsync } = useWriteContract();

  // Alternative: Direct contract pledge (works with Base Account!)
  const handleDirectPledge = async (campaign) => {
    if (!isSignedIn) {
      alert('Please sign in with Base Account first to make a pledge');
      return;
    }

    if (!universalAddress) {
      alert('Base Account address not found. Please try signing in again.');
      return;
    }

    try {
      const selectedAmount = getAmountForCampaign(campaign.id);
      const amountInWei = parseUnits(selectedAmount, 6); // USDC has 6 decimals
      
      addToast(`Processing ${selectedAmount} USDC pledge to blockchain...`, 'info');

      // Call the real contract pledge function using Base Account!
      await writeContractAsync({
        address: getContractAddress(8453), // Base Mainnet
        abi: contractAbi,
        functionName: 'pledge',
        args: [Number(campaign.id), amountInWei],
        account: universalAddress, // Use Base Account address
        chain: { id: 8453 }, // Force Base Mainnet
      });

      addToast('✅ Pledge successful!', 'success');

    } catch (error) {
      console.error('Direct pledge failed:', error);
      alert('Pledge failed: ' + error.message);
      addToast('❌ Direct pledge failed', 'error');
    }
  };

  // Handle payment status check
  const handleCheckStatus = async () => {
    if (!paymentId) {
      addToast('No payment ID found. Please make a payment first.', 'error');
      return;
    }

    try {
      const { status } = await getPaymentStatus({ id: paymentId });
      addToast(`Payment status: ${status}`, 'info');
    } catch (error) {
      console.error('Status check failed:', error);
      addToast('Status check failed', 'error');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Navigation handlers
  const handleCreateCampaign = () => {
    setShowCreateModal(true);
  };

  const handleAbout = () => {
    setShowAboutModal(true);
  };

  const handleHelp = () => {
    alert('Need help? Contact us at hello@fundly.com or check our documentation! 📚');
  };

  // Handle campaign editing
  const handleEditCampaign = async (campaign) => {
    setEditingCampaign(campaign);
    setShowEditModal(true);
    
    // Load existing metadata from Supabase
    setIsLoadingMetadata(true);
    try {
      const metadata = await getCampaignMetadata(campaign.id);
      if (metadata) {
        setEditFormData({
          twitterUrl: metadata.twitter_url || '',
          websiteUrl: metadata.website_url || '',
          extendedDescription: metadata.extended_description || '',
          imageUrl: metadata.image_url || metadata.image_blob_url || ''
        });
      } else {
        // Reset form if no metadata found
        setEditFormData({
          twitterUrl: '',
          websiteUrl: '',
          extendedDescription: '',
          imageUrl: ''
        });
      }
    } catch (error) {
      console.error('Error loading campaign metadata:', error);
      addToast('Failed to load campaign data', 'error');
      setEditFormData({
        twitterUrl: '',
        websiteUrl: '',
        extendedDescription: '',
        imageUrl: ''
      });
    } finally {
      setIsLoadingMetadata(false);
    }
  };

    // Handle image upload to Vercel Blob
  const handleImageUpload = async (file) => {
    if (!file || !editingCampaign) return;

    setIsUploadingImage(true);
    try {
      // Upload using our upload utility
      const result = await uploadImageToBlob(file, editingCampaign.id);
      
      // Update form data with new image URL
      setEditFormData(prev => ({
        ...prev,
        imageUrl: result.url
      }));

      addToast('Image uploaded successfully! 📸', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.message.includes('token') || error.message.includes('REACT_APP_BLOB_READ_WRITE_TOKEN')) {
        addToast('Missing Vercel Blob token - check .env.local', 'error');
      } else {
        addToast('Failed to upload image', 'error');
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle saving campaign metadata
  const handleSaveCampaignMetadata = async () => {
    if (!editingCampaign) return;
    
    setIsSavingMetadata(true);
    try {
      await updateCampaignMetadata(editingCampaign.id, {
        twitterUrl: editFormData.twitterUrl,
        websiteUrl: editFormData.websiteUrl,
        extendedDescription: editFormData.extendedDescription,
        imageBlobUrl: editFormData.imageUrl // Save to image_blob_url column for Vercel Blob URLs
      });
      
      addToast('Campaign updated successfully! 🎉', 'success');
      setShowEditModal(false);
      
      // Refresh campaign data to show changes
      if (campaignData.refetch) {
        campaignData.refetch();
      }
    } catch (error) {
      console.error('Error saving campaign metadata:', error);
      addToast('Failed to save changes', 'error');
    } finally {
      setIsSavingMetadata(false);
    }
  };

  // Campaign creation logic moved to CreateCampaignButton component

  // Handle About donation (Buy us coffee)
  const handleAboutDonation = async () => {
    try {
      addToast('Processing coffee donation...', 'info');
      
      const { id } = await pay({
        amount: '5', // 5 USDC for coffee
        to: '0xF1fa20027b6202bc18e4454149C85CB01dC91Dfd',
        testnet: false
      });

      setPaymentId(id);
      addToast('☕ Thank you for buying us coffee! 5 USDC donated to Fundly team', 'success');
    } catch (error) {
      console.error('Coffee donation failed:', error);
      addToast('❌ Coffee donation failed', 'error');
    }
  };

  // Image upload functionality removed - will be added to campaign editing later

  const dark = theme === 'dark';

  // Professional platform styles
  const styles = {
    container: { 
      minHeight: '100vh', 
      background: dark 
        ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
      color: dark ? '#fff' : '#1e293b',
      fontFamily: "'Inter', 'SF Pro Display', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    header: {
      padding: '20px 40px',
      borderBottom: `1px solid ${dark ? '#1e40af' : 'rgba(148, 163, 184, 0.3)'}`,
      backdropFilter: 'blur(20px)',
      backgroundColor: dark ? 'rgba(30, 58, 138, 0.4)' : 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    logo: {
      fontSize: '32px',
      fontWeight: '800',
      background: dark 
        ? 'linear-gradient(45deg, #ffffff, #e0f2fe)'
        : 'linear-gradient(45deg, #2563eb, #1d4ed8)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      letterSpacing: '-0.02em'
    },
    mainContent: {
      display: 'flex',
      minHeight: 'calc(100vh - 80px)'
    },
    sidebar: {
      width: '320px',
      padding: '30px 20px',
      backgroundColor: dark ? 'rgba(30, 64, 175, 0.4)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      borderRight: `1px solid ${dark ? '#1e40af' : 'rgba(148, 163, 184, 0.3)'}`
    },
    centerFeed: {
      flex: 1,
      padding: '30px',
      maxWidth: '800px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    rightSidebar: {
      width: '320px',
      padding: '30px 20px',
      backgroundColor: dark ? 'rgba(30, 64, 175, 0.4)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      borderLeft: `1px solid ${dark ? '#1e40af' : 'rgba(148, 163, 184, 0.3)'}`
    },
    card: {
      backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '24px',
      marginBottom: '20px',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
      boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.1)' : '0 20px 60px rgba(0,0,0,0.05)'
    },
    button: {
      padding: '10px 20px',
      borderRadius: '12px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontFamily: "'Inter', sans-serif"
    },
    primaryButton: {
      background: 'linear-gradient(45deg, #2563eb, #1d4ed8)',
      color: 'white',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 30px rgba(37, 99, 235, 0.4)'
      }
    }
  };

  return (
    <>
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* CSS for loading animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <img 
          src="/logo512.png" 
          alt="Fundly Logo" 
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }} 
        />
        
        {/* Navigation buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* Base Account Status */}

          <button
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: dark ? '#fff' : '#1e293b',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb'
              }
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(37, 99, 235, 0.1)';
              e.target.style.color = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = dark ? '#fff' : '#1e293b';
            }}
            onClick={handleCreateCampaign}
          >
            Create Campaign
          </button>
          
          <button
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: dark ? '#fff' : '#1e293b',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(37, 99, 235, 0.1)';
              e.target.style.color = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = dark ? '#fff' : '#1e293b';
            }}
            onClick={handleAbout}
          >
            About
          </button>

          <button
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: dark ? '#fff' : '#1e293b',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(37, 99, 235, 0.1)';
              e.target.style.color = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = dark ? '#fff' : '#1e293b';
            }}
            onClick={handleHelp}
          >
            Help
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={toggleTheme} 
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px'
            }}
          >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
          {!isSignedIn && (
            <SignInWithBaseButton 
              align="center"
              variant="solid"
              colorScheme={theme}
              size="medium"
              onClick={handleSignIn}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Left Sidebar - Wallet Management */}
        <div style={styles.sidebar}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>
            💼 Wallet Manager
          </h3>
          
          {/* Contract Connection Status - Now using ContractStatus component */}
          <ContractStatus styles={styles} />
          
          {/* User's Campaign Dashboard */}
          <UserDashboard 
            styles={styles} 
            dark={dark} 
            isSignedIn={isSignedIn}
            universalAddress={universalAddress}
            onEditCampaign={handleEditCampaign}
          />
          
          {isSignedIn ? (
            <div>
      <div style={styles.card}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px' 
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    🏦 Main Account
                  </div>
                  <button
                    onClick={() => {
                      setIsSignedIn(false);
                      setUniversalAddress('');
                      setSubAccount(null);
                      setHasSubAccount(false);
                      addToast('👋 Logged out successfully', 'success');
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#dc2626'}
                    onMouseOut={(e) => e.target.style.background = '#ef4444'}
                  >
                    🚪 Logout
                  </button>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', opacity: 0.9 }}>
                  BaseAccount Address:
                </div>
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(universalAddress);
                                    addToast('📋 Address copied to clipboard!', 'success');
                  }}
                  style={{ 
                    fontSize: '10px', 
                    opacity: 0.8, 
                    marginBottom: '10px',
                    padding: '8px',
                    backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    lineHeight: '1.3',
                    border: `1px dashed ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                    e.target.style.borderStyle = 'solid';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                    e.target.style.borderStyle = 'dashed';
                  }}
                  title="Click to copy address"
                >
                  📋 {universalAddress}
                </div>
                <div style={{ fontSize: '12px', color: '#28a745' }}>
                  ✅ Connected
                </div>
              </div>

                             {/* Payment Methods Info */}
               <div style={styles.card}>
                 <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
                   💳 How Pledging Works
                 </div>
                 <div style={{ marginBottom: '8px' }}>
                   <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb', marginBottom: '4px' }}>
                     1️⃣ Select Amount
                   </div>
                   <div style={{ fontSize: '11px', opacity: 0.8, lineHeight: '1.4' }}>
                     Choose $1, $5, $10, or $100 USDC per campaign
                   </div>
                 </div>
                 <div>
                   <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb', marginBottom: '4px' }}>
                     2️⃣ Pledge with BasePay
                   </div>
                   <div style={{ fontSize: '11px', opacity: 0.8, lineHeight: '1.4' }}>
                     Direct USDC pledge to campaign<br/>
                     (First time: one approval, then instant forever!)
                   </div>
                 </div>
               </div>

              



              {paymentId && (
                <div style={styles.card}>
                  <button 
                    onClick={handleCheckStatus}
                    style={{
                      ...styles.button,
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      width: '100%',
                      fontSize: '12px'
                    }}
                  >
                    🔍 Check Payment Status
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.card}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
                <div style={{ fontSize: '14px', marginBottom: '16px', color: dark ? '#f1f5f9' : '#1e293b' }}>
                  Connect your Base Account to use all features
                </div>
                
                {/* Connection Status */}
                <div style={{ 
                  margin: '20px 0', 
                  padding: '16px',
                  background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: '12px',
                  fontSize: '13px'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    {isSignedIn ? '🟢' : '🔴'} <strong>Base Account:</strong> {isSignedIn ? 'Connected ✅' : 'Not connected'} 
                    <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
                      (For everything: pledges, campaigns, transactions)
                    </div>
                  </div>
                </div>

                {/* Sign In Button */}
                {!isSignedIn && (
                  <div style={{ marginBottom: '16px' }}>
                    <SignInWithBaseButton 
                      align="center"
                      variant="solid"
                      colorScheme={theme}
                      size="medium"
                      onClick={handleSignIn}
                    />
                  </div>
                )}

                {/* Connection Instructions */}
                {!isSignedIn && (
                  <div style={{ 
                    padding: '12px',
                    background: dark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: dark ? '#93c5fd' : '#3b82f6'
                  }}>
                    💡 <strong>Start here:</strong> Sign in with Base Account to create campaigns and make instant USDC pledges!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center Feed - Crowdfunding Campaigns */}
        <div style={styles.centerFeed}>
          {/* Filter Buttons */}
          <div style={{ marginBottom: '30px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {campaignFilters.map(filter => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '25px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: selectedFilter === filter
                      ? '#2563eb'
                      : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(148, 163, 184, 0.2)'),
                    color: selectedFilter === filter
                      ? 'white'
                      : (dark ? '#fff' : '#1e293b'),
                    boxShadow: selectedFilter === filter
                      ? '0 4px 15px rgba(37, 99, 235, 0.3)'
                      : 'none',
                    transform: selectedFilter === filter ? 'translateY(-1px)' : 'none'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          {/* Campaign Manager - handles loading campaigns from blockchain */}
          <CampaignManager onCampaignsUpdate={handleCampaignsUpdate} />
          
          {/* Loading indicator for campaigns */}
          {campaignData.loading && chainId && (
            <div style={{
              ...styles.card,
              padding: '40px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '18px', marginBottom: '16px' }}>
                🔗 Loading campaigns from blockchain...
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {/* Info Banner for all users about campaign types */}
          {!isSignedIn && (
            <div style={{
              ...styles.card,
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px',
              background: dark 
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))'
                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(16, 185, 129, 0.05))',
              border: `1px solid ${dark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`,
              borderRadius: '16px'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '12px' }}>
                🚀 <strong>Live Campaigns</strong>
              </div>
              <div style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.8, lineHeight: '1.5' }}>
                You're viewing <strong>real campaigns from Base blockchain</strong> + demo examples. 
                <br />
                <strong>Sign in with Base Account</strong> to create campaigns and make pledges!
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>
                💰 BasePay pledging requires login
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '900px' }}>
            
            {/* Loading indicator for real campaigns - shown to all users */}
            {campaignData.loading && (
              <div style={{
                ...styles.card,
                textAlign: 'center',
                padding: '40px 20px',
                backgroundColor: dark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                borderLeft: '4px solid #3b82f6',
                marginBottom: '10px'
              }}>
                <div style={{ 
                  fontSize: '32px', 
                  marginBottom: '16px',
                  animation: 'spin 2s linear infinite'
                }}>⏳</div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  marginBottom: '8px', 
                  color: '#2563eb' 
                }}>
                  Loading Live Campaigns from Base Blockchain...
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  opacity: 0.8, 
                  lineHeight: '1.5',
                  maxWidth: '450px',
                  margin: '0 auto'
                }}>
                  {campaignData.campaigns.length === 0 ? (
                    // Phase 1: Initial loading
                    <>
                      🚀 <strong>Phase 1:</strong> Fast campaign fetch<br/>
                      🔍 Getting live campaigns from Base Mainnet<br/>
                      <em>Usually takes ~500ms...</em>
                    </>
                  ) : (
                    // Phase 2: Backers counting
                    <>
                      👥 <strong>Phase 2:</strong> Counting backers<br/>
                      📊 Analyzing blockchain events for each campaign<br/>
                      <em>Almost done, counting backers...</em>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Campaigns list */}
            {filteredCampaigns.map(campaign => (
              <div key={campaign.id} style={{
                ...styles.card,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: dark ? '0 25px 80px rgba(0,0,0,0.2)' : '0 25px 80px rgba(0,0,0,0.1)'
                }
              }}>
                {/* Fundly Logo Watermark */}
                <img 
                  src="/logo512.png" 
                  alt="Fundly" 
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    opacity: 0.4,
                    zIndex: 1
                  }} 
                />
                <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
                  <img 
                    src={campaign.image} 
                    alt={campaign.title}
                    style={{
                      width: '200px',
                      height: '140px',
                      borderRadius: '16px',
                      objectFit: 'cover',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '22px', color: dark ? '#fff' : '#1e293b', lineHeight: '1.3' }}>
                            {campaign.title}
                          </h3>
                          <div style={{ 
                            fontSize: '12px', 
                            opacity: 0.7, 
                            marginTop: '4px',
                            fontStyle: 'italic'
                          }}>
                            by {campaign.creator}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            padding: '6px 12px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {campaign.category}
                          </span>
                          {campaign.status !== 'Active' && (
                            <span style={{
                              padding: '6px 12px',
                              backgroundColor: campaign.status.includes('Funded') ? '#10b981' : '#f59e0b',
                              color: 'white',
                              borderRadius: '16px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {campaign.status}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p style={{ 
                        fontSize: '15px', 
                        opacity: 0.8, 
                        marginBottom: '16px',
                        lineHeight: '1.5',
                        margin: 0
                      }}>
                        {campaign.description}
                      </p>
                      
                      <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '16px' }}>
                        by {campaign.creator}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{
                        width: '100%',
                        height: '10px',
                        backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min((campaign.raised / campaign.goal) * 100, 100)}%`,
                          height: '100%',
                          background: 'linear-gradient(45deg, #2563eb, #1d4ed8)',
                          borderRadius: '6px'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '13px' }}>
                        <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                          ${campaign.raised.toLocaleString()} raised
                        </span>
                        <span style={{ opacity: 0.7 }}>
                          ${campaign.goal.toLocaleString()} goal
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '12px' }}>
                        👥 {campaign.backers} backers • ⏰ {campaign.daysLeft > 0 ? `${campaign.daysLeft} days left` : 'Campaign ended'}
                      </div>
                      
                      {campaign.status === 'Active' && (
                        <>
                          {/* Quick Amount Selection - Always visible */}
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                              💰 Select Amount (USDC):
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {quickAmounts.map(amount => (
                                <button
                                  key={amount}
                                  onClick={() => setAmountForCampaign(campaign.id, amount.toString())}
                                  style={{
                                    padding: '6px 16px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    backgroundColor: getAmountForCampaign(campaign.id) === amount.toString() 
                                      ? '#2563eb' 
                                      : (dark ? 'rgba(255,255,255,0.2)' : 'rgba(148, 163, 184, 0.2)'),
                                    color: getAmountForCampaign(campaign.id) === amount.toString() 
                                      ? 'white' 
                                      : (dark ? '#fff' : '#1e293b'),
                                    transition: 'all 0.2s ease',
                                    boxShadow: getAmountForCampaign(campaign.id) === amount.toString() 
                                      ? '0 4px 15px rgba(37, 99, 235, 0.3)'
                                      : 'none'
                                  }}
                                >
                                  ${amount}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* BasePay Pledge or Demo Notice */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                              Selected: <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
                                ${getAmountForCampaign(campaign.id)} USDC
                              </span>
                            </div>
                            
                              <BasePayButton 
                                colorScheme={theme}
                                onClick={() => handleBasePay(campaign)}
                                style={{
                                  fontSize: '11px',
                                  padding: '8px 16px',
                                  transform: 'scale(0.9)',
                                  borderRadius: '10px'
                                }}
                              />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Info banner about demo campaigns for all users */}
            {finalCampaigns.some(c => c.isDemo) && (
              <div style={{
                ...styles.card,
                padding: '12px 16px',
                textAlign: 'center',
                marginTop: '10px',
                backgroundColor: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                border: `1px dashed ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>
                  🎭 Some demo campaigns included above for platform showcase alongside real blockchain campaigns
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Popular Campaigns & Stats */}
        <div style={styles.rightSidebar}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>
            🔥 Popular This Week
          </h3>
          
          {popularCampaigns.map(campaign => (
            <div key={campaign.id} style={{
              ...styles.card,
              padding: '16px',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                {campaign.title}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>
                by {campaign.creator}
              </div>
              <div style={{ fontSize: '12px' }}>
                <div style={{ color: '#28a745', fontWeight: 'bold' }}>
                  ${campaign.raised.toLocaleString()} raised
                </div>
                <div style={{ opacity: 0.7 }}>
                  👥 {campaign.backers} backers
                </div>
              </div>
            </div>
          ))}
          
          <div style={{ ...styles.card, marginTop: '30px' }}>
            <h4 style={{ marginTop: 0, fontSize: '16px' }}>📊 Platform Stats</h4>
            <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
              <div>💰 Total Raised: $2.4M</div>
              <div>🎯 Campaigns: 1,234</div>
              <div>👥 Active Users: 45,678</div>
              <div>✅ Success Rate: 78%</div>
            </div>
          </div>

          <div style={{ ...styles.card, marginTop: '20px' }}>
            <h4 style={{ marginTop: 0, fontSize: '16px' }}>🔒 Smart Contract</h4>
            <div style={{ fontSize: '12px', lineHeight: '1.6', marginBottom: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✅ Verified Contract</span>
              </div>
              <div style={{ marginBottom: '4px' }}>
                📜 <strong>CrowdfundingEscrow</strong>
              </div>
              <div style={{ marginBottom: '4px' }}>
                🌐 <strong>Base Mainnet</strong>
              </div>
              <div style={{ marginBottom: '8px' }}>
                🔗 <strong>BaseScan Verified</strong>
              </div>
            </div>
            <div 
              onClick={() => {
                navigator.clipboard.writeText('0xef0B17afD2089Cc34b68F48B892922b113FedcE2');
                addToast('📋 Contract address copied!', 'success');
              }}
              style={{ 
                fontSize: '10px', 
                opacity: 0.8,
                padding: '8px',
                backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderRadius: '6px',
                cursor: 'pointer',
                wordBreak: 'break-all',
                lineHeight: '1.3',
                border: `1px dashed ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                e.target.style.borderStyle = 'solid';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                e.target.style.borderStyle = 'dashed';
              }}
              title="Click to copy contract address"
            >
              📋 0xef0B17afD2089Cc34b68F48B892922b113FedcE2
            </div>
            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '6px', textAlign: 'center' }}>
              <a 
                href="https://basescan.org/address/0xef0B17afD2089Cc34b68F48B892922b113FedcE2#code"
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  color: '#2563eb', 
                  textDecoration: 'none',
                  fontSize: '10px'
                }}
              >
                🔍 View on BaseScan
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: dark ? '#1e293b' : 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
          }}>
            {/* Header */}
            <div style={{
              padding: '32px 32px 0 32px',
              borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              marginBottom: '32px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img 
                src="/logo512.png" 
                alt="Fundly Logo" 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px'
                }} 
              />
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '28px', 
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  🚀 Create New Campaign
                </h2>
            </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    color: dark ? '#94a3b8' : '#64748b',
                    padding: '8px',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div style={{ padding: '0 32px 32px 32px' }}>
              {/* Campaign Title */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: dark ? '#f1f5f9' : '#1e293b'
                }}>
                  Campaign Title *
                </label>
                <input
                  type="text"
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Revolutionary Solar Panel Technology"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: `2px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    backgroundColor: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: dark ? '#f1f5f9' : '#1e293b',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: dark ? '#f1f5f9' : '#1e293b'
                }}>
                  Description *
                </label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your campaign, what you're building, and why people should support you..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: `2px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    backgroundColor: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: dark ? '#f1f5f9' : '#1e293b',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '120px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Goal Amount, Category, and Duration Row */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '20px', 
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: dark ? '#f1f5f9' : '#1e293b'
                  }}>
                    Goal Amount (USDC) *
                  </label>
                  <input
                    type="number"
                    value={newCampaign.goal}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, goal: e.target.value }))}
                    placeholder="50000"
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      border: `2px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      backgroundColor: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                      color: dark ? '#f1f5f9' : '#1e293b',
                      fontSize: '16px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: dark ? '#f1f5f9' : '#1e293b'
                  }}>
                    Category
                  </label>
                  <select
                    value={newCampaign.category}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, category: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      border: `2px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      backgroundColor: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                      color: dark ? '#f1f5f9' : '#1e293b',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Technology">Technology</option>
                    <option value="Environment">Environment</option>
                    <option value="Education">Education</option>
                    <option value="Culture">Culture</option>
                    <option value="Health">Health</option>
                    <option value="Dreams">Dreams</option>
                    <option value="Goals">Goals</option>
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: dark ? '#f1f5f9' : '#1e293b'
                  }}>
                    Duration (days) *
                  </label>
                  <input
                    type="number"
                    value={newCampaign.duration}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="30"
                    min="1"
                    max="365"
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      border: `2px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      backgroundColor: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                      color: dark ? '#f1f5f9' : '#1e293b',
                      fontSize: '16px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <div style={{ 
                    fontSize: '12px', 
                    opacity: 0.7, 
                    marginTop: '6px',
                    color: dark ? '#94a3b8' : '#64748b'
                  }}>
                    Campaign duration (1-365 days)
                  </div>
                </div>
              </div>

              {/* Creator Nickname */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: dark ? '#f1f5f9' : '#1e293b'
                }}>
                  Creator Nickname *
                </label>
                <input
                  type="text"
                  value={newCampaign.creatorNickname}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, creatorNickname: e.target.value }))}
                  placeholder="Your public nickname (e.g., @yourname)"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: `2px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    backgroundColor: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: dark ? '#f1f5f9' : '#1e293b',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Connected Wallet Display */}
              {universalAddress && (
                <div style={{ 
                  marginBottom: '32px',
                  padding: '20px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                  border: `2px solid ${dark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.3)'}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    marginBottom: '8px',
                    color: dark ? '#4ade80' : '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    💼 Connected Wallet
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                    color: dark ? '#4ade80' : '#16a34a',
                    backgroundColor: dark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    wordBreak: 'break-all'
                  }}>
                    {universalAddress}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    opacity: 0.8,
                    color: dark ? '#4ade80' : '#16a34a'
                  }}>
                    This address will receive the funds if your campaign is successful
                  </div>
                </div>
              )}

              {/* Campaign image upload will be added to campaign editing later */}


              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                justifyContent: 'flex-end',
                paddingTop: '24px',
                borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
              }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '16px 32px',
                    borderRadius: '16px',
                    border: `2px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                    backgroundColor: 'transparent',
                    color: dark ? '#94a3b8' : '#64748b',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '120px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Cancel
                </button>
                <CreateCampaignButton
                  newCampaign={newCampaign}
                  setNewCampaign={setNewCampaign}
                  setShowCreateModal={setShowCreateModal}
                                          addToast={addToast}
                  onCampaignCreated={handleCampaignCreated}
                  isSignedIn={isSignedIn}
                  universalAddress={universalAddress}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            ...styles.card,
            width: '450px',
            maxWidth: '90vw'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              marginTop: 0, 
              marginBottom: '20px' 
            }}>
              <img 
                src="/logo512.png" 
                alt="Fundly Logo" 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px'
                }} 
              />
              <h2 style={{ 
                margin: 0, 
                fontSize: '24px',
                fontWeight: '700'
              }}>
                About Fundly
            </h2>
            </div>
            
            <div style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              <p style={{ marginBottom: '16px' }}>
                <strong>Fundly</strong> is a modern crowdfunding platform built on <strong>Base blockchain</strong> 
                that makes it incredibly easy for people to achieve their dreams and realize their goals.
              </p>
              
              <p style={{ marginBottom: '16px' }}>
                🌟 <strong>Our Mission:</strong> We believe everyone deserves the chance to bring their ideas to life. 
                Whether you're building the next revolutionary technology, helping communities, 
                or creating something beautiful - we're here to help you get funded.
              </p>
              
              <p style={{ marginBottom: '16px' }}>
                ⚡ <strong>Powered by Base Account:</strong> Enjoy seamless crypto payments with just a few clicks. 
                No complex wallet setups, no confusing interfaces - just simple, secure donations in USDC.
              </p>
              
              <p style={{ marginBottom: '20px' }}>
                ☕ <strong>Support Our Team:</strong> Building this platform takes time and coffee! 
                If you like what we're doing, consider buying us a coffee to keep us caffeinated and coding.
              </p>
      </div>

            <div style={{ 
              padding: '20px', 
              backgroundColor: dark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)',
              borderRadius: '12px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', marginBottom: '12px', opacity: 0.8 }}>
                ☕ Buy us a coffee - Support Fundly development
              </div>
              <BasePayButton 
                colorScheme={theme}
                onClick={handleAboutDonation}
                style={{
                  fontSize: '14px',
                  padding: '10px 20px'
                }}
              />
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                5 USDC = lots of coffee and motivation! 🚀
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setShowAboutModal(false)}
                style={{
                  ...styles.button,
                  backgroundColor: '#6c757d',
                  color: 'white'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Edit Modal - positioned at app level for proper centering */}
      {showEditModal && editingCampaign && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: dark ? '#1e293b' : 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
          }}>
            {/* Header */}
            <div style={{
              padding: '32px 32px 0 32px',
              borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              marginBottom: '32px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img 
                    src="/logo512.png" 
                    alt="Fundly Logo" 
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px'
                    }} 
                  />
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: '28px', 
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    ✏️ Edit Campaign
                  </h2>
                </div>
              <button
                  onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                    fontSize: '28px',
                  cursor: 'pointer',
                    color: dark ? '#94a3b8' : '#64748b',
                    padding: '8px',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
              </div>
              <div style={{ fontSize: '16px', opacity: 0.8 }}>
                Campaign: <strong>{editingCampaign.title}</strong> (#{editingCampaign.id})
              </div>
            </div>

            {/* Form Content */}
            <div style={{ padding: '0 32px 32px 32px' }}>
              {/* Campaign Image Upload */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: dark ? '#f1f5f9' : '#1e293b'
                }}>
                  📸 Campaign Image
                </label>
                {/* Current Image Preview */}
                {editFormData.imageUrl && (
            <div style={{ marginBottom: '16px' }}>
                    <img 
                      src={editFormData.imageUrl} 
                      alt="Campaign" 
                style={{
                        width: '100%',
                        maxHeight: '200px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                      }}
                    />
            </div>
                )}

                {/* File Upload Input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleImageUpload(file);
                  }}
                  disabled={isUploadingImage || isLoadingMetadata}
                  style={{ display: 'none' }}
                  id="imageUpload"
                />

                {/* Upload Button */}
                <label
                  htmlFor="imageUpload"
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '32px 20px',
                    borderRadius: '16px',
                    border: `2px dashed ${dark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.4)'}`,
                    backgroundColor: dark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.08)',
                    color: dark ? '#4ade80' : '#059669',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (isUploadingImage || isLoadingMetadata) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                display: 'flex', 
                    flexDirection: 'column',
                alignItems: 'center', 
                    justifyContent: 'center',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    opacity: (isUploadingImage || isLoadingMetadata) ? 0.5 : 1
                  }}
                >
                  {isUploadingImage ? '🔄 Uploading...' : '📁 Upload Campaign Image'}
                  <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                    {isUploadingImage ? 'Please wait...' : 'Click to select image (JPG, PNG, WebP)'}
              </div>
                </label>
              </div>

              {/* Social Media Links */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: dark ? '#f1f5f9' : '#1e293b'
                }}>
                  🔗 Social Media Links
                </label>
                
                {/* X/Twitter */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                    🐦 X (Twitter) Profile
                  </label>
                  <input
                    type="url"
                    placeholder="https://x.com/yourusername"
                    value={editFormData.twitterUrl}
                    onChange={(e) => setEditFormData({...editFormData, twitterUrl: e.target.value})}
                    disabled={isLoadingMetadata}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: `2px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      backgroundColor: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                      color: dark ? '#f1f5f9' : '#1e293b',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      opacity: isLoadingMetadata ? 0.5 : 1
                    }}
                  />
                </div>

                {/* Website */}
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                    🌐 Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={editFormData.websiteUrl}
                    onChange={(e) => setEditFormData({...editFormData, websiteUrl: e.target.value})}
                    disabled={isLoadingMetadata}
                      style={{
                        width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: `2px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      backgroundColor: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                      color: dark ? '#f1f5f9' : '#1e293b',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      opacity: isLoadingMetadata ? 0.5 : 1
                    }}
                  />
                    </div>
                  </div>

              {/* Extended Description */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: dark ? '#f1f5f9' : '#1e293b'
                }}>
                  📝 Extended Description
                </label>
                <textarea
                  placeholder="Add more details about your campaign, team, roadmap, etc..."
                  rows={4}
                  value={editFormData.extendedDescription}
                  onChange={(e) => setEditFormData({...editFormData, extendedDescription: e.target.value})}
                  disabled={isLoadingMetadata}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: `2px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    backgroundColor: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: dark ? '#f1f5f9' : '#1e293b',
                    fontSize: '16px',
                    fontWeight: '500',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '120px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    opacity: isLoadingMetadata ? 0.5 : 1
                  }}
                />
              </div>

              {/* Action Buttons */}
            <div style={{ 
                display: 'flex', 
                gap: '16px', 
                justifyContent: 'flex-end',
                paddingTop: '24px',
                borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
              }}>
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isSavingMetadata || isUploadingImage}
                  style={{
                    padding: '16px 32px',
                    borderRadius: '16px',
                    border: `2px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                    backgroundColor: 'transparent',
                    color: dark ? '#94a3b8' : '#64748b',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (isSavingMetadata || isUploadingImage) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '120px',
                    opacity: (isSavingMetadata || isUploadingImage) ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCampaignMetadata}
                  disabled={isSavingMetadata || isLoadingMetadata || isUploadingImage}
                  style={{
                    padding: '16px 32px',
                    borderRadius: '16px',
                    border: 'none',
                    background: (isSavingMetadata || isLoadingMetadata || isUploadingImage) ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (isSavingMetadata || isLoadingMetadata || isUploadingImage) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '180px',
                    boxShadow: (isSavingMetadata || isLoadingMetadata || isUploadingImage) ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {isLoadingMetadata ? '📂 Loading...' : 
                   isSavingMetadata ? '💾 Saving...' : 
                   isUploadingImage ? '📸 Uploading...' : 
                   '💾 Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

       
    </div>
    </>
  );
}

export default App;