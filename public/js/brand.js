// Brand Module - Enhanced with complete UI
window.brand = {
  allInfluencers: [],
  
  async renderDashboard() {
    try {
      window.ui.updateSidebarActive('Dashboard');
      window.ui.showMainLoading('dashboard');

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
      const topPerformers = (influencers || []).slice(0, 4);
      
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-8 max-w-7xl mx-auto pb-12">
          
          <!-- Modern Brand Hero Banner with Gradient Mesh -->
          <div class="relative bg-gradient-to-br from-slate-950 via-[#0f172a] to-[#1e1b4b] p-7 sm:p-9 rounded-3xl text-white shadow-2xl border border-white/10 overflow-hidden">
            <div class="ambient-orb absolute -right-12 -top-12 w-80 h-80 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none"></div>
            <div class="ambient-orb absolute right-1/3 -bottom-16 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" style="animation-delay: -3s;"></div>
            
            <div class="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <div class="flex flex-wrap items-center gap-2.5 mb-3.5">
                  <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 backdrop-blur-md">
                    <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span> Brand Control Hub
                  </span>
                  <span class="px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1.5 backdrop-blur-md">
                    <span class="material-icons-outlined text-[13px]">verified_user</span> Escrow Protection Active
                  </span>
                </div>
                
                <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                  Welcome back, <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">${window.auth.currentUser?.profile?.company || 'Brand Partner'}</span> 👋
                </h1>
                <p class="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl font-light leading-relaxed">
                  Oversee active creator campaigns, review submitted media deliverables, and monitor your escrow spend.
                </p>
              </div>
              
              <div class="relative z-10 flex flex-wrap items-center gap-2.5">
                <button onclick="window.brand.renderCampaigns()" 
                  class="px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-[#804ee6] to-purple-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95">
                  <span class="material-icons-outlined text-[18px]">add_circle</span> + New Campaign
                </button>
                <button onclick="window.brand.renderExplore()" 
                  class="glass-pill px-4 py-2.5 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 active:scale-95">
                  <span class="material-icons-outlined text-[18px]">search</span> Explore Creators
                </button>
              </div>
            </div>
          </div>
          
          <!-- 4 Gradient Stat Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="dashboard-mesh-card p-6 bg-gradient-to-b from-cyan-50/50 via-white to-white border-cyan-100">
              <div class="flex justify-between items-start">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-500/25">
                  <span class="material-icons-outlined text-[24px]">campaign</span>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-cyan-50 text-cyan-700 border border-cyan-200">
                  Active Now
                </span>
              </div>
              <div class="mt-5">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Campaigns</div>
                <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">${stats.activeCampaigns || 0}</div>
                <div class="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> Collaborating with creators
                </div>
              </div>
            </div>

            <div class="dashboard-mesh-card p-6 bg-gradient-to-b from-emerald-50/50 via-white to-white border-emerald-100">
              <div class="flex justify-between items-start">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/25">
                  <span class="material-icons-outlined text-[24px]">account_balance_wallet</span>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Escrow Funds
                </span>
              </div>
              <div class="mt-5">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Spent</div>
                <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">${window.utils.formatCurrency(stats.totalSpent || 0)}</div>
                <div class="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 100% Guaranteed Payouts
                </div>
              </div>
            </div>

            <div class="dashboard-mesh-card p-6 bg-gradient-to-b from-pink-50/50 via-white to-white border-pink-100">
              <div class="flex justify-between items-start">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-pink-500/25">
                  <span class="material-icons-outlined text-[24px]">visibility</span>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-pink-50 text-pink-700 border border-pink-200">
                  Audience
                </span>
              </div>
              <div class="mt-5">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Audience Reach</div>
                <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">${((stats.totalReach || 0) / 1000000).toFixed(1)}M</div>
                <div class="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-pink-500"></span> Cumulative impressions
                </div>
              </div>
            </div>

            <div class="dashboard-mesh-card p-6 bg-gradient-to-b from-purple-50/50 via-white to-white border-purple-100">
              <div class="flex justify-between items-start">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#804ee6] to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/25">
                  <span class="material-icons-outlined text-[24px]">trending_up</span>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                  Engagement
                </span>
              </div>
              <div class="mt-5">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg. Engagement</div>
                <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">${stats.avgEngagement || 4.8}%</div>
                <div class="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span> High performer benchmarks
                </div>
              </div>
            </div>
          </div>
          
          <!-- Main Content Grid (2 Columns) -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column: Active Campaigns & Analytics -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Active Campaigns Table -->
              <div class="dashboard-mesh-card overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50/80 to-white">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <span class="material-icons-outlined text-[18px]">view_timeline</span>
                    </div>
                    <div>
                      <h2 class="font-black text-slate-900 text-base tracking-tight">Active Campaigns</h2>
                      <p class="text-xs text-slate-400 font-medium">Deliverables in flight and submission statuses</p>
                    </div>
                  </div>
                  <button onclick="window.brand.renderCampaigns()" class="text-xs font-bold text-[#804ee6] hover:text-[#6c2bd9] flex items-center gap-1">
                    See all <span class="material-icons-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
                <div class="overflow-x-auto">
                  <table class="modern-table">
                    <thead>
                      <tr>
                        <th>Campaign</th>
                        <th>Influencer</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Escrow Budget</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(campaigns || []).slice(0, 4).map(c => `
                        <tr class="hover:bg-slate-50/60 transition">
                          <td class="font-bold text-slate-900">${c.campaignName}</td>
                          <td class="text-slate-700 font-medium">${c.influencerName}</td>
                          <td><span class="badge-modern badge-modern-${c.status}"><span class="status-dot status-dot-${c.status}"></span>${c.status}</span></td>
                          <td>
                            <div class="w-28 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div class="bg-gradient-to-r from-[#804ee6] to-indigo-500 h-2 rounded-full" style="width: ${c.progress || 35}%"></div>
                            </div>
                          </td>
                          <td class="text-slate-900 font-black">${window.utils.formatCurrency(c.amount)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <!-- Performance Chart -->
              <div class="dashboard-mesh-card p-6">
                <div class="flex justify-between items-center mb-6">
                  <div>
                    <h2 class="font-black text-slate-900 text-base tracking-tight flex items-center gap-2">
                      <span class="material-icons-outlined text-purple-600 text-lg">bar_chart</span> Campaign Spend Overview
                    </h2>
                    <p class="text-xs text-slate-400 font-medium">Monthly budget deployment</p>
                  </div>
                  <span class="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">Last 6 Months</span>
                </div>
                
                <div class="chart-area pt-4">
                  <div class="chart-line"></div>
                  ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => `
                    <div class="chart-bar-group">
                      <div class="chart-bar bg-gradient-to-t from-[#804ee6] to-indigo-400 rounded-t-lg" style="height: ${monthlySpend[i] * 1.5}px;"></div>
                      <div class="chart-label font-bold text-[11px] mt-2">${month}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            
            <!-- Right Column: Top Creators & Feed -->
            <div class="space-y-6">
              <!-- Top Performing Creators -->
              <div class="dashboard-mesh-card p-6">
                <h2 class="font-black text-slate-900 text-base tracking-tight mb-4 flex items-center gap-2">
                  <span class="text-amber-500">⭐</span> Top Creators in Network
                </h2>
                <div class="space-y-4">
                  ${topPerformers.map(inf => `
                    <div class="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-xs transition">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#804ee6] to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          ${inf.name ? inf.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div class="font-bold text-slate-900 text-xs">${inf.name}</div>
                          <div class="text-[10px] text-slate-400 font-medium">${inf.niche || 'Fashion'} · ${window.utils.formatNumber(inf.followers || 250000)}</div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-xs text-emerald-600 font-black">⭐ ${inf.rating || 4.9}</div>
                        <div class="text-[10px] text-slate-400 font-bold">${inf.engagement || 5.2}% eng.</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <!-- Recent Activity -->
              <div class="dashboard-mesh-card p-6">
                <h2 class="font-black text-slate-900 text-base tracking-tight mb-4 flex items-center gap-2">
                  <span class="material-icons-outlined text-indigo-600 text-lg">history</span> Activity Stream
                </h2>
                <div class="activity-list space-y-3">
                  ${recentActivity.map(act => `
                    <div class="activity-item p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                      <div class="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style="background: ${act.color}20; color: ${act.color};">
                        ${act.icon}
                      </div>
                      <div class="activity-text">
                        <div class="text-xs font-semibold text-slate-800 leading-snug">${act.text}</div>
                        <div class="text-[10px] text-slate-400 font-bold mt-1">${act.time}</div>
                      </div>
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
      window.ui.showMainLoading('users');

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
      window.ui.showMainLoading('campaigns');

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