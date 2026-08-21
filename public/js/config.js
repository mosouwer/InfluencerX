// Configuration Module
window.CONFIG = {
  APP_NAME: 'InfluenceX',
  API_BASE: (typeof window !== 'undefined' && (window.location.protocol === 'file:' || (window.location.hostname === '127.0.0.1' && window.location.port !== '3000') || (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '5000')))
    ? 'https://influencer-x-mocha.vercel.app/api'
    : '/api',
  COMMISSION_RATE: 0.2,
  DEMO_CREDENTIALS: {
    admin: { email: 'admin@influencex.com', password: 'admin123' },
    brand: { email: 'ravi@store.com', password: 'demo123' },
    influencer: { email: 'priya@demo.com', password: 'demo123' }
  }
};