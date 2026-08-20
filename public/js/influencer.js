// Influencer Module - Enhanced with complete UI
window.influencer = {
  currentRates: null,
  
  async renderDashboard() {
    try {
      window.ui.updateSidebarActive('Dashboard');
      window.ui.showMainLoading('Creator Dashboard', 'Loading analytics, earnings balance, and campaign milestones...', 'dashboard');

      const [stats, campaigns, deals] = await Promise.all([
        window.api.getStats(),
        window.api.getCampaigns(),
        window.api.getDeals()
      ]);
      const pendingOffers = (deals || []).filter(d => d.status === 'pending');
      
      // Mock monthly earnings for chart
      const monthlyEarnings = [12, 18, 22, 35, 42, 38];
      
      document.getElementById('mainContent').innerHTML = `
        <div class="page-transition">
          <h1 class="text-2xl font-bold mb-2">Creator Dashboard ✨</h1>
          <p class="text-gray-500 mb-6">Your performance at a glance, ${window.auth.currentUser?.profile?.name || 'Creator'}</p>
          
          <!-- Earnings Banner -->
          <div class="earnings-banner mb-8">
            <div class="flex justify-between items-center">
              <div>
                <div class="earnings-label">Total Earnings — May 2026</div>
                <div class="earnings-amount">${window.utils.formatCurrency(stats.totalEarned || 0)}</div>
                <div class="earnings-sub">+${window.utils.formatCurrency(stats.pendingAmount || 0)} pending release · ${window.utils.formatCurrency((stats.totalEarned || 0) - (stats.pendingAmount || 0))} available</div>
              </div>
              <div class="flex gap-3">
                <button onclick="window.influencer.renderEarnings()" class="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold hover:bg-white/30 transition">View History</button>
                <button onclick="window.influencer.renderEarnings()" class="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-semibold hover:bg-gray-100 transition">Withdraw →</button>
              </div>
            </div>
          </div>
          
          <!-- Stats Row -->
          <div class="grid grid-cols-4 gap-5 mb-8">
            <div class="stat-card bg-white rounded-xl p-5 border">
              <div class="stat-label">Active Campaigns</div>
              <div class="stat-value" style="color: #ec4899;">${stats.activeCampaigns || 0}</div>
              <div class="stat-change up">↑ 2 new this week</div>
            </div>
            <div class="stat-card bg-white rounded-xl p-5 border">
              <div class="stat-label">Completion Rate</div>
              <div class="stat-value" style="color: #8b5cf6;">96%</div>
              <div class="stat-change up">Top 5%</div>
            </div>
            <div class="stat-card bg-white rounded-xl p-5 border">
              <div class="stat-label">Profile Views</div>
              <div class="stat-value" style="color: #06b6d4;">${stats.profileViews || 1400}</div>
              <div class="stat-change up">↑ 38% this week</div>
            </div>
            <div class="stat-card bg-white rounded-xl p-5 border">
              <div class="stat-label">Avg. Rating</div>
              <div class="stat-value" style="color: #10b981;">${stats.rating || 4.8}⭐</div>
              <div class="stat-change up">47 reviews</div>
            </div>
          </div>
          
          <!-- Main Side Layout -->
          <div class="main-side">
            <!-- Left Column -->
            <div>
              <!-- Incoming Offers -->
              ${pendingOffers.length > 0 ? `
                <div class="bg-white rounded-xl border p-5 mb-6">
                  <div class="flex justify-between items-center mb-4">
                    <h2 class="font-semibold">🔥 New Campaign Offers</h2>
                    <button onclick="window.influencer.renderCampaigns()" class="text-purple-600 text-sm">See all →</button>
                  </div>
                  ${pendingOffers.map(offer => `
                    <div class="offer-item flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-3">
                      <div>
                        <div class="font-bold">${offer.brandName}</div>
                        <div class="text-xs text-gray-500">${offer.packageType || 'Post'} · ${offer.message || 'New campaign deal'}</div>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="font-bold text-purple-600">${window.utils.formatCurrency(offer.amount || 0)}</span>
                        <button onclick="window.influencer.respondToDeal('${offer.id}', 'accepted')" class="px-3 py-1 bg-green-600 text-white rounded text-xs">Accept</button>
                        <button onclick="window.influencer.respondToDeal('${offer.id}', 'rejected')" class="px-3 py-1 bg-red-500 text-white rounded text-xs">Decline</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              
              <!-- Active Deliverables -->
              <div class="bg-white rounded-xl border p-5 mb-6">
                <h2 class="font-semibold mb-4">Active Deliverables</h2>
                <div class="space-y-4">
                  ${(campaigns || []).slice(0, 3).map(c => `
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div class="font-bold">${c.campaignName}</div>
                        <div class="text-xs text-gray-500">${c.brandName} · Due: ${c.deadline || 'Soon'}</div>
                      </div>
                      <div class="text-right">
                        <span class="status-badge status-${c.status}">${c.status}</span>
                        <div class="text-xs font-bold text-purple-600 mt-1">${window.utils.formatCurrency(c.amount || 0)}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            
            <!-- Right Column -->
            <div>
                <div class="space-y-2">
                  <div class="profile-strength-item completed"><span>✅</span><span>Profile photo & bio</span></div>
                  <div class="profile-strength-item completed"><span>✅</span><span>Instagram connected</span></div>
                  <div class="profile-strength-item completed"><span>✅</span><span>Rates set</span></div>
                  <div class="profile-strength-item pending"><span>⬜</span><span>YouTube connected</span><span class="profile-strength-bonus">+10%</span></div>
                  <div class="profile-strength-item pending"><span>⬜</span><span>Media kit uploaded</span><span class="profile-strength-bonus">+8%</span></div>
                </div>
              </div>
              
              <!-- Social Stats -->
              <div class="bg-white rounded-xl border p-5 mb-5">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="font-semibold">Social Stats</h2>
                  <span class="text-xs text-gray-400">Last synced: 2hr ago</span>
                </div>
                <div class="social-stats">
                  <div class="social-stat">
                    <span class="social-icon">📸</span>
                    <div class="social-info"><div class="social-name">Instagram</div><div class="social-handle">@${window.auth.currentUser.profile.name.toLowerCase().replace(/\s/g, '')}</div></div>
                    <div class="social-count"><div class="social-number">${window.utils.formatNumber(window.auth.currentUser.profile.followers)}</div><div class="social-label">followers</div></div>
                  </div>
                  <div class="social-stat">
                    <span class="social-icon">▶️</span>
                    <div class="social-info"><div class="social-name">YouTube</div><div class="social-handle">${window.auth.currentUser.profile.name}TV</div></div>
                    <div class="social-count"><div class="social-number">340K</div><div class="social-label">subscribers</div></div>
                  </div>
                </div>
              </div>
              
              <!-- Recent Activity -->
              <div class="bg-white rounded-xl border p-5">
                <h2 class="font-semibold mb-4">Recent Activity</h2>
                <div class="activity-list">
                  <div class="activity-item">
                    <div class="activity-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">💰</div>
                    <div class="activity-text"><div class="activity-main"><b>₹8,000</b> released from NikeIndia campaign</div><div class="activity-time">3 hours ago</div></div>
                  </div>
                  <div class="activity-item">
                    <div class="activity-icon" style="background: rgba(244, 63, 135, 0.1); color: #f43f87;">⭐</div>
                    <div class="activity-text"><div class="activity-main"><b>5-star review</b> received from Nykaa</div><div class="activity-time">1 day ago</div></div>
                  </div>
                  <div class="activity-item">
                    <div class="activity-icon" style="background: rgba(34, 211, 238, 0.1); color: #22d3ee;">👁️</div>
                    <div class="activity-text"><div class="activity-main">Profile viewed by <b>OnePlus India</b></div><div class="activity-time">2 days ago</div></div>
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
      const campaigns = await window.api.getCampaigns();
      const deals = await window.api.getDeals();
      const pendingOffers = deals.filter(d => d.status === 'pending');
      
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
      window.ui.showMainLoading('Earnings & Payouts', 'Calculating revenue history, available balance, and payment transfers...', 'dashboard');

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
      window.ui.showMainLoading('Creator Profile', 'Loading profile rates, verified credentials, and performance stats...', 'dashboard');

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