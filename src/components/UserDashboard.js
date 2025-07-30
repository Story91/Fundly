import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import { createBaseAccountSDK } from '@base-org/account';
import { encodeFunctionData } from 'viem';
import { CONTRACT_CONFIG, getContractAddress } from '../contracts/contract-config';
import contractAbi from '../contracts/CrowdfundingPlatform.abi.json';

const UserDashboard = ({ styles, dark, isSignedIn, universalAddress }) => {
  const { chainId } = useAccount();
  const config = useConfig();
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // Track which action is loading

  // Force Base Mainnet for consistency with main app
  const targetChainId = 8453; // Base Mainnet
  
  // Initialize SDK for contract interactions
  const sdk = createBaseAccountSDK({
    appName: 'Fundly - Crowdfunding Platform',
        chain: {
      id: 8453,
      name: 'Base Mainnet', 
      network: 'base',
      nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
      rpcUrls: { default: { http: [process.env.REACT_APP_ALCHEMY_BASE_RPC_URL || 'https://mainnet.base.org'] } },
      blockExplorers: { default: { name: 'BaseScan', url: 'https://basescan.org' } },
    },
  });
  
  // Debug logging
  console.log('🔍 UserDashboard Debug:');
  console.log('wagmi chainId:', chainId);
  console.log('forced targetChainId:', targetChainId);
  console.log('universalAddress:', universalAddress);
  console.log('isSignedIn:', isSignedIn);

  // Alternative: Get user's campaign IDs directly via Base Account SDK (more reliable)
  const [userCampaignIds, setUserCampaignIds] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  const fetchUserCampaignIds = async () => {
    if (!universalAddress || !isSignedIn) {
      setUserCampaignIds([]);
      return;
    }
    
    try {
      console.log('🔍 Fetching user campaign IDs via Base Account SDK...');
      const provider = sdk.getProvider();
      
      const getUserCampaignsData = encodeFunctionData({
        abi: contractAbi,
        functionName: 'getUserCampaigns',
        args: [universalAddress]
      });
      
      const result = await provider.request({
        method: 'eth_call',
        params: [{
          to: getContractAddress(targetChainId),
          data: getUserCampaignsData
        }, 'latest']
      });
      
      // Decode the result (array of campaign IDs)
      // This is a simple array decode - each uint256 is 32 bytes
      const hex = result.slice(2); // Remove 0x
      const ids = [];
      
      // First 64 chars are offset and length
      const lengthHex = hex.slice(64, 128);
      const length = parseInt(lengthHex, 16);
      
      console.log(`📋 User has ${length} campaigns`);
      
      for (let i = 0; i < length; i++) {
        const idHex = hex.slice(128 + i * 64, 128 + (i + 1) * 64);
        const id = parseInt(idHex, 16);
        ids.push(BigInt(id));
      }
      
      console.log('📋 User campaign IDs:', ids);
      setUserCampaignIds(ids);
      
    } catch (error) {
      console.error('❌ Error fetching user campaign IDs:', error);
      setUserCampaignIds([]);
    }
  };
  
  const refetch = () => {
    console.log('🔄 Manual refetch triggered');
    setRefetchTrigger(prev => prev + 1);
  };

  // Fetch detailed campaign data
  const fetchUserCampaigns = async () => {
    console.log('📋 fetchUserCampaigns called');
    console.log('userCampaignIds:', userCampaignIds);
    console.log('userCampaignIds length:', userCampaignIds?.length);
    
    if (!userCampaignIds || userCampaignIds.length === 0) {
      console.log('❌ No userCampaignIds found');
      setUserCampaigns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const campaignPromises = userCampaignIds.map(async (campaignId) => {
        console.log(`📋 Fetching campaign ${campaignId} for user`);
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
        
        const campaign = {
          id: Number(campaignId),
          title: campaignData.name,
          description: campaignData.description,
          creator: campaignData.creator,
          raised: Number(campaignData.totalPledged) / 1000000, // Convert from wei to USDC
          goal: Number(campaignData.goal) / 1000000, // Convert from wei to USDC
          daysLeft: daysLeft,
          status: campaignData.cancelled ? "Cancelled" : 
                  campaignData.claimed ? "Completed - Funded" :
                  campaignData.goalReached ? "Nearly Funded" : 
                  daysLeft > 0 ? "Active" : "Completed - Unfunded",
          progress: (Number(campaignData.totalPledged) / Number(campaignData.goal)) * 100,
          canClaim: campaignData.goalReached && !campaignData.claimed && daysLeft <= 0,
          canCancel: !campaignData.cancelled && !campaignData.claimed && daysLeft > 0 && Number(campaignData.totalPledged) === 0
        };
        
        console.log(`✅ User campaign ${campaignId}:`, {
          title: campaign.title,
          creator: campaign.creator,
          raised: campaign.raised,
          goal: campaign.goal,
          status: campaign.status
        });
        
        return campaign;
      });

      const campaigns = await Promise.all(campaignPromises);
      console.log(`🎯 Total user campaigns loaded: ${campaigns.length}`);
      setUserCampaigns(campaigns);
    } catch (error) {
      console.error('❌ Error fetching user campaigns:', error);
      setUserCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user campaign IDs when component mounts or refetch is triggered
  useEffect(() => {
    fetchUserCampaignIds();
  }, [universalAddress, isSignedIn, refetchTrigger]);

  useEffect(() => {
    console.log('🔄 useEffect triggered - userCampaignIds changed:', userCampaignIds);
    if (userCampaignIds && userCampaignIds.length >= 0) {
      fetchUserCampaigns();
    }
  }, [userCampaignIds, targetChainId]); // Use targetChainId instead of chainId

  // Claim funds for successful campaign
  const handleClaimFunds = async (campaign) => {
    if (!universalAddress) return;
    
    setActionLoading(`claim-${campaign.id}`);
    try {
      const provider = sdk.getProvider();
      await provider.request({ method: 'eth_requestAccounts' });
      
      const claimData = encodeFunctionData({
        abi: contractAbi,
        functionName: 'claimFunds',
        args: [campaign.id]
      });
      
      await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: universalAddress,
          to: getContractAddress(targetChainId),
          data: claimData,
          gas: '0x76c0',
        }]
      });
      
      console.log(`✅ Funds claimed for campaign ${campaign.id}`);
      
      // Refresh campaigns after claim
      setTimeout(() => {
        refetch();
        fetchUserCampaigns();
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error claiming funds:', error);
      alert('Failed to claim funds: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };
  
  // Cancel campaign
  const handleCancelCampaign = async (campaign) => {
    if (!universalAddress) return;
    
    if (!window.confirm(`Are you sure you want to cancel "${campaign.title}"? This cannot be undone.`)) {
      return;
    }
    
    setActionLoading(`cancel-${campaign.id}`);
    try {
      const provider = sdk.getProvider();
      await provider.request({ method: 'eth_requestAccounts' });
      
      const cancelData = encodeFunctionData({
        abi: contractAbi,
        functionName: 'cancelCampaign',
        args: [campaign.id]
      });
      
      await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: universalAddress,
          to: getContractAddress(targetChainId),
          data: cancelData,
          gas: '0x76c0',
        }]
      });
      
      console.log(`✅ Campaign ${campaign.id} cancelled`);
      
      // Refresh campaigns after cancel
      setTimeout(() => {
        refetch();
        fetchUserCampaigns();
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error cancelling campaign:', error);
      alert('Failed to cancel campaign: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isSignedIn || !universalAddress) {
    return (
      <div style={styles.card}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>👥 My Campaigns</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>
            Connect your wallet to see your campaigns
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '16px' 
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
          👥 My Campaigns
        </div>
        <button
          onClick={() => { refetch(); fetchUserCampaigns(); }}
          style={{
            padding: '4px 8px',
            borderRadius: '6px',
            border: 'none',
            background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            color: dark ? '#f1f5f9' : '#1e293b',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div>🔄 Loading your campaigns...</div>
        </div>
      ) : userCampaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>📝 No campaigns yet</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            Create your first campaign to see it here!
          </div>
        </div>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {userCampaigns.map(campaign => (
            <div key={campaign.id} style={{
              padding: '12px',
              marginBottom: '12px',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: '8px',
              background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', flex: 1 }}>
                  {campaign.title}
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  background: campaign.status === 'Active' ? '#22c55e' : 
                            campaign.status === 'Nearly Funded' ? '#eab308' : 
                            campaign.status === 'Completed - Funded' ? '#10b981' : '#ef4444',
                  color: 'white'
                }}>
                  {campaign.status}
                </div>
              </div>
              
              <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.8 }}>
                #{campaign.id} • {campaign.daysLeft > 0 ? `${campaign.daysLeft} days left` : 'Ended'}
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>${campaign.raised.toFixed(2)} USDC raised</span>
                  <span>${campaign.goal.toFixed(2)} USDC goal</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(campaign.progress, 100)}%`,
                    height: '100%',
                    backgroundColor: campaign.progress >= 100 ? '#22c55e' : '#3b82f6',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <div style={{ fontSize: '11px', opacity: 0.7, textAlign: 'right', marginTop: '2px' }}>
                  {campaign.progress.toFixed(1)}%
                </div>
              </div>

              {campaign.canClaim && (
                <button 
                  onClick={() => handleClaimFunds(campaign)}
                  disabled={actionLoading === `claim-${campaign.id}`}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: actionLoading === `claim-${campaign.id}` ? '#94a3b8' : '#22c55e',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: actionLoading === `claim-${campaign.id}` ? 'not-allowed' : 'pointer',
                    marginBottom: '6px'
                  }}
                >
                  {actionLoading === `claim-${campaign.id}` ? '⏳ Claiming...' : '💰 Claim Funds'}
                </button>
              )}
              
              {campaign.canCancel && (
                <button 
                  onClick={() => handleCancelCampaign(campaign)}
                  disabled={actionLoading === `cancel-${campaign.id}`}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: actionLoading === `cancel-${campaign.id}` ? '#94a3b8' : '#ef4444',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: actionLoading === `cancel-${campaign.id}` ? 'not-allowed' : 'pointer'
                  }}
                >
                  {actionLoading === `cancel-${campaign.id}` ? '⏳ Cancelling...' : '❌ Cancel Campaign'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;