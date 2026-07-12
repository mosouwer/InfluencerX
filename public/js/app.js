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
    const getCommonLayout = (content) => `
      <div class="p-6 h-full flex flex-col justify-between">
        <div>
          <!-- Sidebar Logo -->
          <div class="flex items-center gap-2 mb-8 px-2">
            <span class="material-icons-outlined text-[#804ee6] text-3xl font-extrabold">change_history</span>
            <h1 class="text-2xl font-black text-gray-900 tracking-tighter uppercase">InfluenceX</h1>
          </div>
          ${content}
        </div>
        
        <!-- Donezo Mobile Promo CTA style -->
        <div class="pt-6 mt-auto">
          <div class="bg-gradient-to-tr from-[#804ee6] to-[#ff8a3d] p-5 rounded-xl text-white shadow-md relative overflow-hidden">
            <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full"></div>
            <div class="relative z-10">
              <h3 class="text-xs font-bold mb-1">Download Mobile App</h3>
              <p class="text-[10px] text-white/80 mb-3 font-light leading-snug">Collaborate on the go. Available for iOS & Android.</p>
              <button onclick="window.ui.showToast('App downloads are disabled in the web demo.', 'info')" 
                class="w-full py-2 bg-white text-[#804ee6] hover:bg-gray-50 rounded-lg text-xs font-bold transition shadow-sm active:scale-[0.98]">
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.auth.isAdmin()) {
      sidebar.innerHTML = getCommonLayout(`
        <div class="mb-6 p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-center gap-2">
          <span class="material-icons-outlined text-[#804ee6] text-[18px]">admin_panel_settings</span>
          <div class="text-xs text-[#804ee6] uppercase tracking-wider font-extrabold">Admin Dashboard</div>
        </div>
        <div class="space-y-1">
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center gap-3 transition-all duration-200" onclick="window.app.currentViewFn = () => window.admin.renderDashboard(); window.admin.renderDashboard()">
            <span class="material-icons-outlined text-[20px]">dashboard</span>
            Dashboard
          </div>
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center gap-3 transition-all duration-200" onclick="window.app.currentViewFn = () => window.admin.renderUsers(); window.admin.renderUsers()">
            <span class="material-icons-outlined text-[20px]">people</span>
            User Management
          </div>
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center gap-3 transition-all duration-200" onclick="window.app.currentViewFn = () => window.admin.renderCampaigns(); window.admin.renderCampaigns()">
            <span class="material-icons-outlined text-[20px]">campaign</span>
            All Campaigns
          </div>
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center gap-3 transition-all duration-200" onclick="window.app.currentViewFn = () => window.admin.renderDeals(); window.admin.renderDeals()">
            <span class="material-icons-outlined text-[20px]">work</span>
            All Deals
          </div>
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center gap-3 transition-all duration-200" onclick="window.app.currentViewFn = () => window.admin.renderWithdrawals(); window.admin.renderWithdrawals()">
            <span class="material-icons-outlined text-[20px]">account_balance_wallet</span>
            Withdrawals
          </div>
        </div>
      `);
    } else if (this.currentMode === 'brand') {
      sidebar.innerHTML = getCommonLayout(`
        <div class="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2">
          <span class="material-icons-outlined text-[#804ee6] text-[18px]">business_center</span>
          <div class="text-xs text-[#804ee6] uppercase tracking-wider font-extrabold">Brand Portal</div>
        </div>
        <div class="space-y-1">
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center gap-3 transition-all duration-200" onclick="window.app.currentViewFn = () => window.brand.renderDashboard(); window.brand.renderDashboard()">
            <span class="material-icons-outlined text-[20px]">bar_chart</span>
            Dashboard
          </div>
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center gap-3 transition-all duration-200" onclick="window.app.currentViewFn = () => window.brand.renderExplore(); window.brand.renderExplore()">
            <span class="material-icons-outlined text-[20px]">search</span>
            Explore Creators
          </div>
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center gap-3 transition-all duration-200" onclick="window.app.currentViewFn = () => window.brand.renderCampaigns(); window.brand.renderCampaigns()">
            <span class="material-icons-outlined text-[20px]">assignment</span>
            My Campaigns
          </div>
        </div>
      `);
    } else {
      sidebar.innerHTML = getCommonLayout(`
        <div class="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2">
          <span class="material-icons-outlined text-[#ff8a3d] text-[18px]">star_outline</span>
          <div class="text-xs text-[#ff8a3d] uppercase tracking-wider font-extrabold">Creator Portal</div>
        </div>
        <div class="space-y-1">
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center gap-3 transition-all duration-200" onclick="window.app.currentViewFn = () => window.influencer.renderDashboard(); window.influencer.renderDashboard()">
            <span class="material-icons-outlined text-[20px]">dashboard</span>
            Dashboard
          </div>
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center gap-3 transition-all duration-200" onclick="window.app.currentViewFn = () => window.influencer.renderCampaigns(); window.influencer.renderCampaigns()">
            <span class="material-icons-outlined text-[20px]">rocket_launch</span>
            My Campaigns
          </div>
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center gap-3 transition-all duration-200" onclick="window.app.currentViewFn = () => window.influencer.renderEarnings(); window.influencer.renderEarnings()">
            <span class="material-icons-outlined text-[20px]">payments</span>
            Earnings
          </div>
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center gap-3 transition-all duration-200" onclick="window.app.currentViewFn = () => window.influencer.renderProfile(); window.influencer.renderProfile()">
            <span class="material-icons-outlined text-[20px]">person</span>
            My Profile
          </div>
        </div>
      `);
    }
  }
};