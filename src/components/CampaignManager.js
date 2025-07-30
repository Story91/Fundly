import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACT_CONFIG, getContractAddress } from '../contracts/contract-config';
import contractAbi from '../contracts/CrowdfundingPlatform.abi.json';

const CampaignManager = ({ onCampaignsUpdate }) => {
  const { address: walletAddress, chainId } = useAccount();
  const config = useConfig();
  const [realCampaigns, setRealCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  // Force Base Sepolia for consistency with CreateCampaignButton
  const targetChainId = 84532; // Base Sepolia
  
  // Get total campaigns from contract
  const { data: totalCampaigns, refetch: refetchTotalCampaigns } = useReadContract({
    address: getContractAddress(targetChainId),
    abi: contractAbi,
    functionName: 'campaignCount',
    enabled: true, // Always enabled for Base Sepolia
  });

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
    chain: baseSepolia,
    transport: http('https://sepolia.base.org')
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

  // Helper function to fetch single campaign from real contract
  const fetchSingleCampaign = async (campaignId) => {
    try {
      // Using the contract's getCampaign function to get real data
      const campaignData = await readContract(config, {
        address: getContractAddress(targetChainId),
        abi: contractAbi,
        functionName: 'getCampaign',
        args: [campaignId],
      });

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