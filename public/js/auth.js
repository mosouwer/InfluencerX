// Authentication Module
window.auth = {
  currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
  activityInterval: null,
  
  async login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      const data = await window.api.login({ email, password });
      this.currentUser = data.user;
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      localStorage.setItem('lastActivityTime', Date.now().toString());
      
      document.getElementById('loginModal').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      
      if (this.currentUser.role === 'admin') {
        document.getElementById('adminModeIndicator').classList.remove('hidden');
        document.getElementById('modeSwitcher').style.display = 'none';
      }
      
      document.getElementById('userAvatar').textContent = this.currentUser.role === 'brand' ? 
        (this.currentUser.profile.company?.charAt(0) || 'B') : 
        (this.currentUser.role === 'admin' ? 'A' : this.currentUser.profile.name?.charAt(0) || 'I');
      document.getElementById('userName').textContent = this.currentUser.role === 'brand' ? 
        this.currentUser.profile.company : (this.currentUser.role === 'admin' ? 'Admin' : this.currentUser.profile.name);
      
      const emailEl = document.getElementById('userEmail');
      if (emailEl) {
        emailEl.textContent = this.currentUser.email || 'user@influencex.com';
      }
      
      await window.app.loadInitialData();
      window.app.renderSidebar();
      
      if (this.currentUser.role === 'admin') {
        await window.admin.renderDashboard();
      } else if (window.app.currentMode === 'brand') {
        await window.brand.renderDashboard();
      } else {
        await window.influencer.renderDashboard();
      }
      
      this.startActivityTracking();
      window.ui.showToast(`Welcome back!`, 'success');
    } catch (err) {
      window.ui.showToast('Login failed: ' + err.message, 'error');
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
  
  restoreSession(user) {
    this.currentUser = user;
    localStorage.setItem('lastActivityTime', Date.now().toString());
    
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    
    if (user.role === 'admin') {
      document.getElementById('adminModeIndicator').classList.remove('hidden');
      document.getElementById('modeSwitcher').style.display = 'none';
      document.getElementById('mainLogo').className = 'text-xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent';
    }
    
    document.getElementById('userAvatar').textContent = user.role === 'brand' ? 
      (user.profile.company?.charAt(0) || 'B') : 
      (user.role === 'admin' ? 'A' : user.profile.name?.charAt(0) || 'I');
    document.getElementById('userName').textContent = user.role === 'brand' ? 
      user.profile.company : (user.role === 'admin' ? 'Admin' : user.profile.name);
    
    window.app.loadInitialData().then(() => {
      window.app.renderSidebar();
      if (user.role === 'admin') {
        window.admin.renderDashboard();
      } else if (window.app.currentMode === 'brand') {
        window.brand.renderDashboard();
      } else {
        window.influencer.renderDashboard();
      }
    });
    
    this.startActivityTracking();
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