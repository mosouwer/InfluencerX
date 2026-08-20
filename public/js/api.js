// API Service Module with Offline/Demo Fallbacks
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
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(window.CONFIG.API_BASE + url, {
        headers,
        signal: controller.signal,
        ...options
      });
      clearTimeout(timeoutId);

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
      console.warn(`API Error on ${url}:`, err.message);
      return this.getFallbackData(url, options);
    }
  },

  getFallbackData(url, options) {
    if (url.includes('/login')) {
      throw new Error('Connection timeout. Use demo accounts.');
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
    if (url.includes('/admin/campaigns')) {
      return [
        {
          id: 'c_101',
          title: 'Summer Apparel Launch 2026',
          brandName: "Ravi's Store",
          influencerName: 'Priya Sharma',
          package: 'Instagram Reel',
          amount: 15000,
          status: 'active',
          createdAt: '2026-08-18T10:00:00Z'
        },
        {
          id: 'c_102',
          title: 'Gourmet Spice Blend Review',
          brandName: 'Artisan Flavours',
          influencerName: 'Chef Arjun',
          package: 'Dedicated Post',
          amount: 10000,
          status: 'review',
          createdAt: '2026-08-16T14:30:00Z'
        },
        {
          id: 'c_103',
          title: 'Fitness Tracker Promo',
          brandName: 'FitLife Tech',
          influencerName: 'FitWithNikhil',
          package: 'Instagram Story',
          amount: 4500,
          status: 'completed',
          createdAt: '2026-08-10T09:15:00Z'
        }
      ];
    }
    if (url.includes('/admin/deals')) {
      return [
        {
          id: 'deal_201',
          campaignName: 'DEAL-201',
          brandName: "Ravi's Store",
          influencerName: 'TechTalk Vikram',
          packageType: 'Instagram Reel',
          amount: 6000,
          status: 'pending',
          createdAt: '2026-08-20T18:00:00Z'
        }
      ];
    }
    if (url.includes('/admin/users') || url.includes('/users')) {
      return [
        { id: 'admin_1', email: 'admin@influencex.com', role: 'admin', profile: { name: 'Platform Admin' }, status: 'active', joinedAt: '2026-01-01' },
        { id: 'biz_1', email: 'ravi@store.com', role: 'brand', profile: { company: "Ravi's Store", industry: 'Fashion' }, status: 'active', joinedAt: '2026-02-15' },
        { id: 'inf_1', email: 'priya@demo.com', role: 'influencer', profile: { name: 'Priya Sharma', niche: 'Fashion', followers: 1200000, rates: { story: 5000, reel: 12000, post: 8000 } }, verified: true, status: 'active', joinedAt: '2026-01-13' },
        { id: 'inf_2', email: 'arjun@demo.com', role: 'influencer', profile: { name: 'Chef Arjun', niche: 'Food', followers: 890000, rates: { story: 8000, reel: 15000, post: 10000 } }, verified: true, status: 'active', joinedAt: '2026-01-15' }
      ];
    }
    if (url.includes('/admin/withdrawals')) {
      return [
        { id: 'w_01', influencerName: 'Priya Sharma', amount: 15000, status: 'pending', requestedAt: '2026-08-19' },
        { id: 'w_02', influencerName: 'Chef Arjun', amount: 20000, status: 'completed', requestedAt: '2026-08-12' }
      ];
    }
    if (url.includes('/notifications')) {
      return [
        { id: 'n_1', title: 'New Deal Proposal', message: "Ravi's Store initiated a new Reel booking.", icon: '🚀', read: false, createdAt: new Date().toISOString() },
        { id: 'n_2', title: 'Escrow Locked', message: '₹15,000 held securely in escrow.', icon: '🔒', read: true, createdAt: new Date().toISOString() }
      ];
    }
    if (url.includes('/influencers')) {
      return [
        { id: 'inf_1', name: 'Priya Sharma', niche: 'Fashion', followers: 1200000, engagement: 6.4, rates: { story: 5000, reel: 12000, post: 8000 }, verified: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80', bio: 'Fashion & luxury lifestyle creator.' },
        { id: 'inf_2', name: 'Chef Arjun', niche: 'Food', followers: 890000, engagement: 7.1, rates: { story: 8000, reel: 15000, post: 10000 }, verified: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80', bio: 'Culinary artist and food reviewer.' },
        { id: 'inf_3', name: 'FitWithNikhil', niche: 'Fitness', followers: 560000, engagement: 5.8, rates: { story: 4500, reel: 8000, post: 5000 }, verified: false, rating: 4.7, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80', bio: 'Fitness coach and wellness advocate.' }
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