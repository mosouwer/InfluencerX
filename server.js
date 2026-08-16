const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
require('dotenv').config();
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const sharp = require('sharp');

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

const upload = multer({ storage: multer.memoryStorage() });

async function uploadToS3(buffer, originalname) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const key = uniqueSuffix + '-' + originalname.replace(/\.[^/.]+$/, "") + '.jpg';
  
  // Compress to JPEG using sharp
  const compressedBuffer = await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
    
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: compressedBuffer,
    ContentType: 'image/jpeg'
  });
  
  await s3.send(command);
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Simple JSON database helper
const DB_FILE = path.join(__dirname, 'db.json');

function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { 
      users: [], 
      deals: [],
      campaigns: [],
      notifications: [],
      withdrawals: []
    };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Initialize DB with demo data
async function initDB() {
  const db = readDB();
  if (db.users.length === 0) {
    console.log('📦 Creating demo data...');
    const hashedPw = await bcrypt.hash('demo123', 10);
    const adminHashedPw = await bcrypt.hash('admin123', 10);
    
    // Admin user
    db.users.push({
      id: 'admin_1',
      email: 'admin@influencex.com',
      password: adminHashedPw,
      role: 'admin',
      profile: {
        name: 'Platform Admin',
        permissions: ['all']
      },
      status: 'active',
      joinedAt: '2026-01-01'
    });
    
    // Business user
    db.users.push({
      id: 'biz_1',
      email: 'ravi@store.com',
      password: hashedPw,
      role: 'brand',
      profile: {
        company: "Ravi's Store",
        budget: 50000,
        spent: 32400,
        industry: 'Fashion'
      },
      status: 'active',
      joinedAt: '2026-02-15'
    });
    
    // Influencer users
    const influencers = [
      { id: 'inf_1', name: 'Priya Sharma', email: 'priya@demo.com', niche: 'Fashion', followers: 1200000, engagement: 6.4, location: 'Mumbai', rates: { story: 5000, reel: 12000, post: 8000, youtube: 25000 }, avatar: '👗', rating: 4.8, campaigns: 47, bio: 'Fashion influencer based in Mumbai', verified: true },
      { id: 'inf_2', name: 'Chef Arjun', email: 'arjun@demo.com', niche: 'Food', followers: 890000, engagement: 7.1, location: 'Delhi', rates: { story: 8000, reel: 15000, post: 10000, youtube: 25000 }, avatar: '🍕', rating: 4.9, campaigns: 32, bio: 'Food creator from Delhi', verified: true },
      { id: 'inf_3', name: 'FitWithNikhil', email: 'nikhil@demo.com', niche: 'Fitness', followers: 560000, engagement: 5.8, location: 'Pune', rates: { story: 4500, reel: 8000, post: 5000 }, avatar: '💪', rating: 4.7, campaigns: 28, bio: 'Fitness coach and wellness advocate', verified: false },
      { id: 'inf_4', name: 'TechTalk Vikram', email: 'vikram@demo.com', niche: 'Tech', followers: 180000, engagement: 8.2, location: 'Bangalore', rates: { story: 3000, reel: 6000, post: 8000 }, avatar: '📱', rating: 4.9, campaigns: 19, bio: 'Tech reviewer and gadget expert', verified: true },
      { id: 'inf_5', name: 'GreenLife Ananya', email: 'ananya@demo.com', niche: 'Lifestyle', followers: 210000, engagement: 4.9, location: 'Delhi', rates: { story: 3500, reel: 7000, post: 5000 }, avatar: '🌿', rating: 4.6, campaigns: 15, bio: 'Sustainable living advocate', verified: false },
      { id: 'inf_6', name: 'Wanderer Kabir', email: 'kabir@demo.com', niche: 'Travel', followers: 340000, engagement: 5.5, location: 'Goa', rates: { story: 6000, reel: 12000, post: 9000 }, avatar: '✈️', rating: 4.7, campaigns: 22, bio: 'Travel blogger exploring India', verified: true }
    ];
    
    for (const inf of influencers) {
      db.users.push({
        id: inf.id,
        email: inf.email,
        password: hashedPw,
        role: 'influencer',
        profile: {
          name: inf.name,
          niche: inf.niche,
          followers: inf.followers,
          engagement: inf.engagement,
          location: inf.location,
          rates: inf.rates,
          availability: true,
          avatar: inf.avatar,
          rating: inf.rating,
          campaigns: inf.campaigns,
          bio: inf.bio,
          verified: inf.verified
        },
        status: 'active',
        joinedAt: '2026-01-' + (10 + Math.floor(Math.random() * 20))
      });
    }
    
    // Demo campaigns
    db.campaigns = [
      { id: 'camp_1', brandId: 'biz_1', influencerId: 'inf_1', influencerName: 'Priya Sharma', type: 'Instagram Reel', amount: 12000, status: 'active', progress: 75, deadline: '2026-05-20', brandName: "Ravi's Store", campaignName: 'Summer Reel Campaign', createdAt: '2026-05-01' },
      { id: 'camp_2', brandId: 'biz_1', influencerId: 'inf_2', influencerName: 'Chef Arjun', type: 'YouTube Video', amount: 25000, status: 'review', progress: 90, deadline: '2026-05-19', brandName: "Ravi's Store", campaignName: 'Product Unboxing', createdAt: '2026-05-02' },
      { id: 'camp_3', brandId: 'biz_1', influencerId: 'inf_3', influencerName: 'FitWithNikhil', type: 'Instagram Story', amount: 5000, status: 'pending', progress: 20, deadline: '2026-05-24', brandName: "Ravi's Store", campaignName: 'Brand Awareness Story', createdAt: '2026-05-03' },
      { id: 'camp_4', brandId: 'biz_1', influencerId: 'inf_4', influencerName: 'TechTalk Vikram', type: 'Feed Post', amount: 8000, status: 'completed', progress: 100, deadline: '2026-05-15', brandName: "Ravi's Store", campaignName: 'Tech Review Post', createdAt: '2026-04-20' }
    ];
    
    db.deals = [
      { id: 'deal_1', brandId: 'biz_1', brandName: "Ravi's Store", influencerId: 'inf_5', influencerName: 'GreenLife Ananya', packageType: 'post', amount: 3500, message: 'Eco-friendly product collaboration', status: 'dispute', createdAt: '2026-05-10' }
    ];
    
    db.withdrawals = [
      { id: 'wd_1', userId: 'inf_1', userName: 'Priya Sharma', amount: 15000, status: 'pending', requestedAt: '2026-05-16' },
      { id: 'wd_2', userId: 'inf_2', userName: 'Chef Arjun', amount: 25000, status: 'completed', requestedAt: '2026-05-14', processedAt: '2026-05-15' }
    ];
    
    db.notifications = [
      { id: 'n1', userId: 'biz_1', title: 'Campaign approved', message: 'Campaign with Priya Sharma was approved', time: '2 minutes ago', read: false, icon: '🎉' },
      { id: 'n2', userId: 'biz_1', title: 'New message', message: 'Chef Arjun sent you a message', time: '18 minutes ago', read: false, icon: '💬' },
      { id: 'n3', userId: 'biz_1', title: 'Content ready', message: 'Content from FitWithNikhil is ready', time: '1 hour ago', read: false, icon: '✅' },
      { id: 'n4', userId: 'inf_1', title: 'New Campaign', message: "Ravi's Store invited you to Summer Reel Campaign", time: '1 day ago', read: true, icon: '🎯' },
      { id: 'n5', userId: 'inf_2', title: 'Payment Released', message: '₹25,000 has been released to your account', time: '2 days ago', read: true, icon: '💰' }
    ];
    
    writeDB(db);
    console.log('✅ Demo data created successfully!');
    console.log('👑 Admin credentials: admin@influencex.com / admin123');
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'influencex-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
}));
app.use(express.static('public'));

