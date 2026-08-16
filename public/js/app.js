// Main App Module
window.app = {
  currentMode: 'brand',
  notifications: [],
  notificationFilter: 'all', // 'all', 'unread', 'deals', 'campaigns', 'withdrawals'
  notificationInterval: null,
  isNotificationsOpen: false,
  currentViewFn: null,
  knownNotificationIds: new Set(),
  socket: null,
  
  refreshCurrentView() {
    const btn = document.querySelector('button[title="Refresh Latest Data"] span');
    if (btn) btn.classList.add('animate-spin');
    
    this.loadNotifications(true);
    
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
    this.initSocket();
    await this.loadNotifications(true);
    await this.loadInfluencersForBrand();
    this.startNotificationPolling();
    this.setupNotificationClickOutside();
  },

  initSocket() {
    try {
      if (typeof io !== 'undefined') {
        this.socket = io();
        this.socket.on('connect', () => {
          console.log('⚡ Connected to real-time notification stream');
        });
        this.socket.on('notification', (notif) => {
          this.handleIncomingRealtimeNotification(notif);
        });
      }
    } catch (e) {
      console.log('Socket not available, relying on live polling');
    }
  },

  handleIncomingRealtimeNotification(notif) {
    const user = window.auth ? window.auth.currentUser : null;
    if (!user) return;

    // Check if relevant to current user
    const isRelevant = user.role === 'admin' || notif.userId === user.id || notif.userId === 'admin_1' || notif.userId === 'admin';
    if (!isRelevant) return;

    // Avoid duplicate
    if (!this.notifications.some(n => n.id === notif.id)) {
      this.notifications.unshift(notif);
      this.knownNotificationIds.add(notif.id);
    }

    this.updateBadges();

    // Show instant toast notification
    if (window.ui && window.ui.showToast) {
      const icon = notif.icon || '🔔';
      window.ui.showToast(`${icon} <strong>${notif.title}</strong>: ${notif.message}`, 'info');
    }

    // If dropdown is open, re-render in place
    if (this.isNotificationsOpen) {
      this.renderNotificationDropdown();
    }
  },
  
  async loadNotifications(silent = false) {
    try {
      const data = await window.api.getNotifications();
      if (!Array.isArray(data)) return;

      // Check for newly arrived unread notifications
      if (!silent && this.knownNotificationIds.size > 0) {
        const newUnreads = data.filter(n => !n.read && !this.knownNotificationIds.has(n.id));
        if (newUnreads.length > 0) {
          const latest = newUnreads[0];
          if (window.ui && window.ui.showToast) {
            window.ui.showToast(`${latest.icon || '🔔'} <strong>${latest.title}</strong>: ${latest.message}`, 'info');
          }
        }
      }

      this.notifications = data;
      this.notifications.forEach(n => this.knownNotificationIds.add(n.id));
      this.updateBadges();

      if (this.isNotificationsOpen) {
        this.renderNotificationDropdown();
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  },

  updateBadges() {
    const unreadCount = (this.notifications || []).filter(n => !n.read).length;
    
    // Header Bell Badge
    const badge = document.getElementById('notifBadge');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    // Sidebar Notification Badge (if present)
    const sidebarBadge = document.getElementById('sidebarNotifBadge');
    if (sidebarBadge) {
      if (unreadCount > 0) {
        sidebarBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        sidebarBadge.classList.remove('hidden');
      } else {
        sidebarBadge.classList.add('hidden');
      }
    }
  },
  
  async loadInfluencersForBrand() {
    try {
      window.brand.allInfluencers = await window.api.getInfluencers();
    } catch (err) {}
  },
  
  startNotificationPolling() {
    if (this.notificationInterval) clearInterval(this.notificationInterval);
    // Poll every 10 seconds for real-time updates
    this.notificationInterval = setInterval(() => this.loadNotifications(false), 10000);
  },

  setupNotificationClickOutside() {
    if (this._clickOutsideAttached) return;
    this._clickOutsideAttached = true;

    document.addEventListener('click', (e) => {
      if (!this.isNotificationsOpen) return;
      const container = document.getElementById('notificationContainer');
      if (container && !container.contains(e.target)) {
        this.closeNotifications();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isNotificationsOpen) {
        this.closeNotifications();
      }
    });
  },
  
  toggleNotifications(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.isNotificationsOpen) {
      this.closeNotifications();
    } else {
      this.openNotifications();
    }
  },

  openNotifications() {
    this.isNotificationsOpen = true;
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    this.renderNotificationDropdown();
    dropdown.classList.remove('hidden');

    // Smooth open animation
    requestAnimationFrame(() => {
      dropdown.classList.remove('opacity-0', 'scale-95');
      dropdown.classList.add('opacity-100', 'scale-100');
    });

    const btn = document.getElementById('notificationBtn');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  },

  closeNotifications() {
    this.isNotificationsOpen = false;
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    dropdown.classList.remove('opacity-100', 'scale-100');
    dropdown.classList.add('opacity-0', 'scale-95');

    setTimeout(() => {
      if (!this.isNotificationsOpen) {
        dropdown.classList.add('hidden');
      }
    }, 200);

    const btn = document.getElementById('notificationBtn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  },

  setNotificationFilter(filter, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.notificationFilter = filter;
    this.renderNotificationDropdown();
  },

  getFilteredNotifications() {
    const list = this.notifications || [];
    if (this.notificationFilter === 'unread') {
      return list.filter(n => !n.read);
    }
    if (this.notificationFilter === 'deals') {
      return list.filter(n => n.type === 'deal' || (n.title && n.title.toLowerCase().includes('deal')) || (n.message && n.message.toLowerCase().includes('hire')));
    }
    if (this.notificationFilter === 'campaigns') {
      return list.filter(n => n.type === 'campaign' || (n.title && n.title.toLowerCase().includes('campaign')));
    }
    if (this.notificationFilter === 'withdrawals') {
      return list.filter(n => n.type === 'withdrawal' || (n.title && n.title.toLowerCase().includes('withdrawal')) || (n.message && n.message.toLowerCase().includes('withdrawal')));
    }
    return list;
  },

  renderNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    const unreadCount = (this.notifications || []).filter(n => !n.read).length;
    const totalCount = (this.notifications || []).length;
    const filtered = this.getFilteredNotifications();
    const isAdmin = window.auth && window.auth.isAdmin();

    const getIconTheme = (item) => {
      const type = (item.type || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const msg = (item.message || '').toLowerCase();

      if (type === 'deal' || title.includes('hire') || title.includes('deal') || msg.includes('hire')) {
        return { bg: 'bg-purple-100 text-[#804ee6]', icon: 'work' };
      }
      if (type === 'campaign' || title.includes('campaign')) {
        return { bg: 'bg-blue-100 text-blue-600', icon: 'rocket_launch' };
      }
      if (type === 'withdrawal' || title.includes('withdrawal') || msg.includes('payout')) {
        return { bg: 'bg-emerald-100 text-emerald-600', icon: 'payments' };
      }
      if (type === 'user' || title.includes('creator') || title.includes('user') || title.includes('verified')) {
        return { bg: 'bg-amber-100 text-amber-600', icon: 'person' };
      }
      if (type === 'dispute' || title.includes('dispute') || title.includes('rejected')) {
        return { bg: 'bg-red-100 text-red-600', icon: 'warning' };
      }
      return { bg: 'bg-indigo-100 text-indigo-600', icon: 'notifications' };
    };

    dropdown.innerHTML = `
      <div class="flex flex-col max-h-[520px]">
        <!-- Header -->
        <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 notif-dot-pulse"></span>
              <h3 class="font-black text-gray-900 text-sm tracking-tight uppercase">Notifications</h3>
            </div>
            ${unreadCount > 0 ? `<span class="bg-[#804ee6]/10 text-[#804ee6] text-[10px] font-extrabold px-2 py-0.5 rounded-full">${unreadCount} New</span>` : ''}
          </div>
          
          <div class="flex items-center gap-2">
            ${unreadCount > 0 ? `
              <button onclick="window.app.markAllNotificationsRead(event)" class="text-[11px] font-bold text-[#804ee6] hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded-md transition flex items-center gap-1" title="Mark all as read">
                <span class="material-icons-outlined text-[14px]">done_all</span> Mark read
              </button>
            ` : ''}
            <button onclick="window.app.closeNotifications()" class="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition" title="Close">
              <span class="material-icons-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="px-4 py-2 bg-gray-50/70 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto notif-scroll-area">
          <button onclick="window.app.setNotificationFilter('all', event)" 
            class="px-2.5 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${this.notificationFilter === 'all' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200/60'}">
            All (${totalCount})
          </button>
          <button onclick="window.app.setNotificationFilter('unread', event)" 
            class="px-2.5 py-1 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${this.notificationFilter === 'unread' ? 'bg-[#804ee6] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200/60'}">
            Unread ${unreadCount > 0 ? `<span class="w-1.5 h-1.5 rounded-full ${this.notificationFilter === 'unread' ? 'bg-white' : 'bg-red-500'}"></span>` : ''}
          </button>
          <button onclick="window.app.setNotificationFilter('deals', event)" 
            class="px-2.5 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${this.notificationFilter === 'deals' ? 'bg-purple-700 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200/60'}">
            Deals
          </button>
          <button onclick="window.app.setNotificationFilter('campaigns', event)" 
            class="px-2.5 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${this.notificationFilter === 'campaigns' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200/60'}">
            Campaigns
          </button>
          ${isAdmin ? `
            <button onclick="window.app.setNotificationFilter('withdrawals', event)" 
              class="px-2.5 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${this.notificationFilter === 'withdrawals' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200/60'}">
              Payouts
            </button>
          ` : ''}
        </div>

        <!-- Notification List -->
        <div class="overflow-y-auto max-h-80 notif-scroll-area divide-y divide-gray-100/70 bg-white">
          ${filtered.length === 0 ? `
            <div class="p-8 text-center flex flex-col items-center justify-center">
              <div class="w-12 h-12 rounded-full bg-purple-50 text-[#804ee6] flex items-center justify-center mb-3">
                <span class="material-icons-outlined text-2xl">notifications_none</span>
              </div>
              <div class="font-extrabold text-gray-900 text-sm">All caught up! 🎉</div>
              <p class="text-xs text-gray-400 mt-1 max-w-[220px]">
                ${this.notificationFilter === 'unread' ? 'No unread notifications right now.' : 'No notifications found in this view.'}
              </p>
            </div>
          ` : filtered.map(item => {
            const theme = getIconTheme(item);
            const timeStr = window.utils && window.utils.timeAgo ? window.utils.timeAgo(item.createdAt || item.time) : (item.time || 'Just now');
            
            return `
              <div onclick="window.app.handleNotificationClick('${item.id}', event)" 
                class="notif-item p-3.5 flex items-start gap-3 cursor-pointer relative group ${!item.read ? 'unread' : ''}">
                
                <!-- Category Icon -->
                <div class="w-9 h-9 rounded-xl ${theme.bg} flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                  <span class="material-icons-outlined text-[18px]">${theme.icon}</span>
                </div>

                <!-- Notification Content -->
                <div class="flex-1 min-w-0 pr-4">
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="text-xs font-bold text-gray-900 leading-snug truncate">${item.title || 'System Update'}</span>
                    ${!item.read ? '<span class="w-1.5 h-1.5 rounded-full bg-[#804ee6] flex-shrink-0"></span>' : ''}
                  </div>
                  <p class="text-[11px] text-gray-600 leading-snug line-clamp-2">${item.message || ''}</p>
                  <div class="flex items-center gap-2 mt-1.5">
                    <span class="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                      <span class="material-icons-outlined text-[12px]">schedule</span> ${timeStr}
                    </span>
                    <span class="text-[10px] font-bold text-[#804ee6] opacity-0 group-hover:opacity-100 transition-opacity">
                      View details →
                    </span>
                  </div>
                </div>

                <!-- Quick Action Buttons -->
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onclick="event.stopPropagation()">
                  ${!item.read ? `
                    <button onclick="window.app.markNotificationAsRead('${item.id}', event)" 
                      class="p-1 text-gray-400 hover:text-[#804ee6] hover:bg-purple-50 rounded-md transition" title="Mark as read">
                      <span class="material-icons-outlined text-[16px]">done</span>
                    </button>
                  ` : ''}
                  <button onclick="window.app.deleteNotification('${item.id}', event)" 
                    class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Delete notification">
                    <span class="material-icons-outlined text-[16px]">close</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Footer -->
        <div class="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
          ${totalCount > 0 ? `
            <button onclick="window.app.clearAllNotifications(event)" class="text-gray-400 hover:text-red-600 font-bold transition flex items-center gap-1 text-[11px]">
              <span class="material-icons-outlined text-[14px]">delete_sweep</span> Clear All
            </button>
          ` : `<span></span>`}

          ${isAdmin ? `
            <button onclick="window.app.closeNotifications(); window.app.currentViewFn = () => window.admin.renderNotifications(); window.admin.renderNotifications();" 
              class="font-extrabold text-[#804ee6] hover:text-purple-800 transition flex items-center gap-1 text-[11px]">
              Live Audit Log <span class="material-icons-outlined text-[14px]">arrow_forward</span>
            </button>
          ` : `
            <span class="text-[10px] text-gray-400 font-medium">Auto-synced in real time</span>
          `}
        </div>
      </div>
    `;
  },

  async markAllNotificationsRead(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    try {
      await window.api.markNotificationsRead();
      this.notifications.forEach(n => n.read = true);
      this.updateBadges();
      this.renderNotificationDropdown();
      if (window.ui && window.ui.showToast) {
        window.ui.showToast('All notifications marked as read', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  },

  async markNotificationAsRead(id, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    try {
      await window.api.markNotificationAsRead(id);
      const item = this.notifications.find(n => n.id === id);
      if (item) item.read = true;
      this.updateBadges();
      this.renderNotificationDropdown();
    } catch (err) {
      console.error(err);
    }
  },

  async deleteNotification(id, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    try {
      await window.api.deleteNotification(id);
      this.notifications = this.notifications.filter(n => n.id !== id);
      this.updateBadges();
      this.renderNotificationDropdown();
    } catch (err) {
      console.error(err);
    }
  },

  async clearAllNotifications(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    try {
      await window.api.clearAllNotifications();
      this.notifications = [];
      this.updateBadges();
      this.renderNotificationDropdown();
      if (window.ui && window.ui.showToast) {
        window.ui.showToast('All notifications cleared', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  },

  handleNotificationClick(id, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const notif = this.notifications.find(n => n.id === id);
    if (!notif) return;

    // Mark as read in background
    if (!notif.read) {
      this.markNotificationAsRead(id);
    }

    // Close the dropdown
    this.closeNotifications();

    const title = (notif.title || '').toLowerCase();
    const msg = (notif.message || '').toLowerCase();
    const type = (notif.type || '').toLowerCase();
    const isAdmin = window.auth && window.auth.isAdmin();

    // Navigate intelligently based on notification context
    if (type === 'deal' || title.includes('hire') || title.includes('deal') || msg.includes('hire')) {
      if (isAdmin) {
        this.currentViewFn = () => window.admin.renderDeals();
        window.admin.renderDeals();
      } else if (this.currentMode === 'brand') {
        this.currentViewFn = () => window.brand.renderCampaigns();
        window.brand.renderCampaigns();
      } else {
        this.currentViewFn = () => window.influencer.renderCampaigns();
        window.influencer.renderCampaigns();
      }
    } else if (type === 'campaign' || title.includes('campaign') || msg.includes('campaign')) {
      if (isAdmin) {
        this.currentViewFn = () => window.admin.renderCampaigns();
        window.admin.renderCampaigns();
      } else if (this.currentMode === 'brand') {
        this.currentViewFn = () => window.brand.renderCampaigns();
        window.brand.renderCampaigns();
      } else {
        this.currentViewFn = () => window.influencer.renderCampaigns();
        window.influencer.renderCampaigns();
      }
    } else if (type === 'withdrawal' || title.includes('withdrawal') || msg.includes('withdrawal') || msg.includes('payout')) {
      if (isAdmin) {
        this.currentViewFn = () => window.admin.renderWithdrawals();
        window.admin.renderWithdrawals();
      } else {
        this.currentViewFn = () => window.influencer.renderEarnings();
        window.influencer.renderEarnings();
      }
    } else if (type === 'user' || title.includes('creator') || title.includes('user')) {
      if (isAdmin) {
        this.currentViewFn = () => window.admin.renderUsers();
        window.admin.renderUsers();
      }
    } else if (title.includes('verified') || type === 'profile') {
      if (window.auth && window.auth.isInfluencer()) {
        this.currentViewFn = () => window.influencer.renderProfile();
        window.influencer.renderProfile();
      }
    }
  },
  
  switchMode(mode) {
    if (window.auth.isAdmin()) return;
    this.currentMode = mode;
    
    const brandBtn = document.getElementById('brandModeBtn');
    const infBtn = document.getElementById('infModeBtn');
    if (brandBtn && infBtn) {
      brandBtn.className = mode === 'brand' ? 
        'px-4 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm' : 
        'px-4 py-1.5 rounded-md text-sm font-medium text-gray-500';
      infBtn.className = mode === 'influencer' ? 
        'px-4 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm' : 
        'px-4 py-1.5 rounded-md text-sm font-medium text-gray-500';
    }
    
    this.renderSidebar();
    if (mode === 'brand') window.brand.renderDashboard();
    else window.influencer.renderDashboard();
  },
  
  renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const unreadCount = (this.notifications || []).filter(n => !n.read).length;

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
          <div class="sidebar-item px-4 py-3 rounded-lg cursor-pointer text-gray-600 hover:text-[#804ee6] hover:bg-purple-50/50 font-bold flex items-center justify-between transition-all duration-200" onclick="window.app.currentViewFn = () => window.admin.renderNotifications(); window.admin.renderNotifications()">
            <div class="flex items-center gap-3">
              <span class="material-icons-outlined text-[20px]">notifications_active</span>
              Notifications
            </div>
            <span id="sidebarNotifBadge" class="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${unreadCount === 0 ? 'hidden' : ''}">${unreadCount}</span>
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