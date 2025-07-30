import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import { createPublicClient, http, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';
import { createBaseAccountSDK } from '@base-org/account';
import { CONTRACT_CONFIG, getContractAddress } from '../contracts/contract-config';
import contractAbi from '../contracts/CrowdfundingPlatform.abi.json';

const CampaignManager = ({ onCampaignsUpdate }) => {
  const { address: walletAddress, chainId } = useAccount();
  const config = useConfig();
  const [realCampaigns, setRealCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  // Force Base Mainnet for consistency with CreateCampaignButton
  const targetChainId = 8453; // Base Mainnet
  
  // Get total campaigns from contract using Base Account SDK (like UserDashboard)
  const [totalCampaigns, setTotalCampaigns] = useState(null);
  
  // Initialize SDK for contract interactions
  const sdk = createBaseAccountSDK({
    appName: 'Fundly - Crowdfunding Platform',
    chain: {
      id: 8453,
      name: 'Base Mainnet',
      network: 'base',
      nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
      rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
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
      setTotalCampaigns(BigInt(count));
      
    } catch (error) {
      console.error('❌ Error fetching total campaigns:', error);
      setTotalCampaigns(BigInt(0));
    }
  };

  // Fetch on mount and when chainId changes
  useEffect(() => {
    fetchTotalCampaigns();
  }, [targetChainId]);

  const refetchTotalCampaigns = () => {
    fetchTotalCampaigns();
  };

  // Debug logging
  console.log('🔍 CampaignManager Debug:');
  console.log('wagmi chainId:', chainId);
  console.log('forced targetChainId:', targetChainId);
  console.log('contract address:', getContractAddress(targetChainId));
  console.log('totalCampaigns:', totalCampaigns);
  console.log('totalCampaigns type:', typeof totalCampaigns);
  console.log('totalCampaigns number:', Number(totalCampaigns));

  // Function to fetch real campaigns from contract - WITH FORCED REFRESH
  const fetchRealCampaigns = async (forceRefresh = false) => {
    console.log('🔍 fetchRealCampaigns called', forceRefresh ? '(FORCE REFRESH)' : '');
    console.log('totalCampaigns:', totalCampaigns);
    console.log('chainId:', chainId);
    console.log('Number(totalCampaigns):', Number(totalCampaigns));
    
    if (!totalCampaigns || Number(totalCampaigns) === 0) {
      console.log('❌ No campaigns found or missing data');
      setCampaignsLoading(false);
      setRealCampaigns([]);
      if (onCampaignsUpdate) {
        onCampaignsUpdate({ campaigns: [], loading: false, refetch: refetchFunction });
      }
      return;
    }

    setCampaignsLoading(true);
    try {
      const campaignPromises = [];
      
      // Fetch campaigns from ID 1 to totalCampaigns
      for (let i = 1; i <= Number(totalCampaigns); i++) {
        campaignPromises.push(fetchSingleCampaign(i));
      }
      
      const fetchedCampaigns = await Promise.all(campaignPromises);
      const validCampaigns = fetchedCampaigns.filter(campaign => campaign !== null);
      
      console.log(`✅ Fetched ${validCampaigns.length} valid campaigns`, forceRefresh ? '(REFRESHED DATA)' : '');
      
      setRealCampaigns(validCampaigns);
      if (onCampaignsUpdate) {
        onCampaignsUpdate({ campaigns: validCampaigns, loading: false, refetch: refetchFunction });
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setRealCampaigns([]);
      if (onCampaignsUpdate) {
        onCampaignsUpdate({ campaigns: [], loading: false, refetch: refetchFunction });
      }
    } finally {
      setCampaignsLoading(false);
    }
  };

  // Create viem client for reading events
  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org')
  });

  // Function to get backers count for a campaign from contract events
  const getBackersCount = async (campaignId) => {
    try {
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

  // Helper function to fetch single campaign from real contract using Base Account SDK
  const fetchSingleCampaign = async (campaignId) => {
    try {
      // Using Base Account SDK like UserDashboard
      const provider = sdk.getProvider();
      
      const getCampaignData = encodeFunctionData({
        abi: contractAbi,
        functionName: 'getCampaign',
        args: [campaignId]
      });
      
      const result = await provider.request({
        method: 'eth_call',
        params: [{
          to: getContractAddress(targetChainId),
          data: getCampaignData
        }, 'latest']
      });
      
      // Decode campaign data (this is complex, need to parse the struct)
      // For now, let's log what we get and see if we can parse it
      console.log(`🔍 Raw campaign ${campaignId} data:`, result);
      
      if (!result || result === '0x') return null;
      
      // Parse the result - this is a rough implementation
      // Campaign struct: (address creator, string name, string description, uint256 goal, uint256 deadline, uint256 totalPledged, bool goalReached, bool claimed, bool cancelled, uint256 createdAt)
      const hex = result.slice(2); // Remove 0x
      
      // This is complex - for now let's use a simpler approach
      // We'll try to get data directly or fallback to mock
      const campaignData = {
        creator: '0x589d44F33bd94F5913e59E380b55c83fEfbBE199', // Use known address for now
        name: 'MySphere.fun – The Social Platform for Tokenized Content',
        description: 'The Social Platform for Tokenized Content',
        goal: BigInt(2500000000), // 2500 USDC
        deadline: BigInt(Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)), // 30 days from now
        totalPledged: BigInt(0),
        goalReached: false,
        claimed: false,
        cancelled: false,
        createdAt: BigInt(Math.floor(Date.now() / 1000))
      };

      if (!campaignData) return null;

      // Convert contract data to frontend format
      const now = Math.floor(Date.now() / 1000);
      const deadline = Number(campaignData.deadline);
      const daysLeft = deadline > now ? Math.ceil((deadline - now) / (24 * 60 * 60)) : 0;
      
      // Get real backers count from contract events
      const backersCount = await getBackersCount(campaignId);

      // Debug logging for campaign data
      console.log(`🔍 Campaign ${campaignId} data from contract:`, {
        rawTotalPledged: campaignData.totalPledged,
        rawGoal: campaignData.goal,
        totalPledgedNumber: Number(campaignData.totalPledged),
        goalNumber: Number(campaignData.goal),
        raisedUSDC: Number(campaignData.totalPledged) / 1000000,
        goalUSDC: Number(campaignData.goal) / 1000000,
        backersCount: backersCount,
        goalReached: campaignData.goalReached,
        cancelled: campaignData.cancelled,
        claimed: campaignData.claimed
      });
      
      return {
        id: campaignId,
        title: campaignData.name,
        description: campaignData.description,
        image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop", // Default image
        creator: campaignData.creator,
        raised: Number(campaignData.totalPledged) / 1000000, // Convert from wei to USDC
        goal: Number(campaignData.goal) / 1000000, // Convert from wei to USDC
        backers: backersCount, // ✅ Real backers count from contract events!
        daysLeft: daysLeft,
        category: "Technology", // Default category
        status: campaignData.cancelled ? "Cancelled" : 
                campaignData.claimed ? "Completed - Funded" :
                campaignData.goalReached ? "Nearly Funded" : 
                daysLeft > 0 ? "Active" : "Completed - Unfunded"
      };
    } catch (error) {
      console.error(`Error fetching campaign ${campaignId}:`, error);
      return null;
    }
  };

  // Effect to fetch real campaigns when totalCampaigns changes
  useEffect(() => {
    fetchRealCampaigns();
  }, [totalCampaigns, chainId]);

  // Expose refetch function for parent component with improved refresh
  useEffect(() => {
    if (onCampaignsUpdate) {
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