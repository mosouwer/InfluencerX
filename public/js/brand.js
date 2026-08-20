// Brand Module - Enhanced with complete UI
window.brand = {
  allInfluencers: [],
  
  async renderDashboard() {
    try {
      window.ui.updateSidebarActive('Dashboard');
      window.ui.showMainLoading('Brand Dashboard', 'Fetching active campaigns, budget analytics, and creator stats...', 'dashboard');

      const [stats, campaigns, influencers] = await Promise.all([
        window.api.getStats(),
        window.api.getCampaigns(),
        window.api.getInfluencers()
      ]);
      this.allInfluencers = influencers || [];
      
      // Mock data for charts and activity
      const monthlySpend = [45, 62, 58, 78, 92, 108];
      const recentActivity = [
        { icon: '✅', text: 'Priya Sharma submitted content for review', time: '2 hours ago', color: '#10b981' },
        { icon: '💰', text: 'Payment of ₹8,000 released to TechTalk Vikram', time: '5 hours ago', color: '#22d3ee' },
        { icon: '⏰', text: 'Deadline reminder: Chef Arjun campaign due tomorrow', time: '1 day ago', color: '#fbbf24' }
      ];
      const topPerformers = influencers.slice(0, 4);
      
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition">
          <h1 class="text-2xl font-bold mb-2">Good morning, ${window.auth.currentUser.profile.company} 👋</h1>
          <p class="text-gray-500 mb-6">Here's what's happening with your campaigns today</p>
          
          <!-- Stats Row -->
          <div class="grid grid-cols-4 gap-5 mb-8">
            <div class="stat-card cyan bg-white rounded-xl p-5 border relative overflow-hidden">
              <div class="stat-label">Active Campaigns</div>
              <div class="stat-value" style="color: #06b6d4;">${stats.activeCampaigns || 0}</div>
              <div class="stat-change up">↑ 3 from last week</div>
            </div>
            <div class="stat-card green bg-white rounded-xl p-5 border">
              <div class="stat-label">Total Spent</div>
              <div class="stat-value" style="color: #10b981;">${window.utils.formatCurrency(stats.totalSpent || 0)}</div>
              <div class="stat-change up">↑ ₹34K this month</div>
            </div>
            <div class="stat-card pink bg-white rounded-xl p-5 border">
              <div class="stat-label">Total Reach</div>
              <div class="stat-value" style="color: #ec4899;">${(stats.totalReach / 1000000).toFixed(1)}M</div>
              <div class="stat-change up">↑ 12% vs last month</div>
            </div>
            <div class="stat-card purple bg-white rounded-xl p-5 border">
              <div class="stat-label">Avg. Engagement</div>
              <div class="stat-value" style="color: #8b5cf6;">${stats.avgEngagement || 0}%</div>
              <div class="stat-change down">↓ 0.3% vs last month</div>
            </div>
          </div>
          
          <!-- Main Side Layout -->
          <div class="main-side">
            <!-- Left Column -->
            <div>
              <!-- Active Campaigns Table -->
              <div class="bg-white rounded-xl border mb-6">
                <div class="flex justify-between items-center p-5 border-b">
                  <h2 class="font-semibold">Active Campaigns</h2>
                  <button onclick="window.brand.renderCampaigns()" class="text-purple-600 text-sm hover:text-purple-700">See all →</button>
                </div>
                <div class="overflow-x-auto">
                  <table class="campaign-table w-full">
                    <thead>
                      <tr>
                        <th>Influencer</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Deadline</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${campaigns.filter(c => c.status === 'active').slice(0, 3).map(c => `
                        <tr onclick="window.brand.viewInfluencer('${c.influencerId}')">
                          <td><div class="font-medium">${c.influencerName}</div><div class="text-xs text-gray-400">${c.type}</div></td>
                          <td>${c.type}</td>
                          <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                          <td><div class="w-24"><div class="progress-bar"><div class="progress-fill" style="width: ${c.progress}%"></div></div></div></td>
                          <td class="text-gray-400">${c.deadline}</td>
                          <td class="text-purple-600 font-semibold">${window.utils.formatCurrency(c.amount)}</td>
                        </tr>
                      `).join('')}
                      ${campaigns.filter(c => c.status === 'active').length === 0 ? '<tr><td colspan="6" class="text-center py-8 text-gray-400">No active campaigns</td></tr>' : ''}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <!-- Spend Chart -->
              <div class="bg-white rounded-xl border p-5">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="font-semibold">Monthly Spend</h2>
                  <span class="text-xs text-gray-400">Last 6 months</span>
                </div>
                <div class="chart-area">
                  <div class="chart-line"></div>
                  ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => `
                    <div class="chart-bar-group">
                      <div class="chart-bar ${i === 2 || i === 4 ? 'cyan' : ''}" style="height: ${monthlySpend[i] * 1.5}px;"></div>
                      <div class="chart-label">${month}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            
            <!-- Right Column -->
            <div>
              <!-- Budget Card -->
              <div class="budget-card mb-5">
                <div class="budget-label">Monthly Budget</div>
                <div class="budget-amount">${window.utils.formatCurrency(stats.budgetTotal || 50000)}</div>
                <div class="budget-sub">${window.utils.formatCurrency(stats.budgetUsed || 0)} used · ${window.utils.formatCurrency((stats.budgetTotal || 50000) - (stats.budgetUsed || 0))} remaining</div>
                <div class="budget-bar"><div class="budget-fill" style="width: ${((stats.budgetUsed || 0) / (stats.budgetTotal || 50000) * 100)}%"></div></div>
                <div class="budget-info"><span>0%</span><span>${Math.round((stats.budgetUsed || 0) / (stats.budgetTotal || 50000) * 100)}% used</span><span>100%</span></div>
              </div>
              
              <!-- Top Performers -->
              <div class="bg-white rounded-xl border p-5 mb-5">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="font-semibold">Top Performers</h2>
                  <button onclick="window.brand.renderExplore()" class="text-purple-600 text-sm">View all →</button>
                </div>
                ${topPerformers.map((inf, idx) => `
                  <div class="performer-item" onclick="window.brand.viewInfluencer('${inf.id}')">
                    <div class="performer-rank ${idx === 0 ? 'r1' : idx === 1 ? 'r2' : idx === 2 ? 'r3' : ''}">${idx + 1}</div>
                    <div class="performer-avatar" style="background: linear-gradient(135deg, #667eea, #764ba2);">${inf.avatar || '👤'}</div>
                    <div class="performer-info"><div class="performer-name">${inf.name}</div><div class="performer-niche">${inf.niche} · ${window.utils.formatNumber(inf.followers)}</div></div>
                    <div class="performer-rate">${window.utils.formatCurrency(inf.rates?.post || 5000)}</div>
                  </div>
                `).join('')}
              </div>
              
              <!-- Activity Feed -->
              <div class="bg-white rounded-xl border p-5">
                <h2 class="font-semibold mb-4">Recent Activity</h2>
                <div class="activity-list">
                  ${recentActivity.map(act => `
                    <div class="activity-item">
                      <div class="activity-icon" style="background: ${act.color}10; color: ${act.color};">${act.icon}</div>
                      <div class="activity-text"><div class="activity-main">${act.text}</div><div class="activity-time">${act.time}</div></div>
                    </div>
                  `).join('')}
                </div>
              </div>
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
  
  async renderExplore() {
    try {
      window.ui.updateSidebarActive('Explore');
      window.ui.showMainLoading('Explore Creators', 'Loading creator directory, categories, and verified profiles...', 'users');

      const influencers = await window.api.getInfluencers();
      this.allInfluencers = influencers || [];
      
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition">
          <h1 class="text-2xl font-bold mb-2">Explore Creators</h1>
          <p class="text-gray-500 mb-6">Find the perfect influencer for your next campaign</p>
          
          <div class="flex gap-3 mb-6">
            <div class="flex-1 relative">
              <input type="text" id="searchInput" placeholder="Search by name, niche, city..." class="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl">
              <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <button class="px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium">⚙️ Filters</button>
            <button class="px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium">📊 Sort: Rating</button>
          </div>
          
          <div class="flex gap-2 mb-6 flex-wrap">
            <button onclick="window.brand.filterNiche('all')" class="filter-pill active">All</button>
            <button onclick="window.brand.filterNiche('Fashion')" class="filter-pill">👗 Fashion</button>
            <button onclick="window.brand.filterNiche('Food')" class="filter-pill">🍕 Food</button>
            <button onclick="window.brand.filterNiche('Tech')" class="filter-pill">📱 Tech</button>
            <button onclick="window.brand.filterNiche('Fitness')" class="filter-pill">💪 Fitness</button>
            <button onclick="window.brand.filterNiche('Travel')" class="filter-pill">✈️ Travel</button>
            <button onclick="window.brand.filterNiche('Beauty')" class="filter-pill">💄 Beauty</button>
            <button onclick="window.brand.filterNiche('Lifestyle')" class="filter-pill">🌿 Lifestyle</button>
          </div>
          
          <div class="flex gap-3 mb-4 flex-wrap">
            <div class="bg-gray-100 px-3 py-1.5 rounded-full text-xs">Budget: <span class="font-semibold">₹5K – ₹50K</span></div>
            <div class="bg-gray-100 px-3 py-1.5 rounded-full text-xs">Platform: <span class="font-semibold">Instagram</span></div>
            <div class="bg-gray-100 px-3 py-1.5 rounded-full text-xs">Followers: <span class="font-semibold">100K – 2M</span></div>
            <div class="text-purple-600 text-xs cursor-pointer">✕ Clear all</div>
          </div>
          
          <div class="text-sm text-gray-400 mb-4">Showing <b class="text-gray-700">${(influencers || []).length} creators</b> matching your filters</div>
          
          <div class="grid grid-cols-3 gap-6" id="influencerGrid">
            ${(influencers || []).map(inf => this.renderInfluencerCard(inf)).join('')}
          </div>
        </div>
      `;
      
      document.getElementById('searchInput')?.addEventListener('input', window.utils.debounce((e) => {
        const term = e.target.value.toLowerCase();
        const filtered = this.allInfluencers.filter(i => (i.name || '').toLowerCase().includes(term) || (i.niche || '').toLowerCase().includes(term) || (i.location || '').toLowerCase().includes(term));
        const grid = document.getElementById('influencerGrid');
        if (grid) grid.innerHTML = filtered.map(inf => this.renderInfluencerCard(inf)).join('');
      }, 300));
      
      window.ui.stopTopProgress();
    } catch (err) { 
      window.ui.stopTopProgress();
      console.error(err);
      window.ui.showToast(err.message, 'error'); 
    }
  },
  
  renderInfluencerCard(inf) {
    const isHot = inf.rating > 4.8;
    return `
      <div class="influencer-card bg-white rounded-xl border overflow-hidden cursor-pointer relative" onclick="window.brand.viewInfluencer('${inf.id}')">
        ${isHot ? '<div class="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">🔥 HOT</div>' : ''}
        <div class="h-24 gradient-bg flex items-center justify-center text-4xl relative">${inf.avatar || '👤'}${inf.verified ? '<span class="absolute bottom-1 right-2 text-xs bg-green-500 text-white px-1 rounded">✓</span>' : ''}</div>
        <div class="p-4">
          <h3 class="font-bold">${inf.name}</h3>
          <p class="text-xs text-gray-400">@${(inf.name || '').toLowerCase().replace(/\s/g, '')} · ${inf.location || ''}</p>
          <div class="flex gap-2 mt-2">
            <span class="text-xs bg-gray-100 px-2 py-1 rounded">${window.utils.formatNumber(inf.followers || 0)} followers</span>
            <span class="text-xs bg-gray-100 px-2 py-1 rounded">${inf.engagement || 0}% eng.</span>
            ${inf.verified ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Verified</span>' : ''}
          </div>
          <div class="flex justify-between items-center mt-3">
            <div>
              <div class="text-xs text-gray-400">Starting from</div>
              <div class="font-bold text-purple-600">${window.utils.formatCurrency(inf.rates?.post || 5000)}</div>
            </div>
            <button onclick="event.stopPropagation(); window.brand.hireInfluencer('${inf.id}')" class="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition">Hire Now</button>
          </div>
        </div>
      </div>
    `;
  },
  
  filterNiche(niche) {
    const filtered = niche === 'all' ? this.allInfluencers : this.allInfluencers.filter(i => i.niche === niche);
    const grid = document.getElementById('influencerGrid');
    if (grid) grid.innerHTML = filtered.map(inf => this.renderInfluencerCard(inf)).join('');
    
    // Update active state on filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.classList.remove('active');
      if (pill.textContent.trim() === niche || (niche === 'all' && pill.textContent.trim() === 'All')) {
        pill.classList.add('active');
      }
    });
  },
  
  async renderCampaigns() {
    try {
      window.ui.updateSidebarActive('Campaigns');
      window.ui.showMainLoading('My Campaigns', 'Fetching brand campaigns, deliverables, and progress tracking...', 'campaigns');

      const campaigns = await window.api.getCampaigns();
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition">
          <h1 class="text-2xl font-bold mb-2">My Campaigns</h1>
          <p class="text-gray-500 mb-6">Track and manage all your influencer campaigns</p>
          
          <div class="grid grid-cols-4 gap-5 mb-8">
            <div class="stat-card bg-white rounded-xl p-5 border"><div class="stat-label">Total Campaigns</div><div class="stat-value" style="color: #06b6d4;">${(campaigns || []).length}</div><div class="stat-change up">↑ 5 this month</div></div>
            <div class="stat-card bg-white rounded-xl p-5 border"><div class="stat-label">Active Now</div><div class="stat-value" style="color: #10b981;">${(campaigns || []).filter(c => c.status === 'active').length}</div><div class="stat-change up">↑ 2 this week</div></div>
            <div class="stat-card bg-white rounded-xl p-5 border"><div class="stat-label">Completed</div><div class="stat-value" style="color: #ec4899;">${(campaigns || []).filter(c => c.status === 'completed').length}</div><div class="stat-change up">100% success rate</div></div>
            <div class="stat-card bg-white rounded-xl p-5 border"><div class="stat-label">Total Spent</div><div class="stat-value" style="color: #8b5cf6;">${window.utils.formatCurrency((campaigns || []).reduce((s, c) => s + (c.amount || 0), 0))}</div><div class="stat-change up">↑ this quarter</div></div>
          </div>
          
          <div class="bg-white rounded-xl border overflow-hidden">
            <div class="flex gap-2 p-4 border-b">
              <button class="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium">All (${(campaigns || []).length})</button>
              <button class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">Active (${(campaigns || []).filter(c => c.status === 'active').length})</button>
              <button class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">Pending (${(campaigns || []).filter(c => c.status === 'pending').length})</button>
              <button class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">Completed (${(campaigns || []).filter(c => c.status === 'completed').length})</button>
            </div>
            <div class="overflow-x-auto">
              <table class="campaign-table w-full">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Influencer</th>
                    <th>Platform</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Deadline</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${(campaigns || []).map(c => `
                    <tr>
                      <td class="font-medium">${c.campaignName}</td>
                      <td>${c.influencerName}</td>
                      <td><span class="text-xs">${c.type === 'YouTube Video' ? '▶️ YouTube' : '📸 Instagram'}</span></td>
                      <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                      <td><div class="w-24"><div class="progress-bar"><div class="progress-fill" style="width: ${c.progress}%"></div></div></div></td>
                      <td class="text-gray-400">${c.deadline}</td>
                      <td class="text-purple-600 font-semibold">${window.utils.formatCurrency(c.amount)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="mt-6"><button onclick="window.brand.openCreateCampaignModal()" class="px-6 py-2.5 rounded-lg gradient-bg text-white font-semibold hover:opacity-90 transition">+ Create New Campaign</button></div>
        </div>
      `;
      window.ui.stopTopProgress();
    } catch (err) { 
      window.ui.stopTopProgress();
      console.error(err);
      window.ui.showToast(err.message, 'error'); 
    }
  },
  
  openCreateCampaignModal() {
    const select = document.getElementById('campaignInfluencer');
    if (select && this.allInfluencers.length) {
      select.innerHTML = this.allInfluencers.map(inf => `<option value="${inf.id}">${inf.name} - ${window.utils.formatCurrency(inf.rates?.post || 5000)}/post</option>`).join('');
    }
    document.getElementById('createCampaignModal').style.display = 'flex';
  },
  
  closeCreateCampaignModal() {
    document.getElementById('createCampaignModal').style.display = 'none';
  },
  
  async createCampaign() {
    const campaignName = document.getElementById('campaignName').value;
    const influencerId = document.getElementById('campaignInfluencer').value;
    const type = document.getElementById('campaignType').value;
    const amount = parseInt(document.getElementById('campaignAmount').value);
    const deadline = document.getElementById('campaignDeadline').value;
    
    if (!campaignName || !influencerId || !amount || !deadline) {
      window.ui.showToast('Please fill all fields', 'error');
      return;
    }
    
    window.ui.showConfirm({
      title: 'Create Campaign',
      message: `Create "${campaignName}" with budget ${window.utils.formatCurrency(amount)}?`,
      icon: '📋',
      confirmClass: 'confirm-btn-success',
      confirmText: 'Create Campaign',
      onConfirm: async () => {
        try {
          await window.api.createCampaign({ influencerId, campaignName, type, amount, deadline });
          window.ui.showToast('Campaign created successfully!', 'success');
          this.closeCreateCampaignModal();
          await this.renderCampaigns();
        } catch (err) {
          window.ui.showToast(err.message, 'error');
        }
      }
    });
  },
  
  async viewInfluencer(id) {
    try {
      const inf = await window.api.getInfluencer(id);
      const rates = Object.entries(inf.rates).map(([key, val]) => `${key}: ${window.utils.formatCurrency(val)}`).join('\n');
      const packageType = prompt(`Hire ${inf.name}\n\nRates:\n${rates}\n\nEnter package type (post/story/reel/youtube):`);
      if (packageType && inf.rates[packageType]) {
        await window.api.createDeal({ influencerId: id, packageType, message: '' });
        window.ui.showToast(`Hire request sent to ${inf.name}!`, 'success');
      } else if (packageType) {
        window.ui.showToast('Invalid package type', 'error');
      }
    } catch (err) {
      window.ui.showToast(err.message, 'error');
    }
  }
};