// Helper functions
function getUser(req) {
  const userId = req.session.userId || req.headers['x-user-id'] || req.query.userId;
  if (!userId) return null;
  const db = readDB();
  return db.users.find(u => u.id === userId);
}

function isAdmin(req) {
  const user = getUser(req);
  return user && user.role === 'admin';
}

function notifyUser(notif, req) {
  try {
    const db = readDB();
    db.notifications = db.notifications || [];
    const fullNotif = {
      id: notif.id || (Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6)),
      createdAt: notif.createdAt || new Date().toISOString(),
      time: notif.time || 'Just now',
      read: false,
      ...notif
    };
    db.notifications.unshift(fullNotif);
    writeDB(db);
    
    // Broadcast via Socket.IO if initialized
    const io = req && req.app ? req.app.get('io') : null;
    if (io) {
      io.emit('notification', fullNotif);
    }
    return fullNotif;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

// ========== AUTH ROUTES ==========
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`🔐 Login attempt: ${email}`);
  
  const db = readDB();
  const user = db.users.find(u => u.email === email);
  
  if (!user) {
    console.log(`❌ User not found: ${email}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    console.log(`❌ Invalid password for: ${email}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  if (user.status === 'suspended') {
    return res.status(401).json({ error: 'Account suspended. Please contact admin.' });
  }
  
  req.session.userId = user.id;
  console.log(`✅ Login successful: ${email} (${user.role})`);
  
  res.json({ 
    success: true, 
    user: { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      profile: user.profile 
    } 
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  res.json({ 
    user: { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      profile: user.profile 
    } 
  });
});

// ========== INFLUENCER ROUTES ==========
app.get('/api/influencers', async (req, res) => {
  const db = readDB();
  const influencers = db.users.filter(u => u.role === 'influencer' && u.profile.availability === true);
  res.json(influencers.map(i => ({
    id: i.id,
    name: i.profile.name,
    niche: i.profile.niche,
    followers: i.profile.followers,
    engagement: i.profile.engagement,
    location: i.profile.location,
    rates: i.profile.rates,
    avatar: i.profile.avatar,
    rating: i.profile.rating,
    campaigns: i.profile.campaigns,
    bio: i.profile.bio,
    verified: i.profile.verified
  })));
});

app.get('/api/influencer/:id', async (req, res) => {
  const db = readDB();
  const influencer = db.users.find(u => u.id === req.params.id && u.role === 'influencer');
  if (!influencer) return res.status(404).json({ error: 'Influencer not found' });
  res.json({
    id: influencer.id,
    name: influencer.profile.name,
    niche: influencer.profile.niche,
    followers: influencer.profile.followers,
    engagement: influencer.profile.engagement,
    location: influencer.profile.location,
    rates: influencer.profile.rates,
    avatar: influencer.profile.avatar,
    rating: influencer.profile.rating,
    campaigns: influencer.profile.campaigns,
    bio: influencer.profile.bio,
    verified: influencer.profile.verified
  });
});

app.put('/api/influencer/rates', async (req, res) => {
  const user = getUser(req);
  if (!user || user.role !== 'influencer') {
    return res.status(403).json({ error: 'Unauthorized - Only influencers can update rates' });
  }
  
  const { rates } = req.body;
  if (!rates) {
    return res.status(400).json({ error: 'Rates data is required' });
  }
  
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === user.id);
  
  if (userIndex !== -1) {
    db.users[userIndex].profile.rates = rates;
    writeDB(db);
    console.log(`💰 Rates updated for ${user.profile.name}:`, rates);
    res.json({ success: true, rates });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// ========== CAMPAIGN ROUTES ==========
app.get('/api/campaigns', async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  let campaigns = db.campaigns || [];
  if (user.role === 'brand') {
    campaigns = campaigns.filter(c => c.brandId === user.id);
  } else if (user.role === 'influencer') {
    campaigns = campaigns.filter(c => c.influencerId === user.id);
  }
  res.json(campaigns);
});

app.post('/api/campaigns', async (req, res) => {
  const brand = getUser(req);
  if (!brand || brand.role !== 'brand') return res.status(403).json({ error: 'Only brands can create campaigns' });
  const { influencerId, campaignName, type, amount, deadline } = req.body;
  const db = readDB();
  const influencer = db.users.find(u => u.id === influencerId);
  if (!influencer) return res.status(404).json({ error: 'Influencer not found' });
  
  const campaign = {
    id: Date.now().toString(),
    brandId: brand.id,
    brandName: brand.profile.company || brand.email,
    influencerId,
    influencerName: influencer.profile.name,
    campaignName,
    type,
    amount,
    status: 'pending',
    progress: 0,
    deadline,
    createdAt: new Date().toISOString()
  };
  db.campaigns = db.campaigns || [];
  db.campaigns.push(campaign);
  writeDB(db);
  
  // Notification to Influencer
  notifyUser({
    userId: influencerId,
    title: 'New Campaign Offer',
    message: `${brand.profile.company || brand.email} invited you to "${campaignName}"`,
    type: 'campaign',
    campaignId: campaign.id,
    icon: '🎯'
  }, req);

  // Notification to Admin
  notifyUser({
    userId: 'admin_1',
    forAdmin: true,
    title: 'New Campaign Created',
    message: `Brand "${brand.profile.company || brand.email}" created campaign "${campaignName}" for ${influencer.profile.name} (₹${amount})`,
    type: 'campaign',
    campaignId: campaign.id,
    icon: '🚀'
  }, req);
  
  res.json({ success: true, campaign });
});

app.put('/api/campaigns/:id/status', async (req, res) => {
  const user = getUser(req);
  const { status, progress } = req.body;
  const db = readDB();
  const campaignIndex = db.campaigns.findIndex(c => c.id === req.params.id);
  if (campaignIndex === -1) return res.status(404).json({ error: 'Campaign not found' });
  
  const campaign = db.campaigns[campaignIndex];
  if (user.role === 'influencer' && campaign.influencerId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (user.role === 'brand' && campaign.brandId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  if (status) campaign.status = status;
  if (progress !== undefined) campaign.progress = progress;
  db.campaigns[campaignIndex] = campaign;
  writeDB(db);

  if (status) {
    // Notify Brand if updated by Influencer, or notify Influencer if updated by Brand
    const targetUserId = user.role === 'influencer' ? campaign.brandId : campaign.influencerId;
    notifyUser({
      userId: targetUserId,
      title: `Campaign Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Campaign "${campaign.campaignName}" is now ${status}`,
      type: 'campaign',
      campaignId: campaign.id,
      icon: status === 'completed' ? '🎉' : '📊'
    }, req);

    // Notify Admin
    notifyUser({
      userId: 'admin_1',
      forAdmin: true,
      title: 'Campaign Status Updated',
      message: `Campaign "${campaign.campaignName}" (${campaign.brandName} ➔ ${campaign.influencerName}) updated to "${status}"`,
      type: 'campaign',
      campaignId: campaign.id,
      icon: '📊'
    }, req);
  }

  res.json({ success: true, campaign });
});

// ========== DEAL ROUTES ==========
app.post('/api/deals', async (req, res) => {
  const brand = getUser(req);
  if (!brand || brand.role !== 'brand') return res.status(403).json({ error: 'Only brands can hire' });
  const { influencerId, packageType, message } = req.body;
  const db = readDB();
  const influencer = db.users.find(u => u.id === influencerId && u.role === 'influencer');
  if (!influencer) return res.status(404).json({ error: 'Influencer not found' });
  
  const amount = influencer.profile.rates[packageType];
  if (!amount) return res.status(400).json({ error: 'Invalid package type' });
  
  const deal = {
    id: Date.now().toString(),
    brandId: brand.id,
    brandName: brand.profile.company || brand.email,
    influencerId,
    influencerName: influencer.profile.name,
    packageType,
    amount,
    message: message || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.deals = db.deals || [];
  db.deals.push(deal);
  writeDB(db);
  
  // Notification to Influencer
  notifyUser({
    userId: influencerId,
    title: 'New Hire Request',
    message: `${brand.profile.company || brand.email} wants to hire you for a ${packageType} (₹${amount})`,
    type: 'deal',
    dealId: deal.id,
    icon: '💼'
  }, req);

  // Notification to Admin
  notifyUser({
    userId: 'admin_1',
    forAdmin: true,
    title: 'New Hire Deal Created',
    message: `${brand.profile.company || brand.email} hired ${influencer.profile.name} for ${packageType} (₹${amount})`,
    type: 'deal',
    dealId: deal.id,
    icon: '💼'
  }, req);
  
  res.json({ success: true, deal });
});

app.get('/api/deals', async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  let deals = db.deals || [];
  if (user.role === 'brand') {
    deals = deals.filter(d => d.brandId === user.id);
  } else if (user.role === 'influencer') {
    deals = deals.filter(d => d.influencerId === user.id);
  }
  res.json(deals);
});

app.put('/api/deals/:id/status', async (req, res) => {
  const user = getUser(req);
  const { status } = req.body;
  const db = readDB();
  const dealIndex = db.deals.findIndex(d => d.id === req.params.id);
  if (dealIndex === -1) return res.status(404).json({ error: 'Deal not found' });
  const deal = db.deals[dealIndex];
  if (user.role !== 'admin' && (user.role !== 'influencer' || deal.influencerId !== user.id)) {
    return res.status(403).json({ error: 'Only the influencer or admin can update status' });
  }
  deal.status = status;
  db.deals[dealIndex] = deal;
  writeDB(db);
  
  // Notify Brand
  notifyUser({
    userId: deal.brandId,
    title: `Deal ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `${deal.influencerName} has ${status} your hire request`,
    type: 'deal',
    dealId: deal.id,
    icon: status === 'accepted' ? '✅' : status === 'completed' ? '🎉' : status === 'dispute' ? '⚠️' : '❌'
  }, req);

  // Notify Admin
  notifyUser({
    userId: 'admin_1',
    forAdmin: true,
    title: `Deal ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `${deal.influencerName} ${status} deal with ${deal.brandName} (₹${deal.amount})`,
    type: 'deal',
    dealId: deal.id,
    icon: status === 'dispute' ? '⚠️' : '💼'
  }, req);
  
  res.json({ success: true, deal });
});

// ========== NOTIFICATION ROUTES ==========
app.get('/api/notifications', async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  let notifications = db.notifications || [];
  
  if (user.role === 'admin') {
    // Admin receives notifications assigned to admin or system alerts
    notifications = notifications.filter(n => 
      n.userId === user.id || 
      n.userId === 'admin' || 
      n.userId === 'admin_1' || 
      n.forAdmin === true || 
      n.isAdmin === true ||
      !n.userId
    );
  } else {
    notifications = notifications.filter(n => n.userId === user.id);
  }
  
  // Sort descending (newest first)
  notifications.sort((a, b) => {
    const timeA = new Date(a.createdAt || (isNaN(Number(a.id)) ? 0 : Number(a.id))).getTime() || 0;
    const timeB = new Date(b.createdAt || (isNaN(Number(b.id)) ? 0 : Number(b.id))).getTime() || 0;
    return timeB - timeA;
  });
  
  res.json(notifications);
});

// Mark all notifications as read
app.put('/api/notifications/read', async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  
  if (user.role === 'admin') {
    db.notifications = (db.notifications || []).map(n => 
      (n.userId === user.id || n.userId === 'admin' || n.userId === 'admin_1' || n.forAdmin === true || !n.userId) 
        ? { ...n, read: true } 
        : n
    );
  } else {
    db.notifications = (db.notifications || []).map(n => 
      n.userId === user.id ? { ...n, read: true } : n
    );
  }
  
  writeDB(db);
  res.json({ success: true });
});

// Mark single notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  
  const index = (db.notifications || []).findIndex(n => n.id === req.params.id);
  if (index !== -1) {
    db.notifications[index].read = true;
    writeDB(db);
    res.json({ success: true, notification: db.notifications[index] });
  } else {
    res.status(404).json({ error: 'Notification not found' });
  }
});

// Delete single notification
app.delete('/api/notifications/:id', async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  
  const beforeCount = (db.notifications || []).length;
  db.notifications = (db.notifications || []).filter(n => n.id !== req.params.id);
  writeDB(db);
  res.json({ success: true, deleted: beforeCount !== db.notifications.length });
});

