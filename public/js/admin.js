// Admin Module - With User Type Filters & Campaign Status Management
window.admin = {
  allUsers: [], // Store all users for filtering
  
  async renderDashboard() {
    try {
      const stats = await window.api.getAdminStats();
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition">
          <h1 class="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p class="text-gray-500 mb-6">Platform overview and key metrics</p>
          
          <div class="grid grid-cols-4 gap-5 mb-8">
            <div class="stat-card bg-white rounded-xl p-5 border">
              <div class="text-gray-400 text-sm">Total Brands</div>
              <div class="text-3xl font-bold mt-2">${stats.totalBrands || 0}</div>
              <div class="text-green-500 text-sm mt-1">Active businesses</div>
            </div>
            <div class="stat-card bg-white rounded-xl p-5 border">
              <div class="text-gray-400 text-sm">Total Influencers</div>
              <div class="text-3xl font-bold mt-2">${stats.totalInfluencers || 0}</div>
              <div class="text-green-500 text-sm mt-1">${stats.verifiedInfluencers || 0} verified</div>
            </div>
            <div class="stat-card bg-white rounded-xl p-5 border">
              <div class="text-gray-400 text-sm">Total Campaigns</div>
              <div class="text-3xl font-bold mt-2">${stats.totalCampaigns || 0}</div>
              <div class="text-blue-500 text-sm mt-1">${stats.activeCampaigns || 0} active</div>
            </div>
            <div class="stat-card bg-white rounded-xl p-5 border">
              <div class="text-gray-400 text-sm">Platform Revenue</div>
              <div class="text-3xl font-bold mt-2 text-green-600">${window.utils.formatCurrency(stats.platformRevenue || 0)}</div>
              <div class="text-gray-500 text-sm mt-1">20% commission</div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-6">
            <div class="bg-white rounded-xl border p-6">
              <h2 class="font-semibold mb-4">Platform Summary</h2>
              <div class="space-y-3">
                <div class="flex justify-between py-2 border-b"><span class="text-gray-600">Total Transaction Value</span><span class="font-bold">${window.utils.formatCurrency(stats.totalValue || 0)}</span></div>
                <div class="flex justify-between py-2 border-b"><span class="text-gray-600">Pending Disputes</span><span class="font-bold text-red-600">${stats.pendingDisputes || 0}</span></div>
                <div class="flex justify-between py-2"><span class="text-gray-600">Pending Withdrawals</span><span class="font-bold text-orange-600">${window.utils.formatCurrency(stats.pendingWithdrawals || 0)}</span></div>
              </div>
            </div>
            
            <div class="gradient-bg rounded-xl p-6 text-white">
              <div class="text-sm opacity-80 mb-2">Quick Actions</div>
              <div class="space-y-2">
                <button onclick="window.admin.renderUsers()" class="w-full text-left px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition">Manage Users</button>
                <button onclick="window.admin.renderWithdrawals()" class="w-full text-left px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition">Process Withdrawals</button>
                <button onclick="window.admin.renderDeals()" class="w-full text-left px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition">Resolve Disputes</button>
              </div>
            </div>
          </div>
        </div>
      `;
      window.ui.updateSidebarActive('Dashboard');
    } catch (err) { 
      console.error(err);
      window.ui.showToast(err.message, 'error'); 
    }
  },
  
  async renderUsers() {
    try {
      this.allUsers = await window.api.getAdminUsers();
      this.renderUserTable(this.allUsers);
    } catch (err) { 
      console.error(err);
      window.ui.showToast(err.message, 'error'); 
    }
  },
  
  renderUserTable(users) {
    const brandCount = users.filter(u => u.role === 'brand').length;
    const influencerCount = users.filter(u => u.role === 'influencer').length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    
    document.getElementById('mainContent').innerHTML = `
      <div class="page-transition">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold mb-2">User Management</h1>
            <p class="text-gray-500">View, verify, and manage all platform users</p>
          </div>
          <div class="flex gap-2">
            <button onclick="window.admin.exportUsers()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
              Export CSV
            </button>
          </div>
        </div>
        
        <!-- Filter Tabs -->
        <div class="flex gap-2 mb-6 border-b">
          <button onclick="window.admin.filterUsers('all')" id="filterAll" class="px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all">
            All Users <span class="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">${users.length}</span>
          </button>
          <button onclick="window.admin.filterUsers('brand')" id="filterBrand" class="px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all text-gray-500 hover:text-gray-700">
            Brands <span class="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">${brandCount}</span>
          </button>
          <button onclick="window.admin.filterUsers('influencer')" id="filterInfluencer" class="px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all text-gray-500 hover:text-gray-700">
            Influencers <span class="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">${influencerCount}</span>
          </button>
          <button onclick="window.admin.filterUsers('admin')" id="filterAdmin" class="px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all text-gray-500 hover:text-gray-700">
            Admins <span class="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">${adminCount}</span>
          </button>
        </div>
        
        <!-- Search Bar -->
        <div class="mb-5">
          <div class="relative max-w-md">
            <input type="text" id="searchUsers" placeholder="Search by name or email..." 
              class="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>
        
        <!-- Users Table -->
        <div class="bg-white rounded-xl border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200" id="userTableBody">
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
      <tr class="hover:bg-gray-50 transition">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 h-8 w-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
              ${user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900">${user.name || user.email.split('@')[0]}</span>
                ${user.role === 'influencer' ? `
                  <button onclick="event.stopPropagation(); window.admin.verifyUser('${user.id}', ${!user.verified})" 
                    class="px-2 py-0.5 text-xs rounded-md ${user.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} transition">
                    ${user.verified ? '✓ Verified' : 'Verify'}
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
         </div>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'brand' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
            ${user.role === 'brand' ? 'Brand' : user.role === 'influencer' ? 'Influencer' : 'Admin'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
            ${user.status === 'active' ? 'Active' : 'Suspended'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.joinedAt}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
          <div class="flex gap-2">
            ${user.role !== 'admin' ? `
              <button onclick="window.admin.toggleUserStatus('${user.id}', '${user.status}')" 
                class="px-4 py-1.5 text-sm rounded-md ${user.status === 'active' ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'} transition">
                ${user.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
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
        btn.className = 'px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all text-gray-500 hover:text-gray-700';
      }
    });
    
    const activeBtn = document.getElementById(`filter${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (activeBtn) {
      activeBtn.className = 'px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all bg-purple-50 text-purple-600 border-b-2 border-purple-600';
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
      const campaigns = await window.api.getAdminCampaigns();
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition">
          <h1 class="text-2xl font-bold mb-2">All Campaigns</h1>
          <p class="text-gray-500 mb-6">Monitor and manage all platform campaigns</p>
          
          <!-- Status Filter Tabs -->
          <div class="flex gap-2 mb-6 border-b">
            <button onclick="window.admin.filterCampaigns('all')" id="campFilterAll" class="px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all bg-purple-50 text-purple-600 border-b-2 border-purple-600">
              All <span class="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">${campaigns.length}</span>
            </button>
            <button onclick="window.admin.filterCampaigns('active')" id="campFilterActive" class="px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all text-gray-500 hover:text-gray-700">
              Active <span class="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">${campaigns.filter(c => c.status === 'active').length}</span>
            </button>
            <button onclick="window.admin.filterCampaigns('pending')" id="campFilterPending" class="px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all text-gray-500 hover:text-gray-700">
              Pending <span class="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">${campaigns.filter(c => c.status === 'pending').length}</span>
            </button>
            <button onclick="window.admin.filterCampaigns('review')" id="campFilterReview" class="px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all text-gray-500 hover:text-gray-700">
              Review <span class="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">${campaigns.filter(c => c.status === 'review').length}</span>
            </button>
            <button onclick="window.admin.filterCampaigns('completed')" id="campFilterCompleted" class="px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all text-gray-500 hover:text-gray-700">
              Completed <span class="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">${campaigns.filter(c => c.status === 'completed').length}</span>
            </button>
          </div>
          
          <div class="bg-white rounded-xl border overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Influencer</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200" id="campaignTableBody">
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
      window.ui.updateSidebarActive('Campaigns');
    } catch (err) { 
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
              <span class="text-4xl">📋</span>
              <span>No campaigns found</span>
            </div>
           </div>
        </tr>
      `;
    }
    
    return campaigns.map(campaign => `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${campaign.campaignName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${campaign.brandName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${campaign.influencerName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">${window.utils.formatCurrency(campaign.amount)}</div>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="status-badge status-${campaign.status}">${campaign.status}</span>
        </div>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="w-24"><div class="progress-bar"><div class="progress-fill" style="width: ${campaign.progress}%"></div></div></div>
        </div>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${campaign.deadline}</div>
        <td class="px-6 py-4 whitespace-nowrap">
          <select onchange="window.admin.updateCampaignStatus('${campaign.id}', this.value)" 
            class="px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white focus:ring-2 focus:ring-purple-500">
            <option value="pending" ${campaign.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="active" ${campaign.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="review" ${campaign.status === 'review' ? 'selected' : ''}>In Review</option>
            <option value="completed" ${campaign.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="dispute" ${campaign.status === 'dispute' ? 'selected' : ''}>Dispute</option>
          </select>
        </div>
       </div>
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
        btn.className = 'px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all text-gray-500 hover:text-gray-700';
      }
    });
    
    const activeBtn = document.getElementById(`campFilter${status.charAt(0).toUpperCase() + status.slice(1)}`);
    if (activeBtn) {
      activeBtn.className = 'px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all bg-purple-50 text-purple-600 border-b-2 border-purple-600';
    }
  },
  
  async updateCampaignStatus(campaignId, newStatus) {
    window.ui.showConfirm({
      title: 'Update Campaign Status',
      message: `Are you sure you want to change this campaign status to ${newStatus.toUpperCase()}?`,
      icon: '📋',
      confirmText: 'Yes, Update',
      confirmClass: 'confirm-btn-success',
      onConfirm: async () => {
        try {
          await window.api.updateCampaignStatus(campaignId, newStatus);
          window.ui.showToast(`Campaign status updated to ${newStatus}!`, 'success');
          await this.renderCampaigns();
        } catch (err) {
          window.ui.showToast(err.message, 'error');
        }
      }
    });
  },
  
  async renderDeals() {
    try {
      const deals = await window.api.getAdminDeals();
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition">
          <h1 class="text-2xl font-bold mb-2">All Deals & Hire Requests</h1>
          <p class="text-gray-500 mb-6">Monitor all influencer hire requests</p>
          
          <div class="bg-white rounded-xl border overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Influencer</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  ${deals.map(deal => `
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${deal.brandName}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${deal.influencerName}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm capitalize text-gray-500">${deal.packageType}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">${window.utils.formatCurrency(deal.amount)}</div>
                      <td class="px-6 py-4 whitespace-nowrap"><span class="status-badge status-${deal.status === 'dispute' ? 'dispute' : deal.status}">${deal.status}</span></div>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${deal.createdAt?.split('T')[0] || 'N/A'}</div>
                     </div>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      window.ui.updateSidebarActive('Deals');
    } catch (err) { 
      console.error(err);
      window.ui.showToast(err.message, 'error'); 
    }
  },
  
  async renderWithdrawals() {
    try {
      const withdrawals = await window.api.getAdminWithdrawals();
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition">
          <h1 class="text-2xl font-bold mb-2">Withdrawal Requests</h1>
          <p class="text-gray-500 mb-6">Process influencer payout requests</p>
          
          <div class="bg-white rounded-xl border overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Influencer</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  ${withdrawals.map(w => `
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${w.userName}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">${window.utils.formatCurrency(w.amount)}</div>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${w.requestedAt}</div>
                      <td class="px-6 py-4 whitespace-nowrap"><span class="status-badge status-${w.status === 'pending' ? 'pending' : 'completed'}">${w.status}</span></div>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        ${w.status === 'pending' ? `
                          <div class="flex gap-2">
                            <button onclick="window.admin.processWithdrawal('${w.id}', ${w.amount}, 'completed')" 
                              class="px-4 py-1.5 text-sm rounded-md bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition">
                              Approve
                            </button>
                            <button onclick="window.admin.processWithdrawal('${w.id}', ${w.amount}, 'rejected')" 
                              class="px-4 py-1.5 text-sm rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition">
                              Reject
                            </button>
                          </div>
                        ` : '-'}
                       </div>
                     </div>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      window.ui.updateSidebarActive('Withdrawals');
    } catch (err) { 
      console.error(err);
      window.ui.showToast(err.message, 'error'); 
    }
  },
  
  async verifyUser(userId, verified) {
    window.ui.showConfirm({
      title: verified ? 'Verify Influencer' : 'Unverify Influencer',
      message: verified ? 'Are you sure you want to verify this influencer? Verified influencers get a badge and appear higher in search results.' : 'Are you sure you want to remove verification from this influencer?',
      icon: verified ? '✓' : '⚠️',
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
      icon: newStatus === 'suspended' ? '⚠️' : '✓',
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
      icon: status === 'completed' ? '💰' : '⚠️',
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
  }
};