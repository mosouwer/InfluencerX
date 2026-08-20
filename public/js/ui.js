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

  showMainLoading(title = 'Loading...', subtitle = 'Fetching latest data...', layout = 'dashboard') {
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
        <!-- Floating Modern Orbital Loader Overlay -->
        <div class="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none backdrop-blur-[1px] bg-white/40 rounded-2xl transition-all duration-300">
          <div class="bg-white/95 border border-purple-100/80 shadow-[0_20px_50px_rgba(128,78,230,0.15)] rounded-2xl p-6 sm:p-8 flex flex-col items-center max-w-sm text-center transform scale-100">
            <!-- Modern Orbital Halo Animation -->
            <div class="relative w-20 h-20 mb-4 flex items-center justify-center">
              <!-- Outer glowing spinning ring -->
              <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-[#804ee6] border-r-[#ff8a3d] animate-spin"></div>
              <!-- Inner reverse spinning ring -->
              <div class="absolute inset-1 rounded-full border-2 border-transparent border-b-[#804ee6] border-l-[#a855f7] animate-spin-reverse opacity-70"></div>
              <!-- Glowing pulse backdrop -->
              <div class="absolute inset-3 rounded-full bg-gradient-to-tr from-[#804ee6]/20 to-[#ff8a3d]/20 blur-sm animate-pulse"></div>
              <!-- Center IX Logo Badge -->
              <div class="relative w-11 h-11 bg-white rounded-full shadow-md border border-purple-100 flex items-center justify-center">
                <span class="text-sm font-black tracking-tighter bg-gradient-to-r from-[#804ee6] to-[#ff8a3d] bg-clip-text text-transparent">IX</span>
                <span class="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#ff8a3d] animate-ping"></span>
              </div>
            </div>

            <h3 class="text-base font-extrabold text-gray-900 tracking-tight mb-1">${title}</h3>
            <p class="text-xs text-gray-500 font-medium leading-relaxed mb-3.5">${subtitle}</p>
            
            <!-- Sleek loader micro slider -->
            <div class="w-36 h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
              <div class="loading-bar-slider absolute inset-y-0 rounded-full bg-gradient-to-r from-[#804ee6] via-[#ff8a3d] to-[#804ee6]"></div>
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