// Clear all notifications
app.delete('/api/notifications', async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  
  if (user.role === 'admin') {
    db.notifications = (db.notifications || []).filter(n => 
      !(n.userId === user.id || n.userId === 'admin' || n.userId === 'admin_1' || n.forAdmin === true || !n.userId)
    );
  } else {
    db.notifications = (db.notifications || []).filter(n => n.userId !== user.id);
  }
  
  writeDB(db);
  res.json({ success: true });
});

// ========== ADMIN ROUTES ==========

// Get platform statistics
app.get('/api/admin/stats', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  
  const db = readDB();
  const brands = db.users.filter(u => u.role === 'brand');
  const influencers = db.users.filter(u => u.role === 'influencer');
  const campaigns = (db.campaigns || []).filter(c => !c.adminDeleted);
  const deals = (db.deals || []).filter(d => !d.adminDeleted);
  const withdrawals = db.withdrawals || [];
  
  const totalTransactions = [...campaigns, ...deals];
  const platformRevenue = totalTransactions.reduce((sum, t) => sum + ((t.amount || 0) * 0.2), 0);
  const pendingDisputes = deals.filter(d => d.status === 'dispute').length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  
  const campaignsActive = campaigns.filter(c => c.status === 'active').length + deals.filter(d => d.status === 'active').length;
  const campaignsReview = campaigns.filter(c => c.status === 'review').length + deals.filter(d => d.status === 'review').length;
  const campaignsCompleted = campaigns.filter(c => c.status === 'completed').length + deals.filter(d => d.status === 'completed').length;

  res.json({
    totalBrands: brands.length,
    totalInfluencers: influencers.length,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaignsActive,
    campaignsActive,
    campaignsReview,
    campaignsCompleted,
    platformRevenue,
    pendingDisputes,
    totalValue: totalTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    pendingWithdrawals,
    verifiedInfluencers: influencers.filter(i => i.profile?.verified).length
  });
});

