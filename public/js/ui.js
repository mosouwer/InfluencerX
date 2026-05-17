// UI Components Module
window.ui = {
  pendingConfirm: null,
  
  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');
    
    toast.className = 'toast';
    toast.classList.add(`toast-${type}`);
    icon.innerHTML = type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ';
    msg.innerHTML = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  },
  
  showConfirm(options) {
    document.getElementById('confirmIcon').innerHTML = options.icon || '⚠️';
    document.getElementById('confirmTitle').innerHTML = options.title || 'Confirm';
    document.getElementById('confirmMessage').innerHTML = options.message || 'Are you sure?';
    
    const btn = document.getElementById('confirmActionBtn');
    btn.innerHTML = options.confirmText || 'Confirm';
    btn.className = `confirm-btn ${options.confirmClass || 'confirm-btn-confirm'}`;
    
    this.pendingConfirm = options.onConfirm;
    document.getElementById('confirmModal').style.display = 'flex';
  },
  
  hideConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    this.pendingConfirm = null;
  },
  
  executeConfirm() {
    if (this.pendingConfirm) this.pendingConfirm();
    this.hideConfirmModal();
  },
  
  updateSidebarActive(activeItem) {
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
      if (item.textContent.includes(activeItem)) {
        item.classList.add('active');
      }
    });
  },
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};