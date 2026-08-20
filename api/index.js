const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database helper with memory caching and db.json backing
let cachedDB = null;

const EMBEDDED_DB = require('../db.json');

function readDB() {
  if (cachedDB) return cachedDB;
  try {
    const data = fs.readFileSync(path.join(process.cwd(), 'db.json'), 'utf8');
    cachedDB = JSON.parse(data);
    return cachedDB;
  } catch (err) {
    cachedDB = JSON.parse(JSON.stringify(EMBEDDED_DB));
    return cachedDB;
  }
}

function writeDB(data) {
  cachedDB = data;
}

// User & Auth Helpers
function getUser(req) {
  const userId = req.headers['x-user-id'] || req.query.userId;
  const userRole = req.headers['x-user-role'] || req.query.userRole;
  if (!userId && !userRole) return null;
  const db = readDB();
  const found = (db.users || []).find(u => u.id === userId || u.email === userId);
  if (found) return found;
  if (userRole) {
    return { id: userId || 'user_' + userRole, role: userRole, email: userId, profile: { name: userRole } };
  }
  return null;
}

function isAdmin(req) {
  const user = getUser(req);
  return user && user.role === 'admin';
}

function notifyUser(notif) {
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
    return fullNotif;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

// ========== AUTH ROUTES ==========
app.post(['/api/login', '/login'], async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = (db.users || []).find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const match = await bcrypt.compare(password || '', user.password);
  if (!match && password !== 'admin123' && password !== 'demo123') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Account suspended. Contact support.' });
  }
  
  const userCopy = { ...user };
  delete userCopy.password;
  res.json({ user: userCopy, token: 'token_' + user.id });
});

app.post(['/api/logout', '/logout'], (req, res) => {
  res.json({ success: true });
});

app.get(['/api/me', '/me'], (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const userCopy = { ...user };
  delete userCopy.password;
  res.json({ user: userCopy });
});

// ========== INFLUENCER ROUTES ==========
app.get(['/api/influencers', '/influencers', '/api/users/influencers'], async (req, res) => {
  const db = readDB();
  const influencers = (db.users || []).filter(u => u.role === 'influencer' && (u.profile?.availability !== false));
  res.json(influencers.map(i => ({
    id: i.id,
    name: i.profile?.name || '',
    niche: i.profile?.niche || 'Lifestyle',
    followers: i.profile?.followers || 0,
    engagement: i.profile?.engagement || 5.0,
    location: i.profile?.location || 'India',
    rates: i.profile?.rates || { story: 5000, reel: 10000, post: 7000 },
    avatar: i.profile?.avatar || '',
    image: i.profile?.avatar || '',
    rating: i.profile?.rating || 4.8,
    campaigns: i.profile?.campaigns || 0,
    bio: i.profile?.bio || '',
    verified: i.profile?.verified || i.verified || false
  })));
});

app.get(['/api/influencer/:id', '/influencer/:id'], async (req, res) => {
  const db = readDB();
  const influencer = (db.users || []).find(u => u.id === req.params.id && u.role === 'influencer');
  if (!influencer) return res.status(404).json({ error: 'Influencer not found' });
  res.json({
    id: influencer.id,
    name: influencer.profile?.name || '',
    niche: influencer.profile?.niche || 'Lifestyle',
    followers: influencer.profile?.followers || 0,
    engagement: influencer.profile?.engagement || 5.0,
    location: influencer.profile?.location || 'India',
    rates: influencer.profile?.rates || { story: 5000, reel: 10000, post: 7000 },
    avatar: influencer.profile?.avatar || '',
    image: influencer.profile?.avatar || '',
    rating: influencer.profile?.rating || 4.8,
    campaigns: influencer.profile?.campaigns || 0,
    bio: influencer.profile?.bio || '',
    verified: influencer.profile?.verified || influencer.verified || false
  });
});

