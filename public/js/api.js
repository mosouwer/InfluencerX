// API Service Module
window.api = {
  async request(url, options = {}) {
    try {
      // If we are sending FormData (for file uploads), do NOT set Content-Type to application/json
      // Let the browser set it automatically to multipart/form-data with the correct boundary
      const headers = {};
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      if (window.auth && window.auth.currentUser) {
        headers['x-user-id'] = window.auth.currentUser.id;
        headers['x-user-role'] = window.auth.currentUser.role;
      }
      
      const res = await fetch(window.CONFIG.API_BASE + url, {
        headers,
        ...options
      });
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
  },
  deleteAdminCampaigns(ids) {
    return this.request('/admin/campaigns', { method: 'DELETE', body: JSON.stringify({ ids }) });
  },
  deleteAdminDeals(ids) {
    return this.request('/admin/deals', { method: 'DELETE', body: JSON.stringify({ ids }) });
  }
};