// Get all users
app.get('/api/admin/users', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  
  const db = readDB();
  const users = db.users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    name: u.role === 'influencer' ? u.profile.name : (u.role === 'brand' ? u.profile.company : 'Admin'),
    status: u.status || 'active',
    joinedAt: u.joinedAt || '2026-01-01',
    verified: u.role === 'influencer' ? (u.profile.verified || false) : null
  }));
  res.json(users);
});

// Update user status
app.put('/api/admin/users/:id/status', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  
  const { status } = req.body;
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === req.params.id);
  
  if (userIndex !== -1 && db.users[userIndex].role !== 'admin') {
    db.users[userIndex].status = status;
    writeDB(db);
    res.json({ success: true, message: `User ${status === 'suspended' ? 'suspended' : 'activated'}` });
  } else {
    res.status(404).json({ error: 'User not found or cannot modify admin' });
  }
});

// Verify influencer
app.put('/api/admin/users/:id/verify', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  
  const { verified } = req.body;
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === req.params.id && u.role === 'influencer');
  
  if (userIndex !== -1) {
    db.users[userIndex].profile.verified = verified;
    writeDB(db);
    res.json({ success: true, message: `Influencer ${verified ? 'verified' : 'unverified'}` });
  } else {
    res.status(404).json({ error: 'Influencer not found' });
  }
});