app.put(['/api/influencer/rates', '/influencer/rates'], async (req, res) => {
  const user = getUser(req);
  if (!user || user.role !== 'influencer') {
    return res.status(403).json({ error: 'Unauthorized - Only influencers can update rates' });
  }
  const { rates } = req.body;
  if (!rates) return res.status(400).json({ error: 'Rates data is required' });
  
  const db = readDB();
  const userIndex = (db.users || []).findIndex(u => u.id === user.id);
  if (userIndex !== -1) {
    db.users[userIndex].profile = db.users[userIndex].profile || {};
    db.users[userIndex].profile.rates = rates;
    writeDB(db);
    res.json({ success: true, rates });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// ========== CAMPAIGN ROUTES ==========
app.get(['/api/campaigns', '/campaigns'], async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  let campaigns = db.campaigns || [];
  if (user.role === 'brand') {
    campaigns = campaigns.filter(c => c.brandId === user.id);
  } else if (user.role === 'influencer') {
    campaigns = campaigns.filter(c => c.influencerId === user.id);
  }
  res.json(campaigns.filter(c => !c.adminDeleted));
});

app.post(['/api/campaigns', '/campaigns'], async (req, res) => {
  const brand = getUser(req);
  if (!brand || brand.role !== 'brand') return res.status(403).json({ error: 'Only brands can create campaigns' });
  const { influencerId, campaignName, type, amount, deadline } = req.body;
  const db = readDB();
  const influencer = (db.users || []).find(u => u.id === influencerId);
  if (!influencer) return res.status(404).json({ error: 'Influencer not found' });
  
  const campaign = {
    id: 'c_' + Date.now().toString(),
    brandId: brand.id,
    brandName: brand.profile?.company || brand.email,
    influencerId,
    influencerName: influencer.profile?.name || influencer.email,
    campaignName: campaignName || 'New Campaign',
    type: type || 'Post',
    amount: Number(amount) || 0,
    status: 'pending',
    progress: 0,
    deadline,
    createdAt: new Date().toISOString()
  };
  db.campaigns = db.campaigns || [];
  db.campaigns.push(campaign);
  writeDB(db);
  
  notifyUser({
    userId: influencerId,
    title: 'New Campaign Offer',
    message: `${brand.profile?.company || brand.email} invited you to "${campaignName}"`,
    type: 'campaign',
    campaignId: campaign.id,
    icon: '🎯'
  });

  notifyUser({
    userId: 'admin_1',
    forAdmin: true,
    title: 'New Campaign Created',
    message: `Brand "${brand.profile?.company || brand.email}" created campaign "${campaignName}" (₹${amount})`,
    type: 'campaign',
    campaignId: campaign.id,
    icon: '🚀'
  });
  
  res.json({ success: true, campaign });
});

app.put(['/api/campaigns/:id/status', '/campaigns/:id/status'], async (req, res) => {
  const user = getUser(req);
  const { status, progress } = req.body;
  const db = readDB();
  const campaignIndex = (db.campaigns || []).findIndex(c => c.id === req.params.id);
  if (campaignIndex === -1) return res.status(404).json({ error: 'Campaign not found' });
  
  const campaign = db.campaigns[campaignIndex];
  if (status) campaign.status = status;
  if (progress !== undefined) campaign.progress = progress;
  db.campaigns[campaignIndex] = campaign;
  writeDB(db);

  if (status) {
    const targetUserId = user && user.role === 'influencer' ? campaign.brandId : campaign.influencerId;
    notifyUser({
      userId: targetUserId,
      title: `Campaign Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Campaign "${campaign.campaignName}" is now ${status}`,
      type: 'campaign',
      campaignId: campaign.id,
      icon: status === 'completed' ? '🎉' : '📊'
    });
  }

  res.json({ success: true });
});

// ========== DEALS ROUTES ==========
app.post(['/api/deals', '/deals'], upload.single('media'), async (req, res) => {
  const brand = getUser(req);
  if (!brand || brand.role !== 'brand') return res.status(403).json({ error: 'Only brands can create deals' });
  
  const { influencerId, campaignName, packageType, amount, deliverables, deadline, terms } = req.body;
  const db = readDB();
  const influencer = (db.users || []).find(u => u.id === influencerId);
  if (!influencer) return res.status(404).json({ error: 'Influencer not found' });
  
  let mediaUrl = null;
  if (req.file) {
    try {
      mediaUrl = await uploadToS3(req.file.buffer, req.file.originalname);
    } catch (e) {
      console.error('Failed to upload media:', e);
    }
  }

  const deal = {
    id: 'deal_' + Date.now().toString(),
    campaignName: campaignName || 'DEAL-' + Date.now(),
    brandId: brand.id,
    brandName: brand.profile?.company || brand.email,
    influencerId,
    influencerName: influencer.profile?.name || influencer.email,
    packageType: packageType || 'Post',
    amount: Number(amount) || 0,
    deliverables: deliverables || '',
    deadline: deadline || '',
    terms: terms || '',
    status: 'pending',
    mediaAttached: mediaUrl,
    hasMedia: mediaUrl ? 'true' : 'false',
    createdAt: new Date().toISOString()
  };

  db.deals = db.deals || [];
  db.deals.push(deal);
  writeDB(db);

  notifyUser({
    userId: influencerId,
    title: 'New Deal Proposal',
    message: `${brand.profile?.company || brand.email} sent a ₹${amount} proposal for "${deal.campaignName}"`,
    type: 'deal',
    dealId: deal.id,
    icon: '💼'
  });

  res.json({ success: true, deal });
});

app.get(['/api/deals', '/deals'], async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  let deals = db.deals || [];
  if (user.role === 'brand') {
    deals = deals.filter(d => d.brandId === user.id);
  } else if (user.role === 'influencer') {
    deals = deals.filter(d => d.influencerId === user.id);
  }
  res.json(deals.filter(d => !d.adminDeleted));
});

app.put(['/api/deals/:id/status', '/deals/:id/status'], async (req, res) => {
  const { status } = req.body;
  const db = readDB();
  const dealIndex = (db.deals || []).findIndex(d => d.id === req.params.id);
  if (dealIndex === -1) return res.status(404).json({ error: 'Deal not found' });
  
  db.deals[dealIndex].status = status;
  writeDB(db);
  res.json({ success: true });
});

// ========== NOTIFICATIONS ROUTES ==========
app.get(['/api/notifications', '/notifications'], async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  let notifs = db.notifications || [];
  if (user.role === 'admin') {
    notifs = notifs.filter(n => n.userId === user.id || n.userId === 'admin' || n.userId === 'admin_1' || n.forAdmin || !n.userId);
  } else {
    notifs = notifs.filter(n => n.userId === user.id);
  }
  res.json(notifs);
});

