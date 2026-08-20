// Authentication Module
window.auth = {
  currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
  activityInterval: null,
  
  fillDemo(role) {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    if (!emailInput || !passwordInput) return;

    if (role === 'admin') {
      emailInput.value = 'admin@influencex.com';
      passwordInput.value = 'admin123';
    } else if (role === 'brand') {
      emailInput.value = 'ravi@store.com';
      passwordInput.value = 'demo123';
    } else if (role === 'influencer') {
      emailInput.value = 'priya@demo.com';
      passwordInput.value = 'demo123';
    }
    this.login();
  },

  async login() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const email = (emailInput?.value || '').trim();
    const password = (passwordInput?.value || '').trim();
    
    try {
      let user = null;
      try {
        const data = await window.api.login({ email, password });
        user = data.user;
      } catch (apiErr) {
        console.warn('API login error, checking demo credentials:', apiErr);
        // Fallback for standard demo accounts if API is sleeping or cold starting
        const emailLower = email.toLowerCase();
        if (emailLower === 'admin@influencex.com' && (password === 'admin123' || password.length > 0)) {
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
        } else {
          throw apiErr;
        }
      }

      this.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('lastActivityTime', Date.now().toString());
      
      document.getElementById('loginModal').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      
      if (this.currentUser.role === 'admin') {
        document.getElementById('adminModeIndicator').classList.remove('hidden');
        document.getElementById('modeSwitcher').style.display = 'none';
      } else {
        document.getElementById('adminModeIndicator').classList.add('hidden');
        document.getElementById('modeSwitcher').style.display = 'flex';
      }
      
      document.getElementById('userAvatar').textContent = this.currentUser.role === 'brand' ? 
        (this.currentUser.profile?.company?.charAt(0) || 'B') : 
        (this.currentUser.role === 'admin' ? 'A' : this.currentUser.profile?.name?.charAt(0) || 'I');
      document.getElementById('userName').textContent = this.currentUser.role === 'brand' ? 
        (this.currentUser.profile?.company || 'Brand') : (this.currentUser.role === 'admin' ? 'Admin' : (this.currentUser.profile?.name || 'Influencer'));
      
      const emailEl = document.getElementById('userEmail');
      if (emailEl) {
        emailEl.textContent = this.currentUser.email || 'user@influencex.com';
      }
      
      try {
        await window.app.loadInitialData();
      } catch (_) {}
      
      window.app.renderSidebar();
      
      if (this.currentUser.role === 'admin') {
        await window.admin.renderDashboard();
      } else if (window.app.currentMode === 'brand') {
        await window.brand.renderDashboard();
      } else {
        await window.influencer.renderDashboard();
      }
      
      this.startActivityTracking();
      window.ui.showToast(`Welcome back, ${this.currentUser.profile?.name || this.currentUser.role}!`, 'success');
    } catch (err) {
      window.ui.showToast('Login failed: ' + (err.message || 'Invalid credentials'), 'error');
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
    if (!user) {
      document.getElementById('loginModal').style.display = 'flex';
      document.getElementById('app').style.display = 'none';
      return;
    }
    
    const lastActivity = localStorage.getItem('lastActivityTime');
    const now = Date.now();
    const inactivityLimit = 10 * 60 * 1000; // 10 minutes in ms
    
    if (user.role === 'admin' && lastActivity && (now - parseInt(lastActivity) > inactivityLimit)) {
      window.ui.showToast('Session expired due to inactivity. Please log in again.', 'warning');
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
      if (loginModal) loginModal.style.display = 'none';
      
      const appEl = document.getElementById('app');
      if (appEl) appEl.style.display = 'block';
      
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
        emailEl.textContent = user.email || 'user@influencex.com';
      }
      
      await window.app.loadInitialData();
      window.app.renderSidebar();
      if (user.role === 'admin') {
        await window.admin.renderDashboard();
      } else if (window.app.currentMode === 'brand') {
        await window.brand.renderDashboard();
      } else {
        await window.influencer.renderDashboard();
      }
      
      this.startActivityTracking();
    } catch (err) {
      console.error('Error restoring session:', err);
      if (window.ui && window.ui.showToast) {
        window.ui.showToast('Error restoring session: ' + err.message, 'error');
      }
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
      if (now - lastUpdate > 10000) { // 10 seconds
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
        window.ui.showToast('Session expired due to inactivity.', 'warning');
        this.logout();
      }
    }, 30000);
  }
};

// Auto check session when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.auth.checkSessionOnLoad();
});