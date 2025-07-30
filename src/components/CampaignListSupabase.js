import React, { useState, useEffect } from 'react';
import { getCampaigns, getCampaignsByCreator } from '../lib/supabase';

const CampaignListSupabase = ({ 
  creatorAddress = null, 
  styles, 
  dark, 
  onCampaignSelect = null 
}) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch campaigns from Supabase
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (creatorAddress) {
        // Get campaigns by specific creator
        data = await getCampaignsByCreator(creatorAddress);
      } else {
        // Get all campaigns
        data = await getCampaigns(1, 20, 'active');
      }
      
      // Transform Supabase data to match existing component expectations
      const transformedCampaigns = data.map(campaign => {
        const deadline = new Date(campaign.deadline).getTime() / 1000;
        const now = Math.floor(Date.now() / 1000);
        const daysLeft = deadline > now ? Math.ceil((deadline - now) / (24 * 60 * 60)) : 0;
        
        return {
          id: campaign.blockchain_id,
          title: campaign.title,
          description: campaign.description,
          category: campaign.category,
          creator: campaign.creator_nickname,
          creatorAddress: campaign.creator_address,
          image: campaign.image_url || campaign.image_blob_url || "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop",
          raised: campaign.current_pledged,
          goal: campaign.goal_usdc,
          backers: campaign.backers_count,
          daysLeft: daysLeft,
          status: campaign.status,
          progress: (campaign.current_pledged / campaign.goal_usdc) * 100,
          createdAt: campaign.created_at,
          updatedAt: campaign.updated_at
        };
      });
      
      setCampaigns(transformedCampaigns);
    } catch (err) {
      console.error('Error fetching campaigns from Supabase:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [creatorAddress]);

  if (loading) {
    return (
      <div style={{
        ...styles.card,
        textAlign: 'center',
        padding: '40px 20px'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔄</div>
        <div style={{ fontSize: '16px', opacity: 0.8 }}>
          Loading campaigns from database...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        ...styles.card,
        textAlign: 'center',
        padding: '40px 20px',
        borderColor: dark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.4)',
        backgroundColor: dark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.08)'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>❌</div>
        <div style={{ fontSize: '16px', marginBottom: '8px', color: '#ef4444' }}>
          {error}
        </div>
        <button
          onClick={fetchCampaigns}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#ef4444',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div style={{
        ...styles.card,
        textAlign: 'center',
        padding: '40px 20px'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>📝</div>
        <div style={{ fontSize: '16px', marginBottom: '8px', opacity: 0.8 }}>
          {creatorAddress ? 'No campaigns created yet' : 'No campaigns available'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.6 }}>
          {creatorAddress ? 'Create your first campaign to see it here!' : 'Check back later for new campaigns.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          {creatorAddress ? `My Campaigns (${campaigns.length})` : `Available Campaigns (${campaigns.length})`}
        </div>
        <button
          onClick={fetchCampaigns}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
            backgroundColor: 'transparent',
            color: dark ? '#94a3b8' : '#64748b',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Campaigns Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {campaigns.map(campaign => (
          <div 
            key={campaign.id} 
            style={{
              ...styles.card,
              cursor: onCampaignSelect ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => onCampaignSelect && onCampaignSelect(campaign)}
            onMouseEnter={(e) => {
              if (onCampaignSelect) {
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = dark ? 
                  '0 25px 50px rgba(0,0,0,0.25)' : 
                  '0 25px 50px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (onCampaignSelect) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = dark ? 
                  '0 20px 60px rgba(0,0,0,0.1)' : 
                  '0 20px 60px rgba(0,0,0,0.05)';
              }
            }}
          >
            {/* Campaign Image */}
            <div style={{
              width: '100%',
              height: '200px',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '16px',
              position: 'relative'
            }}>
              <img 
                src={campaign.image} 
                alt={campaign.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop";
                }}
              />
              {/* Category Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                padding: '4px 8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {campaign.category}
              </div>
              
              {/* Status Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                padding: '4px 8px',
                borderRadius: '8px',
                backgroundColor: campaign.status === 'active' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {campaign.status === 'active' ? '🟢 Active' : '🔴 Ended'}
              </div>
            </div>

            {/* Campaign Content */}
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                lineHeight: '1.3'
              }}>
                {campaign.title}
              </div>
              
              <div style={{ 
                fontSize: '14px', 
                opacity: 0.8, 
                marginBottom: '16px',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {campaign.description}
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(campaign.progress, 100)}%`,
                    height: '100%',
                    backgroundColor: campaign.progress >= 100 ? '#22c55e' : '#3b82f6',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  opacity: 0.8, 
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {campaign.progress.toFixed(1)}% funded
                </div>
              </div>

              {/* Stats */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e' }}>
                    ${campaign.raised.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    raised of ${campaign.goal.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {campaign.daysLeft}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    days left
                  </div>
                </div>
              </div>

              {/* Creator & Backers */}
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>by {campaign.creator}</div>
                <div>{campaign.backers} backers</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignListSupabase;