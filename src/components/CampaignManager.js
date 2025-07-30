import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import { CONTRACT_CONFIG, getContractAddress } from '../contracts/contract-config';
import contractAbi from '../contracts/CrowdfundingPlatform.abi.json';

const CampaignManager = ({ onCampaignsUpdate }) => {
  const { address: walletAddress, chainId } = useAccount();
  const config = useConfig();
  const [realCampaigns, setRealCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  // Get total campaigns from contract
  const { data: totalCampaigns, refetch: refetchTotalCampaigns } = useReadContract({
    address: chainId ? getContractAddress(chainId) : undefined,
    abi: contractAbi,
    functionName: 'campaignCount',
    enabled: !!chainId,
  });

  // Function to fetch real campaigns from contract
  const fetchRealCampaigns = async () => {
    if (!totalCampaigns || !chainId || Number(totalCampaigns) === 0) {
      setCampaignsLoading(false);
      setRealCampaigns([]);
      if (onCampaignsUpdate) {
        onCampaignsUpdate({ campaigns: [], loading: false });
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
      
      setRealCampaigns(validCampaigns);
      if (onCampaignsUpdate) {
        onCampaignsUpdate({ campaigns: validCampaigns, loading: false });
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setRealCampaigns([]);
      if (onCampaignsUpdate) {
        onCampaignsUpdate({ campaigns: [], loading: false });
      }
    } finally {
      setCampaignsLoading(false);
    }
  };

  // Helper function to fetch single campaign from real contract
  const fetchSingleCampaign = async (campaignId) => {
    try {
      // Using the contract's getCampaign function to get real data
      const campaignData = await readContract(config, {
        address: getContractAddress(chainId),
        abi: contractAbi,
        functionName: 'getCampaign',
        args: [campaignId],
      });

      if (!campaignData) return null;

      // Convert contract data to frontend format
      const now = Math.floor(Date.now() / 1000);
      const deadline = Number(campaignData.deadline);
      const daysLeft = deadline > now ? Math.ceil((deadline - now) / (24 * 60 * 60)) : 0;
      
      return {
        id: campaignId,
        title: campaignData.name,
        description: campaignData.description,
        image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop", // Default image
        creator: campaignData.creator,
        raised: Number(campaignData.totalPledged) / 1000000, // Convert from wei to USDC
        goal: Number(campaignData.goal) / 1000000, // Convert from wei to USDC
        backers: 0, // TODO: Calculate from contract events
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

  // Expose refetch function for parent component
  useEffect(() => {
    if (onCampaignsUpdate) {
      onCampaignsUpdate({ 
        campaigns: realCampaigns, 
        loading: campaignsLoading,
        refetch: () => {
          refetchTotalCampaigns();
          setTimeout(fetchRealCampaigns, 2000);
        }
      });
    }
  }, [realCampaigns, campaignsLoading]);

  return null; // This is a logic-only component
};

export default CampaignManager;