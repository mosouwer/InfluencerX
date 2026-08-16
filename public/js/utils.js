// Utility Functions Module
window.utils = {
  formatCurrency(amount) {
    return '₹' + (amount || 0).toLocaleString();
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
  },

  timeAgo(dateInput) {
    if (!dateInput) return 'Just now';
    if (typeof dateInput === 'string' && (dateInput.includes('ago') || dateInput === 'Just now')) {
      return dateInput;
    }
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 45) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
};