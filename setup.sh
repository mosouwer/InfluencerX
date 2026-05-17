#!/bin/bash
# Create directories
mkdir -p public/css public/js

# package.json
cat > package.json << 'PKG'
{
  "name": "influencer-marketplace",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express-session": "^1.17.3",
    "lowdb": "^3.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
PKG

# server.js
cat > server.js << 'SERVER'
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const adapter = new JSONFile('db.json');
const db = new Low(adapter, { users: [], deals: [] });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(express.static('public'));

async function initDB() {
  await db.read();
  db.data ||= { users: [], deals: [] };
  if (db.data.users.length === 0) {
    const hashedPw = await bcrypt.hash('demo123', 10);
    db.data.users.push({
      id: '1',
      email: 'influencer@demo.com',
      password: hashedPw,
      role: 'influencer',
      profile: {
        name: 'Alex Johnson',
        niche: 'Fitness',
        followers: 25000,
        engagement: 4.2,
        location: 'USA',
        rates: { post: 250, story: 120, reel: 350 },
        availability: true
      }
    });
    db.data.users.push({
      id: '2',
      email: 'brand@demo.com',
      password: hashedPw,
      role: 'brand',
      profile: {
        company: 'Demo Brand',
        budget: 5000
      }
    });
    await db.write();
  }
}
initDB();

function getUser(req) {
  if (!req.session.userId) return null;
  return db.data.users.find(u => u.id === req.session.userId);
}

app.post('/api/signup', async (req, res) => {
  const { email, password, role, profile } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  const existing = db.data.users.find(u => u.email === email);
  if (existing) return res.status(400).json({ error: 'Email already exists' });
  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    email,
    password: hashed,
    role,
    profile: profile || (role === 'influencer' ? { name: '', niche: '', followers: 0, engagement: 0, rates: { post: 0, story: 0, reel: 0 }, availability: true } : { company: '', budget: 0 })
  };
  db.data.users.push(newUser);
  await db.write();
  req.session.userId = newUser.id;
  res.json({ success: true, user: { id: newUser.id, email: newUser.email, role: newUser.role, profile: newUser.profile } });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.userId = user.id;
  res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, profile: user.profile } });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  res.json({ user: { id: user.id, email: user.email, role: user.role, profile: user.profile } });
});

app.put('/api/influencer/profile', async (req, res) => {
  const user = getUser(req);
  if (!user || user.role !== 'influencer') return res.status(403).json({ error: 'Unauthorized' });
  const { name, niche, followers, engagement, location, rates, availability } = req.body;
  user.profile = { name, niche, followers, engagement, location, rates, availability };
  await db.write();
  res.json({ success: true, profile: user.profile });
});

app.get('/api/influencers', async (req, res) => {
  const { maxBudget, niche, minFollowers, maxFollowers } = req.query;
  let influencers = db.data.users.filter(u => u.role === 'influencer' && u.profile.availability === true);
  if (maxBudget) {
    const budget = parseInt(maxBudget);
    influencers = influencers.filter(i => i.profile.rates.post <= budget);
  }
  if (niche && niche !== 'all') {
    influencers = influencers.filter(i => i.profile.niche.toLowerCase() === niche.toLowerCase());
  }
  if (minFollowers) {
    influencers = influencers.filter(i => i.profile.followers >= parseInt(minFollowers));
  }
  if (maxFollowers) {
    influencers = influencers.filter(i => i.profile.followers <= parseInt(maxFollowers));
  }
  res.json(influencers.map(i => ({
    id: i.id,
    name: i.profile.name,
    niche: i.profile.niche,
    followers: i.profile.followers,
    engagement: i.profile.engagement,
    location: i.profile.location,
    rates: i.profile.rates,
    availability: i.profile.availability
  })));
});

app.post('/api/deals', async (req, res) => {
  const brand = getUser(req);
  if (!brand || brand.role !== 'brand') return res.status(403).json({ error: 'Only brands can hire' });
  const { influencerId, packageType, message } = req.body;
  const influencer = db.data.users.find(u => u.id === influencerId && u.role === 'influencer');
  if (!influencer) return res.status(404).json({ error: 'Influencer not found' });
  const deal = {
    id: Date.now().toString(),
    brandId: brand.id,
    brandName: brand.profile.company || brand.email,
    influencerId,
    influencerName: influencer.profile.name,
    packageType,
    amount: influencer.profile.rates[packageType],
    message,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.data.deals.push(deal);
  await db.write();
  res.json({ success: true, deal });
});

app.get('/api/deals', async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  let deals = db.data.deals;
  if (user.role === 'brand') {
    deals = deals.filter(d => d.brandId === user.id);
  } else {
    deals = deals.filter(d => d.influencerId === user.id);
  }
  res.json(deals);
});

