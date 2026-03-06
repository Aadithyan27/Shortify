// API Base
const API_BASE = ''; // Same origin

// ----------------------------------------------------
// State & Navigation
// ----------------------------------------------------
let isLoggedIn = false;
let isRegistering = false;

function init() {
    // Check if user is theoretically logged in (could ping an endpoint, but since we rely on cookies, 
    // we'll just try to fetch URLs. If 401, we show login.
    checkAuthStatus();
    attachEventListeners();
}

function showSection(sectionId) {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById(sectionId).classList.remove('hidden');

    // reset animations
    const section = document.getElementById(sectionId);
    section.style.animation = 'none';
    section.offsetHeight; /* trigger reflow */
    section.style.animation = null;
}

async function checkAuthStatus() {
    try {
        const res = await fetch(`${API_BASE}/urls`);
        if (res.ok) {
            isLoggedIn = true;
            document.getElementById('logoutBtn').classList.remove('hidden');
            showSection('dashboardSection');
            loadUrls();
        } else {
            isLoggedIn = false;
            document.getElementById('logoutBtn').classList.add('hidden');
            showSection('authSection');
        }
    } catch (e) {
        showToast('Connection error', 'error');
    }
}

// ----------------------------------------------------
// Event Listeners
// ----------------------------------------------------
function attachEventListeners() {
    // Auth Tabs
    document.getElementById('tabLogin').addEventListener('click', () => switchAuthTab(false));
    document.getElementById('tabRegister').addEventListener('click', () => switchAuthTab(true));

    // Auth Form
    document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Date Input color hack
    const dateInput = document.getElementById('expiresAt');
    dateInput.addEventListener('change', (e) => {
        if (e.target.value) e.target.classList.add('has-val');
        else e.target.classList.remove('has-val');
    });

    // Shorten Form
    document.getElementById('shortenForm').addEventListener('submit', handleShorten);

    // Refresh URLs
    document.getElementById('refreshListBtn').addEventListener('click', loadUrls);

    // Modal Close
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        document.getElementById('analyticsModal').classList.add('hidden');
    });
}

// ----------------------------------------------------
// Auth Functions
// ----------------------------------------------------
function switchAuthTab(isReg) {
    isRegistering = isReg;
    document.getElementById('tabLogin').classList.toggle('active', !isReg);
    document.getElementById('tabRegister').classList.toggle('active', isReg);
    document.getElementById('authSubmitBtn').innerText = isReg ? 'Create Account' : 'Sign In';
    document.getElementById('authError').innerText = '';
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('authError');
    const btn = document.getElementById('authSubmitBtn');

    errorEl.innerText = '';
    const ogText = btn.innerText;
    btn.innerHTML = `<span class="material-symbols-outlined spin">autorenew</span> Working...`;
    btn.disabled = true;

    const endpoint = isRegistering ? '/auth/register' : '/auth/login';

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            if (isRegistering) {
                showToast('Registration successful! Logging in...', 'success');
                // Auto login
                isRegistering = false;
                await handleAuthSubmit(e);
            } else {
                showToast('Welcome back!', 'success');
                isLoggedIn = true;
                document.getElementById('email').value = '';
                document.getElementById('password').value = '';
                document.getElementById('logoutBtn').classList.remove('hidden');
                showSection('dashboardSection');
                loadUrls();
            }
        } else {
            errorEl.innerText = data.error || 'Authentication failed';
        }
    } catch (err) {
        errorEl.innerText = 'Network error occurred';
    } finally {
        btn.innerHTML = ogText;
        btn.disabled = false;
    }
}

function logout() {
    // Clear cookie hack locally (backend doesn't have an explicit clear cookie endpoint)
    document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    isLoggedIn = false;
    document.getElementById('logoutBtn').classList.add('hidden');
    showSection('authSection');
    showToast('Logged out successfully', 'success');
}

