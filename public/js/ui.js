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

  startTopProgress() {
    const bar = document.getElementById('topProgressBar');
    if (bar) {
      bar.style.opacity = '1';
    }
  },

  stopTopProgress() {
    const bar = document.getElementById('topProgressBar');
    if (bar) {
      bar.style.opacity = '0';
    }
  },

  showMainLoading(layout = 'dashboard') {
    const mainContent = document.getElementById('mainContent');
    this.startTopProgress();
    if (!mainContent) return;

    let skeletonHtml = '';
    if (layout === 'table' || layout === 'users' || layout === 'campaigns' || layout === 'withdrawals' || layout === 'deals') {
      skeletonHtml = `
        <div class="space-y-4 animate-pulse">
          <!-- Top filters skeleton -->
          <div class="flex gap-2">
            <div class="h-8 w-24 bg-gray-200/80 rounded-lg"></div>
            <div class="h-8 w-24 bg-gray-200/80 rounded-lg"></div>
            <div class="h-8 w-24 bg-gray-200/80 rounded-lg"></div>
          </div>
          <!-- Search skeleton -->
          <div class="h-10 w-full max-w-md bg-gray-200/80 rounded-lg"></div>
          <!-- Table skeleton -->
          <div class="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs">
            <div class="h-12 bg-gray-100/80 border-b border-gray-150"></div>
            <div class="divide-y divide-gray-100">
              ${[1, 2, 3, 4, 5].map(() => `
                <div class="p-4 flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gray-200"></div>
                    <div class="space-y-1.5">
                      <div class="w-28 h-3.5 bg-gray-200 rounded"></div>
                      <div class="w-20 h-2.5 bg-gray-150 rounded"></div>
                    </div>
                  </div>
                  <div class="w-32 h-3 bg-gray-200 rounded hidden sm:block"></div>
                  <div class="w-20 h-5 bg-gray-200 rounded-md"></div>
                  <div class="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      skeletonHtml = `
        <div class="space-y-6 animate-pulse">
          <!-- Stat cards skeleton -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="h-36 bg-gray-200/80 rounded-xl"></div>
            <div class="h-36 bg-gray-200/80 rounded-xl"></div>
            <div class="h-36 bg-gray-200/80 rounded-xl"></div>
          </div>
          <!-- Metric cards skeleton -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="h-24 bg-gray-200/80 rounded-xl"></div>
            <div class="h-24 bg-gray-200/80 rounded-xl"></div>
            <div class="h-24 bg-gray-200/80 rounded-xl"></div>
            <div class="h-24 bg-gray-200/80 rounded-xl"></div>
          </div>
          <!-- Lower grid skeleton -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="h-64 bg-gray-200/80 rounded-xl md:col-span-2"></div>
            <div class="h-64 bg-gray-200/80 rounded-xl"></div>
          </div>
        </div>
      `;
    }

    mainContent.innerHTML = `
      <div class="page-transition min-h-[calc(100vh-120px)] flex flex-col justify-start relative">
        <!-- Floating Modern Ring Loader Animation over Blur Screen -->
        <div class="absolute inset-0 z-20 flex items-center justify-center pointer-events-none backdrop-blur-[2px] bg-white/40 rounded-2xl transition-all duration-300">
          <div class="relative w-20 h-20 flex items-center justify-center">
            <!-- Outer glowing spinning ring -->
            <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-[#804ee6] border-r-[#ff8a3d] animate-spin"></div>
            <!-- Inner reverse spinning ring -->
            <div class="absolute inset-1.5 rounded-full border-2 border-transparent border-b-[#804ee6] border-l-[#a855f7] animate-spin-reverse opacity-75"></div>
            <!-- Glowing pulse backdrop -->
            <div class="absolute inset-3 rounded-full bg-gradient-to-tr from-[#804ee6]/20 to-[#ff8a3d]/20 blur-sm animate-pulse"></div>
            <!-- Center IX Logo Badge -->
            <div class="relative w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-purple-100/80 flex items-center justify-center">
              <span class="text-xs font-black tracking-tighter bg-gradient-to-r from-[#804ee6] to-[#ff8a3d] bg-clip-text text-transparent">IX</span>
              <span class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#ff8a3d] animate-ping"></span>
            </div>
          </div>
        </div>

        <!-- Skeleton Content in background -->
        <div class="opacity-40 pointer-events-none select-none">
          <div class="mb-6 space-y-2">
            <div class="h-8 w-60 bg-gray-200/80 rounded-lg"></div>
            <div class="h-4 w-96 max-w-full bg-gray-150 rounded"></div>
          </div>
          ${skeletonHtml}
        </div>
      </div>
    `;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};