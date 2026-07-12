
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const sharp = require('sharp');

// Initialize Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
  try {
    serviceAccount = require('../firebase-service-account.json');
  } catch (e) {
    console.error('Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_JSON env var or provide firebase-service-account.json');
    throw e;
  }
}
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

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

async function uploadRawToS3(buffer, originalname, mimetype) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const key = uniqueSuffix + '-' + originalname;
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimetype
  });
  
  await s3.send(command);
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// A simple middleware to simulate authentication (in production use Firebase Auth tokens)
// Here we rely on the client sending userId and userRole in headers
function getUser(req) {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  if (!userId) return null;
  return { id: userId, role: userRole };
}

// Ensure user is logged in
app.use('/api', (req, res, next) => {
  if (req.path === '/login' || req.path === '/signup' || req.path === '/upload') return next();
  const user = getUser(req);
  if (!user && req.method !== 'OPTIONS') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Upload endpoint
app.post('/api/upload', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = await uploadToS3(req.file.buffer, req.file.originalname);
    res.json({ url });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const snapshot = await db.collection('users').where('email', '==', email).get();
  
  if (snapshot.empty) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const userDoc = snapshot.docs[0];
  const user = userDoc.data();
  user.id = userDoc.id; // ensure ID is mapped
  
  const bcrypt = require('bcryptjs');
  const match = await bcrypt.compare(password, user.password);
  
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Account disabled' });
  }
  
  delete user.password;
  res.json({ user, token: 'dummy-token-' + user.id });
});

app.post('/api/logout', (req, res) => {
  res.json({ success: true });
});

// Users
app.get('/api/users', async (req, res) => {
  const snapshot = await db.collection('users').get();
  const users = snapshot.docs.map(doc => {
    const data = doc.data();
    delete data.password;
    data.id = doc.id;
    return data;
  });
  res.json(users);
});

app.get(['/api/users/influencers', '/api/influencers'], async (req, res) => {
  const snapshot = await db.collection('users').where('role', '==', 'influencer').where('status', '==', 'active').get();
  const influencers = snapshot.docs.map(doc => {
    const u = doc.data();
    return {
      id: doc.id,
      name: u.profile?.name || '',
      image: u.profile?.avatar || '',
      niche: u.profile?.niche || 'Lifestyle',
      followers: u.profile?.followers || 0,
      rates: u.profile?.rates || { story: 0, post: 0, reel: 0 },
      verified: u.verified || false,
      role: u.role,
      status: u.status,
      location: u.profile?.location || '',
      rating: u.profile?.rating || 0,
      engagement: u.profile?.engagement || 0,
      availability: u.profile?.availability ?? true
    };
  });
  res.json(influencers);
});

app.get('/api/users/:id', async (req, res) => {
  const doc = await db.collection('users').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: 'User not found' });
  const user = doc.data();
  user.id = doc.id;
  delete user.password;
  res.json(user);
});

app.get('/api/influencer/:id', async (req, res) => {
  const doc = await db.collection('users').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: 'Influencer not found' });
  const u = doc.data();
  res.json({
    id: doc.id,
    name: u.profile?.name || '',
    image: u.profile?.avatar || '',
    niche: u.profile?.niche || 'Lifestyle',
    followers: u.profile?.followers || 0,
    rates: u.profile?.rates || { story: 0, post: 0, reel: 0 },
    verified: u.verified || false,
    location: u.profile?.location || '',
    rating: u.profile?.rating || 0,
    engagement: u.profile?.engagement || 0,
    availability: u.profile?.availability ?? true,
    bio: u.profile?.bio || '',
    campaigns: u.profile?.campaigns || 0
  });
});

app.put('/api/influencer/rates', async (req, res) => {
  const userRole = req.headers['x-user-role'];
  const userId = req.headers['x-user-id'];
  if (userRole !== 'influencer') return res.status(403).json({ error: 'Unauthorized' });

  const docRef = db.collection('users').doc(userId);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'User not found' });

  const profile = doc.data().profile || {};
  profile.rates = {
    ...profile.rates,
    ...req.body.rates
  };

  await docRef.update({ profile });
  
  const updated = await docRef.get();
  const userData = updated.data();
  userData.id = updated.id;
  delete userData.password;
  
  res.json({ success: true, user: userData });
});

