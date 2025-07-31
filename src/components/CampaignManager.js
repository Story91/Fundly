import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import { createPublicClient, http, encodeFunctionData, decodeAbiParameters } from 'viem';
import { base } from 'viem/chains';
import { createBaseAccountSDK } from '@base-org/account';
import { CONTRACT_CONFIG, getContractAddress } from '../contracts/contract-config';
import contractAbi from '../contracts/CrowdfundingPlatform.abi.json';
import { getCampaignMetadata } from '../lib/firebase';

const CampaignManager = ({ onCampaignsUpdate }) => {
  console.log('🚀🚀🚀 CampaignManager COMPONENT LOADED!!! 🚀🚀🚀');
  
  const { address: walletAddress, chainId } = useAccount();
  const config = useConfig();
  const [realCampaigns, setRealCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  // Force Base Mainnet for consistency with CreateCampaignButton
  const targetChainId = 8453; // Base Mainnet
  
  // Get total campaigns from contract using Base Account SDK (like UserDashboard)
  const [totalCampaigns, setTotalCampaigns] = useState(null);
  
  // Use Alchemy RPC if available for better performance
  const alchemyBaseRpcUrl = process.env.REACT_APP_ALCHEMY_BASE_RPC_URL;
  const rpcUrl = alchemyBaseRpcUrl || 'https://mainnet.base.org';
  
  console.log('🔧 CampaignManager RPC:', alchemyBaseRpcUrl ? 'ALCHEMY (fast)' : 'PUBLIC (slower)');
  
  // Initialize SDK for contract interactions
  const sdk = createBaseAccountSDK({
    appName: 'Fundly - Crowdfunding Platform',
    chain: {
      id: 8453,
      name: 'Base Mainnet',
      network: 'base',
      nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
      rpcUrls: { default: { http: [rpcUrl] } },
      blockExplorers: { default: { name: 'BaseScan', url: 'https://basescan.org' } },
    },
  });

  // Fetch total campaigns using Base Account SDK
  const fetchTotalCampaigns = async () => {
    try {
      const provider = sdk.getProvider();
      
      const campaignCountData = encodeFunctionData({
        abi: contractAbi,
        functionName: 'campaignCount',
        args: []
      });
      
      const result = await provider.request({
        method: 'eth_call',
        params: [{
          to: getContractAddress(targetChainId),
          data: campaignCountData
        }, 'latest']
      });
      
      // Decode result (uint256 -> number)
      const count = parseInt(result, 16);
      console.log('📊 Total campaigns from Base Account SDK:', count);
      console.log('📊 Setting totalCampaigns to:', count, 'type:', typeof count);
      setTotalCampaigns(count); // Use number instead of BigInt for simplicity
      
    } catch (error) {
      console.error('❌ Error fetching total campaigns:', error);
      setTotalCampaigns(0); // Use number instead of BigInt
    }
  };

  // SUPER FAST PARALLEL LOADING - like refetch!
  useEffect(() => {
    console.log('🚀 CampaignManager mounted - PARALLEL FAST LOADING!');
    
    // Start parallel loading strategy
    startFastParallelLoading();
    
  }, []); // No dependencies - always fetch on mount
  
  // Also fetch when chainId changes (but not required for initial load)
  useEffect(() => {
    if (chainId) {
      console.log('🔄 ChainId changed, refetching campaigns');
      fetchTotalCampaigns();
    }
  }, [chainId]);

  const refetchTotalCampaigns = () => {
    fetchTotalCampaigns();
  };

  // FAST PARALLEL LOADING STRATEGY - like refetch but without waiting for totalCampaigns
  const startFastParallelLoading = async () => {
    console.log('⚡ FAST PARALLEL LOADING START');
    setCampaignsLoading(true);
    
    try {
      // STRATEGY: Parallel fetch totalCampaigns AND speculative campaign loading
      // Don't wait for totalCampaigns - start fetching campaigns immediately!
      
      console.log('🎯 PARALLEL STRATEGY: fetch totalCampaigns + speculative campaigns');
      
      // 1. Start fetching totalCampaigns (don't await - parallel!)
      const totalPromise = fetchTotalCampaigns();
      
      // 2. Speculatively fetch first 10 campaigns (most apps have < 10 campaigns)
      // This is the key optimization - don't wait for totalCampaigns!
      const speculativeCampaigns = [];
      const maxSpeculative = 20; // Fetch first 20 campaigns speculatively
      
      console.log(`🚀 Starting speculative fetch of first ${maxSpeculative} campaigns...`);
      const startTime = Date.now();
      
      // Create parallel promises for first N campaigns
      const campaignPromises = [];
      for (let i = 1; i <= maxSpeculative; i++) {
        campaignPromises.push(
          fetchSingleCampaignFast(i).catch(error => {
            console.log(`Campaign ${i} not found (expected):`, error.message);
            return null; // Return null for non-existent campaigns
          })
        );
      }
      
      // Execute all campaign fetches in parallel
      console.log(`⚡ Executing ${campaignPromises.length} parallel campaign fetches...`);
      const results = await Promise.all(campaignPromises);
      
      // Filter out null results (non-existent campaigns)
      const validCampaigns = results.filter(campaign => campaign !== null);
      
      const endTime = Date.now();
      console.log(`🎯 PARALLEL STRATEGY COMPLETE: ${validCampaigns.length} campaigns in ${endTime - startTime}ms`);
      
      // Update immediately with found campaigns
      setRealCampaigns(validCampaigns);
      setCampaignsLoading(false);
      
      // Wait for totalCampaigns to complete (for accuracy)
      await totalPromise;
      console.log(`📊 TotalCampaigns confirmed: ${totalCampaigns} (speculative found: ${validCampaigns.length})`);
      
    } catch (error) {
      console.error('❌ Fast parallel loading failed:', error);
      setCampaignsLoading(false);
      setRealCampaigns([]);
    }
  };

  // Debug logging
  console.log('🔍 CampaignManager Debug:');
  console.log('wagmi chainId:', chainId);
  console.log('forced targetChainId:', targetChainId);
  console.log('contract address:', getContractAddress(targetChainId));
  console.log('totalCampaigns:', totalCampaigns);
  console.log('totalCampaigns type:', typeof totalCampaigns);

  // Function to fetch real campaigns from contract - WITH FORCED REFRESH
  const fetchRealCampaigns = async (forceRefresh = false) => {
    console.log('🚀 fetchRealCampaigns START', forceRefresh ? '(FORCE REFRESH)' : '');
    console.log('totalCampaigns:', totalCampaigns);
    console.log('chainId:', chainId);
    
    if (!totalCampaigns || totalCampaigns === 0) {
      console.log('❌ No campaigns found or missing data - totalCampaigns:', totalCampaigns);
      setCampaignsLoading(false);
      setRealCampaigns([]);
      // DON'T call onCampaignsUpdate manually - let useEffect handle it
      return;
    }

    setCampaignsLoading(true);
    console.log(`⏳ Starting FAST fetch ${totalCampaigns} campaigns (without backers)...`);
    
    try {
      // PHASE 1: Fast fetch WITHOUT backers (like UserDashboard)
      const campaignPromises = [];
      
      const totalCount = totalCampaigns; // Already a number now
      console.log(`🔢 Will fetch campaigns from 1 to ${totalCount}`);
      
      for (let i = 1; i <= totalCount; i++) {
        console.log(`📋 Queuing FAST fetch for campaign ${i}`);
        const promise = fetchSingleCampaignFast(i);
        campaignPromises.push(promise);
        console.log(`📋 Added promise for campaign ${i} to queue`);
      }
      
      console.log(`📋 Total promises created: ${campaignPromises.length}`);
      
      console.log(`⚡ Executing ${campaignPromises.length} FAST parallel fetches...`);
      const startTime = Date.now();
      
      const fetchedCampaigns = await Promise.all(campaignPromises);
      const validCampaigns = fetchedCampaigns.filter(campaign => campaign !== null);
      
      const endTime = Date.now();
      console.log(`🚀 PHASE 1 COMPLETE: Fast fetch ${validCampaigns.length} campaigns in ${endTime - startTime}ms (NO BACKERS)`);
      
      // Send fast results immediately
      setRealCampaigns(validCampaigns);
      // DON'T change setCampaignsLoading here - still loading for Phase 2
      // DON'T call onCampaignsUpdate manually - let useEffect handle it
      
      // DONE! No Phase 2 for now - just show campaigns with backers: 0
      console.log(`✅ SKIPPING backers count for now - campaigns visible immediately!`);
      setCampaignsLoading(false); // This will trigger useEffect
      // DON'T call onCampaignsUpdate manually - let useEffect handle it
      
      // TODO: Add backers counting in background later
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setRealCampaigns([]);
      setCampaignsLoading(false); // This will trigger useEffect
      // DON'T call onCampaignsUpdate manually - let useEffect handle it
    }
  };

  // Create viem client for reading events - use Alchemy if available
  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl) // Use same optimized RPC as SDK
  });

  // Function to get backers count for a campaign from contract events
  const getBackersCount = async (campaignId) => {
    try {
      console.log(`📊 Searching for Pledged events for campaign ${campaignId}...`);
      // Get all Pledged events for this campaign
      const pledgeEvents = await publicClient.getLogs({
        address: getContractAddress(targetChainId),
        event: {
          type: 'event',
          name: 'Pledged',
          inputs: [
            { type: 'uint256', name: 'campaignId', indexed: true },
            { type: 'address', name: 'backer', indexed: true },
            { type: 'uint256', name: 'amount' }
          ]
        },
        args: {
          campaignId: BigInt(campaignId)
        },
        fromBlock: 'earliest',
        toBlock: 'latest'
      });

      console.log(`📊 Found ${pledgeEvents.length} Pledged events for campaign ${campaignId}`);

      // Count unique backers (addresses)
      const uniqueBackers = new Set();
      pledgeEvents.forEach(event => {
        if (event.args && event.args.backer) {
          uniqueBackers.add(event.args.backer.toLowerCase());
        }
      });

      const backersCount = uniqueBackers.size;
      console.log(`📊 Campaign ${campaignId} has ${backersCount} unique backers from ${pledgeEvents.length} pledges`);
      
      return backersCount;
    } catch (error) {
      console.error(`Error getting backers for campaign ${campaignId}:`, error);
      return 0;
    }
  };

  // Create refetch function 
  const refetchFunction = async () => {
    console.log('🔄 Manual refetch triggered');
    await refetchTotalCampaigns();
    // Force a fresh fetch after delay to allow blockchain to update
    setTimeout(() => {
      fetchRealCampaigns(true); // Force refresh
    }, 3000);
  };

  // Helper function to fetch single campaign FAST with Firebase metadata integration
  const fetchSingleCampaignFast = async (campaignId) => {
    const campaignStart = Date.now();
    console.log(`🚀 Starting FAST fetch for campaign ${campaignId} with Firebase metadata...`);
    
    try {
      // Fetch blockchain data using wagmi readContract
      console.log(`📋 Fetching campaign ${campaignId} from blockchain...`);
      const campaignData = await readContract(config, {
        address: getContractAddress(targetChainId), // Use targetChainId not chainId
        abi: contractAbi,
        functionName: 'getCampaign',
        args: [campaignId],
        chainId: targetChainId, // Force Base Mainnet
      });

      // Convert contract data to frontend format
      const now = Math.floor(Date.now() / 1000);
      const deadline = Number(campaignData.deadline);
      const daysLeft = deadline > now ? Math.ceil((deadline - now) / (24 * 60 * 60)) : 0;
      
      // Fetch metadata from Firebase in parallel
      console.log(`🔥 Fetching Firebase metadata for campaign ${campaignId}...`);
      const metadata = await getCampaignMetadata(campaignId);
      console.log(`🔥 Firebase metadata for campaign ${campaignId}:`, metadata);
      
      const campaign = {
        id: Number(campaignId),
        title: campaignData.name,
        description: campaignData.description,
        // Use Firebase image if available, otherwise default
        image: metadata?.image_blob_url || "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop",
        creator: campaignData.creator,
        raised: Number(campaignData.totalPledged) / 1000000, // Convert from wei to USDC
        goal: Number(campaignData.goal) / 1000000, // Convert from wei to USDC
        backers: 0, // ⚡ NO BACKERS COUNT initially - will be updated in Phase 2!
        daysLeft: daysLeft,
        category: "Technology", // Default category
        status: campaignData.cancelled ? "Cancelled" : 
                campaignData.claimed ? "Completed - Funded" :
                campaignData.goalReached ? "Nearly Funded" : 
                daysLeft > 0 ? "Active" : "Completed - Unfunded",
        // Add metadata fields for display
        metadata: metadata ? {
          twitterUrl: metadata.twitter_url,
          websiteUrl: metadata.website_url,
          extendedDescription: metadata.extended_description,
          imageUrl: metadata.image_blob_url,
          additionalImages: metadata.additional_images || [],
          creatorNick: metadata.creator_nick || ''
        } : null
      };
      
      const campaignEnd = Date.now();
      console.log(`🚀 FAST Campaign ${campaignId} fetch complete in ${campaignEnd - campaignStart}ms`);
      console.log(`🚀 FAST Campaign result:`, { 
        id: campaign.id, 
        title: campaign.title, 
        raised: campaign.raised, 
        status: campaign.status,
        hasMetadata: !!metadata,
        hasCustomImage: !!metadata?.image_blob_url
      });
      
      return campaign;
    } catch (error) {
      console.error(`Error in FAST fetch campaign ${campaignId}:`, error);
      return null;
    }
  };

  // Helper function to fetch single campaign from real contract using Base Account SDK
  const fetchSingleCampaign = async (campaignId) => {
    const campaignStart = Date.now();
    console.log(`🔍 Starting fetch for campaign ${campaignId}...`);
    
    try {
      // Use Base Account SDK like fetchTotalCampaigns (not wagmi due to chainId undefined issue)
      const sdk = createBaseAccountSDK({
        apiKey: '99f4b7d0-b2fb-4e0e-b9a3-c3b2c6b6b6a3',
        chain: { id: targetChainId, name: 'base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://mainnet.base.org'] } } }
      });

      // Encode getCampaign function call
      const getCampaignData = encodeFunctionData({
        abi: contractAbi,
        functionName: 'getCampaign',
        args: [BigInt(campaignId)]
      });

      // Call contract via Base Account SDK
      const result = await sdk.getProvider().request({
        method: 'eth_call',
        params: [{
          to: getContractAddress(targetChainId),
          data: getCampaignData
        }, 'latest']
      });

      // Decode the result using proper ABI decoding
      const decodedResult = decodeAbiParameters([
        { name: 'creator', type: 'address' },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'goal', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'totalPledged', type: 'uint256' },
        { name: 'goalReached', type: 'bool' },
        { name: 'claimed', type: 'bool' },
        { name: 'cancelled', type: 'bool' },
        { name: 'createdAt', type: 'uint256' }
      ], result);

      const simpleData = {
        creator: decodedResult[0],
        name: decodedResult[1] || `Campaign ${campaignId}`,
        description: decodedResult[2] || 'Real campaign from Base Mainnet contract',
        goal: decodedResult[3],
        deadline: decodedResult[4],
        totalPledged: decodedResult[5],
        goalReached: decodedResult[6],
        claimed: decodedResult[7],
        cancelled: decodedResult[8],
        createdAt: decodedResult[9]
      };

      console.log(`🔍 REAL Campaign ${campaignId} data from contract:`, simpleData);

      if (!simpleData) return null;

      // Convert contract data to frontend format
      const now = Math.floor(Date.now() / 1000);
      const deadline = Number(simpleData.deadline);
      const daysLeft = deadline > now ? Math.ceil((deadline - now) / (24 * 60 * 60)) : 0;
      
      // Get real backers count from contract events
      const backersStart = Date.now();
      console.log(`👥 Getting backers count for campaign ${campaignId}...`);
      const backersCount = await getBackersCount(campaignId);
      const backersEnd = Date.now();
      console.log(`👥 Got ${backersCount} backers for campaign ${campaignId} in ${backersEnd - backersStart}ms`);

      // Debug logging for campaign data
      console.log(`🔍 Campaign ${campaignId} data from contract:`, {
        rawTotalPledged: simpleData.totalPledged,
        rawGoal: simpleData.goal,
        totalPledgedNumber: Number(simpleData.totalPledged),
        goalNumber: Number(simpleData.goal),
        raisedUSDC: Number(simpleData.totalPledged) / 1000000,
        goalUSDC: Number(simpleData.goal) / 1000000,
        backersCount: backersCount,
        goalReached: simpleData.goalReached,
        cancelled: simpleData.cancelled,
        claimed: simpleData.claimed
      });
      
      const campaignData = {
        id: campaignId,
        title: simpleData.name,
        description: simpleData.description,
        image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop", // Default image
        creator: simpleData.creator,
        raised: Number(simpleData.totalPledged) / 1000000, // Convert from wei to USDC
        goal: Number(simpleData.goal) / 1000000, // Convert from wei to USDC
        backers: backersCount, // ✅ Real backers count from contract events!
        daysLeft: daysLeft,
        category: "Technology", // Default category
        status: simpleData.cancelled ? "Cancelled" : 
                simpleData.claimed ? "Completed - Funded" :
                simpleData.goalReached ? "Nearly Funded" : 
                daysLeft > 0 ? "Active" : "Completed - Unfunded"
      };
      
      const campaignEnd = Date.now();
      console.log(`✅ Campaign ${campaignId} fetch complete in ${campaignEnd - campaignStart}ms`);
      
      return campaignData;
    } catch (error) {
      console.error(`Error fetching campaign ${campaignId}:`, error);
      return null;
    }
  };

  // Effect to fetch real campaigns when totalCampaigns changes
  useEffect(() => {
    console.log('🔥 useEffect [totalCampaigns, chainId] triggered!');
    console.log('totalCampaigns:', totalCampaigns, 'type:', typeof totalCampaigns);
    console.log('chainId:', chainId);
    console.log('Will call fetchRealCampaigns...');
    fetchRealCampaigns();
  }, [totalCampaigns, chainId]);

  // Initial update on mount - send initial state
  useEffect(() => {
    console.log('🚀 CampaignManager MOUNTED - sending initial state to App.js');
    if (onCampaignsUpdate) {
      onCampaignsUpdate({ 
        campaigns: [], 
        loading: true,
        refetch: refetchFunction
      });
    }
  }, []); // Only on mount

  // Updates when data changes - but avoid duplicate manual calls
  useEffect(() => {
    console.log('🔄 useEffect triggered with:', { campaigns: realCampaigns.length, loading: campaignsLoading });
    // Only use useEffect, don't call onCampaignsUpdate manually in fetchRealCampaigns
    // This prevents duplicate/conflicting calls
    if (onCampaignsUpdate) {
      console.log('📡 useEffect sending to App.js:', { campaigns: realCampaigns.length, loading: campaignsLoading });
      onCampaignsUpdate({ 
        campaigns: realCampaigns, 
        loading: campaignsLoading,
        refetch: refetchFunction
      });
    }
  }, [realCampaigns, campaignsLoading]);

  return null; // This is a logic-only component
};

export default CampaignManager;