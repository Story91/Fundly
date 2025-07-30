import { getCampaigns, createCampaignsTable } from '../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure database tables exist
    await createCampaignsTable();

    const { 
      page = 1, 
      limit = 20, 
      status = null 
    } = req.query;

    const campaigns = await getCampaigns(
      parseInt(page), 
      parseInt(limit), 
      status
    );

    res.status(200).json({
      success: true,
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: campaigns.length
      }
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ 
      error: 'Failed to fetch campaigns',
      details: error.message 
    });
  }
}