app.put('/api/users/profile', async (req, res) => {
  const user = getUser(req);
  await db.collection('users').doc(user.id).update(req.body);
  const updated = (await db.collection('users').doc(user.id).get()).data();
  delete updated.password;
  res.json(updated);
});

app.put('/api/users/:id', async (req, res) => {
  await db.collection('users').doc(req.params.id).update(req.body);
  res.json({ success: true });
});

// Campaigns
app.get('/api/campaigns', async (req, res) => {
  const user = getUser(req);
  let snapshot;
  if (user.role === 'admin') {
    snapshot = await db.collection('campaigns').get();
  } else if (user.role === 'brand') {
    snapshot = await db.collection('campaigns').where('brandId', '==', user.id).get();
  } else {
    snapshot = await db.collection('campaigns').where('influencerId', '==', user.id).get();
  }
  const campaigns = snapshot.docs.map(doc => {
    const data = doc.data();
    data.id = doc.id;
    return data;
  });
  // Sort descending by id or created timestamp
  campaigns.sort((a, b) => b.id.localeCompare(a.id));
  res.json(campaigns);
});

app.post('/api/campaigns', async (req, res) => {
  const user = getUser(req);
  const id = Date.now().toString();
  const newCampaign = {
    ...req.body,
    id,
    brandId: user.id,
    brandName: req.body.brandName || 'Brand',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  await db.collection('campaigns').doc(id).set(newCampaign);
  
  // Notify
  await db.collection('notifications').doc(Date.now().toString()).set({
    id: Date.now().toString(),
    userId: req.body.influencerId,
    title: 'New Campaign Offer',
    message: `You were invited to ${req.body.name}`,
    time: 'Just now',
    read: false,
    icon: '🎯'
  });
  
  res.json({ success: true, campaign: newCampaign });
});

app.put('/api/campaigns/:id/status', async (req, res) => {
  const user = getUser(req);
  const { status, progress } = req.body;
  const docRef = db.collection('campaigns').doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Campaign not found' });
  const campaign = doc.data();
  
  if (user.role === 'influencer' && campaign.influencerId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  await docRef.update({ status, ...(progress ? { progress } : {}) });
  
  await db.collection('notifications').doc(Date.now().toString()).set({
    id: Date.now().toString(),
    userId: campaign.brandId,
    title: 'Campaign Updated',
    message: `${campaign.influencerName} updated status to ${status}`,
    time: 'Just now',
    read: false,
    icon: '📝'
  });
  
  res.json({ success: true });
});

// Deals
app.get('/api/deals', async (req, res) => {
  const user = getUser(req);
  let snapshot;
  if (user.role === 'admin') {
    snapshot = await db.collection('deals').get();
  } else if (user.role === 'brand') {
    snapshot = await db.collection('deals').where('brandId', '==', user.id).get();
  } else {
    snapshot = await db.collection('deals').where('influencerId', '==', user.id).get();
  }
  const deals = snapshot.docs.map(doc => {
    const data = doc.data();
    data.id = doc.id;
    return data;
  });
  deals.sort((a, b) => b.id.localeCompare(a.id));
  res.json(deals);
});

app.post('/api/deals', upload.single('media'), async (req, res) => {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized', details: 'Missing user credentials in headers' });
    if (!req.body.influencerId) return res.status(400).json({ error: 'Bad Request', details: 'Missing influencerId in request body' });

    const id = Date.now().toString();
    
    // Look up influencer - try by doc ID first, then search by legacy ID field
    let infDoc = await db.collection('users').doc(req.body.influencerId).get();
    
    if (!infDoc.exists) {
      // Fallback: search for influencer by matching the id field in the document data
      const infSnapshot = await db.collection('users')
        .where('role', '==', 'influencer')
        .get();
      const match = infSnapshot.docs.find(doc => {
        const data = doc.data();
        return data.id === req.body.influencerId || doc.id === req.body.influencerId;
      });
      if (match) {
        infDoc = match;
      }
    }
    
    const brandDoc = await db.collection('users').doc(user.id).get();
    
    // Read name from profile.name (where Firestore stores it), falling back to top-level name
    const infData = infDoc.exists ? infDoc.data() : null;
    const infName = infData ? (infData.profile?.name || infData.name || 'Unknown Influencer') : 'Unknown Influencer';
    const brandData = brandDoc.exists ? brandDoc.data() : null;
    const brandName = brandData ? (brandData.profile?.company || brandData.profile?.name || brandData.name || 'Unknown Brand') : 'Unknown Brand';
    
    // Determine amount from influencer rates
    const packageType = req.body.packageType || 'post';
    const rates = infData?.profile?.rates || infData?.rates || {};
    const amount = rates[packageType] || 0;

    let mediaUrl = null;
    if (req.file) {
      mediaUrl = await uploadRawToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const newDeal = {
      ...req.body,
      id,
      brandId: user.id,
      brandName,
      influencerName: infName,
      influencerId: req.body.influencerId,
      amount,
      type: packageType,
      status: 'pending',
      mediaAttached: mediaUrl,
      createdAt: new Date().toISOString()
    };
    
    await db.collection('deals').doc(id).set(newDeal);
    
    await db.collection('notifications').doc(Date.now().toString()).set({
      id: Date.now().toString(),
      userId: req.body.influencerId,
      title: 'New Deal Request',
      message: `${brandName} wants to hire you`,
      time: 'Just now',
      read: false,
      icon: '🤝'
    });
    
    res.json({ success: true, deal: newDeal });
  } catch (error) {
    console.error('Deal creation error:', error);
    res.status(500).json({ error: 'Failed to create deal', details: error.message });
  }
});

app.put('/api/deals/:id/status', async (req, res) => {
  const user = getUser(req);
  const { status } = req.body;
  const docRef = db.collection('deals').doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Deal not found' });
  const deal = doc.data();
  
  if (user.role !== 'admin' && (user.role !== 'influencer' || deal.influencerId !== user.id)) {
    return res.status(403).json({ error: 'Only the influencer or admin can update status' });
  }
  
  await docRef.update({ status });
  
  await db.collection('notifications').doc(Date.now().toString()).set({
    id: Date.now().toString(),
    userId: deal.brandId,
    title: `Deal ${status}`,
    message: `${deal.influencerName} has ${status} your hire request`,
    time: 'Just now',
    read: false,
    icon: status === 'accepted' ? '✅' : '❌'
  });
  
  res.json({ success: true });
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  const user = getUser(req);
  const snapshot = await db.collection('notifications').where('userId', '==', user.id).get();
  const notifs = snapshot.docs.map(doc => doc.data());
  notifs.sort((a, b) => b.id.localeCompare(a.id));
  res.json(notifs);
});

app.put('/api/notifications/:id/read', async (req, res) => {
  await db.collection('notifications').doc(req.params.id).update({ read: true });
  res.json({ success: true });
});

// Admin endpoints
app.get('/api/admin/users', async (req, res) => {
  const snapshot = await db.collection('users').get();
  const users = snapshot.docs.map(doc => {
    const data = doc.data();
    data.id = doc.id;
    delete data.password;
    return data;
  });
  res.json(users);
});

app.post('/api/admin/users/influencer', async (req, res) => {
  const newId = 'user_' + Date.now();
  const bcrypt = require('bcryptjs');
  const hashedPw = await bcrypt.hash('demo123', 10);
  
  const newUser = {
    ...req.body,
    id: newId,
    role: 'influencer',
    status: 'active',
    password: hashedPw,
    joinedAt: new Date().toISOString().split('T')[0]
  };
  
  await db.collection('users').doc(newId).set(newUser);
  delete newUser.password;
  res.json({ success: true, user: newUser });
});

app.put('/api/admin/users/:id/status', async (req, res) => {
  await db.collection('users').doc(req.params.id).update({ status: req.body.status });
  res.json({ success: true });
});

app.post('/api/users/influencer', upload.single('profilePic'), async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { name, email, password, instagramFollowers, about, storyRate, postRate, reelRate, niche } = req.body;
    
    const hashedPassword = await bcrypt.hash(password || 'demo123', 10);
    const newId = 'user_' + Date.now();
    
    let avatarUrl = null;
    if (req.file) {
      avatarUrl = await uploadToS3(req.file.buffer, req.file.originalname);
    }

    const newUser = {
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
        avatar: avatarUrl,
        rating: 5.0,
        campaigns: 0,
        verified: false,
        availability: true
      },
      status: 'active',
      joinedAt: new Date().toISOString()
    };
    
    await db.collection('users').doc(newId).set(newUser);
    
    newUser.id = newId;
    delete newUser.password;
    res.json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create influencer', details: error.message });
  }
});

