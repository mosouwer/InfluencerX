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