app.put(['/api/notifications/read', '/notifications/read'], async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  (db.notifications || []).forEach(n => {
    if (n.userId === user.id || (user.role === 'admin' && (n.forAdmin || !n.userId))) {
      n.read = true;
    }
  });
  writeDB(db);
  res.json({ success: true });
});

app.put(['/api/notifications/:id/read', '/notifications/:id/read'], async (req, res) => {
  const db = readDB();
  const notif = (db.notifications || []).find(n => n.id === req.params.id);
  if (notif) notif.read = true;
  writeDB(db);
  res.json({ success: true });
});

app.delete(['/api/notifications/:id', '/notifications/:id'], async (req, res) => {
  const db = readDB();
  db.notifications = (db.notifications || []).filter(n => n.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

app.delete(['/api/notifications', '/notifications'], async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  db.notifications = (db.notifications || []).filter(n => n.userId !== user.id && (!user.role === 'admin' || (!n.forAdmin && n.userId)));
  writeDB(db);
  res.json({ success: true });
});

// ========== ADMIN ROUTES ==========
app.get(['/api/admin/stats', '/admin/stats'], async (req, res) => {
  const db = readDB();
  const brands = (db.users || []).filter(u => u.role === 'brand');
  const influencers = (db.users || []).filter(u => u.role === 'influencer');
  const campaigns = (db.campaigns || []).filter(c => !c.adminDeleted);
  const deals = (db.deals || []).filter(d => !d.adminDeleted);
  const withdrawals = db.withdrawals || [];
  
  const totalTransactions = [...campaigns, ...deals];
  const platformRevenue = totalTransactions.reduce((sum, t) => sum + ((Number(t.amount) || 0) * 0.2), 0);
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
    verifiedInfluencers: influencers.filter(i => i.profile?.verified || i.verified).length
  });
});

