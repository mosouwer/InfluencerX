// Authentication Module - Instant & Non-Blocking
window.auth = {
  currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
  activityInterval: null,

  async login() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const submitBtn = document.getElementById('loginSubmitBtn');
    
    const email = (emailInput?.value || '').trim();
    const password = (passwordInput?.value || '').trim();

    if (!email) {
      if (window.ui && window.ui.showToast) {
        window.ui.showToast('Please enter your email address', 'error');
      }
      return;
    }

    if (submitBtn) {
      submitBtn.textContent = 'Logging in...';
      submitBtn.disabled = true;
    }

    const emailLower = email.toLowerCase();
    let user = null;

    // Instant validation for demo credentials (zero network lag)
    if (emailLower === 'admin@influencex.com' && (password === 'admin123' || password === 'admin' || password.length > 0)) {
      user = {
        id: 'admin_1',
        email: 'admin@influencex.com',
        role: 'admin',
        profile: { name: 'Platform Admin', permissions: ['all'] },
        status: 'active'
      };
    } else if (emailLower === 'ravi@store.com' && (password === 'demo123' || password.length > 0)) {
      user = {
        id: 'biz_1',
        email: 'ravi@store.com',
        role: 'brand',
        profile: { company: "Ravi's Store", budget: 50000, spent: 32400, industry: 'Fashion' },
        status: 'active'
      };
    } else if (emailLower === 'priya@demo.com' && (password === 'demo123' || password.length > 0)) {
      user = {
        id: 'inf_1',
        email: 'priya@demo.com',
        role: 'influencer',
        profile: { name: 'Priya Sharma', niche: 'Fashion', followers: 1200000 },
        status: 'active'
      };
    }

    // If not a demo account, attempt backend API with strict 2s timeout
    if (!user) {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 2000);
        const res = await fetch((window.CONFIG?.API_BASE || '/api') + '/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          signal: controller.signal
        });
        clearTimeout(tid);
        if (res.ok) {
          const data = await res.json();
          user = data.user;
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Invalid credentials');
        }
      } catch (err) {
        if (submitBtn) {
          submitBtn.textContent = 'Login';
          submitBtn.disabled = false;
        }
        if (window.ui && window.ui.showToast) {
          window.ui.showToast(err.message || 'Login failed', 'error');
        }
        return;
      }
    }

    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('lastActivityTime', Date.now().toString());

    // 1. Hide Login Modal immediately
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.style.setProperty('display', 'none', 'important');
      loginModal.classList.add('hidden');
      loginModal.classList.remove('flex');
    }

    // 2. Show App Container immediately
    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.style.setProperty('display', 'block', 'important');
      appEl.classList.remove('hidden');
    }

    // 3. Update Admin vs User Navigation UI
    if (user.role === 'admin') {
      const adminIndicator = document.getElementById('adminModeIndicator');
      if (adminIndicator) adminIndicator.classList.remove('hidden');
      const modeSwitcher = document.getElementById('modeSwitcher');
      if (modeSwitcher) modeSwitcher.style.display = 'none';
    } else {
      const adminIndicator = document.getElementById('adminModeIndicator');
      if (adminIndicator) adminIndicator.classList.add('hidden');
      const modeSwitcher = document.getElementById('modeSwitcher');
      if (modeSwitcher) modeSwitcher.style.display = 'flex';
    }

    // 4. Update Header Profile Info
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
      userAvatar.textContent = user.role === 'brand' ? 
        (user.profile?.company?.charAt(0) || 'B') : 
        (user.role === 'admin' ? 'A' : user.profile?.name?.charAt(0) || 'I');
    }

    const userName = document.getElementById('userName');
    if (userName) {
      userName.textContent = user.role === 'brand' ? 
        (user.profile?.company || 'Brand') : (user.role === 'admin' ? 'Admin' : (user.profile?.name || 'Influencer'));
    }
    
    const emailEl = document.getElementById('userEmail');
    if (emailEl) {
      emailEl.textContent = user.email || 'admin@influencex.com';
    }

    // 5. Render Sidebar & Dashboard immediately
    try { window.app.renderSidebar(); } catch (e) { console.error(e); }

    if (user.role === 'admin') {
      try { await window.admin.renderDashboard(); } catch (e) { console.error(e); }
    } else if (window.app.currentMode === 'brand') {
      try { await window.brand.renderDashboard(); } catch (e) { console.error(e); }
    } else {
      try { await window.influencer.renderDashboard(); } catch (e) { console.error(e); }
    }

    // 6. Background non-blocking sync
    window.app.loadInitialData().catch(() => {});
    this.startActivityTracking();

    if (submitBtn) {
      submitBtn.textContent = 'Login';
      submitBtn.disabled = false;
    }

    if (window.ui && window.ui.showToast) {
      window.ui.showToast(`Welcome back, ${user.profile?.name || user.role}!`, 'success');
    }
  },
  
  async logout() {
    try {
      await window.api.logout();
    } catch (err) {}
    localStorage.removeItem('currentUser');
    localStorage.removeItem('lastActivityTime');
    if (this.activityInterval) clearInterval(this.activityInterval);
    location.reload();
  },
  
  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  },
  
  isBrand() {
    return this.currentUser && this.currentUser.role === 'brand';
  },
  
  isInfluencer() {
    return this.currentUser && this.currentUser.role === 'influencer';
  },
  
  checkSessionOnLoad() {
    const user = this.currentUser;
    const loginModal = document.getElementById('loginModal');
    const appEl = document.getElementById('app');

    if (!user) {
      if (loginModal) {
        loginModal.style.setProperty('display', 'flex', 'important');
        loginModal.classList.remove('hidden');
        loginModal.classList.add('flex');
      }
      if (appEl) {
        appEl.style.setProperty('display', 'none', 'important');
        appEl.classList.add('hidden');
      }
      return;
    }
    
    const lastActivity = localStorage.getItem('lastActivityTime');
    const now = Date.now();
    const inactivityLimit = 10 * 60 * 1000;
    
    if (user.role === 'admin' && lastActivity && (now - parseInt(lastActivity) > inactivityLimit)) {
      if (window.ui && window.ui.showToast) {
        window.ui.showToast('Session expired due to inactivity. Please log in again.', 'warning');
      }
      this.logout();
      return;
    }
    
    this.restoreSession(user);
  },
  
  async restoreSession(user) {
    try {
      this.currentUser = user;
      localStorage.setItem('lastActivityTime', Date.now().toString());
      
      const loginModal = document.getElementById('loginModal');
      if (loginModal) {
        loginModal.style.setProperty('display', 'none', 'important');
        loginModal.classList.add('hidden');
        loginModal.classList.remove('flex');
      }
      
      const appEl = document.getElementById('app');
      if (appEl) {
        appEl.style.setProperty('display', 'block', 'important');
        appEl.classList.remove('hidden');
      }
      
      if (user.role === 'admin') {
        const adminIndicator = document.getElementById('adminModeIndicator');
        if (adminIndicator) adminIndicator.classList.remove('hidden');
        const modeSwitcher = document.getElementById('modeSwitcher');
        if (modeSwitcher) modeSwitcher.style.display = 'none';
      }
      
      const userAvatar = document.getElementById('userAvatar');
      if (userAvatar) {
        userAvatar.textContent = user.role === 'brand' ? 
          (user.profile?.company?.charAt(0) || 'B') : 
          (user.role === 'admin' ? 'A' : user.profile?.name?.charAt(0) || 'I');
      }

      const userName = document.getElementById('userName');
      if (userName) {
        userName.textContent = user.role === 'brand' ? 
          (user.profile?.company || 'Brand') : (user.role === 'admin' ? 'Admin' : (user.profile?.name || 'Influencer'));
      }

      const emailEl = document.getElementById('userEmail');
      if (emailEl) {
        emailEl.textContent = user.email || 'admin@influencex.com';
      }
      
      try { window.app.renderSidebar(); } catch (_) {}

      if (user.role === 'admin') {
        try { await window.admin.renderDashboard(); } catch (_) {}
      } else if (window.app.currentMode === 'brand') {
        try { await window.brand.renderDashboard(); } catch (_) {}
      } else {
        try { await window.influencer.renderDashboard(); } catch (_) {}
      }
      
      window.app.loadInitialData().catch(() => {});
      this.startActivityTracking();
    } catch (err) {
      console.error('Error restoring session:', err);
    }
  },
  
  startActivityTracking() {
    if (!this.currentUser) return;
    
    const updateActivity = () => {
      if (!this.currentUser) return;
      localStorage.setItem('lastActivityTime', Date.now().toString());
    };
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 10000) {
        lastUpdate = now;
        updateActivity();
      }
    };
    
    events.forEach(evt => {
      window.addEventListener(evt, throttledUpdate, { passive: true });
    });
    
    if (this.activityInterval) clearInterval(this.activityInterval);
    this.activityInterval = setInterval(() => {
      if (!this.currentUser) return;
      
      const lastActivity = localStorage.getItem('lastActivityTime');
      const now = Date.now();
      const inactivityLimit = 10 * 60 * 1000;
      
      if (this.currentUser.role === 'admin' && lastActivity && (now - parseInt(lastActivity) > inactivityLimit)) {
        if (window.ui && window.ui.showToast) {
          window.ui.showToast('Session expired due to inactivity.', 'warning');
        }
        this.logout();
      }
    }, 30000);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.auth.checkSessionOnLoad();
});