app.put('/api/users/influencer/:id', upload.single('profilePic'), async (req, res) => {
  const docRef = db.collection('users').doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'User not found' });

  const data = doc.data();
  const profile = data.profile || {};
  const rates = profile.rates || {};

  const { name, email, instagramFollowers, about, storyRate, postRate, reelRate, niche } = req.body;
  
  if (name) profile.name = name;
  if (about) profile.bio = about;
  if (niche) profile.niche = niche;
  if (instagramFollowers) profile.followers = parseInt(instagramFollowers) || profile.followers;
  
  if (storyRate) rates.story = parseInt(storyRate) || rates.story;
  if (postRate) rates.post = parseInt(postRate) || rates.post;
  if (reelRate) rates.reel = parseInt(reelRate) || rates.reel;
  profile.rates = rates;
  
  const updates = { profile };
  if (email) updates.email = email;
  
  if (req.file) {
    try {
      profile.avatar = await uploadToS3(req.file.buffer, req.file.originalname);
    } catch (e) {
      console.error('S3 Upload Error:', e);
    }
  }

  await docRef.update(updates);
  
  // Return the updated user
  const updatedDoc = await docRef.get();
  const updatedUser = updatedDoc.data();
  updatedUser.id = updatedDoc.id;
  delete updatedUser.password;
  res.json({ success: true, user: updatedUser });
});

