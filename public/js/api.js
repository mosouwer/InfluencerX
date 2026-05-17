// API Service Module
window.api = {
  async request(url, options = {}) {
    try {
      const res = await fetch(window.CONFIG.API_BASE + url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
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
  
  // Campaigns
  getCampaigns() {
    return this.request('/campaigns');
  },
  createCampaign(data) {
    return this.request('/campaigns', { method: 'POST', body: JSON.stringify(data) });
  },
  updateCampaignStatus(id, status, progress) {
    return this.request(`/campaigns/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, progress }) });
  },
  
  // Deals
  getDeals() {
    return this.request('/deals');
  },
  createDeal(data) {
    return this.request('/deals', { method: 'POST', body: JSON.stringify(data) });
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
  }
};