// Get all campaigns (admin view)
app.get('/api/admin/campaigns', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  
  const db = readDB();
  res.json((db.campaigns || []).filter(c => !c.adminDeleted));
});

// Get all deals (admin view)
app.get('/api/admin/deals', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  
  const db = readDB();
  res.json((db.deals || []).filter(d => !d.adminDeleted));
});

// Get withdrawal requests
app.get('/api/admin/withdrawals', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  
  const db = readDB();
  res.json(db.withdrawals || []);
});

// Process withdrawal
app.put('/api/admin/withdrawals/:id/process', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  
  const { status } = req.body;
  const db = readDB();
  const withdrawalIndex = db.withdrawals.findIndex(w => w.id === req.params.id);
  
  if (withdrawalIndex !== -1) {
    const w = db.withdrawals[withdrawalIndex];
    w.status = status;
    w.processedAt = new Date().toISOString();
    writeDB(db);

    // Notify influencer
    notifyUser({
      userId: w.userId,
      title: `Withdrawal ${status === 'completed' ? 'Approved & Transferred' : 'Rejected'}`,
      message: `Your payout withdrawal of ₹${w.amount} has been ${status === 'completed' ? 'processed successfully' : 'rejected'}.`,
      type: 'withdrawal',
      icon: status === 'completed' ? '💰' : '❌'
    }, req);

    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Withdrawal not found' });
  }
});