app.delete('/api/users/influencer/:id', async (req, res) => {
  try {
    const docRef = db.collection('users').doc(req.params.id);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      const avatarUrl = data.profile?.avatar || data.image;
      
      if (avatarUrl && avatarUrl.startsWith('http')) {
        try {
          const url = new URL(avatarUrl);
          if (url.hostname.includes('amazonaws.com')) {
            const key = decodeURIComponent(url.pathname.substring(1));
            const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
            await s3.send(new DeleteObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: key
            }));
          }
        } catch (err) {
          console.error("Failed to delete S3 image:", err);
        }
      }
      
      await docRef.delete();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete influencer', details: error.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  const usersSnap = await db.collection('users').get();
  const campaignsSnap = await db.collection('campaigns').get();
  const dealsSnap = await db.collection('deals').get();
  const withdrawalsSnap = await db.collection('withdrawals').get();
  
  const users = usersSnap.docs.map(d => {
    const data = d.data();
    data.id = d.id;
    return data;
  });
  const campaigns = campaignsSnap.docs.map(d => d.data());
  const deals = dealsSnap.docs.map(d => d.data());
  const withdrawals = withdrawalsSnap.docs.map(d => d.data());
  
  const brands = users.filter(u => u.role === 'brand');
  const influencers = users.filter(u => u.role === 'influencer');
  
  const totalValue = deals.filter(d => d.status === 'completed').reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const platformRevenue = totalValue * 0.20;
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
    totalValue,
    pendingWithdrawals,
    verifiedInfluencers: influencers.filter(i => i.verified || i.profile?.verified).length
  });
});

app.put('/api/admin/users/:id/verify', async (req, res) => {
  await db.collection('users').doc(req.params.id).update({ verified: req.body.verified });
  res.json({ success: true });
});

app.get('/api/admin/campaigns', async (req, res) => {
  const snapshot = await db.collection('campaigns').get();
  const campaigns = snapshot.docs.map(doc => {
    const data = doc.data();
    data.id = doc.id;
    return data;
  });
  campaigns.sort((a, b) => b.id.localeCompare(a.id));
  res.json(campaigns);
});

app.get('/api/admin/deals', async (req, res) => {
  const snapshot = await db.collection('deals').get();
  const deals = snapshot.docs.map(doc => {
    const data = doc.data();
    data.id = doc.id;
    return data;
  });
  deals.sort((a, b) => b.id.localeCompare(a.id));
  res.json(deals);
});

app.get('/api/admin/withdrawals', async (req, res) => {
  const snapshot = await db.collection('withdrawals').get();
  const withdrawals = snapshot.docs.map(doc => {
    const data = doc.data();
    data.id = doc.id;
    return data;
  });
  withdrawals.sort((a, b) => b.id.localeCompare(a.id));
  res.json(withdrawals);
});

app.put('/api/admin/withdrawals/:id/process', async (req, res) => {
  await db.collection('withdrawals').doc(req.params.id).update({
    status: 'completed',
    processedAt: new Date().toISOString()
  });
  res.json({ success: true });
});

module.exports = app;