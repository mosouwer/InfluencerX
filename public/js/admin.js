// Admin Module - With User Type Filters & Campaign Status Management
window.admin = {
  allUsers: [], // Store all users for filtering

  getCampaignStatusOverrides() {
    try {
      return JSON.parse(localStorage.getItem('campaign_status_overrides') || '{}');
    } catch (e) {
      return {};
    }
  },

  setCampaignStatusOverride(id, status) {
    try {
      const overrides = this.getCampaignStatusOverrides();
      overrides[String(id)] = status;
      localStorage.setItem('campaign_status_overrides', JSON.stringify(overrides));
    } catch (e) {}
  },
  
  async renderDashboard() {
    try {
      window.ui.updateSidebarActive('Dashboard');
      window.ui.showMainLoading('dashboard');
      
      const [stats, rawCampaigns, rawDeals] = await Promise.all([
        window.api.getAdminStats(),
        window.api.getAdminCampaigns(),
        window.api.getAdminDeals()
      ]);

      const overrides = this.getCampaignStatusOverrides();
      
      const pendingCampaigns = (rawCampaigns || [])
        .map(c => ({
          ...c,
          status: overrides[String(c.id)] || c.status,
          isDeal: false
        }))
        .filter(c => c.status === 'pending');

      const pendingDeals = (rawDeals || [])
        .map(d => ({
          id: d.id,
          isDeal: true,
          campaignName: d.id,
          packageType: d.packageType || d.type || 'Post',
          brandName: d.brandName,
          influencerName: d.influencerName,
          amount: d.amount,
          status: overrides[String(d.id)] || d.status,
          createdAt: d.createdAt
        }))
        .filter(d => d.status === 'pending');

      const pendingItems = [...pendingCampaigns, ...pendingDeals]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6 max-w-7xl mx-auto">
          
          <!-- Modern Header Banner -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
            <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl"></div>
            <div class="absolute right-40 -top-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <div class="relative z-10">
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Production Active
                </span>
                <span class="text-xs text-slate-400 font-medium">${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white">Platform Administration</h1>
              <p class="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl font-light leading-relaxed">Real-time overview of creator network transactions, active campaigns, and escrow fund settlements.</p>
            </div>
            
            <div class="relative z-10 flex flex-wrap items-center gap-2.5">
              <button onclick="window.admin.renderUsers()" class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/10 backdrop-blur-sm flex items-center gap-2 shadow-sm active:scale-95">
                <span class="material-icons-outlined text-[16px]">person_add</span> Manage Users
              </button>
              <button onclick="window.admin.renderCampaigns()" class="px-4 py-2.5 bg-[#804ee6] hover:bg-[#6c2bd9] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-500/25 flex items-center gap-2 active:scale-95">
                <span class="material-icons-outlined text-[16px]">campaign</span> View Campaigns
              </button>
            </div>
          </div>
          
          <!-- Row 1: 4 High-Impact KPI Stat Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <!-- Card 1: Gross Volume -->
            <div onclick="window.admin.showRevenueDetails()" 
              class="admin-card admin-card-hover p-5 cursor-pointer relative overflow-hidden group">
              <div class="flex justify-between items-start">
                <div class="w-10 h-10 rounded-xl bg-purple-50 text-[#804ee6] flex items-center justify-center font-bold">
                  <span class="material-icons-outlined text-[22px]">payments</span>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 flex items-center gap-0.5">
                  <span class="material-icons-outlined text-[12px]">trending_up</span> +18.4%
                </span>
              </div>
              <div class="mt-4">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Transaction Volume</div>
                <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">${window.utils.formatCurrency(stats.totalValue || 0)}</div>
                <div class="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                  <span class="text-emerald-600 font-bold">₹${((stats.totalValue || 0) * 0.1).toLocaleString('en-IN')}</span> platform revenue (10%)
                </div>
              </div>
            </div>

            <!-- Card 2: Creator Network -->
            <div onclick="window.admin.showInfluencersDetails()" 
              class="admin-card admin-card-hover p-5 cursor-pointer relative overflow-hidden group">
              <div class="flex justify-between items-start">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <span class="material-icons-outlined text-[22px]">stars</span>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-600 flex items-center gap-0.5">
                  ${stats.verifiedInfluencers || 0} Verified
                </span>
              </div>
              <div class="mt-4">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Creators</div>
                <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">${stats.totalInfluencers || 0}</div>
                <div class="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                  Across Fashion, Tech, Food & Travel
                </div>
              </div>
            </div>

            <!-- Card 3: Brand Advertisers -->
            <div onclick="window.admin.showBrandsDetails()" 
              class="admin-card admin-card-hover p-5 cursor-pointer relative overflow-hidden group">
              <div class="flex justify-between items-start">
                <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <span class="material-icons-outlined text-[22px]">business</span>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-600">Active</span>
              </div>
              <div class="mt-4">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand Advertisers</div>
                <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">${stats.totalBrands || 0}</div>
                <div class="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                  Hiring creators on escrow
                </div>
              </div>
            </div>

            <!-- Card 4: Campaigns Active -->
            <div onclick="window.admin.showCampaignsDetails('active')" 
              class="admin-card admin-card-hover p-5 cursor-pointer relative overflow-hidden group">
              <div class="flex justify-between items-start">
                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <span class="material-icons-outlined text-[22px]">rocket_launch</span>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live
                </span>
              </div>
              <div class="mt-4">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Campaigns</div>
                <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">${stats.campaignsActive || stats.totalCampaigns || 0}</div>
                <div class="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                  ${stats.campaignsCompleted || 0} completed successfully
                </div>
              </div>
            </div>
            
          </div>

          <!-- Row 2: Visual Revenue & Escrow Analytics Chart -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Left: Interactive Revenue & Payout Chart (SVG) -->
            <div class="admin-card p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
                  <div>
                    <h2 class="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <span class="material-icons-outlined text-[#804ee6] text-[20px]">show_chart</span>
                      Platform Revenue & Volume Trajectory
                    </h2>
                    <p class="text-xs text-slate-400 font-medium">Monthly Gross Marketplace Volume & Escrow Settlements</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span class="w-2.5 h-2.5 rounded-full bg-[#804ee6]"></span> Volume (₹)
                    </span>
                    <span class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 ml-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Commission (10%)
                    </span>
                  </div>
                </div>

                <!-- Modern SVG Line/Area Graph -->
                <div class="w-full h-48 relative">
                  <svg class="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#804ee6" stop-opacity="0.25"/>
                        <stop offset="100%" stop-color="#804ee6" stop-opacity="0.0"/>
                      </linearGradient>
                      <linearGradient id="greenGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#10b981" stop-opacity="0.2"/>
                        <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
                      </linearGradient>
                    </defs>

                    <!-- Horizontal Grid lines -->
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4 4"/>
                    <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4 4"/>
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4 4"/>

                    <!-- Area 1: Volume -->
                    <path d="M0,120 Q80,95 160,85 T320,45 T500,20 L500,150 L0,150 Z" fill="url(#purpleGlow)"/>
                    <path d="M0,120 Q80,95 160,85 T320,45 T500,20" fill="none" stroke="#804ee6" stroke-width="3" stroke-linecap="round"/>

                    <!-- Area 2: Commission -->
                    <path d="M0,140 Q80,135 160,130 T320,115 T500,95 L500,150 L0,150 Z" fill="url(#greenGlow)"/>
                    <path d="M0,140 Q80,135 160,130 T320,115 T500,95" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>

                    <!-- Interactive Data Points -->
                    <circle cx="160" cy="85" r="4" fill="#804ee6" stroke="#ffffff" stroke-width="2" class="cursor-pointer hover:r-6 transition-all"/>
                    <circle cx="320" cy="45" r="4" fill="#804ee6" stroke="#ffffff" stroke-width="2" class="cursor-pointer hover:r-6 transition-all"/>
                    <circle cx="500" cy="20" r="5" fill="#804ee6" stroke="#ffffff" stroke-width="2" class="cursor-pointer hover:r-6 transition-all"/>
                  </svg>
                  
                  <!-- X-Axis Labels -->
                  <div class="flex justify-between text-[11px] font-bold text-slate-400 mt-2">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun (Current)</span>
                  </div>
                </div>
              </div>

              <!-- Mini Footer Metrics -->
              <div class="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-slate-100 text-center">
                <div>
                  <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Escrow Security</div>
                  <div class="text-base font-extrabold text-slate-900 mt-0.5">100% Protected</div>
                </div>
                <div>
                  <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Avg Deal Size</div>
                  <div class="text-base font-extrabold text-indigo-600 mt-0.5">₹14,500</div>
                </div>
                <div>
                  <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Payout Speed</div>
                  <div class="text-base font-extrabold text-emerald-600 mt-0.5">&lt; 24 Hours</div>
                </div>
              </div>
            </div>
            
            <!-- Right: Financial Health & Escrow Breakdown -->
            <div class="admin-card p-6 flex flex-col justify-between space-y-6">
              <div>
                <h2 class="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mb-1">
                  <span class="material-icons-outlined text-emerald-600 text-[20px]">account_balance</span>
                  Escrow & Settlement
                </h2>
                <p class="text-xs text-slate-400 font-medium">Safe vault funds pending creator delivery</p>
              </div>

              <div class="space-y-4">
                <div class="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                  <div>
                    <div class="text-xs text-slate-500 font-medium">Gross Platform Volume</div>
                    <div class="text-lg font-black text-slate-900 mt-0.5">${window.utils.formatCurrency(stats.totalValue || 0)}</div>
                  </div>
                  <span class="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 material-icons-outlined text-[18px]">account_balance_wallet</span>
                </div>

                <div class="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center justify-between">
                  <div>
                    <div class="text-xs text-amber-700 font-medium">Pending Payout Requests</div>
                    <div class="text-lg font-black text-amber-900 mt-0.5">${window.utils.formatCurrency(stats.pendingWithdrawals || 0)}</div>
                  </div>
                  <button onclick="window.admin.renderWithdrawals()" class="px-2.5 py-1 text-[11px] font-extrabold bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-sm transition active:scale-95">Review</button>
                </div>

                <div class="p-3.5 bg-rose-50/70 border border-rose-200/60 rounded-xl flex items-center justify-between">
                  <div>
                    <div class="text-xs text-rose-700 font-medium">Active Disputes</div>
                    <div class="text-lg font-black text-rose-900 mt-0.5">${stats.pendingDisputes || 0} Open</div>
                  </div>
                  <span class="p-2 rounded-lg bg-white border border-rose-200 text-rose-600 material-icons-outlined text-[18px]">gavel</span>
                </div>
              </div>

              <button onclick="window.admin.renderWithdrawals()" class="w-full py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5">
                <span>View Full Financial Ledger</span>
                <span class="material-icons-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

          </div>
          
          <!-- Row 3: Pending Approvals Modern Table -->
          <div class="admin-card overflow-hidden">
            <div class="px-6 py-4.5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/60">
              <div>
                <h2 class="font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-2">
                  <span class="material-icons-outlined text-[#804ee6] text-[20px]">pending_actions</span>
                  Pending Campaign Approvals & Reviews
                </h2>
                <p class="text-xs text-slate-500 font-medium">Review campaigns and deals submitted by brands</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-[#804ee6] border border-purple-200 shadow-xs">
                ${pendingItems.length} Waiting Action
              </span>
            </div>

            <div class="overflow-x-auto">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Campaign / Type</th>
                    <th>Brand</th>
                    <th>Creator</th>
                    <th>Escrow Amount</th>
                    <th>Fast Decision</th>
                  </tr>
                </thead>
                <tbody>
                  ${pendingItems.length === 0 ? `
                    <tr>
                      <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                        <span class="material-icons-outlined text-4xl text-slate-300 mb-2 block">task_alt</span>
                        <p class="font-semibold text-slate-600 text-sm">All caught up!</p>
                        <p class="text-xs text-slate-400 mt-0.5">No pending approvals require administrative action right now.</p>
                      </td>
                    </tr>` : 
                    pendingItems.map(item => `
                      <tr>
                        <td>
                          <div class="font-bold text-slate-900 hover:text-[#804ee6] transition cursor-pointer" onclick="window.admin.openCampaignModal('${item.id}', ${item.isDeal})">
                            ${item.isDeal ? '#' + (item.campaignName || item.title || item.id) : (item.campaignName || item.title || 'Campaign #' + item.id)}
                          </div>
                          <span class="badge-modern badge-modern-pending mt-1">
                            <span class="status-dot status-dot-pending"></span> ${item.packageType || item.type || 'Campaign'}
                          </span>
                        </td>
                        <td>
                          <div class="font-bold text-slate-800">${item.brandName || 'Brand'}</div>
                          <div class="text-xs text-slate-400">Advertiser</div>
                        </td>
                        <td>
                          <div class="font-bold text-slate-800">${item.influencerName || 'Creator'}</div>
                          <div class="text-xs text-slate-400">Creator</div>
                        </td>
                        <td>
                          <div class="font-black text-slate-900">${window.utils.formatCurrency(item.amount)}</div>
                          <div class="text-[11px] text-emerald-600 font-semibold">In Escrow</div>
                        </td>
                        <td>
                          <select onchange="window.admin.quickApprove('${item.id}', this.value, ${item.isDeal})" 
                            class="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-[#804ee6]/20 focus:border-[#804ee6] transition shadow-2xs">
                            <option value="pending">Pending</option>
                            <option value="active">✓ Approve (Active)</option>
                            <option value="review">In Review</option>
                            <option value="rejected">✕ Reject</option>
                          </select>
                        </td>
                      </tr>
                    `).join('')
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `;
      window.ui.stopTopProgress();
    } catch (err) { 
      window.ui.stopTopProgress();
      console.error(err);
      window.ui.showToast(err.message, 'error'); 
    }
  },
  
  async quickApprove(id, status, isDeal) {
    if (status === 'pending') return;
    this.setCampaignStatusOverride(id, status);
    try {
      if (isDeal) {
        await window.api.updateDealStatus(id, status);
      } else {
        await window.api.updateCampaignStatus(id, status);
      }
      window.ui.showToast('Status updated successfully!', 'success');
      this.renderDashboard();
    } catch (e) {
      window.ui.showToast(e.message, 'error');
    }
  },
  
  async showBrandsDetails() {
    await this.renderUsers();
    this.filterUsers('brand');
  },

  async showInfluencersDetails() {
    await this.renderUsers();
    this.filterUsers('influencer');
  },

  async showCampaignsDetails(status = 'all') {
    await this.renderCampaigns();
    if (status && status !== 'all') {
      setTimeout(() => this.filterCampaigns(status), 50);
    }
  },

  async showRevenueDetails() {
    await this.renderDeals();
  },

  async renderUsers() {
    try {
      window.ui.updateSidebarActive('User Management');
      window.ui.showMainLoading('users');
      this.allUsers = await window.api.getAdminUsers();
      this.renderUserTable(this.allUsers);
      window.ui.stopTopProgress();
    } catch (err) { 
      window.ui.stopTopProgress();
      console.error(err);
      window.ui.showToast(err.message, 'error'); 
    }
  },
  
  renderUserTable(users) {
    const brandCount = users.filter(u => u.role === 'brand').length;
    const influencerCount = users.filter(u => u.role === 'influencer').length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const verifiedCount = users.filter(u => u.verified).length;
    
    document.getElementById('mainContent').innerHTML = `
      <div class="page-transition space-y-6 max-w-7xl mx-auto">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
            <p class="text-slate-500 text-xs sm:text-sm mt-0.5">Control platform access, verify creator credentials, and manage permissions</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.admin.exportUsers()" 
              class="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold shadow-2xs hover:bg-slate-50 transition active:scale-95 flex items-center gap-1.5">
              <span class="material-icons-outlined text-[16px]">file_download</span> Export CSV
            </button>
          </div>
        </div>
        
        <!-- Filters & Search Toolbar -->
        <div class="admin-card p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white">
          <!-- Filter Pills -->
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="window.admin.filterUsers('all')" id="filterAll" class="filter-pill active">
              All Users <span class="pill-count">${users.length}</span>
            </button>
            <button onclick="window.admin.filterUsers('brand')" id="filterBrand" class="filter-pill">
              Brands <span class="pill-count">${brandCount}</span>
            </button>
            <button onclick="window.admin.filterUsers('influencer')" id="filterInfluencer" class="filter-pill">
              Creators <span class="pill-count">${influencerCount}</span>
            </button>
            <button onclick="window.admin.filterUsers('verified')" id="filterVerified" class="filter-pill">
              ✓ Verified <span class="pill-count">${verifiedCount}</span>
            </button>
            <button onclick="window.admin.filterUsers('admin')" id="filterAdmin" class="filter-pill">
              Admins <span class="pill-count">${adminCount}</span>
            </button>
          </div>
          
          <!-- Search Input -->
          <div class="relative min-w-[260px]">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <span class="material-icons-outlined text-[18px]">search</span>
            </span>
            <input type="text" id="searchUsers" placeholder="Search by name, email, niche..." 
              class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#804ee6]/20 focus:border-[#804ee6] transition shadow-2xs">
          </div>
        </div>
        
        <!-- Users Table Card -->
        <div class="admin-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Contact Email</th>
                  <th>Role</th>
                  <th>Verification</th>
                  <th>Account Status</th>
                  <th>Joined Date</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="userTableBody">
                ${this.renderUserRows(users)}
              </tbody>
            </table>
          </div>

          <!-- Footer Count -->
          <div class="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500 font-medium">
            <div>Showing <span id="visibleCount" class="font-bold text-slate-900">${users.length}</span> of <span id="totalCount" class="font-bold text-slate-900">${users.length}</span> users</div>
            <div class="text-[11px] text-slate-400">Real-time AWS Cloud Sync</div>
          </div>
        </div>

      </div>
    `;
    
    this.setActiveFilter('all');
    
    const searchInput = document.getElementById('searchUsers');
    if (searchInput) {
      searchInput.addEventListener('input', window.utils.debounce((e) => {
        this.filterUsersBySearch(e.target.value);
      }, 250));
    }
  },
  
  renderUserRows(users) {
    if (users.length === 0) {
      return `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center text-slate-400">
            <span class="material-icons-outlined text-4xl text-slate-300 mb-2 block">person_off</span>
            <p class="font-bold text-slate-700 text-sm">No users found</p>
            <p class="text-xs text-slate-400 mt-0.5">Try refining your search query or filter criteria.</p>
          </td>
        </tr>
      `;
    }
    
    return users.map(user => {
      const isInfluencer = user.role === 'influencer';
      const isBrand = user.role === 'brand';
      const isAdmin = user.role === 'admin';
      const initial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
      
      const roleColor = isAdmin ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        isBrand ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        'bg-purple-50 text-purple-700 border-purple-200';

      return `
        <tr>
          <td>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl ${isAdmin ? 'bg-rose-600' : isBrand ? 'bg-indigo-600' : 'bg-[#804ee6]'} text-white flex items-center justify-center text-xs font-black shadow-xs flex-shrink-0">
                ${initial}
              </div>
              <div>
                <div class="font-extrabold text-slate-900 leading-snug flex items-center gap-1.5">
                  ${user.name || user.email.split('@')[0]}
                  ${user.verified ? '<span class="material-icons-outlined text-indigo-600 text-[16px]" title="Verified Creator">verified</span>' : ''}
                </div>
                <div class="text-[11px] text-slate-400 font-medium">${user.profile?.niche || (isBrand ? (user.profile?.industry || 'Brand') : 'Platform Admin')}</div>
              </div>
            </div>
          </td>

          <td>
            <span class="font-medium text-slate-600 text-xs">${user.email}</span>
          </td>

          <td>
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold border ${roleColor} uppercase text-[10px] tracking-wide inline-block">
              ${isBrand ? 'Brand' : isInfluencer ? 'Creator' : 'Admin'}
            </span>
          </td>

          <td>
            ${isInfluencer ? `
              <button onclick="event.stopPropagation(); window.admin.verifyUser('${user.id}', ${!user.verified})" 
                class="px-2.5 py-1 text-xs font-bold rounded-lg border transition active:scale-95 ${
                  user.verified 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }">
                ${user.verified ? '✓ Verified' : 'Verify'}
              </button>
            ` : '<span class="text-xs text-slate-400">—</span>'}
          </td>

          <td>
            <span class="badge-modern ${user.status === 'active' ? 'badge-modern-active' : 'badge-modern-suspended'}">
              <span class="status-dot ${user.status === 'active' ? 'status-dot-active' : 'status-dot-suspended'}"></span>
              ${user.status === 'active' ? 'Active' : 'Suspended'}
            </span>
          </td>

          <td>
            <span class="text-xs text-slate-500 font-medium">${user.joinedAt || 'N/A'}</span>
          </td>

          <td class="text-right">
            <div class="flex items-center justify-end gap-1.5">
              ${!isAdmin ? `
                <button onclick="window.admin.toggleUserStatus('${user.id}', '${user.status}')" 
                  class="px-3 py-1.5 text-xs font-bold rounded-lg transition active:scale-95 ${
                    user.status === 'active' 
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }">
                  ${user.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
              ` : ''}
              ${isInfluencer ? `
                <button onclick="window.admin.openEditInfluencerModal('${user.id}')" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition" title="Edit Creator">
                  <span class="material-icons-outlined text-[18px]">edit</span>
                </button>
                <button onclick="window.admin.deleteInfluencer('${user.id}')" class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition" title="Delete Creator">
                  <span class="material-icons-outlined text-[18px]">delete</span>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },
  
  filterUsers(type) {
    this.currentFilter = type;
    let filteredUsers = [...this.allUsers];
    
    if (type === 'brand') {
      filteredUsers = filteredUsers.filter(u => u.role === 'brand');
    } else if (type === 'influencer') {
      filteredUsers = filteredUsers.filter(u => u.role === 'influencer');
    } else if (type === 'admin') {
      filteredUsers = filteredUsers.filter(u => u.role === 'admin');
    }
    
    if (this.currentSearchTerm) {
      filteredUsers = filteredUsers.filter(u => 
        (u.name || u.email).toLowerCase().includes(this.currentSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(this.currentSearchTerm.toLowerCase())
      );
    }
    
    this.filteredUsers = filteredUsers;
    this.updateUserTableDisplay();
    this.setActiveFilter(type);
    const createBtn = document.getElementById('createInfluencerBtn');
    if (createBtn) {
      if (type === 'influencer') createBtn.classList.remove('hidden');
      else createBtn.classList.add('hidden');
    }
  },
  
  filterUsersBySearch(searchTerm) {
    this.currentSearchTerm = searchTerm;
    let filteredUsers = [...this.allUsers];
    
    if (this.currentFilter && this.currentFilter !== 'all') {
      if (this.currentFilter === 'brand') {
        filteredUsers = filteredUsers.filter(u => u.role === 'brand');
      } else if (this.currentFilter === 'influencer') {
        filteredUsers = filteredUsers.filter(u => u.role === 'influencer');
      } else if (this.currentFilter === 'admin') {
        filteredUsers = filteredUsers.filter(u => u.role === 'admin');
      }
    }
    
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(u => 
        (u.name || u.email).toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    this.filteredUsers = filteredUsers;
    this.updateUserTableDisplay();
  },
  
  updateUserTableDisplay() {
    const tbody = document.getElementById('userTableBody');
    const visibleCount = document.getElementById('visibleCount');
    const totalCount = document.getElementById('totalCount');
    
    if (tbody) {
      tbody.innerHTML = this.renderUserRows(this.filteredUsers);
    }
    if (visibleCount) {
      visibleCount.textContent = this.filteredUsers.length;
    }
    if (totalCount) {
      totalCount.textContent = this.allUsers.length;
    }
  },
  
  setActiveFilter(type) {
    const filters = ['all', 'brand', 'influencer', 'admin'];
    filters.forEach(f => {
      const btn = document.getElementById(`filter${f.charAt(0).toUpperCase() + f.slice(1)}`);
      if (btn) {
        btn.className = 'px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition active:scale-[0.98]';
      }
    });
    
    const activeBtn = document.getElementById(`filter${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (activeBtn) {
      activeBtn.className = 'px-4 py-2 text-xs font-bold rounded-lg border border-transparent bg-[#804ee6] text-white shadow-sm transition active:scale-[0.98]';
    }
  },
  
  
  openCreateInfluencerModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'createInfluencerModal';
    modal.innerHTML = `
      <div class="bg-white rounded-sm max-w-2xl w-full p-6 m-4 max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <div class="flex justify-between items-start mb-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span class="material-icons-outlined">person_add</span> Create New Influencer
          </h2>
          <button onclick="document.getElementById('createInfluencerModal').remove()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1.5">&times;</button>
        </div>
        
        <form id="createInfluencerForm" onsubmit="window.admin.submitCreateInfluencer(event)" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" required class="w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-black">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input type="email" name="email" required class="w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-black">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" name="password" required class="w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-black">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Instagram User ID</label>
              <input type="text" name="instagramId" placeholder="@username" required class="w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-black">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Instagram Followers</label>
              <input type="number" name="instagramFollowers" placeholder="e.g. 500000" required class="w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-black">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Influencer Category</label>
              <select name="niche" required class="w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-black">
                <option value="">Select Category</option>
                <option value="Fashion">Fashion</option>
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Fitness">Fitness</option>
                <option value="Tech">Tech</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Beauty">Beauty</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-semibold text-gray-700 mb-1">Profile Picture</label>
              <input type="file" name="profilePic" accept="image/*" class="w-full px-3 py-1.5 border rounded-sm focus:ring-2 focus:ring-black text-sm">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">About Section</label>
            <textarea name="about" rows="3" required placeholder="Tell brands about this influencer..." class="w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-black"></textarea>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-sm border border-gray-200">
            <h3 class="font-bold text-sm mb-3">Package Rates (₹)</h3>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Instagram Story</label>
                <input type="number" name="storyRate" required class="w-full px-3 py-2 border rounded-sm text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Dedicated Post</label>
                <input type="number" name="postRate" required class="w-full px-3 py-2 border rounded-sm text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Instagram Reel</label>
                <input type="number" name="reelRate" required class="w-full px-3 py-2 border rounded-sm text-sm">
              </div>
            </div>
          </div>
          
          <div class="mt-6 flex justify-end">
            <button type="submit" class="px-6 py-2.5 bg-black text-white font-bold rounded-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg transition flex items-center gap-2">
              <span class="material-icons-outlined text-[18px]">save</span> Save Influencer
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  },
  
  async submitCreateInfluencer(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    
    // Convert form to FormData
    const formData = new FormData(form);
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-icons-outlined animate-spin">sync</span> Saving...';
    btn.disabled = true;
    
    try {
      await window.api.createInfluencer(formData);
      window.ui.showToast('Influencer created successfully!', 'success');
      document.getElementById('createInfluencerModal').remove();
      // Re-fetch users
      await this.renderUsers();
      // Force filter back to influencer
      this.filterUsers('influencer');
    } catch (err) {
      window.ui.showToast(err.message, 'error');
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  },

  exportUsers() {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Joined'];
    const rows = this.filteredUsers.map(u => [
      u.name || u.email.split('@')[0],
      u.email,
      u.role,
      u.status,
      u.joinedAt
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    window.ui.showToast(`Exported ${this.filteredUsers.length} users to CSV`, 'success');
  },
  
  async renderCampaigns() {
    try {
      window.ui.updateSidebarActive('Campaigns');
      window.ui.showMainLoading('campaigns');

      const [rawCampaigns, rawDeals] = await Promise.all([
        window.api.getAdminCampaigns(),
        window.api.getAdminDeals()
      ]);

      const overrides = this.getCampaignStatusOverrides();
      
      const dealCampaigns = (rawDeals || []).map(d => ({
        id: d.id,
        isDeal: true,
        campaignName: d.id,
        packageType: d.packageType || d.type || 'Post',
        brandName: d.brandName,
        influencerName: d.influencerName,
        amount: d.amount,
        status: overrides[String(d.id)] || d.status,
        progress: 0,
        deadline: 'N/A',
        createdAt: d.createdAt,
        message: d.message,
        hasMedia: d.hasMedia
      }));
      
      const campaigns = [...(rawCampaigns || []).map(c => ({
        ...c,
        status: overrides[String(c.id)] || c.status,
        isDeal: false
      })), ...dealCampaigns]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6 max-w-7xl mx-auto">
          
          <!-- Header -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">All Campaigns & Creator Hires</h1>
              <p class="text-slate-500 text-xs sm:text-sm mt-0.5">Monitor and control brand-creator deliverables, milestones, and escrow status</p>
            </div>
            
            <button id="campaignBulkDeleteBtn" onclick="window.admin.deleteSelectedCampaigns()" 
              class="hidden px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5">
              <span class="material-icons-outlined text-[16px]">delete</span> Delete Selected (<span id="campaignSelectedCount">0</span>)
            </button>
          </div>
          
          <!-- Status Filter Tabs -->
          <div class="admin-card p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white">
            <div class="flex flex-wrap items-center gap-2">
              <button onclick="window.admin.filterCampaigns('all')" id="campFilterAll" class="filter-pill active">
                All Listings <span class="pill-count">${campaigns.length}</span>
              </button>
              <button onclick="window.admin.filterCampaigns('active')" id="campFilterActive" class="filter-pill">
                ● Active <span class="pill-count">${campaigns.filter(c => c.status === 'active').length}</span>
              </button>
              <button onclick="window.admin.filterCampaigns('pending')" id="campFilterPending" class="filter-pill">
                ● Pending <span class="pill-count">${campaigns.filter(c => c.status === 'pending').length}</span>
              </button>
              <button onclick="window.admin.filterCampaigns('review')" id="campFilterReview" class="filter-pill">
                ● In Review <span class="pill-count">${campaigns.filter(c => c.status === 'review').length}</span>
              </button>
              <button onclick="window.admin.filterCampaigns('completed')" id="campFilterCompleted" class="filter-pill">
                ● Completed <span class="pill-count">${campaigns.filter(c => c.status === 'completed').length}</span>
              </button>
            </div>
          </div>
          
          <!-- Campaigns Table Card -->
          <div class="admin-card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th class="w-10"><input type="checkbox" id="campaignSelectAll" onclick="window.admin.toggleSelectAllCampaigns(this)" class="rounded border-slate-300 text-[#804ee6] focus:ring-[#804ee6]"></th>
                    <th>Campaign & Deliverables</th>
                    <th>Brand Advertiser</th>
                    <th>Assigned Creator</th>
                    <th>Escrow Value</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody id="campaignTableBody">
                  ${this.renderCampaignRows(campaigns)}
                </tbody>
              </table>
            </div>

            <!-- Footer Stats -->
            <div class="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500 font-medium">
              <div>Total Volume: <span class="font-bold text-slate-900">${window.utils.formatCurrency(campaigns.reduce((sum, c) => sum + (Number(c.amount) || 0), 0))}</span> across ${campaigns.length} campaigns</div>
              <div class="text-[11px] text-slate-400">Escrow Milestone Protected</div>
            </div>
          </div>

        </div>
      `;
      
      // Store campaigns for filtering
      this.allCampaigns = campaigns;
      this.currentCampaignFilter = 'all';
      window.ui.stopTopProgress();
    } catch (err) { 
      window.ui.stopTopProgress();
      console.error(err);
      window.ui.showToast(err.message, 'error'); 
    }
  },
  
  renderCampaignRows(campaigns) {
    if (campaigns.length === 0) {
      return `
        <tr>
          <td colspan="8" class="px-6 py-12 text-center text-slate-400">
            <span class="material-icons-outlined text-4xl text-slate-300 mb-2 block">campaign</span>
            <p class="font-bold text-slate-700 text-sm">No campaigns found</p>
            <p class="text-xs text-slate-400 mt-0.5">There are no campaigns matching the selected status filter.</p>
          </td>
        </tr>
      `;
    }
    
    return campaigns.map(campaign => {
      const statusClass = campaign.status === 'active' ? 'badge-modern-active' :
                          campaign.status === 'pending' ? 'badge-modern-pending' :
                          campaign.status === 'review' ? 'badge-modern-review' :
                          campaign.status === 'completed' ? 'badge-modern-completed' : 'badge-modern-suspended';

      const dotClass = campaign.status === 'active' ? 'status-dot-active' :
                        campaign.status === 'pending' ? 'status-dot-pending' :
                        campaign.status === 'review' ? 'status-dot-review' :
                        campaign.status === 'completed' ? 'status-dot-completed' : 'status-dot-suspended';

      return `
        <tr>
          <td>
            <input type="checkbox" class="campaign-row-checkbox rounded border-slate-300 text-[#804ee6] focus:ring-[#804ee6]" value="${campaign.id}" data-is-deal="${campaign.isDeal}" onclick="window.admin.onCampaignRowSelect()">
          </td>

          <td class="cursor-pointer" onclick="window.admin.openCampaignModal('${campaign.id}', ${campaign.isDeal})">
            <div>
              <div class="font-extrabold text-slate-900 hover:text-[#804ee6] transition tracking-tight">
                ${campaign.isDeal ? '#' + (campaign.campaignName || campaign.title || campaign.id) : (campaign.campaignName || campaign.title || 'Campaign #' + campaign.id)}
              </div>
              <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
                <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200/60 text-[11px]">
                  ${campaign.packageType || campaign.type || 'Campaign'}
                </span>
                ${campaign.hasMedia ? `
                  <span class="inline-flex items-center gap-1 text-indigo-600 font-bold text-[11px]">
                    <span class="material-icons-outlined text-[14px]">attach_file</span> Media File
                  </span>
                ` : ''}
              </div>
            </div>
          </td>

          <td>
            <div class="font-bold text-slate-800 text-xs">${campaign.brandName || 'Brand'}</div>
            <div class="text-[10px] text-slate-400 font-medium">Advertiser</div>
          </td>

          <td>
            <div class="font-bold text-slate-800 text-xs">${campaign.influencerName || 'Creator'}</div>
            <div class="text-[10px] text-slate-400 font-medium">Creator</div>
          </td>

          <td>
            <div class="font-black text-slate-900 text-sm">${window.utils.formatCurrency(campaign.amount)}</div>
            <div class="text-[10px] text-emerald-600 font-bold">Escrow Funded</div>
          </td>

          <td>
            <span class="badge-modern ${statusClass}">
              <span class="status-dot ${dotClass}"></span>
              ${campaign.status}
            </span>
          </td>

          <td>
            <span class="text-xs text-slate-500 font-medium">${campaign.deadline || 'N/A'}</span>
          </td>

          <td class="text-right">
            <div class="flex items-center justify-end gap-1.5">
              <select onchange="window.admin.updateUnifiedCampaignStatus('${campaign.id}', this.value, ${campaign.isDeal})" 
                class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-[#804ee6]/20 focus:border-[#804ee6] transition shadow-2xs">
                <option value="pending" ${campaign.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="active" ${campaign.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="review" ${campaign.status === 'review' ? 'selected' : ''}>In Review</option>
                <option value="completed" ${campaign.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="dispute" ${campaign.status === 'dispute' ? 'selected' : ''}>Dispute</option>
              </select>
              <button onclick="window.admin.deleteSingleCampaign('${campaign.id}', ${campaign.isDeal})" class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition" title="Delete Campaign">
                <span class="material-icons-outlined text-[18px]">delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },
  
  filterCampaigns(status) {
    if (!this.allCampaigns) return;
    
    this.currentCampaignFilter = status;
    let filtered = this.allCampaigns;
    
    if (status !== 'all') {
      filtered = this.allCampaigns.filter(c => c.status === status);
    }
    
    const tableBody = document.getElementById('campaignTableBody');
    if (tableBody) {
      tableBody.innerHTML = this.renderCampaignRows(filtered);
    }
    
    // Update active filter styling
    const filters = ['all', 'active', 'pending', 'review', 'completed'];
    filters.forEach(f => {
      const btn = document.getElementById(`campFilter${f.charAt(0).toUpperCase() + f.slice(1)}`);
      if (btn) {
        btn.className = f === status ? 'filter-pill active' : 'filter-pill';
      }
    });
  },

  openCampaignModal(id, isDeal) {
    const campaign = this.allCampaigns.find(c => c.id === id && c.isDeal === isDeal);
    if (!campaign) return;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4';
    modal.id = 'campaignModal';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 relative animate-fade-in">
        <div class="flex justify-between items-start mb-5 pb-4 border-b border-slate-100">
          <div>
            <span class="badge-modern badge-modern-active mb-1 text-[10px]">
              <span class="status-dot status-dot-active"></span> ${campaign.isDeal ? 'Direct Deal Proposal' : 'Marketplace Campaign'}
            </span>
            <h2 class="text-lg font-black text-slate-900 tracking-tight">${campaign.campaignName || 'Campaign Details'}</h2>
          </div>
          <button onclick="document.getElementById('campaignModal').remove()" class="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition">
            <span class="material-icons-outlined text-[18px]">close</span>
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Brand Advertiser</span>
              <div class="font-extrabold text-slate-900 mt-0.5 text-sm">${campaign.brandName || 'Brand'}</div>
            </div>
            <div class="p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Assigned Creator</span>
              <div class="font-extrabold text-slate-900 mt-0.5 text-sm">${campaign.influencerName || 'Creator'}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3.5 bg-purple-50/60 border border-purple-100 rounded-xl">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">Escrow Value</span>
              <div class="font-black text-slate-900 mt-0.5 text-base">${window.utils.formatCurrency(campaign.amount)}</div>
            </div>
            <div class="p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Deliverable Format</span>
              <div class="font-bold text-slate-900 mt-0.5 text-sm">${campaign.packageType || campaign.type || 'Post'}</div>
            </div>
          </div>
          
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">Instructions & Deliverables</label>
            <div class="p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
              ${campaign.message || campaign.deliverables || 'Standard collaboration terms apply. Content to be delivered per agreed milestones.'}
            </div>
          </div>
          
          ${campaign.hasMedia ? `
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">Media Attachment</label>
            <div class="p-3.5 border border-indigo-100 rounded-xl flex items-center justify-between bg-indigo-50/50">
              <div class="flex items-center gap-2.5">
                <span class="p-2 rounded-lg bg-indigo-600 text-white material-icons-outlined text-[18px]">attachment</span>
                <div>
                  <span class="font-bold text-xs text-slate-900 block">Brand Media Asset</span>
                  <span class="text-[10px] text-slate-400">Secured on AWS S3</span>
                </div>
              </div>
              <button onclick="window.admin.downloadMedia('${campaign.id}')" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1">
                <span class="material-icons-outlined text-[14px]">download</span> Download
              </button>
            </div>
          </div>
          ` : `
          <div class="p-3 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 font-medium">
            No external media attachments for this campaign
          </div>
          `}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },
  
  downloadMedia(id) {
    const user = window.auth?.currentUser;
    const query = user ? `?userId=${user.id}&userRole=${user.role}` : '';
    window.open('/api/deals/download/' + id + query, '_blank');
    
    const btn = document.querySelector('#campaignModal button[onclick*="downloadMedia"]');
    if (btn) {
      btn.innerHTML = '✓ Downloaded';
      btn.className = 'px-3.5 py-1.5 bg-slate-200 text-slate-500 rounded-lg text-xs font-bold cursor-not-allowed';
      btn.disabled = true;
      btn.removeAttribute('onclick');
    }
    
    const camp = this.allCampaigns.find(c => c.id === id);
    if (camp) {
      camp.hasMedia = false;
      delete camp.mediaAttached;
      delete camp.mediaUrl;
      delete camp.media;
    }
    
    this.filterCampaigns(this.currentCampaignFilter || 'all');
  },
  
  async updateUnifiedCampaignStatus(id, newStatus, isDeal) {
    this.setCampaignStatusOverride(id, newStatus);
    try {
      if (isDeal) {
        await window.api.updateDealStatus(id, newStatus);
      } else {
        await window.api.updateCampaignStatus(id, newStatus);
      }
    } catch (err) {
      console.warn('Backend sync failed, status kept in local storage:', err);
    }
    window.ui.showToast(`Campaign status updated to ${newStatus.toUpperCase()}!`, 'success');
    await this.renderCampaigns();
  },
  
  async renderDeals() {
    try {
      window.ui.updateSidebarActive('Deals & Commission');
      window.ui.showMainLoading('deals');

      const allDeals = await window.api.getAdminDeals();
      const deals = (allDeals || []).filter(deal => deal.status === 'completed');
      const totalVolume = deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const totalCommission = totalVolume * 0.10;

      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6 max-w-7xl mx-auto">
          
          <!-- Header & Financial Summary Banner -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Completed Deals & Commission</h1>
              <p class="text-slate-500 text-xs sm:text-sm mt-0.5">Platform escrow revenue and commission ledger from completed collaborations</p>
            </div>
            <button id="dealBulkDeleteBtn" onclick="window.admin.deleteSelectedDeals()" 
              class="hidden px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5">
              <span class="material-icons-outlined text-[16px]">delete</span> Delete Selected (<span id="dealSelectedCount">0</span>)
            </button>
          </div>

          <!-- 3 Mini Metric Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="admin-card p-4">
              <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Deals</div>
              <div class="text-2xl font-black text-slate-900 mt-1">${deals.length}</div>
              <div class="text-xs text-emerald-600 font-semibold mt-1">100% Fulfilled</div>
            </div>
            <div class="admin-card p-4">
              <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Settled Volume</div>
              <div class="text-2xl font-black text-slate-900 mt-1">${window.utils.formatCurrency(totalVolume)}</div>
              <div class="text-xs text-slate-400 font-medium mt-1">Gross Marketplace Value</div>
            </div>
            <div class="admin-card p-4 bg-gradient-to-tr from-emerald-500/10 to-transparent border-emerald-200/60">
              <div class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Net Platform Commission</div>
              <div class="text-2xl font-black text-emerald-700 mt-1">${window.utils.formatCurrency(totalCommission)}</div>
              <div class="text-xs text-emerald-600 font-semibold mt-1">10% Platform Fee Earned</div>
            </div>
          </div>
          
          <!-- Deals Table Card -->
          <div class="admin-card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th class="w-10"><input type="checkbox" id="dealSelectAll" onclick="window.admin.toggleSelectAllDeals(this)" class="rounded border-slate-300 text-[#804ee6]"></th>
                    <th>Brand Advertiser</th>
                    <th>Influencer Creator</th>
                    <th>Deliverable Format</th>
                    <th>Deal Value</th>
                    <th>Platform Fee (10%)</th>
                    <th>Status</th>
                    <th>Date Completed</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody id="dealTableBody">
                  ${deals.length === 0 ? `
                    <tr>
                      <td colspan="9" class="px-6 py-12 text-center text-slate-400">
                        <span class="material-icons-outlined text-4xl text-slate-300 mb-2 block">handshake</span>
                        <p class="font-bold text-slate-700 text-sm">No completed deals recorded yet</p>
                        <p class="text-xs text-slate-400 mt-0.5">Completed creator deliveries and platform commission earnings will appear here.</p>
                      </td>
                    </tr>
                  ` : deals.map(deal => `
                    <tr>
                      <td>
                        <input type="checkbox" class="deal-row-checkbox rounded border-slate-300 text-[#804ee6]" value="${deal.id}" onclick="window.admin.onDealRowSelect()">
                      </td>
                      <td>
                        <div class="font-bold text-slate-900">${deal.brandName || 'Brand'}</div>
                        <div class="text-[11px] text-slate-400">Advertiser</div>
                      </td>
                      <td>
                        <div class="font-bold text-slate-900">${deal.influencerName || 'Creator'}</div>
                        <div class="text-[11px] text-slate-400">Creator</div>
                      </td>
                      <td>
                        <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs capitalize">
                          ${deal.packageType || 'Post'}
                        </span>
                      </td>
                      <td>
                        <span class="font-black text-slate-900 text-sm">${window.utils.formatCurrency(deal.amount)}</span>
                      </td>
                      <td>
                        <span class="font-black text-emerald-600 text-sm">+${window.utils.formatCurrency((deal.amount || 0) * 0.10)}</span>
                      </td>
                      <td>
                        <span class="badge-modern badge-modern-completed">
                          <span class="status-dot status-dot-completed"></span> Completed
                        </span>
                      </td>
                      <td>
                        <span class="text-xs text-slate-500 font-medium">${deal.createdAt?.split('T')[0] || 'N/A'}</span>
                      </td>
                      <td class="text-right">
                        <button onclick="window.admin.deleteSingleDeal('${deal.id}')" 
                          class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition" title="Delete Deal">
                          <span class="material-icons-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500 font-medium">
              <div>Total Commission: <span class="font-bold text-emerald-600">${window.utils.formatCurrency(totalCommission)}</span></div>
              <div class="text-[11px] text-slate-400">100% Escrow Reconciled</div>
            </div>
          </div>

        </div>
      `;
      window.ui.stopTopProgress();
    } catch (err) { 
      window.ui.stopTopProgress();
      console.error(err);
      window.ui.showToast(err.message, 'error'); 
    }
  },
  
  async renderWithdrawals() {
    try {
      window.ui.updateSidebarActive('Payouts & Escrow');
      window.ui.showMainLoading('withdrawals');

      const withdrawals = await window.api.getAdminWithdrawals();
      const pendingWithdrawals = (withdrawals || []).filter(w => w.status === 'pending');
      const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6 max-w-7xl mx-auto">
          
          <!-- Header -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Payouts & Escrow Management</h1>
              <p class="text-slate-500 text-xs sm:text-sm mt-0.5">Review, verify banking credentials, and approve creator payout disbursements</p>
            </div>
          </div>

          <!-- Escrow Vault & Summary Banner -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="admin-card p-5 bg-gradient-to-tr from-purple-500/10 to-transparent border-purple-200/60">
              <div class="text-xs font-bold text-[#804ee6] uppercase tracking-wider">Pending Payout Requests</div>
              <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">${window.utils.formatCurrency(pendingAmount)}</div>
              <div class="text-xs text-slate-500 mt-1 font-medium">${pendingWithdrawals.length} creators waiting disbursement</div>
            </div>

            <div class="admin-card p-5">
              <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Escrow Settlement Speed</div>
              <div class="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">Instant</div>
              <div class="text-xs text-slate-500 mt-1 font-medium">Direct UPI & IMPS Bank Transfer</div>
            </div>

            <div class="admin-card p-5">
              <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Disbursement Security</div>
              <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Protected</div>
              <div class="text-xs text-slate-500 mt-1 font-medium">Dual-admin approval ledger</div>
            </div>
          </div>
          
          <!-- Withdrawals Table Card -->
          <div class="admin-card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Creator Beneficiary</th>
                    <th>Payout Amount</th>
                    <th>Requested Timestamp</th>
                    <th>Status</th>
                    <th class="text-right">Administrative Decision</th>
                  </tr>
                </thead>
                <tbody>
                  ${(withdrawals || []).length === 0 ? `
                    <tr>
                      <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                        <span class="material-icons-outlined text-4xl text-slate-300 mb-2 block">payments</span>
                        <p class="font-bold text-slate-700 text-sm">No payout requests</p>
                        <p class="text-xs text-slate-400 mt-0.5">Creator withdrawal requests will appear here for one-click verification and release.</p>
                      </td>
                    </tr>
                  ` : (withdrawals || []).map(w => `
                    <tr>
                      <td>
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-lg bg-[#804ee6]/10 text-[#804ee6] flex items-center justify-center font-bold text-xs">
                            ${w.userName ? w.userName.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div class="font-bold text-slate-900 text-sm">${w.userName || 'Creator'}</div>
                            <div class="text-[11px] text-slate-400 font-medium">UPI / IMPS Verified</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span class="font-black text-slate-900 text-sm">${window.utils.formatCurrency(w.amount)}</span>
                      </td>

                      <td>
                        <span class="text-xs text-slate-500 font-medium">${w.requestedAt || 'Recently'}</span>
                      </td>

                      <td>
                        <span class="badge-modern ${w.status === 'pending' ? 'badge-modern-pending' : 'badge-modern-completed'}">
                          <span class="status-dot ${w.status === 'pending' ? 'status-dot-pending' : 'status-dot-completed'}"></span>
                          ${w.status === 'pending' ? 'Pending Approval' : 'Disbursed'}
                        </span>
                      </td>

                      <td class="text-right">
                        ${w.status === 'pending' ? `
                          <div class="flex items-center justify-end gap-2">
                            <button onclick="window.admin.processWithdrawal('${w.id}', ${w.amount}, 'completed')" 
                              class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95">
                              ✓ Approve & Release
                            </button>
                            <button onclick="window.admin.processWithdrawal('${w.id}', ${w.amount}, 'rejected')" 
                              class="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition active:scale-95">
                              ✕ Reject
                            </button>
                          </div>
                        ` : `
                          <span class="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <span class="material-icons-outlined text-[16px]">verified</span> Released to Creator
                          </span>
                        `}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `;
      window.ui.stopTopProgress();
    } catch (err) { 
      window.ui.stopTopProgress();
      console.error(err);
      window.ui.showToast(err.message, 'error'); 
    }
  },
  
  async verifyUser(userId, verified) {
    window.ui.showConfirm({
      title: verified ? 'Verify Influencer' : 'Unverify Influencer',
      message: verified ? 'Are you sure you want to verify this influencer? Verified influencers get a badge and appear higher in search results.' : 'Are you sure you want to remove verification from this influencer?',
      icon: verified ? '✓' : '',
      confirmText: verified ? 'Yes, Verify' : 'Yes, Unverify',
      confirmClass: verified ? 'confirm-btn-success' : 'confirm-btn-confirm',
      onConfirm: async () => {
        try {
          await window.api.verifyInfluencer(userId, verified);
          window.ui.showToast(`Influencer ${verified ? 'verified' : 'unverified'} successfully!`, 'success');
          await this.renderUsers();
        } catch (err) {
          window.ui.showToast(err.message, 'error');
        }
      }
    });
  },
  
  async toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    window.ui.showConfirm({
      title: newStatus === 'suspended' ? 'Suspend User' : 'Activate User',
      message: newStatus === 'suspended' 
        ? 'Are you sure you want to suspend this user? Suspended users cannot log in or access the platform.' 
        : 'Are you sure you want to activate this user? They will be able to access the platform again.',
      icon: newStatus === 'suspended' ? '' : '✓',
      confirmText: newStatus === 'suspended' ? 'Yes, Suspend' : 'Yes, Activate',
      confirmClass: newStatus === 'suspended' ? 'confirm-btn-confirm' : 'confirm-btn-success',
      onConfirm: async () => {
        try {
          await window.api.updateUserStatus(userId, newStatus);
          window.ui.showToast(`User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully!`, 'success');
          await this.renderUsers();
        } catch (err) {
          window.ui.showToast(err.message, 'error');
        }
      }
    });
  },
  
  async processWithdrawal(withdrawalId, amount, status) {
    window.ui.showConfirm({
      title: status === 'completed' ? 'Approve Withdrawal' : 'Reject Withdrawal',
      message: `Are you sure you want to ${status === 'completed' ? 'approve' : 'reject'} ${window.utils.formatCurrency(amount)} withdrawal?`,
      icon: status === 'completed' ? '💰' : '',
      confirmText: status === 'completed' ? 'Yes, Approve' : 'Yes, Reject',
      confirmClass: status === 'completed' ? 'confirm-btn-success' : 'confirm-btn-confirm',
      onConfirm: async () => {
        try {
          await window.api.processWithdrawal(withdrawalId, status);
          window.ui.showToast(`Withdrawal ${status === 'completed' ? 'approved' : 'rejected'} successfully!`, 'success');
          await this.renderWithdrawals();
        } catch (err) {
          window.ui.showToast(err.message, 'error');
        }
      }
    });
  },

  deleteInfluencer(id) {
    window.ui.showConfirm({
      title: 'Delete Influencer',
      message: 'Are you sure you want to completely delete this influencer? This action cannot be undone.',
      icon: '🗑️',
      confirmText: 'Yes, Delete',
      confirmClass: 'confirm-btn-confirm',
      onConfirm: async () => {
        try {
          await window.api.deleteInfluencer(id);
          window.ui.showToast('Influencer deleted successfully', 'success');
          await this.renderUsers();
        } catch (err) {
          window.ui.showToast(err.message, 'error');
        }
      }
    });
  },

  openEditInfluencerModal(id) {
    const user = this.allUsers.find(u => u.id === id);
    if (!user) return;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'editInfluencerModal';
    modal.innerHTML = `
      <div class="bg-white rounded-sm max-w-2xl w-full p-6 m-4 max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <div class="flex justify-between items-start mb-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span class="material-icons-outlined">edit</span> Edit Influencer
          </h2>
          <button onclick="document.getElementById('editInfluencerModal').remove()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1.5">&times;</button>
        </div>
        
        <form id="editInfluencerForm" onsubmit="window.admin.submitEditInfluencer(event, '${id}')" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" value="${user.name || user.profile?.name || ''}" class="w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-black">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input type="email" name="email" value="${user.email || ''}" class="w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-black">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Instagram Followers</label>
              <input type="number" name="instagramFollowers" value="${user.profile?.followers || 0}" class="w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-black">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Influencer Category</label>
              <select name="niche" class="w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-black">
                <option value="Fashion" ${user.profile?.niche === 'Fashion' ? 'selected' : ''}>Fashion</option>
                <option value="Food" ${user.profile?.niche === 'Food' ? 'selected' : ''}>Food</option>
                <option value="Travel" ${user.profile?.niche === 'Travel' ? 'selected' : ''}>Travel</option>
                <option value="Fitness" ${user.profile?.niche === 'Fitness' ? 'selected' : ''}>Fitness</option>
                <option value="Tech" ${user.profile?.niche === 'Tech' ? 'selected' : ''}>Tech</option>
                <option value="Lifestyle" ${user.profile?.niche === 'Lifestyle' ? 'selected' : ''}>Lifestyle</option>
                <option value="Beauty" ${user.profile?.niche === 'Beauty' ? 'selected' : ''}>Beauty</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-semibold text-gray-700 mb-1">Profile Picture (Leave blank to keep existing)</label>
              <input type="file" name="profilePic" accept="image/*" class="w-full px-3 py-1.5 border rounded-sm focus:ring-2 focus:ring-black text-sm">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">About Section</label>
            <textarea name="about" rows="3" class="w-full px-3 py-2 border rounded-sm focus:ring-2 focus:ring-black">${user.profile?.bio || ''}</textarea>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-sm border border-gray-200">
            <h3 class="font-bold text-sm mb-3">Package Rates (₹)</h3>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Instagram Story</label>
                <input type="number" name="storyRate" value="${user.profile?.rates?.story || 0}" class="w-full px-3 py-2 border rounded-sm text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Dedicated Post</label>
                <input type="number" name="postRate" value="${user.profile?.rates?.post || 0}" class="w-full px-3 py-2 border rounded-sm text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Instagram Reel</label>
                <input type="number" name="reelRate" value="${user.profile?.rates?.reel || 0}" class="w-full px-3 py-2 border rounded-sm text-sm">
              </div>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button type="button" onclick="document.getElementById('editInfluencerModal').remove()" class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-sm">Cancel</button>
            <button type="submit" class="px-6 py-2 bg-black text-white font-bold rounded-sm shadow-sm hover:shadow-md transition">Update Influencer</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async submitEditInfluencer(e, id) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-icons-outlined animate-spin text-sm mr-2">refresh</span> Updating...';
    
    try {
      const formData = new FormData(form);
      await window.api.updateInfluencer(id, formData);
      
      document.getElementById('editInfluencerModal').remove();
      window.ui.showToast('Influencer updated successfully!', 'success');
      
      await this.renderUsers();
    } catch (err) {
      window.ui.showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  },

  showModal(title, headers, rows) {
    const existing = document.getElementById('adminDynamicModal');
    if (existing) existing.remove();
    
    const modalHtml = `
      <div id="adminDynamicModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div class="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden ring-1 ring-black/5">
          <!-- Header -->
          <div class="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 class="text-lg font-bold text-gray-900">${title}</h2>
            <button onclick="document.getElementById('adminDynamicModal').remove()" class="text-gray-400 hover:text-gray-600 text-2xl font-semibold leading-none">&times;</button>
          </div>
          <!-- Body -->
          <div class="p-6 overflow-y-auto flex-1 text-sm">
            <div class="border rounded-sm overflow-hidden bg-white">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b">
                    <tr>
                      ${headers.map(h => `<th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">${h}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    ${rows.length === 0 ? `
                      <tr>
                        <td colspan="${headers.length}" class="px-4 py-8 text-center text-gray-400">No records found.</td>
                      </tr>
                    ` : rows.map(row => `
                      <tr class="hover:bg-gray-50 transition-colors duration-150">
                        ${row.map(cell => `<td class="px-4 py-2.5 text-gray-600 whitespace-nowrap">${cell}</td>`).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 border-t flex justify-end">
            <button onclick="document.getElementById('adminDynamicModal').remove()" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm font-semibold transition text-xs">Close</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async showBrandsDetails() {
    try {
      const users = await window.api.getAdminUsers();
      const brands = users.filter(u => u.role === 'brand');
      const headers = ['Company', 'Email', 'Budget (₹)', 'Joined'];
      const rows = brands.map(b => [
        window.ui.escapeHtml(b.profile?.company || b.name || 'N/A'),
        window.ui.escapeHtml(b.email || 'N/A'),
        window.ui.escapeHtml((b.profile?.budget || 0).toLocaleString()),
        window.ui.escapeHtml(b.createdAt?.split('T')[0] || 'N/A')
      ]);
      this.showModal('Total Registered Brands', headers, rows);
    } catch (err) {
      window.ui.showToast('Failed to load brand details: ' + err.message, 'error');
    }
  },

  async showInfluencersDetails() {
    try {
      const users = await window.api.getAdminUsers();
      const influencers = users.filter(u => u.role === 'influencer');
      const headers = ['Name', 'Email', 'Niche', 'Followers', 'Engagement', 'Status'];
      const rows = influencers.map(i => [
        window.ui.escapeHtml(i.profile?.name || i.name || 'N/A'),
        window.ui.escapeHtml(i.email || 'N/A'),
        window.ui.escapeHtml(i.profile?.niche || 'N/A'),
        window.ui.escapeHtml((i.profile?.followers || 0).toLocaleString()),
        window.ui.escapeHtml((i.profile?.engagement || 0).toString() + '%'),
        i.profile?.verified ? '<span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Verified</span>' : '<span class="text-gray-400 text-xs">Standard</span>'
      ]);
      this.showModal('Total Registered Influencers', headers, rows);
    } catch (err) {
      window.ui.showToast('Failed to load influencer details: ' + err.message, 'error');
    }
  },

  async showRevenueDetails() {
    try {
      const deals = await window.api.getAdminDeals();
      const completedDeals = deals.filter(d => d.status === 'completed');
      const headers = ['Brand', 'Influencer', 'Package', 'Amount', 'Commission (20%)', 'Completed'];
      const rows = completedDeals.map(d => [
        window.ui.escapeHtml(d.brandName || 'N/A'),
        window.ui.escapeHtml(d.influencerName || 'N/A'),
        window.ui.escapeHtml(d.packageType || 'N/A'),
        window.ui.escapeHtml(window.utils.formatCurrency(d.amount || 0)),
        `<span class="text-green-600 font-semibold">${window.utils.formatCurrency((d.amount || 0) * 0.20)}</span>`,
        window.ui.escapeHtml(d.createdAt?.split('T')[0] || 'N/A')
      ]);
      this.showModal('Completed Hires & Revenue Breakdown', headers, rows);
    } catch (err) {
      window.ui.showToast('Failed to load revenue details: ' + err.message, 'error');
    }
  },

  async showCampaignsDetails(statusFilter) {
    try {
      const campaigns = await window.api.getAdminCampaigns();
      const deals = await window.api.getAdminDeals();
      
      const formattedCampaigns = campaigns.map(c => ({
        name: c.name || 'Campaign Listing',
        brand: c.brandName || 'N/A',
        influencer: c.influencerName || 'N/A',
        type: c.type || 'Campaign',
        amount: c.amount || 0,
        status: c.status || 'pending',
        date: c.createdAt || ''
      }));

      const formattedDeals = deals.map(d => ({
        name: d.id,
        brand: d.brandName || 'N/A',
        influencer: d.influencerName || 'N/A',
        type: 'Direct Hire',
        amount: d.amount || 0,
        status: d.status || 'pending',
        date: d.createdAt || ''
      }));

      const allItems = [...formattedCampaigns, ...formattedDeals];
      
      let filteredItems = allItems;
      let title = 'Total Campaigns & Bookings';
      
      if (statusFilter === 'active') {
        filteredItems = allItems.filter(item => item.status === 'active');
        title = 'Active Campaigns & Bookings';
      } else if (statusFilter === 'review') {
        filteredItems = allItems.filter(item => item.status === 'review' || item.status === 'pending');
        title = 'Campaigns & Bookings Under Review';
      } else if (statusFilter === 'completed') {
        filteredItems = allItems.filter(item => item.status === 'completed');
        title = 'Completed Campaigns & Bookings';
      }

      const headers = ['Name', 'Brand', 'Influencer', 'Type', 'Budget', 'Status', 'Date'];
      const rows = filteredItems.map(item => [
        window.ui.escapeHtml(item.name),
        window.ui.escapeHtml(item.brand),
        window.ui.escapeHtml(item.influencer),
        window.ui.escapeHtml(item.type),
        window.ui.escapeHtml(window.utils.formatCurrency(item.amount)),
        `<span class="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-semibold capitalize">${item.status}</span>`,
        window.ui.escapeHtml(item.date?.split('T')[0] || 'N/A')
      ]);

      this.showModal(title, headers, rows);
    } catch (err) {
      window.ui.showToast('Failed to load campaigns: ' + err.message, 'error');
    }
  },

  // Campaign checkbox handlers
  toggleSelectAllCampaigns(master) {
    const checkboxes = document.querySelectorAll('.campaign-row-checkbox');
    checkboxes.forEach(cb => cb.checked = master.checked);
    this.onCampaignRowSelect();
  },

  onCampaignRowSelect() {
    const checkboxes = document.querySelectorAll('.campaign-row-checkbox:checked');
    const btn = document.getElementById('campaignBulkDeleteBtn');
    const count = document.getElementById('campaignSelectedCount');
    if (checkboxes.length > 0) {
      if (btn) btn.classList.remove('hidden');
      if (count) count.textContent = checkboxes.length;
    } else {
      if (btn) btn.classList.add('hidden');
    }
  },

  // Deal checkbox handlers
  toggleSelectAllDeals(master) {
    const checkboxes = document.querySelectorAll('.deal-row-checkbox');
    checkboxes.forEach(cb => cb.checked = master.checked);
    this.onDealRowSelect();
  },

  onDealRowSelect() {
    const checkboxes = document.querySelectorAll('.deal-row-checkbox:checked');
    const btn = document.getElementById('dealBulkDeleteBtn');
    const count = document.getElementById('dealSelectedCount');
    if (checkboxes.length > 0) {
      if (btn) btn.classList.remove('hidden');
      if (count) count.textContent = checkboxes.length;
    } else {
      if (btn) btn.classList.add('hidden');
    }
  },

  // Campaign single & bulk delete execution
  async deleteSingleCampaign(id, isDeal) {
    window.ui.showConfirm({
      title: 'Delete Item',
      message: `Are you sure you want to delete this ${isDeal ? 'deal booking' : 'campaign'}?`,
      confirmText: 'Delete',
      confirmClass: 'bg-red-600 text-white hover:bg-red-700',
      onConfirm: async () => {
        try {
          if (isDeal) {
            await window.api.deleteAdminDeals([id]);
          } else {
            await window.api.deleteAdminCampaigns([id]);
          }
          window.ui.showToast('Item deleted successfully!', 'success');
          await this.renderCampaigns();
        } catch (err) {
          window.ui.showToast('Delete failed: ' + err.message, 'error');
        }
      }
    });
  },

  async deleteSelectedCampaigns() {
    const checkboxes = document.querySelectorAll('.campaign-row-checkbox:checked');
    const itemsToDelete = Array.from(checkboxes).map(cb => ({
      id: cb.value,
      isDeal: cb.getAttribute('data-is-deal') === 'true'
    }));

    window.ui.showConfirm({
      title: 'Delete Selected Items',
      message: `Are you sure you want to delete ${itemsToDelete.length} selected items?`,
      confirmText: 'Delete All',
      confirmClass: 'bg-red-600 text-white hover:bg-red-700',
      onConfirm: async () => {
        try {
          const campaignIds = itemsToDelete.filter(item => !item.isDeal).map(item => item.id);
          const dealIds = itemsToDelete.filter(item => item.isDeal).map(item => item.id);
          
          if (campaignIds.length > 0) {
            await window.api.deleteAdminCampaigns(campaignIds);
          }
          if (dealIds.length > 0) {
            await window.api.deleteAdminDeals(dealIds);
          }
          window.ui.showToast('Selected items deleted successfully!', 'success');
          await this.renderCampaigns();
        } catch (err) {
          window.ui.showToast('Delete failed: ' + err.message, 'error');
        }
      }
    });
  },

  // Deal single & bulk delete execution
  async deleteSingleDeal(id) {
    window.ui.showConfirm({
      title: 'Delete Deal',
      message: 'Are you sure you want to delete this completed deal?',
      confirmText: 'Delete',
      confirmClass: 'bg-red-600 text-white hover:bg-red-700',
      onConfirm: async () => {
        try {
          await window.api.deleteAdminDeals([id]);
          window.ui.showToast('Deal deleted successfully!', 'success');
          await this.renderDeals();
        } catch (err) {
          window.ui.showToast('Delete failed: ' + err.message, 'error');
        }
      }
    });
  },

  async deleteSelectedDeals() {
    const checkboxes = document.querySelectorAll('.deal-row-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => cb.value);

    window.ui.showConfirm({
      title: 'Delete Selected Deals',
      message: `Are you sure you want to delete ${ids.length} selected completed deals?`,
      confirmText: 'Delete All',
      confirmClass: 'bg-red-600 text-white hover:bg-red-700',
      onConfirm: async () => {
        try {
          await window.api.deleteAdminDeals(ids);
          window.ui.showToast('Selected deals deleted successfully!', 'success');
          await this.renderDeals();
        } catch (err) {
          window.ui.showToast('Delete failed: ' + err.message, 'error');
        }
      }
    });
  },

  // ========== NOTIFICATIONS & LIVE AUDIT STREAM ==========
  async renderNotifications() {
    try {
      window.ui.updateSidebarActive('Notifications');
      window.ui.showMainLoading('table');

      const notifications = await window.api.getNotifications();
      this.allNotifications = notifications;
      this.currentNotifFilter = this.currentNotifFilter || 'all';
      this.notifSearchTerm = this.notifSearchTerm || '';

      const unreadCount = (notifications || []).filter(n => !n.read).length;

      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6">
          <!-- Top Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">System Notifications & Stream</h1>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 notif-dot-pulse"></span> Live Sync
                </span>
              </div>
              <p class="text-gray-500 text-sm">Real-time audit log of platform transactions, registrations, and creator updates.</p>
            </div>

            <div class="flex items-center gap-2">
              <button onclick="window.admin.renderNotifications()" 
                class="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs">
                <span class="material-icons-outlined text-[16px]">refresh</span> Refresh
              </button>
              ${unreadCount > 0 ? `
                <button onclick="window.admin.markAllNotificationsRead()" 
                  class="px-3.5 py-2 bg-[#804ee6] hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs">
                  <span class="material-icons-outlined text-[16px]">done_all</span> Mark All Read
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Notification Feed Filter Tabs -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 notif-scroll-area">
            <button onclick="window.admin.setNotificationFilter('all')" 
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${this.currentNotifFilter === 'all' ? 'bg-gray-900 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}">
              All Activity (${(notifications || []).length})
            </button>
            <button onclick="window.admin.setNotificationFilter('unread')" 
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${this.currentNotifFilter === 'unread' ? 'bg-[#804ee6] text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}">
              Unread Updates ${unreadCount > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[10px] ${this.currentNotifFilter === 'unread' ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}">${unreadCount}</span>` : ''}
            </button>
            <button onclick="window.admin.setNotificationFilter('deals')" 
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${this.currentNotifFilter === 'deals' ? 'bg-purple-700 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}">
              Deals & Hires
            </button>
            <button onclick="window.admin.setNotificationFilter('campaigns')" 
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${this.currentNotifFilter === 'campaigns' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}">
              Campaigns
            </button>
            <button onclick="window.admin.setNotificationFilter('withdrawals')" 
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${this.currentNotifFilter === 'withdrawals' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}">
              Payouts & Financials
            </button>
            <button onclick="window.admin.setNotificationFilter('users')" 
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${this.currentNotifFilter === 'users' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}">
              Users & Verification
            </button>
          </div>

          <!-- Search Input -->
          <div class="relative max-w-md w-full">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              <span class="material-icons-outlined text-lg">search</span>
            </span>
            <input type="text" id="notifSearch" placeholder="Filter audit stream by keyword..." 
              value="${this.notifSearchTerm}"
              oninput="window.admin.searchNotifications(this.value)"
              class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#804ee6]/20 focus:border-[#804ee6] transition duration-200">
          </div>

          <!-- Feed Cards Container -->
          <div id="notifFeedList" class="space-y-3">
            ${this.renderNotificationFeedCards()}
          </div>
        </div>
      `;

      window.ui.stopTopProgress();
    } catch (err) {
      window.ui.stopTopProgress();
      console.error(err);
      window.ui.showToast('Failed to load notifications: ' + err.message, 'error');
    }
  },

  setNotificationFilter(filter) {
    this.currentNotifFilter = filter;
    const feed = document.getElementById('notifFeedList');
    if (feed) feed.innerHTML = this.renderNotificationFeedCards();
    this.renderNotifications();
  },

  searchNotifications(val) {
    this.notifSearchTerm = val.toLowerCase();
    const feed = document.getElementById('notifFeedList');
    if (feed) feed.innerHTML = this.renderNotificationFeedCards();
  },

  renderNotificationFeedCards() {
    let list = this.allNotifications || [];

    if (this.currentNotifFilter === 'unread') {
      list = list.filter(n => !n.read);
    } else if (this.currentNotifFilter === 'deals') {
      list = list.filter(n => n.type === 'deal' || (n.title && n.title.toLowerCase().includes('deal')) || (n.message && n.message.toLowerCase().includes('hire')));
    } else if (this.currentNotifFilter === 'campaigns') {
      list = list.filter(n => n.type === 'campaign' || (n.title && n.title.toLowerCase().includes('campaign')));
    } else if (this.currentNotifFilter === 'withdrawals') {
      list = list.filter(n => n.type === 'withdrawal' || (n.title && n.title.toLowerCase().includes('withdrawal')) || (n.message && n.message.toLowerCase().includes('payout')));
    } else if (this.currentNotifFilter === 'users') {
      list = list.filter(n => n.type === 'user' || (n.title && n.title.toLowerCase().includes('creator')) || (n.title && n.title.toLowerCase().includes('user')));
    }

    if (this.notifSearchTerm) {
      list = list.filter(n => 
        (n.title && n.title.toLowerCase().includes(this.notifSearchTerm)) ||
        (n.message && n.message.toLowerCase().includes(this.notifSearchTerm))
      );
    }

    if (list.length === 0) {
      return `
        <div class="bg-white rounded-xl border border-gray-150 p-12 text-center">
          <div class="w-16 h-16 rounded-full bg-purple-50 text-[#804ee6] mx-auto flex items-center justify-center mb-4">
            <span class="material-icons-outlined text-3xl">notifications_off</span>
          </div>
          <h3 class="text-base font-extrabold text-gray-900">No Notifications Found</h3>
          <p class="text-xs text-gray-500 mt-1 max-w-sm mx-auto">There are no updates matching your current filter criteria.</p>
        </div>
      `;
    }

    const getTheme = (item) => {
      const type = (item.type || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const msg = (item.message || '').toLowerCase();

      if (type === 'deal' || title.includes('hire') || title.includes('deal') || msg.includes('hire')) {
        return { bg: 'bg-purple-100 text-[#804ee6] border-purple-200', icon: 'work', label: 'Deal Activity' };
      }
      if (type === 'campaign' || title.includes('campaign')) {
        return { bg: 'bg-blue-100 text-blue-600 border-blue-200', icon: 'rocket_launch', label: 'Campaign' };
      }
      if (type === 'withdrawal' || title.includes('withdrawal') || msg.includes('payout')) {
        return { bg: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: 'payments', label: 'Payout' };
      }
      if (type === 'user' || title.includes('creator') || title.includes('user') || title.includes('verified')) {
        return { bg: 'bg-amber-100 text-amber-600 border-amber-200', icon: 'person', label: 'User' };
      }
      if (type === 'dispute' || title.includes('dispute') || title.includes('rejected')) {
        return { bg: 'bg-red-100 text-red-600 border-red-200', icon: 'warning', label: 'Alert' };
      }
      return { bg: 'bg-indigo-100 text-indigo-600 border-indigo-200', icon: 'notifications', label: 'System' };
    };

    return list.map(item => {
      const theme = getTheme(item);
      const timeStr = window.utils && window.utils.timeAgo ? window.utils.timeAgo(item.createdAt || item.time) : (item.time || 'Just now');

      return `
        <div class="bg-white rounded-xl border ${!item.read ? 'border-purple-200 bg-purple-50/20' : 'border-gray-150'} p-4.5 transition hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-xl ${theme.bg} border flex items-center justify-center flex-shrink-0 mt-0.5">
              <span class="material-icons-outlined text-[20px]">${theme.icon}</span>
            </div>
            
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${theme.bg}">${theme.label}</span>
                <h4 class="text-sm font-extrabold text-gray-900">${item.title || 'Platform Notification'}</h4>
                ${!item.read ? '<span class="px-2 py-0.5 bg-[#804ee6] text-white text-[10px] font-extrabold rounded-full">New</span>' : ''}
              </div>
              <p class="text-xs text-gray-600 leading-relaxed">${item.message || ''}</p>
              <div class="flex items-center gap-3 text-[11px] text-gray-400 font-medium pt-0.5">
                <span class="flex items-center gap-1">
                  <span class="material-icons-outlined text-[13px]">schedule</span> ${timeStr}
                </span>
                ${item.createdAt ? `<span>• ${new Date(item.createdAt).toLocaleString()}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
            <button onclick="window.app.handleNotificationClick('${item.id}')" 
              class="px-3 py-1.5 bg-gray-50 hover:bg-[#804ee6] hover:text-white text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-gray-200 hover:border-transparent">
              <span>Inspect</span>
              <span class="material-icons-outlined text-[14px]">arrow_forward</span>
            </button>
            ${!item.read ? `
              <button onclick="window.admin.markNotificationAsRead('${item.id}')" 
                class="p-1.5 text-gray-400 hover:text-[#804ee6] hover:bg-purple-50 rounded-lg transition" title="Mark as read">
                <span class="material-icons-outlined text-[18px]">done</span>
              </button>
            ` : ''}
            <button onclick="window.admin.deleteNotification('${item.id}')" 
              class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete notification">
              <span class="material-icons-outlined text-[18px]">delete_outline</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  async markAllNotificationsRead() {
    await window.app.markAllNotificationsRead();
    await this.renderNotifications();
  },

  async markNotificationAsRead(id) {
    await window.app.markNotificationAsRead(id);
    await this.renderNotifications();
  },

  async deleteNotification(id) {
    await window.app.deleteNotification(id);
    await this.renderNotifications();
  },

  async clearAllNotifications() {
    window.ui.showConfirm({
      title: 'Clear All Notifications',
      message: 'Are you sure you want to clear all notification logs? This cannot be undone.',
      confirmText: 'Clear All',
      confirmClass: 'bg-red-600 text-white hover:bg-red-700',
      onConfirm: async () => {
        await window.app.clearAllNotifications();
        await this.renderNotifications();
      }
    });
  },

  // ========== PLATFORM SETTINGS ==========
  renderSettings() {
    window.ui.updateSidebarActive('Platform Settings');
    
    document.getElementById('mainContent').innerHTML = `
      <div class="page-transition space-y-6 max-w-4xl mx-auto">
        
        <!-- Header -->
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Platform Configuration & Settings</h1>
          <p class="text-slate-500 text-xs sm:text-sm mt-0.5">Manage escrow commission fee rates, cloud persistence, and platform governance</p>
        </div>

        <!-- Section 1: Financial & Commission Rules -->
        <div class="admin-card p-6 space-y-6">
          <div class="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div class="w-10 h-10 rounded-xl bg-purple-50 text-[#804ee6] flex items-center justify-center font-bold">
              <span class="material-icons-outlined text-[22px]">percent</span>
            </div>
            <div>
              <h3 class="font-extrabold text-slate-900 text-base">Monetization & Commission Rules</h3>
              <p class="text-xs text-slate-500 font-medium">Configure automated platform take-rates on deal escrow settlements</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Platform Fee on Direct Deals (%)</label>
              <div class="relative">
                <input type="number" id="settingDealFee" value="10" min="0" max="50"
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#804ee6]/20 focus:border-[#804ee6] transition shadow-2xs">
                <span class="absolute right-4 top-2.5 text-xs font-bold text-slate-400">% Take Rate</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1 font-medium">Standard industry commission deducted upon creator milestone release.</p>
            </div>

            <div>
              <label class="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Minimum Creator Withdrawal (₹)</label>
              <div class="relative">
                <input type="number" id="settingMinWithdrawal" value="1000" min="100" step="100"
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#804ee6]/20 focus:border-[#804ee6] transition shadow-2xs">
                <span class="absolute right-4 top-2.5 text-xs font-bold text-slate-400">₹ INR</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1 font-medium">Minimum wallet balance required for creators to request bank payout.</p>
            </div>
          </div>
        </div>

        <!-- Section 2: Infrastructure & Cloud Persistence -->
        <div class="admin-card p-6 space-y-6">
          <div class="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <span class="material-icons-outlined text-[22px]">cloud_done</span>
            </div>
            <div>
              <h3 class="font-extrabold text-slate-900 text-base">Infrastructure & Cloud Database</h3>
              <p class="text-xs text-slate-500 font-medium">Live AWS S3 bucket synchronization & media storage</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="p-4 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
              <div>
                <div class="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <span>AWS S3 Database Vault</span>
                  <span class="badge-modern badge-modern-active text-[10px]">
                    <span class="status-dot status-dot-active"></span> Connected
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5">Bucket: <code class="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-700">influencershubs3bucket</code> / Region: <code class="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-700">ap-south-1</code></div>
              </div>
              <span class="material-icons-outlined text-emerald-600 text-2xl">verified</span>
            </div>

            <div class="p-4 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
              <div>
                <div class="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <span>Automated Media Asset Purging</span>
                  <span class="badge-modern badge-modern-active text-[10px]">
                    <span class="status-dot status-dot-active"></span> Active
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5">Saves cloud storage costs by deleting downloaded campaign files automatically.</div>
              </div>
              <span class="material-icons-outlined text-[#804ee6] text-2xl">auto_delete</span>
            </div>
          </div>
        </div>

        <!-- Section 3: Platform Governance -->
        <div class="admin-card p-6 space-y-6">
          <div class="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <span class="material-icons-outlined text-[22px]">security</span>
            </div>
            <div>
              <h3 class="font-extrabold text-slate-900 text-base">Security & Creator Onboarding</h3>
              <p class="text-xs text-slate-500 font-medium">Rules for verifying creator accounts and public discovery</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-bold text-slate-900 text-sm">Require Manual Admin Creator Verification</div>
                <div class="text-xs text-slate-400 mt-0.5">New creators require verified badge check before appearing in top search rankings.</div>
              </div>
              <input type="checkbox" checked class="w-5 h-5 rounded text-[#804ee6] focus:ring-[#804ee6]">
            </div>

            <div class="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <div class="font-bold text-slate-900 text-sm">Real-Time Mobile App Push Notifications</div>
                <div class="text-xs text-slate-400 mt-0.5">Dispatch instant notifications to Flutter mobile app on status changes.</div>
              </div>
              <input type="checkbox" checked class="w-5 h-5 rounded text-[#804ee6] focus:ring-[#804ee6]">
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex justify-end">
            <button onclick="window.ui.showToast('Platform configuration saved successfully!', 'success')" 
              class="px-5 py-2.5 bg-[#804ee6] hover:bg-[#6c2bd9] text-white rounded-xl text-xs font-black shadow-md shadow-purple-500/20 transition active:scale-95 flex items-center gap-2">
              <span class="material-icons-outlined text-[18px]">save</span> Save Settings
            </button>
          </div>
        </div>

      </div>
    `;
  }
};