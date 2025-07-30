import React, { useState } from 'react';
import { createBaseAccountSDK, pay, getPaymentStatus } from '@base-org/account';
import { SignInWithBaseButton, BasePayButton } from '@base-org/account-ui/react';

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [theme, setTheme] = useState('light');
  
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
    creatorNickname: ''
  });

  // Unsplash integration states
  const [unsplashImages, setUnsplashImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageSource, setImageSource] = useState(''); // 'unsplash' or 'upload'

  // Unsplash API configuration
  const UNSPLASH_ACCESS_KEY = 'uGdVJxeg4lsYvDtmfAiTdQtpkkoet2TUVZyz5llER6E';

  // Initialize SDK
  const sdk = createBaseAccountSDK({
    appName: 'Fundly - Crowdfunding Platform',
    appLogo: 'https://base.org/logo.png',
  });

  // Mock crowdfunding campaigns data
  const campaigns = [
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
    }
  ];

  // Add some Dreams and Goals campaigns
  campaigns.push(
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
  );

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

  // BasePay function with selected amount (ONLY BasePay, no SubAccount)
  const handleBasePay = async (campaign) => {
    try {
      const selectedAmount = getAmountForCampaign(campaign.id);
      setPaymentStatus(`Processing ${selectedAmount} USDC donation via BasePay...`);
      
      const { id } = await pay({
        amount: selectedAmount, // Use selected amount (1, 5, 10, or 100)
        to: '0xF1fa20027b6202bc18e4454149C85CB01dC91Dfd', // Campaign escrow address
        testnet: true
      });

      setPaymentId(id);
      setPaymentStatus(`✅ BasePay successful! ${selectedAmount} USDC donated to "${campaign.title}"`);
    } catch (error) {
      console.error('BasePay failed:', error);
      setPaymentStatus('❌ BasePay donation failed');
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

  // Handle Create Campaign form submission
  const handleCreateCampaignSubmit = () => {
    if (!newCampaign.title || !newCampaign.description || !newCampaign.goal || !newCampaign.creatorNickname) {
      alert('Please fill in all required fields (Title, Description, Goal, and Creator Nickname)');
      return;
    }

    if (!newCampaign.image) {
      alert('Please select an image for your campaign');
      return;
    }

    // Demo success message
    alert('Campaign created successfully! 🎉 (This is a demo - real implementation would save to database)');
    setShowCreateModal(false);
    setNewCampaign({ title: '', description: '', goal: '', category: 'Technology', image: '', creatorNickname: '' });
  };

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
          
          {isSignedIn ? (
            <div>
              <div style={styles.card}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  🏦 Main Account
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
                   💳 How BasePay Works
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
                     2️⃣ Pay with BasePay
                   </div>
                   <div style={{ fontSize: '11px', opacity: 0.8, lineHeight: '1.4' }}>
                     Secure payment via Base Account (wallet approval)
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
                <div style={{ fontSize: '14px', marginBottom: '16px' }}>
                  Connect your wallet to start donating
                </div>
                <SignInWithBaseButton 
                  align="center"
                  variant="solid"
                  colorScheme={theme}
                  size="medium"
                  onClick={handleSignIn}
                />
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
                          
                          {/* BasePay Button with Selected Amount */}
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
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            ...styles.card,
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0, fontSize: '24px', marginBottom: '20px' }}>
              🚀 Create New Campaign
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                Campaign Title *
              </label>
              <input
                type="text"
                value={newCampaign.title}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Revolutionary Solar Panel Technology"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${dark ? '#555' : '#ddd'}`,
                  backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'white',
                  color: dark ? 'white' : 'black',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                Description *
              </label>
              <textarea
                value={newCampaign.description}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your campaign, what you're building, and why people should support you..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${dark ? '#555' : '#ddd'}`,
                  backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'white',
                  color: dark ? 'white' : 'black',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Goal Amount (USDC) *
                </label>
                <input
                  type="number"
                  value={newCampaign.goal}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, goal: e.target.value }))}
                  placeholder="50000"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${dark ? '#555' : '#ddd'}`,
                    backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'white',
                    color: dark ? 'white' : 'black',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
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
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${dark ? '#555' : '#ddd'}`,
                    backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'white',
                    color: dark ? 'white' : 'black',
                    fontSize: '14px'
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
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                Creator Nickname
              </label>
              <input
                type="text"
                value={newCampaign.creatorNickname}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, creatorNickname: e.target.value }))}
                placeholder="Your public nickname (e.g., @yourname)"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${dark ? '#555' : '#ddd'}`,
                  backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'white',
                  color: dark ? 'white' : 'black',
                  fontSize: '14px'
                }}
              />
            </div>

            {universalAddress && (
              <div style={{ 
                marginBottom: '24px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: dark ? 'rgba(0,255,0,0.1)' : 'rgba(34, 197, 94, 0.1)',
                border: `1px solid ${dark ? 'rgba(0,255,0,0.3)' : 'rgba(34, 197, 94, 0.3)'}`
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  💼 Connected Wallet:
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  fontFamily: 'monospace',
                  color: dark ? '#4ade80' : '#16a34a'
                }}>
                  {universalAddress}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                  This address will receive the funds if your campaign is successful
                </div>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                Campaign Image
              </label>
              
              {newCampaign.image ? (
                <div style={{ marginBottom: '12px' }}>
                  <img 
                    src={newCampaign.image}
                    alt="Campaign preview"
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>
                      {imageSource === 'upload' ? '📁 Your uploaded image' : '📸 From Unsplash'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
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
                        ...styles.button,
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontSize: '12px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        display: 'inline-block'
                      }}
                    >
                      📁 Upload New
                    </label>
                    <button
                      type="button"
                      onClick={openImagePicker}
                      style={{
                        ...styles.button,
                        backgroundColor: '#2563eb',
                        color: 'white',
                        fontSize: '12px',
                        padding: '6px 12px'
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
                        ...styles.button,
                        backgroundColor: '#ef4444',
                        color: 'white',
                        fontSize: '12px',
                        padding: '6px 12px'
                      }}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
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
                        padding: '30px 20px',
                        borderRadius: '8px',
                        border: `2px dashed ${dark ? '#555' : '#ddd'}`,
                        backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.05)',
                        color: dark ? '#fff' : '#10b981',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'block',
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 185, 129, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.05)';
                      }}
                    >
                      📁 Upload Your Image
                      <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '8px' }}>
                        JPG, PNG, GIF up to 10MB
                      </div>
                    </label>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: dark ? '#666' : '#999'
                  }}>
                    OR
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <button
                      type="button"
                      onClick={openImagePicker}
                      style={{
                        width: '100%',
                        padding: '30px 20px',
                        borderRadius: '8px',
                        border: `2px dashed ${dark ? '#555' : '#ddd'}`,
                        backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(37, 99, 235, 0.05)',
                        color: dark ? '#fff' : '#2563eb',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(37, 99, 235, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.05)' : 'rgba(37, 99, 235, 0.05)';
                      }}
                    >
                      📸 Choose from Unsplash
                      <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '8px' }}>
                        Professional photos for {newCampaign.category}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  ...styles.button,
                  backgroundColor: '#6c757d',
                  color: 'white'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaignSubmit}
                style={{
                  ...styles.button,
                  ...styles.primaryButton
                }}
              >
                🚀 Create Campaign
              </button>
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