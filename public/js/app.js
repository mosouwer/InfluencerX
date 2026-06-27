// Main App Module
window.app = {
  currentMode: 'brand',
  notifications: [],
  notificationInterval: null,
  currentViewFn: null,
  
  refreshCurrentView() {
    const btn = document.querySelector('button[title="Refresh Latest Data"] svg');
    if (btn) btn.classList.add('animate-spin');
    
    setTimeout(() => {
      if (this.currentViewFn) {
        this.currentViewFn();
      } else {
        if (window.auth && window.auth.isAdmin()) window.admin.renderDashboard();
        else if (this.currentMode === 'brand') window.brand.renderDashboard();
        else window.influencer.renderDashboard();
      }
      if (btn) btn.classList.remove('animate-spin');
      if (window.ui && window.ui.showToast) window.ui.showToast('Data refreshed successfully!');
    }, 400);
  },
  
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
        <div class="p-6">
          <div class="mb-8 p-3 bg-gray-900 border border-black shadow-lg rounded-sm flex items-center gap-2">
            <span class="material-icons-outlined text-white text-[18px]">admin_panel_settings</span>
            <div class="text-xs text-white uppercase tracking-widest font-black">Admin Mode</div>
          </div>
          <div class="space-y-2">
            <div class="sidebar-item p-3 rounded-sm cursor-pointer text-gray-600 hover:text-black hover:bg-gray-100 font-bold flex items-center gap-3 transition-all duration-300  " onclick="window.app.currentViewFn = () => window.admin.renderDashboard(); window.admin.renderDashboard()">
              <span class="material-icons-outlined">dashboard</span>
              Dashboard
            </div>
            <div class="sidebar-item p-3 rounded-sm cursor-pointer text-gray-600 hover:text-black hover:bg-gray-100 font-bold flex items-center gap-3 transition-all duration-300  " onclick="window.app.currentViewFn = () => window.admin.renderUsers(); window.admin.renderUsers()">
              <span class="material-icons-outlined">people</span>
              User Management
            </div>
            <div class="sidebar-item p-3 rounded-sm cursor-pointer text-gray-600 hover:text-black hover:bg-gray-100 font-bold flex items-center gap-3 transition-all duration-300  " onclick="window.app.currentViewFn = () => window.admin.renderCampaigns(); window.admin.renderCampaigns()">
              <span class="material-icons-outlined">campaign</span>
              All Campaigns
            </div>
            <div class="sidebar-item p-3 rounded-sm cursor-pointer text-gray-600 hover:text-black hover:bg-gray-100 font-bold flex items-center gap-3 transition-all duration-300  " onclick="window.app.currentViewFn = () => window.admin.renderDeals(); window.admin.renderDeals()">
              <span class="material-icons-outlined">work</span>
              All Deals
            </div>
            <div class="sidebar-item p-3 rounded-sm cursor-pointer text-gray-600 hover:text-black hover:bg-gray-100 font-bold flex items-center gap-3 transition-all duration-300  " onclick="window.app.currentViewFn = () => window.admin.renderWithdrawals(); window.admin.renderWithdrawals()">
              <span class="material-icons-outlined">account_balance_wallet</span>
              Withdrawals
            </div>
          </div>
        </div>
      `;
    } else if (this.currentMode === 'brand') {
      sidebar.innerHTML = `
        <div class="p-4"><div class="space-y-1"><div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.app.currentViewFn = () => window.brand.renderDashboard(); window.brand.renderDashboard()">📊 Dashboard</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.app.currentViewFn = () => window.brand.renderExplore(); window.brand.renderExplore()">🔍 Explore Creators</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.app.currentViewFn = () => window.brand.renderCampaigns(); window.brand.renderCampaigns()">📋 My Campaigns</div></div></div>
      `;
    } else {
      sidebar.innerHTML = `
        <div class="p-4"><div class="space-y-1"><div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.app.currentViewFn = () => window.influencer.renderDashboard(); window.influencer.renderDashboard()">📊 Dashboard</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.app.currentViewFn = () => window.influencer.renderCampaigns(); window.influencer.renderCampaigns()">🚀 My Campaigns</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.app.currentViewFn = () => window.influencer.renderEarnings(); window.influencer.renderEarnings()">💰 Earnings</div>
        <div class="sidebar-item p-3 rounded-lg cursor-pointer hover:bg-gray-50" onclick="window.app.currentViewFn = () => window.influencer.renderProfile(); window.influencer.renderProfile()">👤 My Profile</div></div></div>
      `;
    }
  }
};