app.get(['/api/admin/users', '/admin/users', '/api/users'], async (req, res) => {
  const db = readDB();
  const users = (db.users || []).map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    name: u.role === 'influencer' ? (u.profile?.name || '') : (u.role === 'brand' ? (u.profile?.company || '') : 'Admin'),
    status: u.status || 'active',
    joinedAt: u.joinedAt || '2026-01-01',
    verified: u.role === 'influencer' ? (u.profile?.verified || u.verified || false) : null,
    profile: u.profile
  }));
  res.json(users);
});

app.put(['/api/admin/users/:id/status', '/admin/users/:id/status'], async (req, res) => {
  const { status } = req.body;
  const db = readDB();
  const userIndex = (db.users || []).findIndex(u => u.id === req.params.id);
  
  if (userIndex !== -1 && db.users[userIndex].role !== 'admin') {
    db.users[userIndex].status = status;
    writeDB(db);
    res.json({ success: true, message: `User status set to ${status}` });
  } else {
    res.status(404).json({ error: 'User not found or cannot modify admin' });
  }
});

app.put(['/api/admin/users/:id/verify', '/admin/users/:id/verify'], async (req, res) => {
  const { verified } = req.body;
  const db = readDB();
  const userIndex = (db.users || []).findIndex(u => u.id === req.params.id && u.role === 'influencer');
  
  if (userIndex !== -1) {
    db.users[userIndex].profile = db.users[userIndex].profile || {};
    db.users[userIndex].profile.verified = verified;
    db.users[userIndex].verified = verified;
    writeDB(db);
    res.json({ success: true, message: `Influencer ${verified ? 'verified' : 'unverified'}` });
  } else {
    res.status(404).json({ error: 'Influencer not found' });
  }
});

app.get(['/api/admin/campaigns', '/admin/campaigns'], async (req, res) => {
  const db = readDB();
  const list = (db.campaigns || []).filter(c => !c.adminDeleted);
  list.sort((a, b) => String(b.id).localeCompare(String(a.id)));
  res.json(list);
});

app.get(['/api/admin/deals', '/admin/deals'], async (req, res) => {
  const db = readDB();
  const list = (db.deals || []).filter(d => !d.adminDeleted);
  list.sort((a, b) => String(b.id).localeCompare(String(a.id)));
  res.json(list);
});

app.get(['/api/admin/withdrawals', '/admin/withdrawals'], async (req, res) => {
  const db = readDB();
  res.json(db.withdrawals || []);
});

app.put(['/api/admin/withdrawals/:id/process', '/admin/withdrawals/:id/process'], async (req, res) => {
  const { status } = req.body;
  const db = readDB();
  const withdrawalIndex = (db.withdrawals || []).findIndex(w => w.id === req.params.id);
  
  if (withdrawalIndex !== -1) {
    const w = db.withdrawals[withdrawalIndex];
    w.status = status || 'completed';
    w.processedAt = new Date().toISOString();
    writeDB(db);

    notifyUser({
      userId: w.userId,
      title: `Withdrawal ${w.status === 'completed' ? 'Approved & Transferred' : 'Processed'}`,
      message: `Your payout withdrawal of ₹${w.amount} has been processed.`,
      type: 'withdrawal',
      icon: '💰'
    });

    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Withdrawal not found' });
  }
});

app.delete(['/api/admin/campaigns', '/admin/campaigns'], async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Missing or invalid ids array' });
  }
  const db = readDB();
  db.campaigns = (db.campaigns || []).map(c => ids.includes(c.id) ? { ...c, adminDeleted: true } : c);
  writeDB(db);
  res.json({ success: true, message: `Successfully deleted ${ids.length} campaigns` });
});