// ========== STATS ROUTES ==========
app.get('/api/stats', async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  
  if (user.role === 'brand') {
    const campaigns = (db.campaigns || []).filter(c => c.brandId === user.id);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalSpent = campaigns.reduce((sum, c) => sum + c.amount, 0);
    const totalReach = 4800000; // Mock data for demo
    const avgEngagement = 5.2;
    
    res.json({
      activeCampaigns,
      totalSpent,
      totalReach,
      avgEngagement,
      budgetTotal: user.profile.budget || 50000,
      budgetUsed: user.profile.spent || totalSpent
    });
  } else if (user.role === 'influencer') {
    const campaigns = (db.campaigns || []).filter(c => c.influencerId === user.id);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    const totalEarned = campaigns.reduce((sum, c) => sum + c.amount, 0);
    const pendingAmount = campaigns.filter(c => c.status === 'pending' || c.status === 'review').reduce((sum, c) => sum + c.amount, 0);
    
    res.json({
      activeCampaigns,
      completedCampaigns,
      totalEarned,
      pendingAmount,
      rating: user.profile.rating || 4.8,
      profileViews: 1400
    });
  } else {
    res.json({});
  }
});

// ========== HEALTH CHECK ==========

app.post('/api/users/influencer', upload.single('profilePic'), async (req, res) => {
  const db = readDB();
  const { name, email, password, instagramFollowers, about, storyRate, postRate, reelRate, niche } = req.body;
  
  const hashedPassword = await bcrypt.hash(password || 'demo123', 10);
  const newUser = {
    id: 'user_' + Date.now(),
    email: email,
    password: hashedPassword,
    role: 'influencer',
    profile: {
      name: name,
      bio: about || '',
      niche: niche || 'Fashion',
      followers: parseInt(instagramFollowers) || 0,
      engagement: 5.0,
      location: 'Global',
      rates: {
        story: parseInt(storyRate) || 0,
        post: parseInt(postRate) || 0,
        reel: parseInt(reelRate) || 0
      },
      avatar: req.file ? await uploadToS3(req.file.buffer, req.file.originalname) : null,
      rating: 5.0,
      campaigns: 0,
      verified: false,
      availability: true
    },
    status: 'active',
    joinedAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  writeDB(db);
  
  if (req.app.get('io')) req.app.get('io').emit('new_influencer', newUser);
  res.json({ success: true, user: newUser });
});

app.put('/api/users/influencer/:id', upload.single('profilePic'), async (req, res) => {
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === req.params.id && u.role === 'influencer');
  if (userIndex === -1) return res.status(404).json({ error: 'Influencer not found' });

  const { name, email, instagramFollowers, about, storyRate, postRate, reelRate, niche } = req.body;
  
  const user = db.users[userIndex];
  if (name) user.profile.name = name;
  if (email) user.email = email;
  if (about) user.profile.bio = about;
  if (niche) user.profile.niche = niche;
  if (instagramFollowers) user.profile.followers = parseInt(instagramFollowers) || user.profile.followers;
  
  if (storyRate) user.profile.rates.story = parseInt(storyRate);
  if (postRate) user.profile.rates.post = parseInt(postRate);
  if (reelRate) user.profile.rates.reel = parseInt(reelRate);
  
  if (req.file) {
    user.profile.avatar = await uploadToS3(req.file.buffer, req.file.originalname);
  }
  
  db.users[userIndex] = user;
  writeDB(db);
  
  if (req.app.get('io')) req.app.get('io').emit('update_influencer', user);
  res.json({ success: true, user });
});

