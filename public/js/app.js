// Main App Module
window.app = {
  currentMode: 'brand',
  notifications: [],
  notificationInterval: null,
  
  async loadInitialData() {
    await this.loadNotifications();
    await this.loadInfluencersForBrand();
    this.startNotificationPolling();
  },
  
  async loadNotifications() {
    try {
      this.notifications = await window.api.getNotifications();
      const unreadCount = this.notifications.filter(n => !n.read).length;
      document.getElementById('notifBadge').classList.toggle('hidden', unreadCount === 0);
    } catch (err) {}
  },
  
  async loadInfluencersForBrand() {
    try {
      window.brand.allInfluencers = await window.api.getInfluencers();
    } catch (err) {}
  },
  
  startNotificationPolling() {
    if (this.notificationInterval) clearInterval(this.notificationInterval);
    this.notificationInterval = setInterval(() => this.loadNotifications(), 30000);
  },
  
  toggleNotifications() {
    const unread = this.notifications.filter(n => !n.read).length;
    alert(`You have ${unread} unread notifications`);
  },
  
  switchMode(mode) {
    if (window.auth.isAdmin()) return;
    this.currentMode = mode;
    
    document.getElementById('brandModeBtn').className = mode === 'brand' ? 
      'px-4 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm' : 
      'px-4 py-1.5 rounded-md text-sm font-medium text-gray-500';
    document.getElementById('infModeBtn').className = mode === 'influencer' ? 
      'px-4 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm' : 
      'px-4 py-1.5 rounded-md text-sm font-medium text-gray-500';
    
    this.renderSidebar();
    if (mode === 'brand') window.brand.renderDashboard();
    else window.influencer.renderDashboard();
  },
  
  renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    
    if (window.auth.isAdmin()) {
      sidebar.innerHTML = `
        <div class="p-4"><div class="mb-4 p-2 bg-red-50 rounded-lg"><div class="text-xs text-red-600 font-bold">👑 Admin Controls</div></div>
        <div class="space-y-1"><div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-red-50" onclick="window.admin.renderDashboard()">📊 Dashboard</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-red-50" onclick="window.admin.renderUsers()">👥 User Management</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-red-50" onclick="window.admin.renderCampaigns()">📋 All Campaigns</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-red-50" onclick="window.admin.renderDeals()">💼 All Deals</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-red-50" onclick="window.admin.renderWithdrawals()">💰 Withdrawals</div></div></div>
      `;
    } else if (this.currentMode === 'brand') {
      sidebar.innerHTML = `
        <div class="p-4"><div class="space-y-1"><div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.brand.renderDashboard()">📊 Dashboard</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.brand.renderExplore()">🔍 Explore Creators</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.brand.renderCampaigns()">📋 My Campaigns</div></div></div>
      `;
    } else {
      sidebar.innerHTML = `
        <div class="p-4"><div class="space-y-1"><div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.influencer.renderDashboard()">📊 Dashboard</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.influencer.renderCampaigns()">🚀 My Campaigns</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.influencer.renderEarnings()">💰 Earnings</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.influencer.renderProfile()">👤 My Profile</div></div></div>
      `;
    }
  }
};