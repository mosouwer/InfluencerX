// Utility Functions Module
window.utils = {
  formatCurrency(amount) {
    return '₹' + amount.toLocaleString();
  },
  
  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  },
  
  getStars(rating) {
    return '⭐'.repeat(Math.floor(rating || 0));
  },
  
  getInitials(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  },
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
};