app.delete('/api/users/influencer/:id', async (req, res) => {
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === req.params.id && u.role === 'influencer');
  if (userIndex === -1) return res.status(404).json({ error: 'Influencer not found' });
  
  // Delete from S3
  const user = db.users[userIndex];
  if (user.profile && user.profile.avatar && user.profile.avatar.includes('amazonaws.com')) {
    try {
      const key = new URL(user.profile.avatar).pathname.substring(1);
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: decodeURIComponent(key) }));
    } catch (err) {
      console.error('Failed to delete S3 image:', err);
    }
  }
  
  db.users.splice(userIndex, 1);
  writeDB(db);
  
  if (req.app.get('io')) req.app.get('io').emit('delete_influencer', req.params.id);
  res.json({ success: true });
});

app.get('/api/proxy-image', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || !url.includes('amazonaws.com')) return res.status(400).send('Invalid URL');
    const key = new URL(url).pathname.substring(1);
    const command = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: decodeURIComponent(key) });
    const response = await s3.send(command);
    let contentType = response.ContentType;
    if (!contentType || contentType === 'application/octet-stream') {
      contentType = key.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    }
    res.setHeader('Content-Type', contentType);
    response.Body.pipe(res);
  } catch (err) {
    console.error('Image proxy error:', err);
    res.status(404).send('Image not found');
  }
});