app.put('/api/deals/:id/status', async (req, res) => {
  const user = getUser(req);
  const { status } = req.body;
  const deal = db.data.deals.find(d => d.id === req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  if (user.role !== 'influencer' || deal.influencerId !== user.id) {
    return res.status(403).json({ error: 'Only the influencer can respond' });
  }
  deal.status = status;
  await db.write();
  res.json({ success: true, deal });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
SERVER

# public/index.html
cat > public/index.html << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>InfluenceMatch | Minimalist Influencer Marketplace</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body class="bg-gray-50 font-sans antialiased">
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="text-xl font-semibold text-gray-800">InfluenceMatch</div>
                <div id="nav-buttons" class="space-x-4"></div>
            </div>
        </div>
    </nav>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div id="auth-container" class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 mt-10">
            <div class="flex space-x-4 border-b mb-6">
                <button id="login-tab" class="py-2 px-4 text-gray-600 border-b-2 border-transparent hover:text-gray-800">Login</button>
                <button id="signup-tab" class="py-2 px-4 text-gray-600 border-b-2 border-transparent hover:text-gray-800">Sign Up</button>
            </div>
            <div id="login-form">
                <input type="email" id="login-email" placeholder="Email" class="w-full mb-3 px-4 py-2 border rounded-md">
                <input type="password" id="login-password" placeholder="Password" class="w-full mb-4 px-4 py-2 border rounded-md">
                <button id="login-btn" class="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700">Login</button>
            </div>
            <div id="signup-form" class="hidden">
                <input type="email" id="signup-email" placeholder="Email" class="w-full mb-3 px-4 py-2 border rounded-md">
                <input type="password" id="signup-password" placeholder="Password" class="w-full mb-3 px-4 py-2 border rounded-md">
                <select id="signup-role" class="w-full mb-4 px-4 py-2 border rounded-md bg-white">
                    <option value="brand">Brand / Business</option>
                    <option value="influencer">Influencer</option>
                </select>
                <button id="signup-btn" class="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700">Sign Up</button>
            </div>
        </div>
        <div id="dashboard" class="hidden">
            <div id="brand-dashboard" class="hidden">
                <h2 class="text-2xl font-bold mb-6">Find Influencers</h2>
                <div class="bg-white p-5 rounded-lg shadow-sm mb-8 border">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input type="number" id="filter-budget" placeholder="Max budget per post ($)" class="px-3 py-2 border rounded">
                        <select id="filter-niche" class="px-3 py-2 border rounded bg-white">
                            <option value="all">All niches</option>
                            <option value="Fitness">Fitness</option>
                            <option value="Beauty">Beauty</option>
                            <option value="Tech">Tech</option>
                            <option value="Travel">Travel</option>
                            <option value="Food">Food</option>
                        </select>
                        <input type="number" id="filter-min-followers" placeholder="Min followers" class="px-3 py-2 border rounded">
                        <button id="search-btn" class="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">Search</button>
                    </div>
                </div>
                <div id="influencer-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
            </div>
            <div id="influencer-dashboard" class="hidden">
                <h2 class="text-2xl font-bold mb-6">Your Profile & Rates</h2>
                <div class="bg-white p-6 rounded-lg shadow-sm border mb-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" id="inf-name" placeholder="Display name" class="px-3 py-2 border rounded">
                        <select id="inf-niche" class="px-3 py-2 border rounded bg-white">
                            <option>Fitness</option><option>Beauty</option><option>Tech</option><option>Travel</option><option>Food</option>
                        </select>
                        <input type="number" id="inf-followers" placeholder="Followers count" class="px-3 py-2 border rounded">
                        <input type="number" id="inf-engagement" step="0.1" placeholder="Engagement rate (%)" class="px-3 py-2 border rounded">
                        <input type="text" id="inf-location" placeholder="Location (e.g., USA)" class="px-3 py-2 border rounded">
                        <div class="col-span-2">
                            <label class="block text-sm font-medium mb-1">Rates ($)</label>
                            <div class="grid grid-cols-3 gap-3">
                                <input type="number" id="rate-post" placeholder="Post" class="px-3 py-2 border rounded">
                                <input type="number" id="rate-story" placeholder="Story" class="px-3 py-2 border rounded">
                                <input type="number" id="rate-reel" placeholder="Reel" class="px-3 py-2 border rounded">
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <label class="flex items-center gap-2"><input type="checkbox" id="inf-availability" checked> Available for work</label>
                            <button id="save-profile-btn" class="bg-gray-800 text-white px-5 py-2 rounded hover:bg-gray-700">Save Profile</button>
                        </div>
                    </div>
                </div>
                <h3 class="text-xl font-semibold mb-3">Hire Requests</h3>
                <div id="deals-list" class="space-y-3"></div>
            </div>
        </div>
    </main>
    <script src="/js/main.js"></script>
</body>
</html>
HTML

# public/css/style.css
cat > public/css/style.css << 'CSS'
.influencer-card {
    transition: transform 0.1s ease;
}
.influencer-card:hover {
    transform: translateY(-2px);
}
CSS

# public/js/main.js
cat > public/js/main.js << 'JS'
let currentUser = null;
const api = async (url, options = {}) => {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

window.onload = async () => {
    try {
        const data = await api('/api/me');
        currentUser = data.user;
        showDashboard();
    } catch (err) {
        showAuth();
    }
};

function showAuth() {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('login-tab').classList.add('border-gray-800', 'text-gray-800');
    document.getElementById('signup-tab').classList.remove('border-gray-800', 'text-gray-800');
}

function showDashboard() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    const brandDash = document.getElementById('brand-dashboard');
    const infDash = document.getElementById('influencer-dashboard');
    const nav = document.getElementById('nav-buttons');
    if (currentUser.role === 'brand') {
        brandDash.classList.remove('hidden');
        infDash.classList.add('hidden');
        nav.innerHTML = `<span class="text-gray-600">${currentUser.profile.company || currentUser.email}</span>
                         <button id="logout-btn" class="text-red-500 hover:text-red-700">Logout</button>`;
        loadInfluencers();
    } else {
        brandDash.classList.add('hidden');
        infDash.classList.remove('hidden');
        nav.innerHTML = `<span class="text-gray-600">${currentUser.profile.name || currentUser.email}</span>
                         <button id="logout-btn" class="text-red-500 hover:text-red-700">Logout</button>`;
        loadInfluencerProfile();
        loadDeals();
    }
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await api('/api/logout', { method: 'POST' });
        location.reload();
    });
}

document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const data = await api('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        currentUser = data.user;
        showDashboard();
    } catch (err) { alert('Login failed'); }
};

