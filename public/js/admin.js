// Admin Module - With User Type Filters & Campaign Status Management
window.admin = {
  allUsers: [], // Store all users for filtering
  
  async renderDashboard() {
    try {
      window.ui.updateSidebarActive('Dashboard');
      window.ui.showMainLoading('Admin Dashboard', 'Aggregating platform metrics, bookings, and financial analytics...', 'dashboard');
      
      const [stats, rawCampaigns, rawDeals] = await Promise.all([
        window.api.getAdminStats(),
        window.api.getAdminCampaigns(),
        window.api.getAdminDeals()
      ]);
      
      const pendingCampaigns = (rawCampaigns || []).filter(c => c.status === 'pending').map(c => ({...c, isDeal: false}));
      const pendingDeals = (rawDeals || []).filter(d => d.status === 'pending').map(d => ({
        id: d.id,
        isDeal: true,
        campaignName: d.id,
        packageType: d.packageType || d.type || 'Post',
        brandName: d.brandName,
        influencerName: d.influencerName,
        amount: d.amount,
        status: d.status,
        createdAt: d.createdAt
      }));
      const pendingItems = [...pendingCampaigns, ...pendingDeals]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6">
          <div>
            <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Admin Dashboard</h1>
            <p class="text-gray-500 text-sm">Monitor platform metrics, user bookings, and transaction payouts.</p>
          </div>
          
          <!-- Row 1: Users & Platform Earnings (Donezo Style) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <!-- Primary Card: Solid Purple -->
            <div onclick="window.admin.showBrandsDetails()" 
              class="stat-card bg-[#804ee6] text-white rounded-xl p-6 shadow-[0_12px_30px_rgba(128,78,230,0.15)] hover:shadow-[0_16px_35px_rgba(128,78,230,0.25)] hover:-translate-y-1 cursor-pointer transition-all duration-300 relative overflow-hidden group">
              <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
              <div class="flex justify-between items-start">
                <span class="text-white/80 text-xs font-bold uppercase tracking-wider">Total Brands</span>
                <span class="material-icons-outlined text-white/90 text-xl">arrow_outward</span>
              </div>
              <div class="text-4xl font-extrabold mt-4 tracking-tight">${stats.totalBrands || 0}</div>
              <div class="text-white/70 text-xs mt-3 font-medium flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active businesses registered
              </div>
            </div>

            <!-- Card 2: White Total Influencers -->
            <div onclick="window.admin.showInfluencersDetails()" 
              class="stat-card bg-white border border-gray-150 rounded-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] hover:-translate-y-1 cursor-pointer transition-all duration-300 relative group">
              <div class="flex justify-between items-start">
                <span class="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Influencers</span>
                <span class="material-icons-outlined text-gray-400 group-hover:text-gray-900 transition-colors text-xl">arrow_outward</span>
              </div>
              <div class="text-4xl font-extrabold mt-4 text-gray-900 tracking-tight">${stats.totalInfluencers || 0}</div>
              <div class="text-gray-500 text-xs mt-3 font-medium flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> ${stats.verifiedInfluencers || 0} verified creators
              </div>
            </div>

            <!-- Card 3: White Platform Revenue -->
            <div onclick="window.admin.showRevenueDetails()" 
              class="stat-card bg-white border border-gray-150 rounded-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] hover:-translate-y-1 cursor-pointer transition-all duration-300 relative group">
              <div class="flex justify-between items-start">
                <span class="text-gray-400 text-xs font-bold uppercase tracking-wider">Platform Revenue</span>
                <span class="material-icons-outlined text-gray-400 group-hover:text-gray-900 transition-colors text-xl">arrow_outward</span>
              </div>
              <div class="text-4xl font-extrabold mt-4 text-emerald-600 tracking-tight">${window.utils.formatCurrency(stats.platformRevenue || 0)}</div>
              <div class="text-gray-500 text-xs mt-3 font-medium">
                From ${window.utils.formatCurrency(stats.totalValue || 0)} transaction value
              </div>
            </div>
            
          </div>

          <!-- Row 2: Campaign Metrics -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            <div onclick="window.admin.showCampaignsDetails('all')" 
              class="stat-card bg-white border border-gray-150 rounded-xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer transition-all duration-300">
              <div class="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Campaigns</div>
              <div class="text-2xl font-extrabold mt-2 text-gray-900 tracking-tight">${stats.totalCampaigns || 0}</div>
              <div class="text-gray-500 text-[11px] mt-1 font-medium">All creator listings</div>
            </div>

            <div onclick="window.admin.showCampaignsDetails('active')" 
              class="stat-card bg-white border border-gray-150 rounded-xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer transition-all duration-300">
              <div class="text-gray-400 text-xs font-bold uppercase tracking-wider">Active</div>
              <div class="text-2xl font-extrabold mt-2 text-indigo-600 tracking-tight">${stats.campaignsActive || 0}</div>
              <div class="text-gray-500 text-[11px] mt-1 font-medium">Currently running</div>
            </div>

            <div onclick="window.admin.showCampaignsDetails('review')" 
              class="stat-card bg-white border border-gray-150 rounded-xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer transition-all duration-300">
              <div class="text-gray-400 text-xs font-bold uppercase tracking-wider">In Review</div>
              <div class="text-2xl font-extrabold mt-2 text-amber-500 tracking-tight">${stats.campaignsReview || 0}</div>
              <div class="text-gray-500 text-[11px] mt-1 font-medium">Awaiting validation</div>
            </div>

            <div onclick="window.admin.showCampaignsDetails('completed')" 
              class="stat-card bg-white border border-gray-150 rounded-xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer transition-all duration-300">
              <div class="text-gray-400 text-xs font-bold uppercase tracking-wider">Completed</div>
              <div class="text-2xl font-extrabold mt-2 text-emerald-600 tracking-tight">${stats.campaignsCompleted || 0}</div>
              <div class="text-gray-500 text-[11px] mt-1 font-medium">Settled successfully</div>
            </div>

          </div>
          
          <!-- Row 3: Platform Summary & Quick Actions -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div class="bg-white border border-gray-150 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 md:col-span-2">
              <h2 class="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                <span class="material-icons-outlined text-[#804ee6]">analytics</span>
                Platform Financial Summary
              </h2>
              <div class="divide-y divide-gray-100">
                <div class="flex justify-between py-3">
                  <span class="text-gray-500 font-medium text-sm">Total Gross Transaction Volume</span>
                  <span class="font-bold text-gray-900 text-sm">${window.utils.formatCurrency(stats.totalValue || 0)}</span>
                </div>
                <div class="flex justify-between py-3">
                  <span class="text-gray-500 font-medium text-sm">Pending Creator Disputes</span>
                  <span class="font-bold text-rose-600 text-sm">${stats.pendingDisputes || 0} active</span>
                </div>
                <div class="flex justify-between py-3">
                  <span class="text-gray-500 font-medium text-sm">Pending Payout Withdrawals</span>
                  <span class="font-bold text-amber-600 text-sm">${window.utils.formatCurrency(stats.pendingWithdrawals || 0)}</span>
                </div>
              </div>
            </div>
            
            <!-- Quick Actions (Donezo Time Tracker gradient theme) -->
            <div class="bg-gradient-to-tr from-[#1f2937] to-[#111827] rounded-xl p-6 text-white shadow-[0_15px_35px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col justify-between">
              <div class="absolute -left-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full"></div>
              <div>
                <span class="text-white/60 text-xs font-bold uppercase tracking-wider">Administrative Tasks</span>
                <h3 class="font-extrabold text-lg mt-1 mb-4">Quick Shortcuts</h3>
              </div>
              <div class="space-y-2.5 relative z-10">
                <button onclick="window.admin.renderUsers()" 
                  class="w-full text-left px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-bold tracking-wide transition-all border border-white/5 flex items-center justify-between group active:scale-[0.98]">
                  <span>Manage Platform Users</span>
                  <span class="material-icons-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
                <button onclick="window.admin.renderWithdrawals()" 
                  class="w-full text-left px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-bold tracking-wide transition-all border border-white/5 flex items-center justify-between group active:scale-[0.98]">
                  <span>Process Creator Withdrawals</span>
                  <span class="material-icons-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
                <button onclick="window.admin.renderDeals()" 
                  class="w-full text-left px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-bold tracking-wide transition-all border border-white/5 flex items-center justify-between group active:scale-[0.98]">
                  <span>Resolve Active Disputes</span>
                  <span class="material-icons-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </div>

          </div>
          
          <!-- Row 4: Pending Approvals Table -->
          <div class="bg-white border border-gray-150 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 class="font-bold text-gray-900 text-base">Pending Campaign Actions</h2>
              <span class="bg-[#804ee6]/10 text-[#804ee6] text-xs font-extrabold px-3 py-1 rounded-full">${pendingItems.length} Waiting</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50/70 border-b border-gray-100">
                  <tr>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Type / Name</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Brand</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Influencer</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-150">
                  ${pendingItems.length === 0 ? '<tr><td colspan="5" class="px-6 py-10 text-center text-gray-400 font-medium">No pending approvals</td></tr>' : 
                    pendingItems.map(item => `
                      <tr class="hover:bg-gray-50/40 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap font-bold text-gray-900">#${item.campaignName}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">${item.brandName}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">${item.influencerName}</td>
                        <td class="px-6 py-4 whitespace-nowrap font-extrabold text-gray-700">${window.utils.formatCurrency(item.amount)}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <select onchange="window.admin.quickApprove('${item.id}', this.value, ${item.isDeal})" 
                            class="px-2.5 py-1.5 border border-gray-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#804ee6]/20 focus:border-[#804ee6] bg-white transition duration-200">
                            <option value="pending">Pending</option>
                            <option value="active">Approve (Active)</option>
                            <option value="review">In Review</option>
                            <option value="rejected">Reject</option>
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
    try {
      if (isDeal) {
        await window.api.updateDealStatus(id, status);
      } else {
        await window.api.updateCampaignStatus(id, status, 0);
      }
      window.ui.showToast('Status updated successfully!', 'success');
      this.renderDashboard();
    } catch (e) {
      window.ui.showToast(e.message, 'error');
    }
  },
  
  async renderUsers() {
    try {
      window.ui.updateSidebarActive('User Management');
      window.ui.showMainLoading('User Management', 'Fetching creators, brands, and account verification statuses...', 'users');
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
    
    document.getElementById('mainContent').innerHTML = `
      <div class="page-transition space-y-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">User Management</h1>
            <p class="text-gray-500 text-sm">View, verify, and manage all registered brands and creators</p>
          </div>
          <div class="flex gap-2">
            <button id="createInfluencerBtn" onclick="window.admin.openCreateInfluencerModal()" 
              class="px-4 py-2 bg-[#804ee6] hover:bg-[#6c2bd9] text-white rounded-lg text-sm font-bold shadow transition flex items-center gap-2 active:scale-95 hidden">
              <span class="material-icons-outlined text-[18px]">add</span> Create Influencer
            </button>
            <button onclick="window.admin.exportUsers()" 
              class="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition duration-200">
              Export CSV
            </button>
          </div>
        </div>
        
        <!-- Filter Pills -->
        <div class="flex flex-wrap gap-2">
          <button onclick="window.admin.filterUsers('all')" id="filterAll" 
            class="px-4 py-2 text-xs font-bold rounded-lg border border-transparent bg-[#804ee6] text-white shadow-sm transition active:scale-[0.98]">
            All Users <span class="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-[10px]">${users.length}</span>
          </button>
          <button onclick="window.admin.filterUsers('brand')" id="filterBrand" 
            class="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition active:scale-[0.98]">
            Brands <span class="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-md text-[10px]">${brandCount}</span>
          </button>
          <button onclick="window.admin.filterUsers('influencer')" id="filterInfluencer" 
            class="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition active:scale-[0.98]">
            Influencers <span class="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-md text-[10px]">${influencerCount}</span>
          </button>
          <button onclick="window.admin.filterUsers('admin')" id="filterAdmin" 
            class="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition active:scale-[0.98]">
            Admins <span class="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-md text-[10px]">${adminCount}</span>
          </button>
        </div>
        
        <!-- Search Bar -->
        <div class="relative max-w-md w-full">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <span class="material-icons-outlined text-lg">search</span>
          </span>
          <input type="text" id="searchUsers" placeholder="Search by name or email..." 
            class="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#804ee6]/20 focus:border-[#804ee6] transition duration-200">
        </div>
        
        <!-- Users Table -->
        <div class="bg-white border border-gray-150 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50/70 border-b border-gray-100">
                <tr>
                  <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                  <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                  <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                  <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-150" id="userTableBody">
                ${this.renderUserRows(users)}
              </tbody>
            <table>
          </div>
        </div>
        
        <!-- Summary Stats -->
        <div class="mt-4 text-sm text-gray-500">
          Showing <span id="visibleCount">${users.length}</span> of <span id="totalCount">${users.length}</span> users
        </div>
      </div>
    `;
    
    this.setActiveFilter('all');
    
    const searchInput = document.getElementById('searchUsers');
    if (searchInput) {
      searchInput.addEventListener('input', window.utils.debounce((e) => {
        this.filterUsersBySearch(e.target.value);
      }, 300));
    }
  },
  
  renderUserRows(users) {
    if (users.length === 0) {
      return `
        <tr>
          <td colspan="6" class="px-6 py-12 text-center text-gray-400">
            <div class="flex flex-col items-center gap-2">
              <span class="text-4xl">👥</span>
              <span>No users found</span>
            </div>
           </div>
        </tr>
      `;
    }
    
    return users.map(user => `
      <tr class="hover:bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)]  transition-all duration-300 z-10 relative">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold">
              ${user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900">${user.name || user.email.split('@')[0]}</span>
                ${user.role === 'influencer' ? `
                  <button onclick="event.stopPropagation(); window.admin.verifyUser('${user.id}', ${!user.verified})" 
                    class="px-2 py-0.5 text-xs rounded-sm ${user.verified ? 'bg-black-100 text-black-700' : 'bg-gray-100 text-gray-500'} transition">
                    ${user.verified ? '✓ Verified' : 'Verify'}
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
         </div>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="w-28 justify-center py-1 inline-flex items-center rounded-md text-xs font-semibold ring-1 ring-inset ${
            user.role === 'admin' 
              ? 'bg-rose-50 text-rose-700 ring-rose-600/10' 
              : user.role === 'brand' 
                ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/10' 
                : 'bg-purple-50 text-purple-700 ring-purple-600/10'
          }">
            ${user.role === 'brand' ? 'Brand' : user.role === 'influencer' ? 'Influencer' : 'Admin'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="w-28 justify-center py-1 inline-flex items-center gap-1.5 rounded-md text-xs font-semibold ring-1 ring-inset ${
            user.status === 'active' 
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
              : 'bg-rose-50 text-rose-700 ring-rose-600/20'
          }">
            <span class="h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}"></span>
            ${user.status === 'active' ? 'Active' : 'Suspended'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.joinedAt}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
          <div class="flex gap-2">
            ${user.role !== 'admin' ? `
              <button onclick="window.admin.toggleUserStatus('${user.id}', '${user.status}')" 
                class="px-4 py-1.5 text-sm rounded-sm ${user.status === 'active' ? 'bg-red-50 text-red-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]  transition-all duration-300 ring-1 ring-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]  transition-all duration-300 ring-1 ring-gray-200-red-200 hover:bg-red-100' : 'bg-black-50 text-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]  transition-all duration-300 ring-1 ring-gray-200 border-black-200 hover:bg-black-100'} transition">
                ${user.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            ` : ''}
            ${user.role === 'influencer' ? `
              <button onclick="window.admin.openEditInfluencerModal('${user.id}')" class="px-3 py-1.5 text-sm rounded-sm bg-gray-100 text-gray-700 shadow-sm hover:bg-gray-200 transition">Edit</button>
              <button onclick="window.admin.deleteInfluencer('${user.id}')" class="px-3 py-1.5 text-sm rounded-sm bg-red-100 text-red-700 shadow-sm hover:bg-red-200 transition">Delete</button>
            ` : ''}
          </div>
         </div>
       </div>
    `).join('');
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
      window.ui.showMainLoading('All Campaigns', 'Retrieving campaign briefs, milestones, and brand hires...', 'campaigns');

      const [rawCampaigns, rawDeals] = await Promise.all([
        window.api.getAdminCampaigns(),
        window.api.getAdminDeals()
      ]);
      
      const dealCampaigns = (rawDeals || []).map(d => ({
        id: d.id,
        isDeal: true,
        campaignName: d.id,
        packageType: d.packageType || d.type || 'Post',
        brandName: d.brandName,
        influencerName: d.influencerName,
        amount: d.amount,
        status: d.status,
        progress: 0,
        deadline: 'N/A',
        createdAt: d.createdAt,
        message: d.message,
        hasMedia: d.hasMedia
      }));
      
      const campaigns = [...(rawCampaigns || []).map(c => ({...c, isDeal: false})), ...dealCampaigns]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">All Campaigns</h1>
              <p class="text-gray-500 text-sm">Monitor and manage all platform campaigns and brand hires</p>
            </div>
          </div>
          
          <!-- Status Filter Tabs & Bulk Actions -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="flex flex-wrap gap-2">
              <button onclick="window.admin.filterCampaigns('all')" id="campFilterAll" 
                class="px-4 py-2 text-xs font-bold rounded-lg border border-transparent bg-[#804ee6] text-white shadow-sm transition active:scale-[0.98]">
                All <span class="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-[10px]">${campaigns.length}</span>
              </button>
              <button onclick="window.admin.filterCampaigns('active')" id="campFilterActive" 
                class="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition active:scale-[0.98]">
                Active <span class="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-md text-[10px]">${campaigns.filter(c => c.status === 'active').length}</span>
              </button>
              <button onclick="window.admin.filterCampaigns('pending')" id="campFilterPending" 
                class="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition active:scale-[0.98]">
                Pending <span class="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-md text-[10px]">${campaigns.filter(c => c.status === 'pending').length}</span>
              </button>
              <button onclick="window.admin.filterCampaigns('review')" id="campFilterReview" 
                class="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition active:scale-[0.98]">
                Review <span class="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-md text-[10px]">${campaigns.filter(c => c.status === 'review').length}</span>
              </button>
              <button onclick="window.admin.filterCampaigns('completed')" id="campFilterCompleted" 
                class="px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition active:scale-[0.98]">
                Completed <span class="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-md text-[10px]">${campaigns.filter(c => c.status === 'completed').length}</span>
              </button>
            </div>
            
            <button id="campaignBulkDeleteBtn" onclick="window.admin.deleteSelectedCampaigns()" 
              class="hidden px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5">
              <span class="material-icons-outlined text-[16px]">delete</span> Delete Selected (<span id="campaignSelectedCount">0</span>)
            </button>
          </div>
          
          <div class="bg-white border border-gray-150 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50/70 border-b border-gray-100">
                  <tr>
                    <th class="px-6 py-3.5 text-left w-10"><input type="checkbox" id="campaignSelectAll" onclick="window.admin.toggleSelectAllCampaigns(this)"></th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Campaign</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Brand</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Influencer</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Deadline</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-150" id="campaignTableBody">
                  ${this.renderCampaignRows(campaigns)}
                </tbody>
              </table>
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
          <td colspan="8" class="px-6 py-12 text-center text-gray-400">
            <div class="flex flex-col items-center gap-2">
              <span class="text-4xl"></span>
              <span>No campaigns found</span>
            </div>
          </td>
        </tr>
      `;
    }
    
    return campaigns.map(campaign => `
      <tr class="hover:bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)]  transition-all duration-300 z-10 relative">
        <td class="px-6 py-4 whitespace-nowrap text-sm"><input type="checkbox" class="campaign-row-checkbox" value="${campaign.id}" data-is-deal="${campaign.isDeal}" onclick="window.admin.onCampaignRowSelect()"></td>
        <td class="px-6 py-4 text-sm cursor-pointer" onclick="window.admin.openCampaignModal('${campaign.id}', ${campaign.isDeal})">
          <div class="flex flex-col gap-1.5">
            <div class="font-bold text-gray-900 hover:text-black transition-colors tracking-wide">
              ${campaign.isDeal ? '#' + campaign.campaignName : campaign.campaignName}
            </div>
            <div class="flex items-center gap-2 text-xs font-medium text-gray-500">
              <span class="capitalize px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-sm border border-gray-200/50">
                ${campaign.packageType || campaign.type || 'Campaign'}
              </span>
              ${campaign.hasMedia ? `
                <span class="inline-flex items-center gap-1 text-indigo-600 font-bold">
                  <span>📎</span> Attachment available
                </span>
              ` : ''}
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${campaign.brandName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${campaign.influencerName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">${window.utils.formatCurrency(campaign.amount)}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="status-badge w-28 justify-center status-${campaign.status}">${campaign.status}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${campaign.deadline}</td>
        <td class="px-6 py-4 whitespace-nowrap flex items-center gap-2">
          <select onchange="window.admin.updateUnifiedCampaignStatus('${campaign.id}', this.value, ${campaign.isDeal})" 
            class="px-3 py-1.5 text-sm rounded-sm bg-white focus:ring-2 focus:ring-gray-500 border ring-1 ring-gray-200">
            <option value="pending" ${campaign.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="active" ${campaign.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="review" ${campaign.status === 'review' ? 'selected' : ''}>In Review</option>
            <option value="completed" ${campaign.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="dispute" ${campaign.status === 'dispute' ? 'selected' : ''}>Dispute</option>
          </select>
          <button onclick="window.admin.deleteSingleCampaign('${campaign.id}', ${campaign.isDeal})" class="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-sm transition-colors animate-fade-in flex items-center" title="Delete Campaign">
            <span class="material-icons-outlined text-[18px]">delete</span>
          </button>
        </td>
      </tr>
    `).join('');
  },
  
  filterCampaigns(status) {
    if (!this.allCampaigns) return;
    
    this.currentCampaignFilter = status;
    let filtered = this.allCampaigns;
    
    if (status !== 'all') {
      filtered = this.allCampaigns.filter(c => c.status === status);
    }
    
    document.getElementById('campaignTableBody').innerHTML = this.renderCampaignRows(filtered);
    
    // Update active filter styling
    const filters = ['all', 'active', 'pending', 'review', 'completed'];
    filters.forEach(f => {
      const btn = document.getElementById(`campFilter${f.charAt(0).toUpperCase() + f.slice(1)}`);
      if (btn) {
        btn.className = 'px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition active:scale-[0.98]';
      }
    });
    
    const activeBtn = document.getElementById(`campFilter${status.charAt(0).toUpperCase() + status.slice(1)}`);
    if (activeBtn) {
      activeBtn.className = 'px-4 py-2 text-xs font-bold rounded-lg border border-transparent bg-[#804ee6] text-white shadow-sm transition active:scale-[0.98]';
    }
  },

  openCampaignModal(id, isDeal) {
    const campaign = this.allCampaigns.find(c => c.id === id && c.isDeal === isDeal);
    if (!campaign) return;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'campaignModal';
    modal.innerHTML = `
      <div class="bg-white rounded-sm max-w-lg w-full p-6 m-4 max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <div class="flex justify-between items-start mb-6">
          <h2 class="text-xl font-bold text-gray-900">Campaign Details</h2>
          <button onclick="document.getElementById('campaignModal').remove()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1.5">&times;</button>
        </div>
        
        <div class="space-y-6">
          <div class="bg-gray-50 p-4 rounded-sm">
            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Campaign Name</label>
            <div class="mt-1 text-lg font-bold text-gray-900">${campaign.campaignName}</div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]  transition-all duration-300 ring-1 ring-gray-200 rounded-sm p-3">
              <label class="block text-xs font-medium text-gray-500">Brand</label>
              <div class="mt-1 font-semibold">${campaign.brandName}</div>
            </div>
            <div class="shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]  transition-all duration-300 ring-1 ring-gray-200 rounded-sm p-3">
              <label class="block text-xs font-medium text-gray-500">Influencer</label>
              <div class="mt-1 font-semibold">${campaign.influencerName}</div>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Instructions / Request Message</label>
            <div class="p-4 bg-gray-50 rounded-sm text-sm text-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]  transition-all duration-300 ring-1 ring-gray-200 whitespace-pre-wrap">${campaign.message || 'No specific instructions provided.'}</div>
          </div>
          
          ${campaign.hasMedia ? `
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Attached Media</label>
            <div class="p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]  transition-all duration-300 ring-1 ring-gray-200 rounded-sm flex items-center justify-between bg-gray-100">
              <div class="flex items-center text-black">
                <span class="text-2xl"></span>
                <span class="ml-3 font-semibold text-sm">Brand Attachment</span>
              </div>
              <button onclick="window.admin.downloadMedia('${campaign.id}')" class="px-4 py-2 bg-black text-white rounded-sm text-sm font-bold shadow hover:bg-gray-900 transition active:scale-95">
                Download File
              </button>
            </div>
            <p class="text-xs text-gray-600 mt-2 font-medium flex items-center">
              <span class="mr-1"></span> Once downloaded, the file will be automatically deleted from S3 to save cloud storage space.
            </p>
          </div>
          ` : `
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Attached Media</label>
            <div class="p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]  transition-all duration-300 ring-1 ring-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]  transition-all duration-300 ring-1 ring-gray-200-dashed rounded-sm flex items-center justify-center text-gray-400 bg-gray-50">
              No media files attached to this request
            </div>
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
      btn.innerHTML = 'Downloaded';
      btn.className = 'px-4 py-2 bg-gray-300 text-gray-500 rounded-sm text-sm font-bold cursor-not-allowed';
      btn.disabled = true;
      btn.removeAttribute('onclick');
    }
    
    // Immediately clear in-memory attachment state to prevent reopen race conditions
    const camp = this.allCampaigns.find(c => c.id === id);
    if (camp) {
      camp.hasMedia = false;
      delete camp.mediaAttached;
      delete camp.mediaUrl;
      delete camp.media;
    }
    
    // Instantly refresh the parent tables in the UI
    this.filterCampaigns(this.currentCampaignFilter || 'all');
    
    // Sync with the backend after S3 and Firestore complete their operations
    setTimeout(async () => {
      try {
        const rawCampaigns = await window.api.getAdminCampaigns();
        const rawDeals = await window.api.getAdminDeals();
        
        const dealCampaigns = rawDeals.map(d => ({
          id: d.id,
          isDeal: true,
          campaignName: d.id,
          packageType: d.packageType || d.type || 'Post',
          brandName: d.brandName,
          influencerName: d.influencerName,
          amount: d.amount,
          status: d.status,
          progress: 0,
          deadline: 'N/A',
          createdAt: d.createdAt,
          message: d.message,
          hasMedia: d.hasMedia
        }));
        
        this.allCampaigns = [...rawCampaigns.map(c => ({...c, isDeal: false})), ...dealCampaigns]
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        
        this.filterCampaigns(this.currentCampaignFilter || 'all');
      } catch (err) {
        console.error(err);
      }
    }, 3000);
  },
  
  async updateUnifiedCampaignStatus(id, newStatus, isDeal) {
    window.ui.showConfirm({
      title: 'Update Status',
      message: `Are you sure you want to change this status to ${newStatus.toUpperCase()}?`,
      icon: '',
      confirmText: 'Yes, Update',
      confirmClass: 'confirm-btn-success',
      onConfirm: async () => {
        try {
          if (isDeal) {
            await window.api.updateDealStatus(id, newStatus);
          } else {
            await window.api.updateCampaignStatus(id, newStatus, 0);
          }
          window.ui.showToast(`Status updated to ${newStatus}!`, 'success');
          await this.renderCampaigns();
        } catch (err) {
          window.ui.showToast(err.message, 'error');
        }
      }
    });
  },
  
  async renderDeals() {
    try {
      window.ui.updateSidebarActive('All Deals');
      window.ui.showMainLoading('Completed Deals', 'Calculating platform commission earnings and settlements...', 'deals');

      const allDeals = await window.api.getAdminDeals();
      const deals = (allDeals || []).filter(deal => deal.status === 'completed');
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Completed Deals & Commission</h1>
              <p class="text-gray-500 text-sm">Monitor completed influencer hires and platform commission earnings</p>
            </div>
            <button id="dealBulkDeleteBtn" onclick="window.admin.deleteSelectedDeals()" 
              class="hidden px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5">
              <span class="material-icons-outlined text-[16px]">delete</span> Delete Selected (<span id="dealSelectedCount">0</span>)
            </button>
          </div>
          
          <div class="bg-white border border-gray-150 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50/70 border-b border-gray-100">
                  <tr>
                    <th class="px-6 py-3.5 text-left w-10"><input type="checkbox" id="dealSelectAll" onclick="window.admin.toggleSelectAllDeals(this)"></th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Brand</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Influencer</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Package</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Deal Amount</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Commission (20%)</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Created</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-150">
                  ${deals.length === 0 ? `
                    <tr>
                      <td colspan="9" class="px-6 py-10 text-center text-gray-400 font-medium">No completed deals found</td>
                    </tr>
                  ` : deals.map(deal => `
                    <tr class="hover:bg-gray-50/40 transition-colors">
                      <td class="px-6 py-4 whitespace-nowrap text-sm"><input type="checkbox" class="deal-row-checkbox" value="${deal.id}" onclick="window.admin.onDealRowSelect()"></td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${deal.brandName}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">${deal.influencerName}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm capitalize font-semibold text-gray-500">${deal.packageType}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-gray-700">${window.utils.formatCurrency(deal.amount)}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-emerald-600">${window.utils.formatCurrency((deal.amount || 0) * 0.20)}</td>
                      <td class="px-6 py-4 whitespace-nowrap"><span class="status-badge w-28 justify-center status-completed">${deal.status}</span></td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">${deal.createdAt?.split('T')[0] || 'N/A'}</td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <button onclick="window.admin.deleteSingleDeal('${deal.id}')" 
                          class="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center" title="Delete Deal">
                          <span class="material-icons-outlined text-[18px]">delete</span>
                        </button>
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
  
  async renderWithdrawals() {
    try {
      window.ui.updateSidebarActive('Withdrawals');
      window.ui.showMainLoading('Withdrawal Requests', 'Syncing creator payout queues and banking details...', 'withdrawals');

      const withdrawals = await window.api.getAdminWithdrawals();
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6">
          <div>
            <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Withdrawal Requests</h1>
            <p class="text-gray-500 text-sm">Process creator payouts and request transactions</p>
          </div>
          
          <div class="bg-white border border-gray-150 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50/70 border-b border-gray-100">
                  <tr>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Influencer</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Requested</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-150">
                  ${(withdrawals || []).map(w => `
                    <tr class="hover:bg-gray-50/40 transition-colors">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${w.userName}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-gray-700">${window.utils.formatCurrency(w.amount)}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">${w.requestedAt}</td>
                      <td class="px-6 py-4 whitespace-nowrap"><span class="status-badge w-28 justify-center status-${w.status === 'pending' ? 'pending' : 'completed'}">${w.status}</span></td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        ${w.status === 'pending' ? `
                          <div class="flex gap-2">
                            <button onclick="window.admin.processWithdrawal('${w.id}', ${w.amount}, 'completed')" 
                              class="px-4 py-1.5 text-xs font-bold rounded-lg border border-transparent bg-[#804ee6] text-white shadow-sm transition active:scale-[0.98]">
                              Approve
                            </button>
                            <button onclick="window.admin.processWithdrawal('${w.id}', ${w.amount}, 'rejected')" 
                              class="px-4 py-1.5 text-xs font-bold rounded-lg border border-rose-250 bg-rose-50 text-rose-600 shadow-sm transition active:scale-[0.98] hover:bg-rose-100">
                              Reject
                            </button>
                          </div>
                        ` : '-'}
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
      window.ui.showMainLoading('Live Audit Stream', 'Connecting to real-time notification ledger and system updates...', 'table');

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
  }
};