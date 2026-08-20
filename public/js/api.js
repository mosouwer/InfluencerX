// API Service Module
window.api = {
  async request(url, options = {}) {
    try {
      const headers = {};
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      if (window.auth && window.auth.currentUser) {
        headers['x-user-id'] = window.auth.currentUser.id;
        headers['x-user-role'] = window.auth.currentUser.role;
      }

      // 3-second timeout — prevents cold-start hangs from blocking the UI
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(window.CONFIG.API_BASE + url, {
        headers,
        signal: controller.signal,
        ...options
      });
      clearTimeout(tid);

      if (!res.ok) {
        const text = await res.text();
        let errorMsg = text;
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) errorMsg = parsed.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }
      return res.json();
    } catch (err) {
      return this.getFallbackData(url, options, err);
    }
  },

  getFallbackData(url, options, originalError) {
    if (url.includes('/login')) {
      throw originalError || new Error('Login failed');
    }
    if (url.includes('/admin/stats')) {
      return {
        totalBrands: 12,
        totalInfluencers: 6,
        totalCampaigns: 8,
        activeCampaigns: 4,
        campaignsActive: 4,
        campaignsReview: 2,
        campaignsCompleted: 6,
        platformRevenue: 34500,
        pendingDisputes: 0,
        totalValue: 172500,
        pendingWithdrawals: 15000,
        verifiedInfluencers: 4
      };
    }
    if (url.includes('/admin/campaigns') || url.includes('/campaigns')) {
      return [
        { id: 'camp_1', campaignName: 'Summer Reel Campaign', brandName: "Ravi's Store", influencerName: 'Priya Sharma', packageType: 'Instagram Reel', type: 'Instagram Reel', amount: 12000, status: 'active', deadline: '2026-05-20', createdAt: '2026-05-01' },
        { id: 'camp_2', campaignName: 'Product Unboxing', brandName: "Ravi's Store", influencerName: 'Chef Arjun', packageType: 'YouTube Video', type: 'YouTube Video', amount: 25000, status: 'review', deadline: '2026-05-19', createdAt: '2026-05-02' },
        { id: 'camp_3', campaignName: 'Brand Awareness Story', brandName: "Ravi's Store", influencerName: 'FitWithNikhil', packageType: 'Instagram Story', type: 'Instagram Story', amount: 5000, status: 'completed', deadline: '2026-05-24', createdAt: '2026-05-03' },
        { id: 'camp_4', campaignName: 'Tech Review Post', brandName: "Ravi's Store", influencerName: 'TechTalk Vikram', packageType: 'Feed Post', type: 'Feed Post', amount: 8000, status: 'active', deadline: '2026-05-15', createdAt: '2026-04-20' },
        { id: 'camp_5', campaignName: 'Summer Apparel Launch 2026', brandName: "Ravi's Store", influencerName: 'GreenLife Ananya', packageType: 'Instagram Reel', type: 'Instagram Reel', amount: 15000, status: 'pending', deadline: '2026-06-01', createdAt: '2026-05-10' },
        { id: 'camp_6', campaignName: 'Travel VLOG Goa', brandName: "Ravi's Store", influencerName: 'Wanderer Kabir', packageType: 'Instagram Reel', type: 'Instagram Reel', amount: 9000, status: 'completed', deadline: '2026-05-19', createdAt: '2026-05-12' }
      ];
    }
    if (url.includes('/admin/deals') || url.includes('/deals')) {
      return [
        { id: 'deal_1', campaignName: 'DEAL-Eco Collaboration', brandName: "Ravi's Store", influencerName: 'GreenLife Ananya', packageType: 'Instagram Post', amount: 3500, status: 'completed', createdAt: '2026-05-10' },
        { id: 'deal_201', campaignName: 'DEAL-Tech Spotlight', brandName: "Ravi's Store", influencerName: 'TechTalk Vikram', packageType: 'Instagram Reel', amount: 6000, status: 'pending', createdAt: '2026-08-20T18:00:00Z' }
      ];
    }
    if (url.includes('/admin/users') || url.includes('/users')) {
      return [
        { id: 'admin_1', email: 'admin@influencex.com', role: 'admin', name: 'Platform Admin', profile: { name: 'Platform Admin' }, status: 'active', joinedAt: '2026-01-01', verified: null },
        { id: 'biz_1', email: 'ravi@store.com', role: 'brand', name: "Ravi's Store", profile: { company: "Ravi's Store", industry: 'Fashion' }, status: 'active', joinedAt: '2026-02-15', verified: null },
        { id: 'inf_1', email: 'priya@demo.com', role: 'influencer', name: 'Priya Sharma', profile: { name: 'Priya Sharma', niche: 'Fashion', followers: 1200000, rates: { story: 5000, reel: 12000, post: 8000 } }, verified: true, status: 'active', joinedAt: '2026-01-13' },
        { id: 'inf_2', email: 'arjun@demo.com', role: 'influencer', name: 'Chef Arjun', profile: { name: 'Chef Arjun', niche: 'Food', followers: 890000, rates: { story: 8000, reel: 15000, post: 10000 } }, verified: true, status: 'active', joinedAt: '2026-01-15' },
        { id: 'inf_3', email: 'nikhil@demo.com', role: 'influencer', name: 'FitWithNikhil', profile: { name: 'FitWithNikhil', niche: 'Fitness', followers: 560000, rates: { story: 4500, reel: 8000, post: 5000 } }, verified: true, status: 'active', joinedAt: '2026-01-13' },
        { id: 'inf_4', email: 'vikram@demo.com', role: 'influencer', name: 'TechTalk Vikram', profile: { name: 'TechTalk Vikram', niche: 'Tech', followers: 180000, rates: { story: 3000, reel: 6000, post: 8000 } }, verified: true, status: 'active', joinedAt: '2026-01-15' },
        { id: 'inf_5', email: 'ananya@demo.com', role: 'influencer', name: 'GreenLife Ananya', profile: { name: 'GreenLife Ananya', niche: 'Lifestyle', followers: 210000, rates: { story: 3500, reel: 7000, post: 5000 } }, verified: false, status: 'active', joinedAt: '2026-01-14' },
        { id: 'inf_6', email: 'kabir@demo.com', role: 'influencer', name: 'Wanderer Kabir', profile: { name: 'Wanderer Kabir', niche: 'Travel', followers: 340000, rates: { story: 6000, reel: 12000, post: 9000 } }, verified: true, status: 'active', joinedAt: '2026-01-26' }
      ];
    }
    if (url.includes('/admin/withdrawals')) {
      return [
        { id: 'w_01', influencerName: 'Priya Sharma', amount: 15000, status: 'pending', requestedAt: '2026-08-19' },
        { id: 'w_02', influencerName: 'Chef Arjun', amount: 20000, status: 'completed', requestedAt: '2026-08-12' }
      ];
    }
    if (url.includes('/notifications')) {
      return [];
    }
    if (url.includes('/influencers')) {
      return [
        { id: 'inf_1', name: 'Priya Sharma', niche: 'Fashion', followers: 1200000, engagement: 6.4, location: 'Mumbai', rates: { story: 5000, reel: 12000, post: 8000 }, verified: true, rating: 4.8, avatar: '👗', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80', bio: 'Fashion influencer based in Mumbai.' },
        { id: 'inf_2', name: 'Chef Arjun', niche: 'Food', followers: 890000, engagement: 7.1, location: 'Delhi', rates: { story: 8000, reel: 15000, post: 10000 }, verified: true, rating: 4.9, avatar: '🍕', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80', bio: 'Food creator from Delhi.' },
        { id: 'inf_3', name: 'FitWithNikhil', niche: 'Fitness', followers: 560000, engagement: 5.8, location: 'Pune', rates: { story: 4500, reel: 8000, post: 5000 }, verified: true, rating: 4.7, avatar: '💪', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80', bio: 'Fitness coach and wellness advocate.' },
        { id: 'inf_4', name: 'TechTalk Vikram', niche: 'Tech', followers: 180000, engagement: 8.2, location: 'Bangalore', rates: { story: 3000, reel: 6000, post: 8000 }, verified: true, rating: 4.9, avatar: '📱', image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=80', bio: 'Tech reviewer and gadget expert.' },
        { id: 'inf_5', name: 'GreenLife Ananya', niche: 'Lifestyle', followers: 210000, engagement: 4.9, location: 'Delhi', rates: { story: 3500, reel: 7000, post: 5000 }, verified: false, rating: 4.6, avatar: '🌿', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80', bio: 'Sustainable living advocate.' },
        { id: 'inf_6', name: 'Wanderer Kabir', niche: 'Travel', followers: 340000, engagement: 5.5, location: 'Goa', rates: { story: 6000, reel: 12000, post: 9000 }, verified: true, rating: 4.7, avatar: '✈️', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80', bio: 'Travel blogger exploring India.' }
      ];
    }
    return { success: true };
  },
  
  // Auth
  login(credentials) {
    return this.request('/login', { method: 'POST', body: JSON.stringify(credentials) });
  },
  logout() {
    return this.request('/logout', { method: 'POST' });
  },
  getMe() {
    return this.request('/me');
  },
  
  // Influencers
  getInfluencers() {
    return this.request('/influencers');
  },
  getInfluencer(id) {
    return this.request(`/influencer/${id}`);
  },
  updateInfluencerRates(rates) {
    return this.request('/influencer/rates', { method: 'PUT', body: JSON.stringify({ rates }) });
  },
  createInfluencer(formData) {
    return this.request('/users/influencer', { method: 'POST', body: formData });
  },
  updateInfluencer(id, formData) {
    return this.request(`/users/influencer/${id}`, { method: 'PUT', body: formData });
  },
  deleteInfluencer(id) {
    return this.request(`/users/influencer/${id}`, { method: 'DELETE' });
  },
  
  // Campaigns
  getCampaigns() {
    return this.request('/campaigns');
  },
  createCampaign(campaign) {
    return this.request('/campaigns', { method: 'POST', body: JSON.stringify(campaign) });
  },
  updateCampaignStatus(id, status) {
    return this.request(`/campaigns/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },
  
  // Deals
  getDeals() {
    return this.request('/deals');
  },
  createDeal(dealData) {
    return this.request('/deals', { method: 'POST', body: dealData });
  },
  updateDealStatus(id, status) {
    return this.request(`/deals/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },
  
  // Notifications
  getNotifications() {
    return this.request('/notifications');
  },
  markNotificationsRead() {
    return this.request('/notifications/read', { method: 'PUT' });
  },
  markNotificationAsRead(id) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  },
  deleteNotification(id) {
    return this.request(`/notifications/${id}`, { method: 'DELETE' });
  },
  clearAllNotifications() {
    return this.request('/notifications', { method: 'DELETE' });
  },
  
  // Stats
  getStats() {
    return this.request('/stats');
  },
  
  // Admin
  getAdminStats() {
    return this.request('/admin/stats');
  },
  getAdminUsers() {
    return this.request('/admin/users');
  },
  updateUserStatus(userId, status) {
    return this.request(`/admin/users/${userId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },
  verifyInfluencer(userId, verified) {
    return this.request(`/admin/users/${userId}/verify`, { method: 'PUT', body: JSON.stringify({ verified }) });
  },
  getAdminCampaigns() {
    return this.request('/admin/campaigns');
  },
  getAdminDeals() {
    return this.request('/admin/deals');
  },
  getAdminWithdrawals() {
    return this.request('/admin/withdrawals');
  },
  processWithdrawal(id, status) {
    return this.request(`/admin/withdrawals/${id}/process`, { method: 'PUT', body: JSON.stringify({ status }) });
  },
  deleteAdminCampaigns(ids) {
    return this.request('/admin/campaigns', { method: 'DELETE', body: JSON.stringify({ ids }) });
  },
  deleteAdminDeals(ids) {
    return this.request('/admin/deals', { method: 'DELETE', body: JSON.stringify({ ids }) });
  }
};