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

function App() {
  // Wagmi hooks for contract integration
  const { address: walletAddress, isConnected: isWalletConnected, chainId } = useAccount();
  
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [theme, setTheme] = useState('light');
  
  // Real contract data - managed by CampaignManager component
  const [campaignData, setCampaignData] = useState({
    campaigns: [],
    loading: true,
    refetch: null
  });

  // Sub Account states
  const [subAccount, setSubAccount] = useState(null);
  const [hasSubAccount, setHasSubAccount] = useState(false);
  const [subAccountLoading, setSubAccountLoading] = useState(false);
  const [universalAddress, setUniversalAddress] = useState('');

  // Crowdfunding states
  const [selectedAmounts, setSelectedAmounts] = useState({});

  // Quick amount options
  const quickAmounts = [1, 5, 10, 100];

  // Campaign filter states
  const [selectedFilter, setSelectedFilter] = useState('Active');
  const campaignFilters = ['Active', 'Nearly Funded', 'Completed - Funded', 'Completed - Unfunded'];

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Create Campaign form states
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    goal: '',
    category: 'Technology',
    image: '',
    creatorNickname: '',
    duration: '30' // Duration in days, default 30 days
  });

  // Unsplash integration states
  const [unsplashImages, setUnsplashImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageSource, setImageSource] = useState(''); // 'unsplash' or 'upload'

  // Unsplash API configuration
  const UNSPLASH_ACCESS_KEY = 'uGdVJxeg4lsYvDtmfAiTdQtpkkoet2TUVZyz5llER6E';

  // Initialize SDK with Base Mainnet network
  const sdk = createBaseAccountSDK({
    appName: 'Fundly - Crowdfunding Platform',
    appLogo: 'https://base.org/logo.png',
    chain: {
      id: 8453, // Base Mainnet
              name: 'Base Mainnet',
      network: 'base-sepolia',
      nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      },
      rpcUrls: {
        public: { http: ['https://mainnet.base.org'] },
        default: { http: ['https://mainnet.base.org'] },
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

  // Use real campaigns if available, otherwise fall back to mock data
  const mockCampaigns = [
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
    },
    {
      id: 2,
      title: "Revolutionary Solar Panel Technology",
      description: "Next-generation solar panels with 40% higher efficiency than current models.",
      image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop",
      creator: "SolarTech Innovation",
      raised: 75300,
      goal: 100000,
      backers: 234,
      daysLeft: 15,
      category: "Technology",
      status: "Active"
    },
    {
      id: 3,
      title: "Educational Gaming App for Kids",
      description: "Interactive learning platform that makes education fun through gamification.",
      image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=300&fit=crop",
      creator: "EduPlay Studios",
      raised: 28750,
      goal: 40000,
      backers: 156,
      daysLeft: 8,
      category: "Education",
      status: "Active"
    },
    {
      id: 4,
      title: "Ocean Cleanup Initiative",
      description: "Advanced technology to remove plastic waste from our oceans.",
      image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop",
      creator: "OceanSaver Project",
      raised: 45200,
      goal: 80000,
      backers: 312,
      daysLeft: 31,
      category: "Environment",
      status: "Active"
    },
    {
      id: 5,
      title: "Smart Home Security System",
      description: "AI-powered security system for modern homes.",
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=300&fit=crop",
      creator: "SecureTech Ltd",
      raised: 98500,
      goal: 100000,
      backers: 445,
      daysLeft: 5,
      category: "Technology",
      status: "Nearly Funded"
    },
    {
      id: 6,
      title: "Community Garden Project",
      description: "Building sustainable community gardens in urban areas.",
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
      creator: "Green Communities",
      raised: 150000,
      goal: 120000,
      backers: 892,
      daysLeft: 0,
      category: "Environment",
      status: "Completed - Funded"
    },
    {
      id: 7,
      title: "Vintage Book Restoration",
      description: "Preserving rare books for future generations.",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
      creator: "Heritage Library",
      raised: 15000,
      goal: 50000,
      backers: 78,
      daysLeft: 0,
      category: "Culture",
      status: "Completed - Unfunded"
    },
    // Dreams and Goals campaigns
    {
      id: 8,
      title: "Follow My Dream: Becoming a Professional Chef",
      description: "Help me attend culinary school and open my own restaurant to serve my community.",
      raised: 3200,
      goal: 15000,
      backers: 24,
      daysLeft: 45,
      category: "Dreams",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
      creator: "Chef Maria Rodriguez",
      status: "Active"
    },
    {
      id: 9,
      title: "Goal: Marathon for Mental Health Awareness",
      description: "Supporting mental health by running 26.2 miles and raising funds for therapy programs.",
      raised: 8750,
      goal: 10000,
      backers: 156,
      daysLeft: 12,
      category: "Goals",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      creator: "Alex Thompson",
      status: "Nearly Funded"
    }
  ];

  // Use real campaigns if we have them and not loading, otherwise use mock data
  // Debug campaign data
  console.log('🔍 App.js Campaign Data Debug:');
  console.log('campaignData:', campaignData);
  console.log('campaignData.loading:', campaignData.loading);
  console.log('campaignData.campaigns:', campaignData.campaigns);
  console.log('campaignData.campaigns.length:', campaignData.campaigns?.length);
  
  // TEMPORARILY FORCE REAL DATA ONLY - no mock campaigns
  const campaigns = campaignData.campaigns;
  
  console.log('✅ FORCED REAL DATA ONLY');
  console.log('Real campaigns count:', campaigns.length);
  console.log('campaignData.loading:', campaignData.loading);
  console.log('campaignData.campaigns:', campaignData.campaigns);

  // Filter campaigns based on status
  const getFilteredCampaigns = () => {
    switch (selectedFilter) {
      case 'Active':
        return campaigns.filter(c => c.status === 'Active');
      case 'Nearly Funded':
        return campaigns.filter(c => c.status === 'Nearly Funded');
      case 'Completed - Funded':
        return campaigns.filter(c => c.status === 'Completed - Funded');
      case 'Completed - Unfunded':
        return campaigns.filter(c => c.status === 'Completed - Unfunded');
      default:
        return campaigns;
    }
  };

  const filteredCampaigns = getFilteredCampaigns();

  // Popular campaigns for right sidebar
  const popularCampaigns = campaigns
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
      setPaymentStatus('✅ Connected to Base Account');
    } catch (error) {
      console.error('Sign in failed:', error);
      setPaymentStatus('❌ Connection failed');
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
      setPaymentStatus('✅ Sub Account created! Now you can make seamless donations.');
    } catch (error) {
      console.error('Sub Account creation failed:', error);
      setPaymentStatus('❌ Sub Account creation failed');
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
      
      setPaymentStatus(`💰 Step 1/3: Getting ${selectedAmount} USDC via BasePay for campaign "${campaign.title}"...`);
      
      // Step 1: Use BasePay to get USDC to the user's Base Account wallet
      // NOTE: BasePay doesn't know this is for crowdfunding - it just shows "+X USDC" 
      // The actual pledge to campaign happens in Steps 2-3
      const { id } = await pay({
        amount: selectedAmount, // Use selected amount (1, 5, 10, or 100)
        to: universalAddress, // Send to Base Account address
        testnet: true
      });

      setPaymentId(id);
      setPaymentStatus(`✅ Step 1/3: BasePay successful! (You saw "+${selectedAmount} USDC" - that's normal) Now approving for campaign pledge...`);
      
      // Wait a moment for BasePay to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check USDC balance before approve
      setPaymentStatus(`🔍 Checking USDC balance before approve...`);
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
        setPaymentStatus(`❌ Balance check failed: ${error.message}`);
        return;
      }
      
      // Step 2: Approve USDC spending by the crowdfunding contract
      setPaymentStatus(`🔐 Step 2/3: Approving USDC spending...`);
      
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
      setPaymentStatus(`✅ Step 2/3: USDC approve sent! Waiting for confirmation...`);
      
      // Wait longer for approve transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 8000)); // Increased from 3 to 8 seconds
      
      // Verify that approve worked by checking allowance
      setPaymentStatus(`🔍 Verifying USDC approval...`);
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
        setPaymentStatus(`❌ Allowance verification failed: ${error.message}`);
        return;
      }
      
      setPaymentStatus(`✅ Step 2/3: USDC approved! Now pledging to campaign...`);
      
      // Step 3: Call pledge() function on crowdfunding contract
      setPaymentStatus(`🎯 Step 3/3: Pledging ${selectedAmount} USDC to "${campaign.title}"...`);
      
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

      setPaymentStatus(`🎉 Pledge successful! ${selectedAmount} USDC pledged to "${campaign.title}"`);
      
      // Refresh campaigns to show updated amounts - wait longer for blockchain confirmation
      if (campaignData.refetch) {
        setPaymentStatus(`🎉 Pledge successful! Refreshing campaign data...`);
        setTimeout(() => campaignData.refetch(), 5000); // Longer delay for blockchain confirmation
      }
      
    } catch (error) {
      console.error('BasePay pledge failed:', error);
      setPaymentStatus(`❌ Pledge failed: ${error.message}`);
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
      
      setPaymentStatus(`🎯 Pledging ${selectedAmount} USDC to "${campaign.title}" via BasePay...`);
      
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
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
        }
      }
      
      await provider.request({ method: 'eth_requestAccounts' });
      
      // Check current allowance first
      setPaymentStatus(`🔍 Checking USDC allowance...`);
      
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
        setPaymentStatus(`🔐 One-time USDC approval needed...`);
        
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
        
        setPaymentStatus(`✅ Approved! Now pledging...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Now pledge directly to campaign
      setPaymentStatus(`🎯 Pledging ${selectedAmount} USDC to "${campaign.title}"...`);
      
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
      setPaymentStatus(`🎉 Success! ${selectedAmount} USDC pledged to "${campaign.title}"`);
      
      // Refresh campaigns
      if (campaignData.refetch) {
        setTimeout(() => campaignData.refetch(), 3000);
      }
      
    } catch (error) {
      console.error('BasePay pledge failed:', error);
      setPaymentStatus(`❌ Pledge failed: ${error.message}`);
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
      
      setPaymentStatus(`Processing ${selectedAmount} USDC pledge to blockchain...`);

      // Call the real contract pledge function using Base Account!
      await writeContractAsync({
        address: getContractAddress(8453), // Base Mainnet
        abi: contractAbi,
        functionName: 'pledge',
        args: [Number(campaign.id), amountInWei],
        account: universalAddress, // Use Base Account address
        chain: { id: 8453 }, // Force Base Mainnet
      });

      setPaymentStatus('✅ Pledge successful!');

    } catch (error) {
      console.error('Direct pledge failed:', error);
      alert('Pledge failed: ' + error.message);
      setPaymentStatus('❌ Direct pledge failed');
    }
  };

  // Handle payment status check
  const handleCheckStatus = async () => {
    if (!paymentId) {
      setPaymentStatus('No payment ID found. Please make a payment first.');
      return;
    }

    try {
      const { status } = await getPaymentStatus({ id: paymentId });
      setPaymentStatus(`Payment status: ${status}`);
    } catch (error) {
      console.error('Status check failed:', error);
      setPaymentStatus('Status check failed');
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

  // Campaign creation logic moved to CreateCampaignButton component

  // Handle About donation (Buy us coffee)
  const handleAboutDonation = async () => {
    try {
      setPaymentStatus('Processing coffee donation...');
      
      const { id } = await pay({
        amount: '5', // 5 USDC for coffee
        to: '0xF1fa20027b6202bc18e4454149C85CB01dC91Dfd',
        testnet: true
      });

      setPaymentId(id);
      setPaymentStatus('☕ Thank you for buying us coffee! 5 USDC donated to Fundly team');
    } catch (error) {
      console.error('Coffee donation failed:', error);
      setPaymentStatus('❌ Coffee donation failed');
    }
  };

  // Unsplash API functions
  const fetchUnsplashImages = async (category) => {
    setLoadingImages(true);
    try {
      const searchTerms = {
        'Technology': 'technology innovation computer',
        'Environment': 'nature environment sustainability',
        'Education': 'education learning school',
        'Culture': 'culture art community',
        'Health': 'health medical healthcare',
        'Dreams': 'dreams aspiration hope future inspiration',
        'Goals': 'goals achievement success motivation challenge'
      };

      const searchTerm = searchTerms[category] || category;
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${searchTerm}&per_page=12&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      const data = await response.json();
      setUnsplashImages(data.results || []);
    } catch (error) {
      console.error('Failed to fetch Unsplash images:', error);
      setUnsplashImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleImageSelect = (image) => {
    setNewCampaign(prev => ({ ...prev, image: image.urls.regular }));
    setShowImagePicker(false);
    setImageSource('unsplash');
    // Trigger download as required by Unsplash API guidelines
    fetch(`https://api.unsplash.com/photos/${image.id}/download`, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    }).catch(console.error);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewCampaign(prev => ({ ...prev, image: e.target.result }));
        setImageSource('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const openImagePicker = () => {
    setShowImagePicker(true);
    fetchUnsplashImages(newCampaign.category);
  };

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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          💰 Fundly
        </div>
        
        {/* Navigation buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* Base Account Status */}
          <div style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
          }}>
            <div>
              {isSignedIn ? '🟢' : '🔴'} Base Account: {isSignedIn ? 'Connected' : 'Disconnected'}
            </div>
          </div>
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
                      setPaymentStatus('👋 Logged out successfully');
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
                <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '10px' }}>
                  {universalAddress.slice(0, 6)}...{universalAddress.slice(-4)}
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

              

              {paymentStatus && (
                <div style={{
                  ...styles.card,
                  backgroundColor: paymentStatus.includes('✅') ? 'rgba(40, 167, 69, 0.2)' : 
                                  paymentStatus.includes('❌') ? 'rgba(220, 53, 69, 0.2)' : 
                                  'rgba(255, 193, 7, 0.2)',
                  fontSize: '12px'
                }}>
                  {paymentStatus}
                </div>
              )}

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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '900px' }}>
            {filteredCampaigns.map(campaign => (
              <div key={campaign.id} style={{
                ...styles.card,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: dark ? '0 25px 80px rgba(0,0,0,0.2)' : '0 25px 80px rgba(0,0,0,0.1)'
                }
              }}>
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
                          
                          {/* BasePay Pledge */}
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
                    onChange={(e) => {
                      setNewCampaign(prev => ({ ...prev, category: e.target.value }));
                      // Refresh images if picker is open
                      if (showImagePicker) {
                        fetchUnsplashImages(e.target.value);
                      }
                    }}
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

              {/* Campaign Image Section */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '16px', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: dark ? '#f1f5f9' : '#1e293b'
                }}>
                  Campaign Image *
                </label>
                
                {newCampaign.image ? (
                  <div style={{ marginBottom: '16px' }}>
                    <img 
                      src={newCampaign.image}
                      alt="Campaign preview"
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '16px',
                        marginBottom: '16px',
                        border: `2px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ 
                        fontSize: '13px', 
                        opacity: 0.7,
                        color: dark ? '#94a3b8' : '#64748b',
                        flex: 1
                      }}>
                        {imageSource === 'upload' ? '📁 Your uploaded image' : '📸 From Unsplash'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        style={{
                          padding: '12px 20px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#059669';
                          e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#10b981';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        📁 Upload New
                      </label>
                      <button
                        type="button"
                        onClick={openImagePicker}
                        style={{
                          padding: '12px 20px',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#1d4ed8';
                          e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#2563eb';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        📸 Browse Unsplash
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCampaign(prev => ({ ...prev, image: '' }));
                          setImageSource('');
                        }}
                        style={{
                          padding: '12px 20px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#dc2626';
                          e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#ef4444';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr auto 1fr', 
                    gap: '16px',
                    alignItems: 'stretch'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="file-upload-main"
                      />
                      <label
                        htmlFor="file-upload-main"
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
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = dark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.12)';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = dark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.08)';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        📁 Upload Your Image
                        <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                          JPG, PNG, GIF up to 10MB
                        </div>
                      </label>
                    </div>
                    
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '700',
                      color: dark ? '#64748b' : '#94a3b8',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '120px'
                    }}>
                      OR
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <button
                        type="button"
                        onClick={openImagePicker}
                        style={{
                          width: '100%',
                          minHeight: '120px',
                          padding: '32px 20px',
                          borderRadius: '16px',
                          border: `2px dashed ${dark ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.4)'}`,
                          backgroundColor: dark ? 'rgba(37, 99, 235, 0.05)' : 'rgba(37, 99, 235, 0.08)',
                          color: dark ? '#60a5fa' : '#2563eb',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = dark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.12)';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = dark ? 'rgba(37, 99, 235, 0.05)' : 'rgba(37, 99, 235, 0.08)';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        📸 Choose from Unsplash
                        <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                          Professional photos for {newCampaign.category}
                        </div>
                      </button>
                    </div>
                  </div>
                )}
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
                  setPaymentStatus={setPaymentStatus}
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
            <h2 style={{ marginTop: 0, fontSize: '24px', marginBottom: '20px' }}>
              💰 About Fundly
            </h2>
            
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

      {/* Unsplash Image Picker Modal */}
      {showImagePicker && (
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
          zIndex: 1001
        }}>
          <div style={{
            ...styles.card,
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>
                📸 Choose Image - {newCampaign.category}
              </h3>
              <button
                onClick={() => setShowImagePicker(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: dark ? '#fff' : '#000'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => fetchUnsplashImages(newCampaign.category)}
                disabled={loadingImages}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  fontSize: '14px',
                  opacity: loadingImages ? 0.6 : 1
                }}
              >
                {loadingImages ? '⏳ Loading...' : '🔄 Refresh Images'}
              </button>
            </div>

            {loadingImages ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '200px',
                fontSize: '18px'
              }}>
                ⏳ Loading beautiful images...
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '12px',
                marginBottom: '20px'
              }}>
                {unsplashImages.map(image => (
                  <div 
                    key={image.id}
                    onClick={() => handleImageSelect(image)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    <img 
                      src={image.urls.small}
                      alt={image.alt_description || 'Unsplash image'}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <div style={{
                      padding: '8px',
                      backgroundColor: dark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                      fontSize: '10px',
                      lineHeight: '1.2'
                    }}>
                      Photo by{' '}
                      <a 
                        href={`https://unsplash.com/@${image.user.username}?utm_source=fundly&utm_medium=referral`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none' }}
                      >
                        {image.user.name}
                      </a>
                      {' '}on{' '}
                      <a 
                        href="https://unsplash.com/?utm_source=fundly&utm_medium=referral"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none' }}
                      >
                        Unsplash
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ 
              fontSize: '12px', 
              opacity: 0.7, 
              textAlign: 'center',
              padding: '16px',
              borderTop: `1px solid ${dark ? '#333' : '#eee'}`
            }}>
              Images provided by{' '}
              <a 
                href="https://unsplash.com/?utm_source=fundly&utm_medium=referral"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2563eb', textDecoration: 'none' }}
              >
                Unsplash
              </a>
              {' '}• Click any image to select
            </div>
          </div>
        </div>
      )}
       
    </div>
  );
}

export default App;