document.getElementById('signup-btn').onclick = async () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;
    const profile = role === 'influencer' ? { name: 'New Creator', niche: 'Fitness', followers: 0, engagement: 0, rates: { post: 0, story: 0, reel: 0 }, availability: true } : { company: 'My Company', budget: 0 };
    try {
        const data = await api('/api/signup', { method: 'POST', body: JSON.stringify({ email, password, role, profile }) });
        currentUser = data.user;
        showDashboard();
    } catch (err) { alert('Signup failed'); }
};

document.getElementById('login-tab').onclick = () => {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('login-tab').classList.add('border-gray-800', 'text-gray-800');
    document.getElementById('signup-tab').classList.remove('border-gray-800', 'text-gray-800');
};
document.getElementById('signup-tab').onclick = () => {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('signup-tab').classList.add('border-gray-800', 'text-gray-800');
    document.getElementById('login-tab').classList.remove('border-gray-800', 'text-gray-800');
};

async function loadInfluencers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const influencers = await api(`/api/influencers?${params}`);
    const container = document.getElementById('influencer-list');
    if (influencers.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">No influencers match your criteria.</div>';
        return;
    }
    container.innerHTML = influencers.map(inf => `
        <div class="bg-white border rounded-lg p-5 shadow-sm influencer-card">
            <h3 class="text-xl font-semibold">${inf.name}</h3>
            <div class="text-sm text-gray-500">${inf.niche} • ${inf.followers.toLocaleString()} followers</div>
            <div class="mt-2 text-sm">📍 ${inf.location} | 📈 ${inf.engagement}% engagement</div>
            <div class="mt-3 flex gap-2 text-sm">
                <span class="bg-gray-100 px-2 py-1 rounded">📷 Post: $${inf.rates.post}</span>
                <span class="bg-gray-100 px-2 py-1 rounded">📱 Story: $${inf.rates.story}</span>
                <span class="bg-gray-100 px-2 py-1 rounded">🎬 Reel: $${inf.rates.reel}</span>
            </div>
            <div class="mt-4 flex gap-2">
                <button onclick="hireInfluencer('${inf.id}', 'post')" class="bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">Hire (Post)</button>
                <button onclick="hireInfluencer('${inf.id}', 'story')" class="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-500">Story</button>
                <button onclick="hireInfluencer('${inf.id}', 'reel')" class="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-500">Reel</button>
            </div>
        </div>
    `).join('');
}
window.hireInfluencer = async (infId, pkg) => {
    const msg = prompt('Optional message to influencer:');
    try {
        await api('/api/deals', { method: 'POST', body: JSON.stringify({ influencerId: infId, packageType: pkg, message: msg || '' }) });
        alert('Hire request sent!');
    } catch (err) { alert('Error sending request'); }
};

