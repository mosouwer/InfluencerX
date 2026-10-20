// Influencer Module - Enhanced with complete UI
window.influencer = {
  currentRates: null,
  
  async renderDashboard() {
    try {
      window.ui.updateSidebarActive('Dashboard');
      window.ui.showMainLoading('dashboard');

      const [stats, campaigns, deals] = await Promise.all([
        window.api.getStats(),
        window.api.getCampaigns(),
        window.api.getDeals()
      ]);
      const pendingOffers = (deals || []).filter(d => d.status === 'pending');
      const activeCampaigns = (campaigns || []).filter(c => c.status === 'active' || c.status === 'in_progress');
      
      const creatorName = window.auth.currentUser?.profile?.name || 'Creator';
      const followersCount = window.auth.currentUser?.profile?.followers || 128000;
      const category = window.auth.currentUser?.profile?.category || 'Lifestyle & Tech';

      const totalEarned = stats.totalEarned || 0;
      const pendingAmount = stats.pendingAmount || 0;
      const availableFunds = Math.max(0, totalEarned - pendingAmount);
      
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-8">
          
          <!-- Modern Hero Banner with Ambient Glowing Orbs -->
          <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1e1b4b] via-[#2e1065] to-[#4c1d95] p-7 md:p-9 text-white shadow-2xl border border-purple-500/20">
            <!-- Ambient glowing orbs -->
            <div class="ambient-orb absolute -top-16 -right-16 w-80 h-80 rounded-full bg-gradient-to-br from-fuchsia-500/25 to-pink-500/10 blur-3xl pointer-events-none"></div>
            <div class="ambient-orb absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-500/25 to-indigo-500/10 blur-3xl pointer-events-none" style="animation-delay: -3s;"></div>
            <div class="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-purple-500/15 blur-2xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div class="max-w-2xl">
                <div class="flex flex-wrap items-center gap-2.5 mb-3">
                  <span class="glass-pill px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Verified Creator Pro
                  </span>
                  <span class="glass-pill px-3 py-1 rounded-full text-xs text-purple-300 font-medium">
                    ${category}
                  </span>
                </div>
                <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
                  Welcome back, <span class="bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200 bg-clip-text text-transparent">${creatorName}</span> ✨
                </h1>
                <p class="text-purple-200/80 text-sm md:text-base leading-relaxed">
                  Your creator workspace is live. You have <span class="font-bold text-white">${pendingOffers.length} new brand offers</span> and <span class="font-bold text-white">${activeCampaigns.length} deliverables</span> in progress today.
                </p>
              </div>

              <!-- Quick Payout Tile in Hero -->
              <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 min-w-[280px] shadow-inner">
                <div class="text-xs uppercase tracking-wider font-semibold text-purple-200 mb-1 flex items-center justify-between">
                  <span>Available Balance</span>
                  <span class="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">Ready</span>
                </div>
                <div class="text-3xl font-extrabold text-white tracking-tight mb-2">
                  ${window.utils.formatCurrency(availableFunds)}
                </div>
                <div class="text-xs text-purple-200/80 mb-3 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>${window.utils.formatCurrency(pendingAmount)} in Escrow settlement</span>
                </div>
                <div class="flex gap-2">
                  <button onclick="window.influencer.renderEarnings()" class="flex-1 py-2 px-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition border border-white/20">
                    Earnings
                  </button>
                  <button onclick="window.influencer.renderEarnings()" class="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-1">
                    Withdraw →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 4 High-Impact KPI Stat Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <!-- Active Campaigns -->
            <div class="dashboard-mesh-card bg-white p-6 relative group">
              <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500"></div>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Active Deals</span>
                <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-500 text-white flex items-center justify-center gradient-glow-purple shadow-sm group-hover:scale-110 transition-transform">
                  <span class="material-icons-outlined text-xl">rocket_launch</span>
                </div>
              </div>
              <div class="text-3xl font-black text-gray-900 tracking-tight mb-1">
                ${activeCampaigns.length || stats.activeCampaigns || 0}
              </div>
              <div class="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <span class="material-icons-outlined text-sm">trending_up</span>
                <span>${pendingOffers.length} incoming offers pending</span>
              </div>
            </div>

            <!-- Completion Rate -->
            <div class="dashboard-mesh-card bg-white p-6 relative group">
              <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500"></div>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Completion Rate</span>
                <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center gradient-glow-indigo shadow-sm group-hover:scale-110 transition-transform">
                  <span class="material-icons-outlined text-xl">task_alt</span>
                </div>
              </div>
              <div class="text-3xl font-black text-gray-900 tracking-tight mb-1">
                98.5%
              </div>
              <div class="flex items-center gap-1.5 text-xs text-purple-600 font-semibold">
                <span class="material-icons-outlined text-sm">stars</span>
                <span>Top 3% Creator Tier</span>
              </div>
            </div>

            <!-- Profile Views / Reach -->
            <div class="dashboard-mesh-card bg-white p-6 relative group">
              <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Profile Impressions</span>
                <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform" style="box-shadow: 0 12px 28px -6px rgba(6, 182, 212, 0.35);">
                  <span class="material-icons-outlined text-xl">visibility</span>
                </div>
              </div>
              <div class="text-3xl font-black text-gray-900 tracking-tight mb-1">
                ${window.utils.formatNumber(stats.profileViews || 14200)}
              </div>
              <div class="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <span class="material-icons-outlined text-sm">trending_up</span>
                <span>+34% brand discovery this week</span>
              </div>
            </div>

            <!-- Creator Rating -->
            <div class="dashboard-mesh-card bg-white p-6 relative group">
              <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"></div>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Brand Rating</span>
                <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center gradient-glow-amber shadow-sm group-hover:scale-110 transition-transform">
                  <span class="material-icons-outlined text-xl">grade</span>
                </div>
              </div>
              <div class="text-3xl font-black text-gray-900 tracking-tight mb-1 flex items-center gap-1.5">
                ${stats.rating || 4.9} <span class="text-amber-400 text-2xl">★</span>
              </div>
              <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <span>Based on 48 verified reviews</span>
              </div>
            </div>
          </div>

          <!-- Main 2-Column Section -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Left 2 Cols: Offers, Deliverables & Charts -->
            <div class="lg:col-span-2 space-y-8">
              
              <!-- Incoming Offers -->
              <div class="dashboard-mesh-card bg-white p-6">
                <div class="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <span class="material-icons-outlined text-xl">local_fire_department</span>
                    </div>
                    <div>
                      <h2 class="text-base font-bold text-gray-900">New Campaign Offers</h2>
                      <p class="text-xs text-gray-500">Direct invitations from brand marketing teams</p>
                    </div>
                  </div>
                  <button onclick="window.influencer.renderCampaigns()" class="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition">
                    <span>View all (${pendingOffers.length})</span>
                    <span class="material-icons-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                ${pendingOffers.length > 0 ? `
                  <div class="space-y-3">
                    ${pendingOffers.map(offer => `
                      <div class="p-4 rounded-2xl bg-gradient-to-r from-purple-50/50 via-pink-50/20 to-white border border-purple-100/80 hover:border-purple-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div class="flex items-center gap-3.5">
                          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#804ee6] to-pink-500 text-white font-bold text-base flex items-center justify-center shadow-sm">
                            ${(offer.brandName || 'B').charAt(0)}
                          </div>
                          <div>
                            <div class="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2">
                              ${offer.brandName}
                              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">
                                ${offer.packageType || 'Post'}
                              </span>
                            </div>
                            <div class="text-xs text-gray-500 mt-0.5">${offer.message || 'Collaboration proposal with milestone deliverables'}</div>
                          </div>
                        </div>
                        <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          <div class="text-right sm:mr-2">
                            <span class="text-base font-black text-purple-600">${window.utils.formatCurrency(offer.amount || 0)}</span>
                            <div class="text-[10px] text-gray-400 font-medium">Escrow backed</div>
                          </div>
                          <div class="flex items-center gap-2">
                            <button onclick="window.influencer.respondToDeal('${offer.id}', 'accepted')" class="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm">
                              Accept
                            </button>
                            <button onclick="window.influencer.respondToDeal('${offer.id}', 'rejected')" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition">
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div class="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50">
                    <div class="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3">
                      <span class="material-icons-outlined text-2xl">mail_outline</span>
                    </div>
                    <div class="text-sm font-bold text-gray-700">No pending offers right now</div>
                    <p class="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Your profile is visible to 400+ top brands in Discover. You'll receive instant alerts when a deal is offered!</p>
                  </div>
                `}
              </div>

              <!-- Active Deliverables -->
              <div class="dashboard-mesh-card bg-white p-6">
                <div class="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <span class="material-icons-outlined text-xl">assignment</span>
                    </div>
                    <div>
                      <h2 class="text-base font-bold text-gray-900">Active Deliverables</h2>
                      <p class="text-xs text-gray-500">Track deadlines, content approvals, and payouts</p>
                    </div>
                  </div>
                  <button onclick="window.influencer.renderCampaigns()" class="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition">
                    <span>Manage all</span>
                    <span class="material-icons-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                <div class="space-y-3">
                  ${(campaigns || []).slice(0, 4).map(c => `
                    <div class="p-4 rounded-2xl border border-gray-100 hover:border-purple-200 transition-all bg-gray-50/40 hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div class="flex items-center gap-3.5">
                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                          ${(c.brandName || 'B').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div class="font-bold text-gray-900 text-sm">${c.campaignName || 'Campaign Deliverable'}</div>
                          <div class="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                            <span>${c.brandName}</span>
                            <span>•</span>
                            <span class="flex items-center gap-1 text-gray-600">
                              <span class="material-icons-outlined text-xs">event</span>
                              Due: ${c.deadline || 'This week'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <div class="text-right sm:mr-3">
                          <span class="status-badge status-${c.status} text-[11px] font-bold capitalize">${c.status || 'Active'}</span>
                          <div class="text-xs font-extrabold text-purple-600 mt-1">${window.utils.formatCurrency(c.amount || 0)}</div>
                        </div>
                        <button onclick="window.influencer.renderCampaigns()" class="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition">
                          Details
                        </button>
                      </div>
                    </div>
                  `).join('')}
                  ${(campaigns || []).length === 0 ? `
                    <div class="text-center py-8 text-gray-400 text-sm">No active deliverables right now.</div>
                  ` : ''}
                </div>
              </div>

              <!-- Revenue Growth Trends Chart -->
              <div class="dashboard-mesh-card bg-white p-6">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h2 class="text-base font-bold text-gray-900">Earnings Velocity</h2>
                    <p class="text-xs text-gray-500">Monthly payout trajectory & volume growth</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold">2026 Season</span>
                  </div>
                </div>

                <div class="relative h-44 w-full">
                  <svg viewBox="0 0 600 180" class="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="creatorChartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#804ee6" stop-opacity="0.25"/>
                        <stop offset="100%" stop-color="#804ee6" stop-opacity="0.0"/>
                      </linearGradient>
                      <linearGradient id="creatorChartStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#ec4899"/>
                        <stop offset="50%" stop-color="#804ee6"/>
                        <stop offset="100%" stop-color="#06b6d4"/>
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="40" x2="600" y2="40" stroke="#f1f5f9" stroke-dasharray="4 4" stroke-width="1.5" />
                    <line x1="0" y1="90" x2="600" y2="90" stroke="#f1f5f9" stroke-dasharray="4 4" stroke-width="1.5" />
                    <line x1="0" y1="140" x2="600" y2="140" stroke="#f1f5f9" stroke-dasharray="4 4" stroke-width="1.5" />
                    
                    <path d="M 0 140 Q 120 120, 220 85 T 420 50 T 600 25 L 600 180 L 0 180 Z" fill="url(#creatorChartFill)" />
                    <path d="M 0 140 Q 120 120, 220 85 T 420 50 T 600 25" fill="none" stroke="url(#creatorChartStroke)" stroke-width="3.5" stroke-linecap="round" />
                    
                    <circle cx="220" cy="85" r="5" fill="#804ee6" stroke="#ffffff" stroke-width="2.5" />
                    <circle cx="420" cy="50" r="5" fill="#804ee6" stroke="#ffffff" stroke-width="2.5" />
                    <circle cx="600" cy="25" r="6" fill="#06b6d4" stroke="#ffffff" stroke-width="2.5" />
                  </svg>
                </div>
                
                <div class="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 mt-2">
                  <div class="text-center p-2.5 rounded-xl bg-purple-50/50">
                    <div class="text-[10px] uppercase font-bold text-purple-600">Avg Deal Value</div>
                    <div class="text-sm font-extrabold text-gray-900 mt-0.5">₹38,500</div>
                  </div>
                  <div class="text-center p-2.5 rounded-xl bg-emerald-50/50">
                    <div class="text-[10px] uppercase font-bold text-emerald-600">Escrow Security</div>
                    <div class="text-sm font-extrabold text-gray-900 mt-0.5">100% Protected</div>
                  </div>
                  <div class="text-center p-2.5 rounded-xl bg-cyan-50/50">
                    <div class="text-[10px] uppercase font-bold text-cyan-600">Payout Speed</div>
                    <div class="text-sm font-extrabold text-gray-900 mt-0.5">&lt; 24h Bank/UPI</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right 1 Col: Profile Strength, Channels, Milestones -->
            <div class="space-y-8">
              
              <!-- Profile Strength & Verification -->
              <div class="dashboard-mesh-card bg-white p-6">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-base font-bold text-gray-900">Profile Strength</h2>
                  <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">92% Complete</span>
                </div>
                
                <div class="w-full bg-gray-100 rounded-full h-2.5 mb-5 overflow-hidden">
                  <div class="bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-400 h-2.5 rounded-full" style="width: 92%"></div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-50/50 text-emerald-800">
                    <div class="flex items-center gap-2 font-semibold">
                      <span class="material-icons-outlined text-sm text-emerald-600">check_circle</span>
                      <span>Verified Bio & Avatar</span>
                    </div>
                    <span class="text-[10px] font-bold text-emerald-600">Done</span>
                  </div>
                  <div class="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-50/50 text-emerald-800">
                    <div class="flex items-center gap-2 font-semibold">
                      <span class="material-icons-outlined text-sm text-emerald-600">check_circle</span>
                      <span>Instagram Connected</span>
                    </div>
                    <span class="text-[10px] font-bold text-emerald-600">Done</span>
                  </div>
                  <div class="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-50/50 text-emerald-800">
                    <div class="flex items-center gap-2 font-semibold">
                      <span class="material-icons-outlined text-sm text-emerald-600">check_circle</span>
                      <span>Rate Card Configured</span>
                    </div>
                    <span class="text-[10px] font-bold text-emerald-600">Done</span>
                  </div>
                  <div class="flex items-center justify-between text-xs p-2.5 rounded-xl bg-purple-50/50 text-purple-900 border border-purple-100">
                    <div class="flex items-center gap-2 font-semibold">
                      <span class="material-icons-outlined text-sm text-purple-600">radio_button_unchecked</span>
                      <span>YouTube Channel Linked</span>
                    </div>
                    <span class="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">+8% visibility</span>
                  </div>
                </div>
              </div>

              <!-- Connected Channels & Reach -->
              <div class="dashboard-mesh-card bg-white p-6">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-base font-bold text-gray-900">Connected Channels</h2>
                  <span class="text-[10px] text-gray-400 font-medium">Live sync</span>
                </div>

                <div class="space-y-3">
                  <!-- Instagram -->
                  <div class="p-3.5 rounded-2xl border border-gray-100 hover:border-pink-200 transition flex items-center justify-between bg-gradient-to-r from-pink-50/30 to-white">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-sm">
                        <span class="font-bold text-sm">IG</span>
                      </div>
                      <div>
                        <div class="font-bold text-xs text-gray-900">Instagram</div>
                        <div class="text-[11px] text-gray-500">@${creatorName.toLowerCase().replace(/\s/g, '')}</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-extrabold text-sm text-gray-900">${window.utils.formatNumber(followersCount)}</div>
                      <div class="text-[10px] text-gray-400">followers</div>
                    </div>
                  </div>

                  <!-- YouTube -->
                  <div class="p-3.5 rounded-2xl border border-gray-100 hover:border-red-200 transition flex items-center justify-between bg-gradient-to-r from-red-50/30 to-white">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-500 to-red-600 text-white flex items-center justify-center shadow-sm">
                        <span class="font-bold text-sm">YT</span>
                      </div>
                      <div>
                        <div class="font-bold text-xs text-gray-900">YouTube</div>
                        <div class="text-[11px] text-gray-500">${creatorName} Official</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-extrabold text-sm text-gray-900">340K</div>
                      <div class="text-[10px] text-gray-400">subscribers</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recent Activity Stream -->
              <div class="dashboard-mesh-card bg-white p-6">
                <h2 class="text-base font-bold text-gray-900 mb-4">Milestone Activity</h2>
                <div class="space-y-4">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="material-icons-outlined text-sm">payments</span>
                    </div>
                    <div>
                      <div class="text-xs text-gray-800"><span class="font-bold text-gray-900">₹8,500</span> escrow milestone released</div>
                      <div class="text-[10px] text-gray-400 mt-0.5">2 hours ago</div>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="material-icons-outlined text-sm">grade</span>
                    </div>
                    <div>
                      <div class="text-xs text-gray-800"><span class="font-bold text-gray-900">5.0 Star review</span> from Nykaa Beauty</div>
                      <div class="text-[10px] text-gray-400 mt-0.5">Yesterday</div>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="material-icons-outlined text-sm">visibility</span>
                    </div>
                    <div>
                      <div class="text-xs text-gray-800">Profile discovered by <span class="font-bold text-gray-900">OnePlus India</span></div>
                      <div class="text-[10px] text-gray-400 mt-0.5">2 days ago</div>
                    </div>
                  </div>
                </div>
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
  
  async renderCampaigns() {
    try {
      window.ui.updateSidebarActive('Campaigns');
      window.ui.showMainLoading('campaigns');

      const [campaigns, deals] = await Promise.all([
        window.api.getCampaigns(),
        window.api.getDeals()
      ]);
      const pendingOffers = (deals || []).filter(d => d.status === 'pending');
      
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition">
          <h1 class="text-2xl font-bold mb-2">My Campaigns 🚀</h1>
          <p class="text-gray-500 mb-6">Track all your active and completed work</p>
          
          <div class="grid grid-cols-4 gap-5 mb-8">
            <div class="stat-card bg-white rounded-xl p-5 border"><div class="stat-label">Active</div><div class="stat-value" style="color: #f43f87;">${campaigns.filter(c => c.status === 'active').length}</div><div class="stat-change up">Ongoing now</div></div>
            <div class="stat-card bg-white rounded-xl p-5 border"><div class="stat-label">Pending Accept</div><div class="stat-value" style="color: #8b5cf6;">${pendingOffers.length}</div><div class="stat-change down">Respond soon</div></div>
            <div class="stat-card bg-white rounded-xl p-5 border"><div class="stat-label">Completed</div><div class="stat-value" style="color: #06b6d4;">${campaigns.filter(c => c.status === 'completed').length}</div><div class="stat-change up">All time</div></div>
            <div class="stat-card bg-white rounded-xl p-5 border"><div class="stat-label">Total Earned</div><div class="stat-value" style="color: #10b981;">${window.utils.formatCurrency(campaigns.reduce((s, c) => s + c.amount, 0))}</div><div class="stat-change up">↑ All time</div></div>
          </div>
          
          <div class="bg-white rounded-xl border overflow-hidden">
            <div class="flex gap-2 p-4 border-b">
              <button class="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium">All (${campaigns.length + pendingOffers.length})</button>
              <button class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">Active (${campaigns.filter(c => c.status === 'active').length})</button>
              <button class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">New Offers (${pendingOffers.length})</button>
              <button class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">Completed (${campaigns.filter(c => c.status === 'completed').length})</button>
            </div>
            <div class="overflow-x-auto">
              <table class="campaign-table w-full">
                <thead>
                  <tr><th>Brand</th><th>Campaign</th><th>Type</th><th>Status</th><th>Progress</th><th>Deadline</th><th>Payout</th><th>Action</th></tr>
                </thead>
                <tbody>
                  ${pendingOffers.map(offer => `
                    <tr>
                      <td class="font-medium">${offer.brandName}</td>
                      <td>New Offer</td>
                      <td class="capitalize">${offer.packageType}</td>
                      <td><span class="status-badge status-pending">pending</span></td>
                      <td>-</td>
                      <td class="text-gray-400">-</td>
                      <td class="text-purple-600 font-semibold">${window.utils.formatCurrency(offer.amount)}</td>
                      <td><button onclick="window.influencer.respondToDeal('${offer.id}', 'accepted')" class="px-3 py-1 bg-purple-600 text-white rounded text-xs">Accept</button></td>
                    </tr>
                  `).join('')}
                  ${(campaigns || []).map(c => `
                    <tr>
                      <td class="font-medium">${c.brandName}</td>
                      <td>${c.campaignName}</td>
                      <td>${c.type}</td>
                      <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                      <td><div class="w-24"><div class="progress-bar"><div class="progress-fill" style="width: ${c.progress}%"></div></div></div></td>
                      <td class="text-gray-400">${c.deadline}</td>
                      <td class="text-purple-600 font-semibold">${window.utils.formatCurrency(c.amount)}</td>
                      <td>${c.status === 'pending' ? '<button class="px-3 py-1 bg-yellow-500 text-white rounded text-xs">Accept</button>' : c.status === 'review' ? '<button class="px-3 py-1 bg-green-500 text-white rounded text-xs">Submit</button>' : '-'}</td>
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
  
  async renderEarnings() {
    try {
      window.ui.updateSidebarActive('Earnings');
      window.ui.showMainLoading('dashboard');

      const [stats, campaigns] = await Promise.all([
        window.api.getStats(),
        window.api.getCampaigns()
      ]);
      
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition">
          <h1 class="text-2xl font-bold mb-2">Earnings</h1>
          <p class="text-gray-500 mb-6">Track your income and withdrawals</p>
          
          <div class="earnings-banner mb-8">
            <div class="flex justify-between items-center">
              <div>
                <div class="earnings-label">Total Lifetime Earnings</div>
                <div class="earnings-amount">${window.utils.formatCurrency(stats.totalEarned || 0)}</div>
                <div class="earnings-sub">${window.utils.formatCurrency(stats.pendingAmount || 0)} pending release</div>
              </div>
              <button class="px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition">Withdraw Funds</button>
            </div>
          </div>
          
          <div class="bg-white rounded-xl border overflow-hidden">
            <div class="overflow-x-auto">
              <table class="campaign-table w-full">
                <thead>
                  <tr>
                    <th class="p-4">Campaign</th>
                    <th>Brand</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${(campaigns || []).map(c => `
                    <tr>
                      <td class="p-4 font-medium">${c.campaignName}</td>
                      <td>${c.brandName}</td>
                      <td class="font-semibold text-purple-600">${window.utils.formatCurrency(c.amount)}</td>
                      <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                      <td class="text-gray-400">${c.deadline}</td>
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
  
  async renderProfile() {
    try {
      window.ui.updateSidebarActive('Profile');
      window.ui.showMainLoading('dashboard');

      const userData = await window.api.getMe();
      const profile = userData.user?.profile || {};
      this.currentRates = profile.rates;
      
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h1 class="text-2xl font-bold mb-2">My Profile</h1>
              <p class="text-gray-500">Manage your creator profile and rates</p>
            </div>
            <button onclick="window.influencer.openEditRatesModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2">
              ✏️ Edit Rates
            </button>
          </div>
          
          <div class="bg-white rounded-xl border p-6">
            <div class="flex items-center gap-6 mb-6">
              <div class="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-3xl">${profile.avatar || '👤'}</div>
              <div>
                <h2 class="text-xl font-bold">${profile.name || 'Creator'} ${profile.verified ? '<span class="verified-badge ml-2">✓ Verified</span>' : ''}</h2>
                <p class="text-gray-500">${profile.niche || 'Lifestyle'} Creator · ${profile.location || 'India'}</p>
                <div class="flex text-yellow-400 mt-1">${window.utils.getStars(profile.rating || 5)}</div>
              </div>
            </div>
            
            <div class="border-t pt-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold">Promotion Rates</h3>
                <button onclick="window.influencer.openEditRatesModal()" class="text-sm text-purple-600 hover:text-purple-700">Edit →</button>
              </div>
              <div class="grid grid-cols-4 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                  <div class="text-xs text-gray-400">Instagram Story</div>
                  <div class="text-xl font-bold text-purple-600 mt-1">${window.utils.formatCurrency(profile.rates?.story || 5000)}</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                  <div class="text-xs text-gray-400">Instagram Reel</div>
                  <div class="text-xl font-bold text-purple-600 mt-1">${window.utils.formatCurrency(profile.rates?.reel || 12000)}</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                  <div class="text-xs text-gray-400">Feed Post</div>
                  <div class="text-xl font-bold text-purple-600 mt-1">${window.utils.formatCurrency(profile.rates?.post || 8000)}</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                  <div class="text-xs text-gray-400">YouTube</div>
                  <div class="text-xl font-bold text-purple-600 mt-1">${window.utils.formatCurrency(profile.rates?.youtube || 25000)}</div>
                </div>
              </div>
            </div>
            
            <div class="border-t pt-6 mt-6">
              <h3 class="font-semibold mb-4">Social Stats</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span class="text-2xl">📸</span>
                  <div>
                    <div class="font-medium">Instagram</div>
                    <div class="text-gray-500">${((profile.followers || 0) / 1000000).toFixed(1)}M followers</div>
                  </div>
                </div>
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span class="text-2xl">▶️</span>
                  <div>
                    <div class="font-medium">YouTube</div>
                    <div class="text-gray-500">340K subscribers</div>
                  </div>
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
  
  openEditRatesModal() {
    if (this.currentRates) {
      document.getElementById('editRateStory').value = this.currentRates.story;
      document.getElementById('editRateReel').value = this.currentRates.reel;
      document.getElementById('editRatePost').value = this.currentRates.post;
      document.getElementById('editRateYoutube').value = this.currentRates.youtube;
    }
    document.getElementById('editRatesModal').style.display = 'flex';
  },
  
  closeEditRatesModal() {
    document.getElementById('editRatesModal').style.display = 'none';
  },
  
  async saveRates() {
    const newRates = {
      story: parseInt(document.getElementById('editRateStory').value) || 0,
      reel: parseInt(document.getElementById('editRateReel').value) || 0,
      post: parseInt(document.getElementById('editRatePost').value) || 0,
      youtube: parseInt(document.getElementById('editRateYoutube').value) || 0
    };
    
    window.ui.showConfirm({
      title: 'Update Rates',
      message: `Are you sure you want to update your rates?\n\nStory: ${window.utils.formatCurrency(newRates.story)}\nReel: ${window.utils.formatCurrency(newRates.reel)}\nPost: ${window.utils.formatCurrency(newRates.post)}\nYouTube: ${window.utils.formatCurrency(newRates.youtube)}`,
      icon: '💰',
      confirmClass: 'confirm-btn-success',
      confirmText: 'Save Changes',
      onConfirm: async () => {
        try {
          await window.api.updateInfluencerRates(newRates);
          window.ui.showToast('Rates updated successfully!', 'success');
          this.currentRates = newRates;
          this.closeEditRatesModal();
          await this.renderProfile();
        } catch (err) {
          window.ui.showToast('Error updating rates: ' + err.message, 'error');
        }
      }
    });
  },
  
  async respondToDeal(dealId, status) {
    window.ui.showConfirm({
      title: status === 'accepted' ? 'Accept Offer' : 'Decline Offer',
      message: status === 'accepted' ? 'Are you sure you want to accept this offer? You will be expected to deliver the content by the agreed deadline.' : 'Are you sure you want to decline this offer?',
      icon: status === 'accepted' ? '✓' : '✗',
      confirmText: status === 'accepted' ? 'Yes, Accept' : 'Yes, Decline',
      confirmClass: status === 'accepted' ? 'confirm-btn-success' : 'confirm-btn-confirm',
      onConfirm: async () => {
        try {
          await window.api.updateDealStatus(dealId, status);
          window.ui.showToast(`Offer ${status === 'accepted' ? 'accepted' : 'declined'} successfully!`, 'success');
          await this.renderDashboard();
        } catch (err) {
          window.ui.showToast(err.message, 'error');
        }
      }
    });
  }
};