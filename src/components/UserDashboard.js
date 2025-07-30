import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import { CONTRACT_CONFIG, getContractAddress } from '../contracts/contract-config';
import contractAbi from '../contracts/CrowdfundingPlatform.abi.json';

const UserDashboard = ({ styles, dark, isSignedIn, universalAddress }) => {
  const { chainId } = useAccount();
  const config = useConfig();
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get user's campaign IDs from contract
  const { data: userCampaignIds, refetch } = useReadContract({
    address: chainId ? getContractAddress(chainId) : undefined,
    abi: contractAbi,
    functionName: 'getUserCampaigns',
    args: universalAddress ? [universalAddress] : undefined,
    enabled: !!chainId && !!universalAddress && isSignedIn,
  });

  // Fetch detailed campaign data
  const fetchUserCampaigns = async () => {
    if (!userCampaignIds || userCampaignIds.length === 0) {
      setUserCampaigns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const campaignPromises = userCampaignIds.map(async (campaignId) => {
        const campaignData = await readContract(config, {
          address: getContractAddress(chainId),
          abi: contractAbi,
          functionName: 'getCampaign',
          args: [campaignId],
        });

        // Convert contract data to frontend format
        const now = Math.floor(Date.now() / 1000);
        const deadline = Number(campaignData.deadline);
        const daysLeft = deadline > now ? Math.ceil((deadline - now) / (24 * 60 * 60)) : 0;
        
        return {
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
      });

      const campaigns = await Promise.all(campaignPromises);
      setUserCampaigns(campaigns);
    } catch (error) {
      console.error('Error fetching user campaigns:', error);
      setUserCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userCampaignIds) {
      fetchUserCampaigns();
    }
  }, [userCampaignIds, chainId]);

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
                <button style={{
                  width: '100%',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#22c55e',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                  💰 Claim Funds
                </button>
              )}
              
              {campaign.canCancel && (
                <button style={{
                  width: '100%',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                  ❌ Cancel Campaign
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