document.getElementById('search-btn')?.addEventListener('click', () => {
    const filters = {
        maxBudget: document.getElementById('filter-budget').value,
        niche: document.getElementById('filter-niche').value,
        minFollowers: document.getElementById('filter-min-followers').value
    };
    loadInfluencers(filters);
});

async function loadInfluencerProfile() {
    const p = currentUser.profile;
    document.getElementById('inf-name').value = p.name || '';
    document.getElementById('inf-niche').value = p.niche || 'Fitness';
    document.getElementById('inf-followers').value = p.followers || 0;
    document.getElementById('inf-engagement').value = p.engagement || 0;
    document.getElementById('inf-location').value = p.location || '';
    document.getElementById('rate-post').value = p.rates?.post || 0;
    document.getElementById('rate-story').value = p.rates?.story || 0;
    document.getElementById('rate-reel').value = p.rates?.reel || 0;
    document.getElementById('inf-availability').checked = p.availability !== false;
}
document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
    const profile = {
        name: document.getElementById('inf-name').value,
        niche: document.getElementById('inf-niche').value,
        followers: parseInt(document.getElementById('inf-followers').value) || 0,
        engagement: parseFloat(document.getElementById('inf-engagement').value) || 0,
        location: document.getElementById('inf-location').value,
        rates: {
            post: parseInt(document.getElementById('rate-post').value) || 0,
            story: parseInt(document.getElementById('rate-story').value) || 0,
            reel: parseInt(document.getElementById('rate-reel').value) || 0
        },
        availability: document.getElementById('inf-availability').checked
    };
    await api('/api/influencer/profile', { method: 'PUT', body: JSON.stringify(profile) });
    alert('Profile saved!');
    currentUser.profile = profile;
    loadDeals();
});

async function loadDeals() {
    const deals = await api('/api/deals');
    const container = document.getElementById('deals-list');
    if (deals.length === 0) {
        container.innerHTML = '<div class="text-gray-500">No hire requests yet.</div>';
        return;
    }
    container.innerHTML = deals.map(deal => `
        <div class="bg-white border rounded-lg p-4 flex justify-between items-center">
            <div>
                <strong>${deal.brandName}</strong> wants a <span class="capitalize">${deal.packageType}</span> for $${deal.amount}<br>
                <span class="text-sm text-gray-500">Message: ${deal.message || 'No message'}</span>
                <div class="mt-1 text-xs">Status: <span class="font-medium">${deal.status}</span></div>
            </div>
            ${deal.status === 'pending' && currentUser.role === 'influencer' ? `
                <div class="space-x-2">
                    <button onclick="respondToDeal('${deal.id}', 'accepted')" class="bg-green-600 text-white px-3 py-1 rounded text-sm">Accept</button>
                    <button onclick="respondToDeal('${deal.id}', 'rejected')" class="bg-red-500 text-white px-3 py-1 rounded text-sm">Reject</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}
window.respondToDeal = async (dealId, status) => {
    await api(`/api/deals/${dealId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    loadDeals();
};
JS

echo "✅ All files created successfully!"
echo "📦 Run 'npm install' then 'npm start'"