// ----------------------------------------------------
// URL Functions
// ----------------------------------------------------
async function handleShorten(e) {
    e.preventDefault();
    const original_url = document.getElementById('originalUrl').value;
    const expires_at_val = document.getElementById('expiresAt').value;
    const btn = e.target.querySelector('button[type="submit"]');

    const ogHtml = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined spin">autorenew</span>`;
    btn.disabled = true;

    try {
        const payload = { original_url };
        if (expires_at_val) { // Convert to ISO string
            payload.expires_at = new Date(expires_at_val).toISOString();
        }

        const res = await fetch(`${API_BASE}/urls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            showToast('Link shortened successfully!', 'success');
            document.getElementById('originalUrl').value = '';
            document.getElementById('expiresAt').value = '';
            document.getElementById('expiresAt').classList.remove('has-val');
            loadUrls();
        } else {
            showToast(data.error || 'Failed to shorten URL', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    } finally {
        btn.innerHTML = ogHtml;
        btn.disabled = false;
    }
}

async function loadUrls() {
    const tbody = document.getElementById('urlsTableBody');
    const loading = document.getElementById('urlsLoading');
    const emptyMsg = document.getElementById('urlsEmptyMsg');

    tbody.innerHTML = '';
    loading.classList.remove('hidden');
    emptyMsg.classList.add('hidden');

    try {
        const res = await fetch(`${API_BASE}/urls`);
        if (res.status === 401) {
            logout();
            return;
        }

        const data = await res.json();
        loading.classList.add('hidden');

        if (!data.urls || data.urls.length === 0) {
            emptyMsg.classList.remove('hidden');
            return;
        }

        data.urls.forEach(urlObj => {
            const tr = document.createElement('tr');
            tr.innerHTML = renderUrlRow(urlObj);
            tbody.appendChild(tr);
        });

    } catch (e) {
        loading.classList.add('hidden');
        showToast('Failed to load links', 'error');
    }
}

function renderUrlRow(url) {
    const shortLink = `${window.location.origin}/${url.short_code}`;

    let isExpired = false;
    let statusHtml = '<span class="status-badge status-active">Active</span>';

    if (url.expires_at && new Date(url.expires_at) < new Date()) {
        isExpired = true;
        statusHtml = '<span class="status-badge status-expired">Expired</span>';
    }

    return `
        <td>
            <a href="${shortLink}" target="_blank" class="shortened-link">${url.short_code}</a>
        </td>
        <td class="original-url-cell" title="${url.original_url}">
            ${url.original_url}
        </td>
        <td>
            <button onclick="viewAnalytics('${url.id}')" class="btn btn-sm btn-outline">
                <span class="material-symbols-outlined" style="font-size:16px">bar_chart</span> Stats
            </button>
        </td>
        <td>${statusHtml}</td>
        <td>
            <div class="flex-actions">
                <button onclick="copyToClipboard('${shortLink}')" class="btn btn-icon btn-copy" title="Copy">
                    <span class="material-symbols-outlined">content_copy</span>
                </button>
                <button onclick="deleteUrl('${url.id}')" class="btn btn-icon btn-danger" title="Delete">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        </td>
    `;
}

async function deleteUrl(id) {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
        const res = await fetch(`${API_BASE}/urls/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Link deleted', 'success');
            loadUrls();
        } else {
            const data = await res.json();
            showToast(data.error || 'Failed to delete', 'error');
        }
    } catch (e) {
        showToast('Network error', 'error');
    }
}

async function viewAnalytics(id) {
    const modal = document.getElementById('analyticsModal');
    const activityList = document.getElementById('activityList');

    try {
        const res = await fetch(`${API_BASE}/urls/${id}/analytics`);
        const data = await res.json();

        if (res.ok) {
            document.getElementById('modalShortUrl').innerText = `${window.location.host}/${data.url.short_code}`;
            document.getElementById('modalOriginalUrl').innerText = data.url.original_url;
            document.getElementById('modalTotalClicks').innerText = data.stats.total_clicks;

            activityList.innerHTML = '';

            if (data.recent_activity.length === 0) {
                activityList.innerHTML = '<p class="text-dim">No clicks recorded yet.</p>';
            } else {
                data.recent_activity.forEach(act => {
                    const date = new Date(act.timestamp).toLocaleString();
                    const div = document.createElement('div');
                    div.className = 'activity-item';
                    div.innerHTML = `
                        <span class="device-info" title="${act.user_agent}">${act.user_agent}</span>
                        <span class="time-info">${date}</span>
                    `;
                    activityList.appendChild(div);
                });
            }

            modal.classList.remove('hidden');
        } else {
            showToast(data.error || 'Failed to load analytics', 'error');
        }
    } catch (e) {
        showToast('Network error', 'error');
    }
}

// ----------------------------------------------------
// UI Utilities
// ----------------------------------------------------
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? 'check_circle' : 'error';
    toast.innerHTML = `<span class="material-symbols-outlined">${icon}</span> ${message}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastExit 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Boot up
document.addEventListener('DOMContentLoaded', init);