app.delete('/api/admin/campaigns', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Bad Request', details: 'Missing or invalid ids array' });
  }
  
  const db = readDB();
  db.campaigns = (db.campaigns || []).map(c => 
    ids.includes(c.id) ? { ...c, adminDeleted: true } : c
  );
  writeDB(db);
  
  res.json({ success: true, message: `Successfully deleted ${ids.length} campaigns from admin side` });
});

app.delete('/api/admin/deals', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Bad Request', details: 'Missing or invalid ids array' });
  }
  
  const db = readDB();
  db.deals = (db.deals || []).map(d => 
    ids.includes(d.id) ? { ...d, adminDeleted: true } : d
  );
  writeDB(db);
  
  res.json({ success: true, message: `Successfully deleted ${ids.length} deals from admin side` });
});

app.get('/api/deals/download/:id', async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const dbData = readDB();
    let isDeal = true;
    let itemIndex = dbData.deals ? dbData.deals.findIndex(d => d.id === req.params.id) : -1;
    let item;
    
    if (itemIndex !== -1) {
      item = dbData.deals[itemIndex];
    } else {
      isDeal = false;
      itemIndex = dbData.campaigns ? dbData.campaigns.findIndex(c => c.id === req.params.id) : -1;
      if (itemIndex !== -1) {
        item = dbData.campaigns[itemIndex];
      }
    }
    
    if (itemIndex === -1 || !item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const mediaUrl = item.mediaAttached || item.mediaUrl || item.media;
    if (!mediaUrl) {
      return res.status(404).json({ error: 'No attachment found for this item' });
    }
    
    // Extract key from S3 URL
    const key = mediaUrl.substring(mediaUrl.lastIndexOf('/') + 1);
    
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    });
    
    const response = await s3.send(command);
    
    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${key}"`);
    
    response.Body.pipe(res);
    
    res.on('finish', async () => {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key
        });
        await s3.send(deleteCommand);
        
        // Update document to clear media in local DB
        const freshDb = readDB();
        if (isDeal) {
          const freshIndex = freshDb.deals.findIndex(d => d.id === req.params.id);
          if (freshIndex !== -1) {
            freshDb.deals[freshIndex].hasMedia = 'false';
            delete freshDb.deals[freshIndex].mediaAttached;
            delete freshDb.deals[freshIndex].mediaUrl;
            delete freshDb.deals[freshIndex].media;
          }
        } else {
          const freshIndex = freshDb.campaigns.findIndex(c => c.id === req.params.id);
          if (freshIndex !== -1) {
            freshDb.campaigns[freshIndex].hasMedia = 'false';
            delete freshDb.campaigns[freshIndex].mediaAttached;
            delete freshDb.campaigns[freshIndex].mediaUrl;
            delete freshDb.campaigns[freshIndex].media;
          }
        }
        writeDB(freshDb);
        console.log(`Deleted S3 attachment for item ${req.params.id} in local database`);
      } catch (err) {
        console.error('Failed to clean up attachment after download:', err);
      }
    });
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file', details: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend - must be last route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize DB and start server
initDB().then(() => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    const io = new Server(server, { cors: { origin: '*' } });
    app.set('io', io);
    io.on('connection', (socket) => {
      console.log('Client connected: ' + socket.id);
    });
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`${'='.repeat(50)}`);
    console.log(`\n📧 Demo Credentials:`);
    console.log(`   ┌─────────────────────────────────┐`);
    console.log(`   │ 👑 Admin:   admin@influencex.com │`);
    console.log(`   │ Password:   admin123             │`);
    console.log(`   ├─────────────────────────────────┤`);
    console.log(`   │ 💼 Brand:   ravi@store.com       │`);
    console.log(`   │ Password:   demo123              │`);
    console.log(`   ├─────────────────────────────────┤`);
    console.log(`   │ 🌟 Influencer: priya@demo.com    │`);
    console.log(`   │ Password:   demo123              │`);
    console.log(`   └─────────────────────────────────┘`);
    console.log(`\n📁 Database: ${DB_FILE}`);
    console.log(`${'='.repeat(50)}\n`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});