// Authentication Module - Instant Local-First Login
window.auth = {
  currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
  activityInterval: null,

  // Called by the Login button
  async login() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const submitBtn = document.getElementById('loginSubmitBtn');
    
    const email = (emailInput ? emailInput.value : '').trim();
    const password = (passwordInput ? passwordInput.value : '').trim();

    if (!email) {
      alert('Please enter your email address.');
      return;
    }

    if (submitBtn) {
      submitBtn.textContent = 'Logging in...';
      submitBtn.disabled = true;
    }

    var user = null;

    // Step 1: Instant local check for known demo accounts (no network needed)
    var emailLower = email.toLowerCase();
    if (emailLower === 'admin@influencex.com') {
      user = {
        id: 'admin_1',
        email: 'admin@influencex.com',
        role: 'admin',
        profile: { name: 'Platform Admin', permissions: ['all'] },
        status: 'active'
      };
    } else if (emailLower === 'ravi@store.com') {
      user = {
        id: 'biz_1',
        email: 'ravi@store.com',
        role: 'brand',
        profile: { company: "Ravi's Store", budget: 50000, spent: 32400, industry: 'Fashion' },
        status: 'active'
      };
    } else if (emailLower === 'priya@demo.com') {
      user = {
        id: 'inf_1',
        email: 'priya@demo.com',
        role: 'influencer',
        profile: { name: 'Priya Sharma', niche: 'Fashion', followers: 1200000 },
        status: 'active'
      };
    }

    // Step 2: If not a known demo account, try the backend API
    if (!user) {
      try {
        var res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password })
        });
        if (res.ok) {
          var data = await res.json();
          user = data.user;
        } else {
          var errData = await res.json().catch(function() { return {}; });
          if (submitBtn) { submitBtn.textContent = 'Login'; submitBtn.disabled = false; }
          alert(errData.error || 'Invalid credentials. Please try again.');
          return;
        }
      } catch (netErr) {
        if (submitBtn) { submitBtn.textContent = 'Login'; submitBtn.disabled = false; }
        alert('Network error. Please check your connection.');
        return;
      }
    }

    if (!user) {
      if (submitBtn) { submitBtn.textContent = 'Login'; submitBtn.disabled = false; }
      alert('Login failed. Please check your credentials.');
      return;
    }

    // Step 3: Store session
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('lastActivityTime', String(Date.now()));

    // Step 4: Hide Login Modal, show app — using multiple methods to be safe
    var loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.style.cssText += ';display:none!important';
      loginModal.setAttribute('style', 'display:none!important');
    }

    var appEl = document.getElementById('app');
    if (appEl) {
      appEl.style.cssText += ';display:block!important';
      appEl.setAttribute('style', 'display:block!important');
    }

    // Step 5: Update nav UI based on role
    var adminIndicator = document.getElementById('adminModeIndicator');
    var modeSwitcher = document.getElementById('modeSwitcher');
    if (user.role === 'admin') {
      if (adminIndicator) adminIndicator.classList.remove('hidden');
      if (modeSwitcher) modeSwitcher.style.display = 'none';
    } else {
      if (adminIndicator) adminIndicator.classList.add('hidden');
      if (modeSwitcher) modeSwitcher.style.display = 'flex';
    }

    var avatar = user.role === 'brand'
      ? (user.profile && user.profile.company ? user.profile.company.charAt(0) : 'B')
      : user.role === 'admin' ? 'A'
      : (user.profile && user.profile.name ? user.profile.name.charAt(0) : 'I');

    var nameText = user.role === 'brand'
      ? (user.profile && user.profile.company ? user.profile.company : 'Brand')
      : user.role === 'admin' ? 'Admin'
      : (user.profile && user.profile.name ? user.profile.name : 'Creator');

    var userAvatar = document.getElementById('userAvatar');
    if (userAvatar) userAvatar.textContent = avatar;

    var userName = document.getElementById('userName');
    if (userName) userName.textContent = nameText;

    var emailEl = document.getElementById('userEmail');
    if (emailEl) emailEl.textContent = user.email;

    // Step 6: Render sidebar and dashboard
    try { window.app.renderSidebar(); } catch(e) { console.warn('renderSidebar error:', e); }

    if (user.role === 'admin') {
      try { await window.admin.renderDashboard(); } catch(e) { console.warn('admin dashboard error:', e); }
    } else if (window.app && window.app.currentMode === 'brand') {
      try { await window.brand.renderDashboard(); } catch(e) { console.warn('brand dashboard error:', e); }
    } else {
      try { await window.influencer.renderDashboard(); } catch(e) { console.warn('influencer dashboard error:', e); }
    }

    // Step 7: Non-blocking background load
    if (window.app && window.app.loadInitialData) {
      window.app.loadInitialData().catch(function() {});
    }

    this.startActivityTracking();

    if (submitBtn) {
      submitBtn.textContent = 'Login';
      submitBtn.disabled = false;
    }

    if (window.ui && window.ui.showToast) {
      window.ui.showToast('Welcome back, ' + nameText + '!', 'success');
    }
  },

  async logout() {
    try { await fetch('/api/logout', { method: 'POST' }); } catch(e) {}
    localStorage.removeItem('currentUser');
    localStorage.removeItem('lastActivityTime');
    if (this.activityInterval) clearInterval(this.activityInterval);
    location.reload();
  },

  isAdmin() { return this.currentUser && this.currentUser.role === 'admin'; },
  isBrand() { return this.currentUser && this.currentUser.role === 'brand'; },
  isInfluencer() { return this.currentUser && this.currentUser.role === 'influencer'; },

  checkSessionOnLoad() {
    var user = this.currentUser;
    var loginModal = document.getElementById('loginModal');
    var appEl = document.getElementById('app');

    if (!user) {
      if (loginModal) loginModal.setAttribute('style', 'display:flex!important');
      if (appEl) appEl.setAttribute('style', 'display:none!important');
      return;
    }

    var lastActivity = localStorage.getItem('lastActivityTime');
    var inactivityLimit = 10 * 60 * 1000;
    if (user.role === 'admin' && lastActivity && (Date.now() - parseInt(lastActivity) > inactivityLimit)) {
      this.logout();
      return;
    }

    this.restoreSession(user);
  },

  async restoreSession(user) {
    this.currentUser = user;
    localStorage.setItem('lastActivityTime', String(Date.now()));

    var loginModal = document.getElementById('loginModal');
    if (loginModal) loginModal.setAttribute('style', 'display:none!important');

    var appEl = document.getElementById('app');
    if (appEl) appEl.setAttribute('style', 'display:block!important');

    if (user.role === 'admin') {
      var adminIndicator = document.getElementById('adminModeIndicator');
      if (adminIndicator) adminIndicator.classList.remove('hidden');
      var modeSwitcher = document.getElementById('modeSwitcher');
      if (modeSwitcher) modeSwitcher.style.display = 'none';
    }

    var avatar = user.role === 'brand'
      ? (user.profile && user.profile.company ? user.profile.company.charAt(0) : 'B')
      : user.role === 'admin' ? 'A'
      : (user.profile && user.profile.name ? user.profile.name.charAt(0) : 'I');

    var nameText = user.role === 'brand'
      ? (user.profile && user.profile.company ? user.profile.company : 'Brand')
      : user.role === 'admin' ? 'Admin'
      : (user.profile && user.profile.name ? user.profile.name : 'Creator');

    var userAvatar = document.getElementById('userAvatar');
    if (userAvatar) userAvatar.textContent = avatar;

    var userName = document.getElementById('userName');
    if (userName) userName.textContent = nameText;

    var emailEl = document.getElementById('userEmail');
    if (emailEl) emailEl.textContent = user.email;

    try { window.app.renderSidebar(); } catch(e) {}

    if (user.role === 'admin') {
      try { await window.admin.renderDashboard(); } catch(e) {}
    } else if (window.app && window.app.currentMode === 'brand') {
      try { await window.brand.renderDashboard(); } catch(e) {}
    } else {
      try { await window.influencer.renderDashboard(); } catch(e) {}
    }

    if (window.app && window.app.loadInitialData) {
      window.app.loadInitialData().catch(function() {});
    }

    this.startActivityTracking();
  },

  startActivityTracking() {
    if (!this.currentUser) return;
    var self = this;

    var lastUpdate = 0;
    var throttledUpdate = function() {
      var now = Date.now();
      if (now - lastUpdate > 10000) {
        lastUpdate = now;
        localStorage.setItem('lastActivityTime', String(now));
      }
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(function(evt) {
      window.addEventListener(evt, throttledUpdate, { passive: true });
    });

    if (this.activityInterval) clearInterval(this.activityInterval);
    this.activityInterval = setInterval(function() {
      if (!self.currentUser) return;
      var lastActivity = localStorage.getItem('lastActivityTime');
      var inactivityLimit = 10 * 60 * 1000;
      if (self.currentUser.role === 'admin' && lastActivity && (Date.now() - parseInt(lastActivity) > inactivityLimit)) {
        self.logout();
      }
    }, 30000);
  }
};

window.addEventListener('DOMContentLoaded', function() {
  window.auth.checkSessionOnLoad();
});