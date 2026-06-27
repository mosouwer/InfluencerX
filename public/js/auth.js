// Authentication Module
window.auth = {
  currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
  
  async login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      const data = await window.api.login({ email, password });
      this.currentUser = data.user;
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      document.getElementById('loginModal').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      
      if (this.currentUser.role === 'admin') {
        document.getElementById('adminModeIndicator').classList.remove('hidden');
        document.getElementById('modeSwitcher').style.display = 'none';
        document.getElementById('mainLogo').className = 'text-xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent';
      }
      
      document.getElementById('userAvatar').textContent = this.currentUser.role === 'brand' ? 
        (this.currentUser.profile.company?.charAt(0) || 'B') : 
        (this.currentUser.role === 'admin' ? 'A' : this.currentUser.profile.name?.charAt(0) || 'I');
      document.getElementById('userName').textContent = this.currentUser.role === 'brand' ? 
        this.currentUser.profile.company : (this.currentUser.role === 'admin' ? 'Admin' : this.currentUser.profile.name);
      
      await window.app.loadInitialData();
      window.app.renderSidebar();
      
      if (this.currentUser.role === 'admin') {
        await window.admin.renderDashboard();
      } else if (window.app.currentMode === 'brand') {
        await window.brand.renderDashboard();
      } else {
        await window.influencer.renderDashboard();
      }
      
      window.ui.showToast(`Welcome back!`, 'success');
    } catch (err) {
      window.ui.showToast('Login failed: ' + err.message, 'error');
    }
  },
  
  async logout() {
    await window.api.logout();
    localStorage.removeItem('currentUser');
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
  }
};