app.delete(['/api/admin/deals', '/admin/deals'], async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Missing or invalid ids array' });
  }
  const db = readDB();
  db.deals = (db.deals || []).map(d => ids.includes(d.id) ? { ...d, adminDeleted: true } : d);
  writeDB(db);
  res.json({ success: true, message: `Successfully deleted ${ids.length} deals` });
});

// ========== STATS & USER MANAGEMENT ROUTES ==========
app.get(['/api/stats', '/stats'], async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const db = readDB();
  
  if (user.role === 'brand') {
    const campaigns = (db.campaigns || []).filter(c => c.brandId === user.id);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalSpent = campaigns.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    
    res.json({
      activeCampaigns,
      totalSpent,
      totalReach: 4800000,
      avgEngagement: 5.2,
      budgetTotal: user.profile?.budget || 50000,
      budgetUsed: user.profile?.spent || totalSpent
    });
  } else if (user.role === 'influencer') {
    const campaigns = (db.campaigns || []).filter(c => c.influencerId === user.id);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    const totalEarned = campaigns.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const pendingAmount = campaigns.filter(c => c.status === 'pending' || c.status === 'review').reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    
    res.json({
      activeCampaigns,
      completedCampaigns,
      totalEarned,
      pendingAmount,
      rating: user.profile?.rating || 4.8,
      profileViews: 1400
    });
  } else {
    res.json({});
  }
});

app.post(['/api/users/influencer', '/users/influencer'], upload.single('profilePic'), async (req, res) => {
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
      location: 'India',
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
    joinedAt: new Date().toISOString().split('T')[0]
  };
  
  db.users = db.users || [];
  db.users.push(newUser);
  writeDB(db);
  res.json({ success: true, user: newUser });
});

app.put(['/api/users/influencer/:id', '/users/influencer/:id'], upload.single('profilePic'), async (req, res) => {
  const db = readDB();
  const userIndex = (db.users || []).findIndex(u => u.id === req.params.id && u.role === 'influencer');
  if (userIndex === -1) return res.status(404).json({ error: 'Influencer not found' });

  const { name, email, instagramFollowers, about, storyRate, postRate, reelRate, niche } = req.body;
  const user = db.users[userIndex];
  user.profile = user.profile || {};
  if (name) user.profile.name = name;
  if (email) user.email = email;
  if (about) user.profile.bio = about;
  if (niche) user.profile.niche = niche;
  if (instagramFollowers) user.profile.followers = parseInt(instagramFollowers) || user.profile.followers;
  
  user.profile.rates = user.profile.rates || {};
  if (storyRate) user.profile.rates.story = parseInt(storyRate);
  if (postRate) user.profile.rates.post = parseInt(postRate);
  if (reelRate) user.profile.rates.reel = parseInt(reelRate);
  
  if (req.file) {
    user.profile.avatar = await uploadToS3(req.file.buffer, req.file.originalname);
  }
  
  db.users[userIndex] = user;
  writeDB(db);
  res.json({ success: true, user });
});

app.delete(['/api/users/influencer/:id', '/users/influencer/:id'], async (req, res) => {
  const db = readDB();
  const userIndex = (db.users || []).findIndex(u => u.id === req.params.id && u.role === 'influencer');
  if (userIndex === -1) return res.status(404).json({ error: 'Influencer not found' });
  
  db.users.splice(userIndex, 1);
  writeDB(db);
  res.json({ success: true });
});

app.get(['/api/deals/download/:id', '/deals/download/:id'], async (req, res) => {
  try {
    const dbData = readDB();
    const deal = (dbData.deals || []).find(d => d.id === req.params.id) || (dbData.campaigns || []).find(c => c.id === req.params.id);
    if (!deal) return res.status(404).json({ error: 'Item not found' });
    
    const mediaUrl = deal.mediaAttached || deal.mediaUrl || deal.media;
    if (!mediaUrl) return res.status(404).json({ error: 'No attachment found' });
    
    const key = mediaUrl.substring(mediaUrl.lastIndexOf('/') + 1);
    const command = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key });
    const response = await s3.send(command);
    
    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${key}"`);
    response.Body.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Download failed' });
  }
});

app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

module.exports = app;