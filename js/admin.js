/**
 * LEGION Free VPN - Admin Panel Logic
 * Manages ISP Packages, Trojan Credentials, Stock Toggle, and User Ban Controller
 */

(function () {
  'use strict';

  const ADMIN_SESSION_KEY = 'legion_admin_auth_token';
  const DEFAULT_PIN = '80664227';

  // State
  let packages = [];
  let users = [];

  // DOM Elements
  const loginView = document.getElementById('admin-login-view');
  const dashboardView = document.getElementById('admin-dashboard-view');
  const loginForm = document.getElementById('admin-login-form');
  const passInput = document.getElementById('admin-pass-input');
  const logoutBtn = document.getElementById('admin-logout-btn');

  const packagesListEl = document.getElementById('admin-packages-list');
  const usersTableEl = document.getElementById('admin-users-table');
  
  // Modal Elements
  const pkgModal = document.getElementById('package-edit-modal');
  const closePkgModalBtn = document.getElementById('close-pkg-modal');
  const btnAddPkg = document.getElementById('btn-add-pkg-modal');
  const pkgForm = document.getElementById('package-edit-form');
  const pkgModalTitle = document.getElementById('pkg-modal-title');

  // Stats
  const statUsers = document.getElementById('stat-total-users');
  const statBanned = document.getElementById('stat-banned-users');
  const statAvailable = document.getElementById('stat-available-pkgs');
  const statOutOfStock = document.getElementById('stat-outofstock-pkgs');

  // --- Auth Guard ---
  function checkAuth() {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (token === 'authorized') {
      loginView.classList.add('hidden');
      dashboardView.classList.remove('hidden');
      dashboardView.classList.add('flex');
      loadDashboardData();
    } else {
      loginView.classList.remove('hidden');
      dashboardView.classList.add('hidden');
      dashboardView.classList.remove('flex');
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const pin = passInput.value.trim();

    // Async login audit & verification
    try {
      const apiBase = getApiBaseUrl();
      fetch(`${apiBase}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      }).catch(() => {});
    } catch (e) {}

    if (pin === DEFAULT_PIN) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'authorized');
      passInput.value = '';
      checkAuth();
    } else {
      alert("Invalid Security PIN!");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    checkAuth();
  }


  // --- Admin Security Logs & Live Traffic Telemetry ---
  let trafficRefreshTimer = null;

  async function loadAdminLogins() {
    const tableEl = document.getElementById('admin-logins-table');
    const badgeEl = document.getElementById('badge-admin-logins-count');
    if (!tableEl) return;

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/admin/logs?type=admin`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-admin-pin': DEFAULT_PIN
        }
      });

      if (res.ok) {
        const data = await res.json();
        const logs = data.logs || [];
        if (badgeEl) badgeEl.textContent = `${logs.length} Records`;

        if (logs.length === 0) {
          tableEl.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-zinc-500 font-mono">No admin security logs recorded yet.</td></tr>`;
          return;
        }

        tableEl.innerHTML = logs.map(l => {
          const isSuccess = l.status === 'Success';
          const statusBadge = isSuccess
            ? `<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px]">✓ Success</span>`
            : `<span class="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 font-semibold text-[11px]">✕ Invalid PIN</span>`;

          const actionLabel = l.action === 'save_master_config'
            ? 'Save Master Config'
            : (l.action === 'admin_dashboard_login' ? 'Dashboard Login' : l.action);

          return `
            <tr class="hover:bg-surface-200/50 transition-colors">
              <td class="py-3 px-4 font-mono text-[11px] text-zinc-300">${l.slTime || l.timestamp}</td>
              <td class="py-3 px-4 font-mono text-neon font-bold">${l.ip || '127.0.0.1'}</td>
              <td class="py-3 px-4 text-zinc-300">${l.location || 'Unknown'} <span class="text-[10px] text-zinc-500 block">${l.isp || ''}</span></td>
              <td class="py-3 px-4 font-medium text-white">${actionLabel}</td>
              <td class="py-3 px-4 font-mono text-[11px] text-zinc-400">${l.deviceSummary || l.device || 'Desktop'}</td>
              <td class="py-3 px-4 text-right">${statusBadge}</td>
            </tr>
          `;
        }).join('');
      } else {
        tableEl.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-amber-400 text-xs">Could not fetch admin security logs (HTTP ${res.status}).</td></tr>`;
      }
    } catch (err) {
      console.warn("loadAdminLogins notice:", err);
      tableEl.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-zinc-500 text-xs">Admin telemetry worker endpoint offline or unreachable.</td></tr>`;
    }
  }

  async function loadVisitorLogs() {
    const tableEl = document.getElementById('admin-visitors-table');
    const badgeEl = document.getElementById('badge-visitors-count');
    if (!tableEl) return;

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/admin/logs?type=visitors`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-admin-pin': DEFAULT_PIN
        }
      });

      if (res.ok) {
        const data = await res.json();
        const logs = data.logs || [];
        if (badgeEl) badgeEl.textContent = `${logs.length} Sessions`;

        if (logs.length === 0) {
          tableEl.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-zinc-500 font-mono">No active visitor sessions recorded yet.</td></tr>`;
          return;
        }

        tableEl.innerHTML = logs.map(l => {
          let eventBadge = `<span class="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px]">${l.event}</span>`;
          if (l.event === 'node_claimed') {
            eventBadge = `<span class="px-2 py-0.5 rounded-full bg-neon/15 text-neon font-bold text-[10px] border border-neon/40">🎉 Claimed Node</span>`;
          } else if (l.event === 'ad_verified') {
            eventBadge = `<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px]">✓ Ad Verified</span>`;
          } else if (l.event === 'step_completed') {
            eventBadge = `<span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold text-[10px]">⭐ Step Unlocked</span>`;
          } else if (l.event === 'page_view') {
            eventBadge = `<span class="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px]">👀 Page Visit</span>`;
          }

          const progressText = l.progressSummary || (l.totalAdsVerified ? `${l.totalAdsVerified}/100 Ads` : `Step ${l.step || 1}`);

          return `
            <tr class="hover:bg-surface-200/50 transition-colors">
              <td class="py-3 px-4 font-mono text-[11px] text-zinc-300">${l.slTime || l.timestamp}</td>
              <td class="py-3 px-4 font-mono text-emerald-300 font-bold">${l.ip || '127.0.0.1'}</td>
              <td class="py-3 px-4 text-zinc-300">${l.isp || 'Sri Lanka Telecom'} <span class="text-[10px] text-zinc-500 block">${l.location || ''}</span></td>
              <td class="py-3 px-4 font-mono text-[11px] text-zinc-400">${l.deviceSummary || (l.device + ' - ' + l.browser) || 'Desktop'}</td>
              <td class="py-3 px-4 font-bold text-white font-mono text-[11px]">${progressText}</td>
              <td class="py-3 px-4">${eventBadge}</td>
              <td class="py-3 px-4 text-right text-zinc-300 font-mono text-[11px]">${l.userEmail || 'Anonymous'}</td>
            </tr>
          `;
        }).join('');
      } else {
        tableEl.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-amber-400 text-xs">Could not fetch visitor telemetry (HTTP ${res.status}).</td></tr>`;
      }
    } catch (err) {
      console.warn("loadVisitorLogs notice:", err);
      tableEl.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-zinc-500 text-xs">Visitor telemetry worker endpoint offline or unreachable.</td></tr>`;
    }
  }

  function setupTrafficAutoRefresh() {
    if (trafficRefreshTimer) {
      clearInterval(trafficRefreshTimer);
      trafficRefreshTimer = null;
    }
    const chk = document.getElementById('chk-auto-refresh-traffic');
    trafficRefreshTimer = setInterval(() => {
      const isAuthorized = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authorized';
      const isChecked = chk ? chk.checked : true;
      if (isAuthorized && isChecked && document.visibilityState === 'visible') {
        loadVisitorLogs();
        loadUserActivityLogs();
      }
    }, 10000);
  }

  // --- Data Loader ---
  function loadDashboardData() {
    loadGlobalSettingsFromBackend();
    packages = window.LegionStore.getPackages();
    users = window.LegionStore.getUsers();
    renderStats();
    loadMasterConfig();
    loadFunnelSettings();
    renderPackages();
    renderUsers();
    setupPublicServersEventDelegation();
    loadPublicServers();
    loadModalSettings();
    loadAdminLogins();
    loadVisitorLogs();
    setupTrafficAutoRefresh();
  }

  function renderStats() {
    const totalUsers = users.length;
    const bannedUsers = users.filter(u => window.LegionStore.isUserBanned(u.email)).length;
    const available = packages.filter(p => p.inStock).length;
    const outOfStock = packages.length - available;

    if (statUsers) statUsers.textContent = totalUsers;
    if (statBanned) statBanned.textContent = bannedUsers;
    if (statAvailable) statAvailable.textContent = available;
    if (statOutOfStock) statOutOfStock.textContent = outOfStock;
  }

  // --- Push Packages to MongoDB Atlas via Cloudflare Worker ---
  async function pushPackagesToBackend(pkgs) {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/free/admin/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': DEFAULT_PIN
        },
        body: JSON.stringify({
          pin: DEFAULT_PIN,
          packages: pkgs
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showAdminToast("Package status synced to MongoDB Atlas!", "success");
      }
    } catch (err) {
      console.warn("pushPackagesToBackend error:", err);
    }
  }

  async function loadGlobalSettingsFromBackend() {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/free/global-settings`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const settings = data.settings || data.data;
        if (settings && typeof settings === 'object') {
          if (window.LegionStore && window.LegionStore.applyGlobalSettings) {
            window.LegionStore.applyGlobalSettings(settings);
          }
          packages = window.LegionStore.getPackages();
          renderPackages();
          renderStats();

          // Master Config
          const masterCfg = settings.master_config || settings.raw_config;
          const textarea = document.getElementById('admin-master-vpn-config');
          if (textarea && masterCfg) {
            textarea.value = masterCfg;
            updateMasterProtocolDisplay(masterCfg);
          }

          // Funnel UI
          updateFunnelUI(settings.sg_steps, settings.public_steps);

          // Public Servers
          renderPublicServers();

          // Modal Settings
          if (settings.modal_settings) {
            loadModalSettings();
          }
        }
      }
    } catch (e) {
      console.warn("loadGlobalSettingsFromBackend notice:", e);
    }
  }

  // --- Render Packages ---
  function renderPackages() {
    if (!packagesListEl) return;
    packagesListEl.innerHTML = '';

    packages.forEach(pkg => {
      const card = document.createElement('div');
      card.className = `m3-surface-2 p-5 rounded-3xl border transition-all ${
        pkg.inStock ? 'border-emerald-900/50' : 'border-red-950/60 opacity-80'
      }`;

      card.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            pkg.inStock ? 'bg-neon/10 border border-neon/30 text-neon' : 'bg-red-950/40 border border-red-500/40 text-red-400'
          }">
            ${pkg.inStock ? '● In Stock' : '✕ Out of Stock'}
          </span>
          <span class="text-xs text-zinc-400 font-mono">${pkg.ispPrice || ''}</span>
        </div>

        <h4 class="text-base font-bold text-white mb-1">${pkg.title}</h4>
        <p class="text-xs text-zinc-400 mb-4 line-clamp-2 leading-relaxed">${pkg.desc || ''}</p>

        <!-- Trojan Link Preview -->
        <div class="p-2.5 rounded-xl bg-surface-100 border border-emerald-950/80 mb-4">
          <span class="block text-[10px] text-zinc-500 font-mono uppercase mb-0.5">Trojan Config Link</span>
          <p class="text-[11px] font-mono text-emerald-400 truncate">${pkg.trojanConfig || 'No trojan link set'}</p>
        </div>

        <div class="flex items-center gap-2 pt-2 border-t border-emerald-950/60">
          <button data-id="${pkg.id}" class="js-toggle-stock flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            pkg.inStock 
              ? 'bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/50' 
              : 'bg-neon/20 border border-neon/50 text-neon hover:bg-neon hover:text-black'
          }">
            ${pkg.inStock ? 'Mark Out of Stock' : 'Mark In Stock (Click Here)'}
          </button>
          
          <button data-id="${pkg.id}" class="js-edit-pkg p-2 rounded-xl bg-surface-300 hover:bg-surface-200 border border-zinc-700 text-zinc-300">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </button>
        </div>
      `;

      packagesListEl.appendChild(card);
    });

    // Attach listeners
    document.querySelectorAll('.js-toggle-stock').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        window.LegionStore.togglePackageStock(id);
        packages = window.LegionStore.getPackages();
        renderPackages();
        renderStats();
        await pushPackagesToBackend(packages);
      });
    });

    document.querySelectorAll('.js-edit-pkg').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditModal(id);
      });
    });
  }

  // --- Live User Activity Logs & Ban Controller ---
  let liveUserLogs = [];

  function formatTimeAgoOrDate(dateStr) {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  }

  async function loadUserActivityLogs() {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/admin/logs?type=users`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-admin-pin': DEFAULT_PIN
        }
      });
      if (res.ok) {
        const data = await res.json();
        const usersList = data.logs || data.users || [];
        if (Array.isArray(usersList) && usersList.length > 0) {
          liveUserLogs = usersList;
          renderUsersTable(liveUserLogs);
          return;
        }
      }
    } catch (e) {
      console.warn("loadUserActivityLogs notice:", e);
    }

    // Fallback to local store users if worker has no users yet
    const localUsers = (window.LegionStore && window.LegionStore.getUsers()) || [];
    renderUsersTable(localUsers);
  }

  function renderUsersTable(usersList) {
    const table = document.getElementById('admin-users-table');
    if (!table) return;
    table.innerHTML = '';

    const list = Array.isArray(usersList) ? usersList : [];
    
    // Update stat cards
    const statTotalEl = document.getElementById('stat-total-users') || document.getElementById('stat-users');
    if (statTotalEl) statTotalEl.textContent = list.length;
    
    let bannedCount = 0;
    list.forEach(u => {
      const email = (u.email || '').toLowerCase().trim();
      const isBanned = u.banned || (window.LegionStore && window.LegionStore.isUserBanned(email));
      if (isBanned) bannedCount++;
    });
    const statBannedEl = document.getElementById('stat-banned-users') || document.getElementById('stat-banned');
    if (statBannedEl) statBannedEl.textContent = bannedCount;

    if (list.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="6" class="py-8 text-center text-zinc-500">
            No user sign-ins recorded yet. Users will appear here in real-time when they authenticate with Google.
          </td>
        </tr>
      `;
      return;
    }

    list.forEach(u => {
      const email = (u.email || '').toLowerCase().trim();
      const isBanned = u.banned || (window.LegionStore && window.LegionStore.isUserBanned(email));
      const avatar = u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}&backgroundColor=060a08`;
      const name = u.name || 'Legion Member';
      const firstSignIn = formatTimeAgoOrDate(u.firstSignIn || u.firstLogin || u.createdAt);
      const lastActivity = formatTimeAgoOrDate(u.lastActivity || u.lastLogin || u.timestamp);
      const ip = u.ip || '112.134.xxx.xx';
      const isp = u.isp || (u.country ? `${u.country} (Direct)` : 'Dialog / Mobitel');
      const countryCode = (u.countryCode || 'lk').toLowerCase();

      const tr = document.createElement('tr');
      tr.className = `hover:bg-surface-200/50 transition-colors ${isBanned ? 'bg-red-950/15' : ''}`;
      tr.innerHTML = `
        <td class="py-3.5 px-4 flex items-center gap-2.5">
          <img src="${avatar}" class="w-7 h-7 rounded-full bg-emerald-950 border border-neon/40 flex-shrink-0">
          <div class="min-w-0">
            <span class="font-semibold text-white block truncate text-xs sm:text-sm">${name}</span>
            <span class="font-mono text-[11px] text-zinc-400 block truncate">${email}</span>
          </div>
        </td>
        <td class="py-3.5 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">${firstSignIn}</td>
        <td class="py-3.5 px-4 font-mono text-[11px] text-emerald-300 whitespace-nowrap">${lastActivity}</td>
        <td class="py-3.5 px-4">
          <div class="font-mono text-neon text-[11px]">${ip}</div>
          <div class="text-zinc-400 text-[10px] truncate max-w-[140px] flex items-center gap-1">
            <img src="https://flagcdn.com/w20/${countryCode}.png" class="w-3.5 h-2.5 rounded-xs inline-block">
            <span>${isp}</span>
          </div>
        </td>
        <td class="py-3.5 px-4">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${
            isBanned 
              ? 'bg-red-950 text-red-400 border border-red-500/50' 
              : 'bg-emerald-950/80 text-neon border border-neon/30'
          }">
            ${isBanned ? 'BANNED' : 'ACTIVE'}
          </span>
        </td>
        <td class="py-3.5 px-4 text-right">
          <button type="button" class="js-toggle-ban px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isBanned 
              ? 'bg-surface-300 hover:bg-surface-200 text-zinc-300 border border-zinc-700' 
              : 'bg-red-950 hover:bg-red-900 text-red-400 border border-red-500/50'
          }" data-email="${email}">
            ${isBanned ? 'Unban' : 'Ban User'}
          </button>
        </td>
      `;
      table.appendChild(tr);
    });

    // Ban / Unban click listener
    table.querySelectorAll('.js-toggle-ban').forEach(btn => {
      btn.addEventListener('click', async () => {
        const email = btn.getAttribute('data-email');
        if (!email) return;

        const isCurrentlyBanned = window.LegionStore.isUserBanned(email);
        const newBannedState = !isCurrentlyBanned;

        // Toggle in local store
        window.LegionStore.toggleBanUser(email);

        // Sync with Cloudflare Worker
        try {
          const apiBase = getApiBaseUrl();
          await fetch(`${apiBase}/api/admin/ban-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-pin': DEFAULT_PIN
            },
            body: JSON.stringify({
              pin: DEFAULT_PIN,
              email: email,
              banned: newBannedState
            })
          });
        } catch (e) {}

        showAdminToast(`User ${email} has been ${newBannedState ? 'BANNED' : 'UNBANNED'}!`, newBannedState ? 'error' : 'success');
        loadUserActivityLogs();
      });
    });
  }

  function renderUsers() {
    loadUserActivityLogs();
  }

  // --- Modal Operations ---
  function openEditModal(pkgId = null) {
    if (!pkgModal) return;

    if (pkgId) {
      const pkg = window.LegionStore.getPackageById(pkgId);
      if (pkg) {
        pkgModalTitle.textContent = "Edit Package & Configuration";
        document.getElementById('edit-pkg-id').value = pkg.id;
        document.getElementById('edit-pkg-title').value = pkg.title;
        document.getElementById('edit-pkg-badge').value = pkg.badge || '';
        document.getElementById('edit-pkg-badge-style').value = pkg.badgeType || 'normal';
        document.getElementById('edit-pkg-price').value = pkg.ispPrice || '';
        document.getElementById('edit-pkg-logins').value = pkg.logins || 'Up to 2 Logins';
        document.getElementById('edit-pkg-desc').value = pkg.desc || '';
        
        let configStr = pkg.trojanConfig || '';
        let protocol = 'trojan';
        if (configStr.startsWith('vless://')) protocol = 'vless';
        if (configStr.startsWith('vmess://')) protocol = 'vmess';
        
        document.getElementById('edit-pkg-protocol').value = protocol;
        document.getElementById('edit-pkg-trojan').value = configStr;
        document.getElementById('edit-pkg-stock').checked = pkg.inStock;
        
        updateProtocolGuidance();
      }
    } else {
      pkgModalTitle.textContent = "Add New ISP Package";
      document.getElementById('edit-pkg-id').value = "pkg_" + Date.now();
      document.getElementById('edit-pkg-title').value = "";
      document.getElementById('edit-pkg-badge').value = "Normal Package";
      document.getElementById('edit-pkg-badge-style').value = "normal";
      document.getElementById('edit-pkg-price').value = "";
      document.getElementById('edit-pkg-logins').value = "Up to 2 Logins";
      document.getElementById('edit-pkg-desc').value = "";
      document.getElementById('edit-pkg-protocol').value = "trojan";
      document.getElementById('edit-pkg-trojan').value = "trojan://password@sg01.legionvpn.net:443?security=tls#LEGION-NEW";
      document.getElementById('edit-pkg-stock').checked = true;
      updateProtocolGuidance();
    }

    pkgModal.classList.remove('hidden');
    pkgModal.classList.add('flex');
  }

  function updateProtocolGuidance() {
    const p = document.getElementById('edit-pkg-protocol').value;
    const label = document.getElementById('label-pkg-config');
    const input = document.getElementById('edit-pkg-trojan');
    if (p === 'trojan') {
      label.textContent = "Trojan Connection URL";
      input.placeholder = "trojan://password@host:port?security=tls#NAME";
    } else if (p === 'vless') {
      label.textContent = "VLESS Connection URL";
      input.placeholder = "vless://uuid@host:port?encryption=none&security=tls#NAME";
    } else if (p === 'vmess') {
      label.textContent = "VMess Base64 URL";
      input.placeholder = "vmess://eyJ2IjoiMiIsInBzIjoiTkFNR... (Base64 encoded string)";
    }
  }

  const protocolSelect = document.getElementById('edit-pkg-protocol');
  if (protocolSelect) {
    protocolSelect.addEventListener('change', updateProtocolGuidance);
  }

  function closeEditModal() {
    if (pkgModal) {
      pkgModal.classList.add('hidden');
      pkgModal.classList.remove('flex');
    }
  }

  function handlePackageFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-pkg-id').value;
    const title = document.getElementById('edit-pkg-title').value.trim();
    const badge = document.getElementById('edit-pkg-badge').value.trim();
    const badgeType = document.getElementById('edit-pkg-badge-style').value;
    const ispPrice = document.getElementById('edit-pkg-price').value.trim();
    const logins = document.getElementById('edit-pkg-logins').value.trim();
    const desc = document.getElementById('edit-pkg-desc').value.trim();
    const trojanConfig = document.getElementById('edit-pkg-trojan').value.trim();
    const inStock = document.getElementById('edit-pkg-stock').checked;

    const existingList = window.LegionStore.getPackages();
    const exists = existingList.find(p => p.id === id);

    if (exists) {
      window.LegionStore.updatePackage(id, {
        title, badge, badgeType, ispPrice, logins, desc, trojanConfig, inStock
      });
    } else {
      existingList.push({
        id, title, badge, badgeType, ispPrice, logins, desc, trojanConfig, inStock,
        network: 'General',
        simType: 'Mobile Sim'
      });
      window.LegionStore.savePackages(existingList);
    }

    closeEditModal();
    loadDashboardData();
    pushPackagesToBackend(window.LegionStore.getPackages()).catch(() => {});
  }

  // --- Public Servers Manager ---
  async function loadPublicServers() {
    setupPublicServersEventDelegation();
    renderPublicServers();
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/free/public-servers`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const liveServers = data.servers || data.public_servers;
        if (Array.isArray(liveServers) && liveServers.length > 0) {
          window.LegionStore.savePublicServers(liveServers);
          renderPublicServers();
        }
      }
    } catch (e) {
      console.warn("loadPublicServers notice:", e);
    }
  }

  async function pushPublicServersToBackend(servers) {
    if (!Array.isArray(servers)) return;

    // Explicitly enforce boolean flags for every server: selected mode is true, other two are false
    servers.forEach(srv => {
      const s = (srv.status || '').toString().trim().toLowerCase();
      let isOff = false;
      let isMaint = false;
      let isOn = false;

      if (s === 'online') {
        isOn = true;
      } else if (s === 'offline') {
        isOff = true;
      } else if (s === 'maintenance') {
        isMaint = true;
      } else if (srv.isOffline === true) {
        isOff = true;
      } else if (srv.isMaintenance === true) {
        isMaint = true;
      } else if (srv.isOnline === true) {
        isOn = true;
      } else {
        isOn = true;
      }

      srv.isOnline = isOn;
      srv.isOffline = isOff;
      srv.isMaintenance = isMaint;
      srv.status = isOff ? 'Offline' : (isMaint ? 'Maintenance' : 'Online');
    });

    if (window.LegionStore && window.LegionStore.savePublicServers) {
      window.LegionStore.savePublicServers(servers);
    }
    renderPublicServers();

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/free/admin/public-servers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': DEFAULT_PIN
        },
        body: JSON.stringify({
          pin: DEFAULT_PIN,
          servers: servers
        })
      });

      // Also ensure global-settings doc gets updated
      await fetch(`${apiBase}/api/free/admin/global-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': DEFAULT_PIN
        },
        body: JSON.stringify({
          pin: DEFAULT_PIN,
          public_servers: servers
        })
      }).catch(() => {});

      if (res.ok) {
        showAdminToast("Public servers saved & synced to MongoDB Atlas!", "success");
      }
    } catch (err) {
      console.warn("pushPublicServersToBackend error:", err);
    }
  }

  function renderPublicServers() {
    const table = document.getElementById('admin-public-servers-table');
    if (!table) return;
    
    const servers = window.LegionStore.getPublicServers() || [];
    table.innerHTML = '';
    
    servers.forEach(srv => {
      const s = (srv.status || '').toString().trim().toLowerCase();
      let isOffline = false;
      let isMaintenance = false;
      let isOnline = false;
      if (s === 'online') {
        isOnline = true;
      } else if (s === 'offline') {
        isOffline = true;
      } else if (s === 'maintenance') {
        isMaintenance = true;
      } else if (srv.isOffline === true) {
        isOffline = true;
      } else if (srv.isMaintenance === true) {
        isMaintenance = true;
      } else {
        isOnline = true;
      }

      let badgeClass = 'bg-emerald-950 border border-neon/50 text-neon hover:bg-emerald-900';
      let badgeLabel = 'Online';
      if (isOffline) {
        badgeClass = 'bg-red-950 border border-red-500/50 text-red-400 hover:bg-red-900';
        badgeLabel = 'Offline';
      } else if (isMaintenance) {
        badgeClass = 'bg-amber-950 border border-amber-500/50 text-amber-400 hover:bg-amber-900';
        badgeLabel = 'Maintenance';
      }

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-200/50 transition-colors';
      tr.innerHTML = `
        <td class="py-3.5 px-4 flex items-center gap-2">
          <img src="https://flagcdn.com/w40/${srv.flag}.png" class="w-5 h-3.5 rounded-sm object-cover">
          <span class="font-bold text-white">${srv.country}</span>
        </td>
        <td class="py-3.5 px-4 font-mono text-neon text-[11px]">${srv.ip || '—'}</td>
        <td class="py-3.5 px-4 font-mono text-amber-400">${srv.ping || '—'}</td>
        <td class="py-3.5 px-4 font-mono text-zinc-300 text-[10px]">${srv.sni || '—'}</td>
        <td class="py-3.5 px-4">
          <button type="button" class="js-toggle-srv-status px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${badgeClass}" data-id="${srv.id || srv.country}" title="Click to cycle status: Online -> Offline -> Maintenance">
            ${badgeLabel}
          </button>
        </td>
        <td class="py-3.5 px-4 text-right">
          <button type="button" class="js-edit-srv px-3 py-1.5 rounded-xl bg-surface-300 hover:bg-surface-200 text-zinc-300 border border-zinc-700 text-xs font-bold transition-all cursor-pointer" data-id="${srv.id || srv.country}">
            Edit
          </button>
        </td>
      `;
      table.appendChild(tr);
    });
  }

  function setupPublicServersEventDelegation() {
    const table = document.getElementById('admin-public-servers-table');
    if (!table || table._hasPublicServerDelegation) return;
    table._hasPublicServerDelegation = true;

    table.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('.js-toggle-srv-status');
      if (toggleBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = toggleBtn.getAttribute('data-id');
        const servers = window.LegionStore.getPublicServers() || [];
        const srv = servers.find(s => s.id === id || s.country === id);
        if (srv) {
          const currentNorm = (srv.status || (srv.isOffline ? 'Offline' : (srv.isMaintenance ? 'Maintenance' : 'Online'))).trim().toLowerCase();
          if (currentNorm === 'online') {
            srv.status = 'Offline';
            srv.isOnline = false;
            srv.isOffline = true;
            srv.isMaintenance = false;
          } else if (currentNorm === 'offline') {
            srv.status = 'Maintenance';
            srv.isOnline = false;
            srv.isOffline = false;
            srv.isMaintenance = true;
          } else {
            srv.status = 'Online';
            srv.isOnline = true;
            srv.isOffline = false;
            srv.isMaintenance = false;
          }
          pushPublicServersToBackend(servers);
          showAdminToast(`${srv.country} set to ${srv.status}`, "info");
        }
        return;
      }

      const editBtn = e.target.closest('.js-edit-srv');
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = editBtn.getAttribute('data-id');
        const servers = window.LegionStore.getPublicServers() || [];
        const srv = servers.find(s => s.id === id || s.country === id);
        if (srv) {
          openPublicServerEditModal(srv);
        }
        return;
      }
    });
  }

  function openPublicServerEditModal(srv) {
    const setVal = (elemId, val) => {
      const el = document.getElementById(elemId);
      if (el) el.value = val || '';
    };
    setVal('edit-pub-srv-id', srv.id || srv.country);
    const title = document.getElementById('pub-srv-modal-title');
    if (title) title.textContent = `Edit ${srv.country} Node`;
    setVal('edit-pub-srv-ip', srv.ip);
    setVal('edit-pub-srv-ping', srv.ping);
    setVal('edit-pub-srv-sni', srv.sni || 'm.facebook.com');

    const statusSelect = document.getElementById('edit-pub-srv-status');
    if (statusSelect) {
      if (srv.isOffline || (srv.status || '').toLowerCase() === 'offline') statusSelect.value = 'Offline';
      else if (srv.isMaintenance || (srv.status || '').toLowerCase() === 'maintenance') statusSelect.value = 'Maintenance';
      else statusSelect.value = 'Online';
    }

    setVal('edit-pub-srv-social', (srv.configs && srv.configs.social) ? srv.configs.social : '');
    setVal('edit-pub-srv-tiktok', (srv.configs && srv.configs.tiktok) ? srv.configs.tiktok : '');
    setVal('edit-pub-srv-youtube', (srv.configs && srv.configs.youtube) ? srv.configs.youtube : '');
    setVal('edit-pub-srv-zoom', (srv.configs && srv.configs.zoom) ? srv.configs.zoom : '');

    const modal = document.getElementById('public-server-edit-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.display = 'flex';
    }
  }

  function closePublicServerModal() {
    const modal = document.getElementById('public-server-edit-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.style.display = 'none';
    }
  }

  function handlePublicServerEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-pub-srv-id').value;
    const servers = window.LegionStore.getPublicServers() || [];
    const srv = servers.find(s => s.id === id || s.country === id);
    if (srv) {
      srv.ip = (document.getElementById('edit-pub-srv-ip').value || '').trim();
      srv.ping = (document.getElementById('edit-pub-srv-ping').value || '').trim();

      const sniEl = document.getElementById('edit-pub-srv-sni');
      if (sniEl) srv.sni = (sniEl.value || '').trim();

      const statusEl = document.getElementById('edit-pub-srv-status');
      if (statusEl) {
        const val = (statusEl.value || 'Online').trim();
        srv.status = val;
        srv.isOnline = (val === 'Online');
        srv.isOffline = (val === 'Offline');
        srv.isMaintenance = (val === 'Maintenance');
      }

      if (!srv.configs) srv.configs = {};
      srv.configs.social = (document.getElementById('edit-pub-srv-social').value || '').trim();
      srv.configs.tiktok = (document.getElementById('edit-pub-srv-tiktok').value || '').trim();
      srv.configs.youtube = (document.getElementById('edit-pub-srv-youtube').value || '').trim();
      srv.configs.zoom = (document.getElementById('edit-pub-srv-zoom').value || '').trim();

      pushPublicServersToBackend(servers);
      closePublicServerModal();
      showAdminToast(`Server ${srv.country} updated & synced!`, "success");
    }
  }

  function handleAddCustomServer() {
    const servers = window.LegionStore.getPublicServers();
    const country = prompt("Enter Country Name (e.g., Japan):", "Japan");
    if (!country) return;
    
    const flag = prompt("Enter Country Code for Flag (e.g., jp):", "jp");
    const ip = prompt("Enter Server IP (e.g., 103.45.67.89):", "103.45.67.89");
    const ping = prompt("Enter Expected Ping (e.g., 150ms Ping):", "150ms Ping");
    const sni = prompt("Enter Default SNI (e.g., m.facebook.com):", "m.facebook.com");
    
    if (flag && ip) {
      servers.push({
        id: "pub_custom_" + Date.now(),
        country: country.trim(),
        flag: flag.trim().toLowerCase(),
        ip: ip.trim(),
        ping: ping ? ping.trim() : "200ms Ping",
        sni: sni ? sni.trim() : "m.facebook.com",
        status: "Online"
      });
      pushPublicServersToBackend(servers);
    }
  }

  // --- Modal Settings Manager ---
  async function loadModalSettings() {
    const fields = ['sgHeading', 'sgStatusTag', 'sgProtocolLabel', 'sgValidityNotice', 'sgSupportBanner', 'sgFooter', 'pubAdvisoryBanner', 'pubUpsellPitch', 'pubVipPitch'];
    const ms = window.LegionStore.getModalSettings();
    fields.forEach(f => {
      const el = document.getElementById('ms-' + f);
      if (el) el.value = ms[f] || '';
    });

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/free/modal-settings`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const liveMs = data.modal_settings || data.settings;
        if (liveMs && typeof liveMs === 'object') {
          window.LegionStore.saveModalSettings(liveMs);
          fields.forEach(f => {
            const el = document.getElementById('ms-' + f);
            if (el && liveMs[f] !== undefined) el.value = liveMs[f];
          });
        }
      }
    } catch (e) {
      console.warn("loadModalSettings notice:", e);
    }
  }

  async function handleModalSettingsSubmit(e) {
    e.preventDefault();
    const fields = ['sgHeading', 'sgStatusTag', 'sgProtocolLabel', 'sgValidityNotice', 'sgSupportBanner', 'sgFooter', 'pubAdvisoryBanner', 'pubUpsellPitch', 'pubVipPitch'];
    const ms = {};
    fields.forEach(f => {
      const el = document.getElementById('ms-' + f);
      if (el) ms[f] = el.value.trim();
    });
    window.LegionStore.saveModalSettings(ms);

    const btn = document.getElementById('btn-save-modal-settings') || e.target.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ Saving to MongoDB Atlas...</span>`;
    }

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/free/admin/modal-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': DEFAULT_PIN
        },
        body: JSON.stringify({
          pin: DEFAULT_PIN,
          modal_settings: ms
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (btn) {
          btn.innerHTML = `<span>✓ Saved to MongoDB!</span>`;
          btn.classList.add('bg-emerald-400');
          setTimeout(() => {
            btn.innerHTML = `<span>Save Modal Settings & Push to Clients</span>`;
            btn.classList.remove('bg-emerald-400');
            btn.disabled = false;
          }, 2500);
        }
        showAdminToast("Modal settings saved to MongoDB Atlas & pushed to clients!", "success");
      } else {
        throw new Error(data.message || `HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn("Save modal settings error:", err);
      if (btn) {
        btn.innerHTML = `<span>💾 Saved Locally</span>`;
        btn.disabled = false;
        setTimeout(() => {
          btn.innerHTML = `<span>Save Modal Settings & Push to Clients</span>`;
        }, 2500);
      }
      alert(`⚠️ Saved locally, but MongoDB Atlas update failed:\n${err.message}`);
    }
  }

  // --- Singapore Master VPN Config Management ---
  function detectProtocol(url) {
    const u = (url || '').trim().toLowerCase();
    if (u.startsWith('trojan://')) return 'Trojan';
    if (u.startsWith('vless://')) return 'VLESS';
    if (u.startsWith('vmess://')) return 'VMess';
    return 'VPN';
  }

  function updateMasterProtocolDisplay(val) {
    const badge = document.getElementById('admin-master-protocol-badge');
    const textDesc = document.getElementById('admin-master-detected-text');
    const proto = detectProtocol(val);

    if (badge) {
      badge.textContent = proto;
      if (proto === 'Trojan') {
        badge.className = 'px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40';
      } else if (proto === 'VLESS') {
        badge.className = 'px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-neon/15 text-neon border border-neon/30';
      } else if (proto === 'VMess') {
        badge.className = 'px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/40';
      } else {
        badge.className = 'px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-zinc-500/15 text-zinc-400 border border-zinc-500/40';
      }
    }
    if (textDesc) {
      textDesc.textContent = `Detected Protocol: ${proto}`;
    }
  }

  function getApiBaseUrl() {
    const cfg = window.LEGION_CONFIG || {};
    if (cfg.API_BASE_URL) return cfg.API_BASE_URL.replace(/\/+$/, '');
    if (cfg.API_ENDPOINT) return cfg.API_ENDPOINT.replace(/\/claim\/?$/, '').replace(/\/+$/, '');
    return "https://freevpn.dulangathipul.workers.dev";
  }

  async function loadMasterConfig() {
    const textarea = document.getElementById('admin-master-vpn-config');
    const status = document.getElementById('admin-master-save-status');
    if (!textarea) return;

    // 1. Immediately populate from local cache to prevent empty inputs
    const currentConfig = window.LegionStore.getMasterConfig();
    textarea.value = currentConfig;
    updateMasterProtocolDisplay(currentConfig);

    // 2. Auto-fetch active config from MongoDB Atlas via GET /api/free/config
    if (status) status.textContent = "Syncing with MongoDB Atlas...";
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/free/config`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          textarea.value = data.config.trim();
          updateMasterProtocolDisplay(data.config.trim());
          window.LegionStore.saveMasterConfig(data.config.trim());
          if (status) {
            status.textContent = "✓ Synced live from MongoDB Atlas";
            setTimeout(() => { if (status && status.textContent.includes("Synced")) status.textContent = ""; }, 3000);
          }
        }
      } else {
        if (status) status.textContent = "Using local cache (MongoDB API offline)";
      }
    } catch (e) {
      console.warn("Could not sync with MongoDB Atlas:", e);
      if (status) status.textContent = "Using local cache (Worker unreachable)";
    }
  }

  async function handleSaveMasterConfig() {
    const textarea = document.getElementById('admin-master-vpn-config');
    const btn = document.getElementById('btn-save-master-config');
    const status = document.getElementById('admin-master-save-status');
    if (!textarea) return;

    const val = textarea.value.trim();
    if (!val) {
      alert("Please enter a valid VPN configuration URI string.");
      return;
    }

    const protocol = detectProtocol(val);
    updateMasterProtocolDisplay(val);

    // Save to local cache immediately
    window.LegionStore.saveMasterConfig(val);

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ Saving to MongoDB Atlas...</span>`;
    }
    if (status) status.textContent = "Pushing to MongoDB Atlas (settings.master_config)...";

    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/free/admin/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Pin': DEFAULT_PIN
        },
        body: JSON.stringify({
          pin: DEFAULT_PIN,
          raw_config: val,
          protocol: protocol
        })
      });

      const resJson = await response.json();

      if (response.ok && resJson.success) {
        if (btn) {
          btn.innerHTML = `<span>✓ Saved to MongoDB!</span>`;
          btn.classList.add('bg-emerald-400');
          setTimeout(() => {
            btn.innerHTML = `<span>💾 Save Master Config</span>`;
            btn.classList.remove('bg-emerald-400');
            btn.disabled = false;
          }, 2500);
        }
        if (status) {
          status.textContent = "✓ Saved to MongoDB Atlas (free-legion-vpn.settings.master_config)!";
          setTimeout(() => { status.textContent = ""; }, 4000);
        }
      } else {
        throw new Error(resJson.message || `Server returned ${response.status}`);
      }
    } catch (err) {
      console.error("Save to MongoDB Atlas failed:", err);
      if (btn) {
        btn.innerHTML = `<span>💾 Saved Locally (DB Offline)</span>`;
        btn.disabled = false;
        setTimeout(() => {
          btn.innerHTML = `<span>💾 Save Master Config</span>`;
        }, 3000);
      }
      if (status) {
        status.textContent = `Saved locally (MongoDB note: ${err.message})`;
      }
      alert(`⚠️ Config saved to local cache, but MongoDB Atlas update failed:\n${err.message}\n\nPlease verify that your Cloudflare Worker is deployed with the MongoDB Atlas integration.`);
    }
  }

  // --- Ad Verification Funnel Settings Manager ---
  function updateFunnelUI(sgSteps, publicSteps) {
    const selectSg = document.getElementById('select-sg-steps');
    const selectPublic = document.getElementById('select-public-steps');
    const sgBadge = document.getElementById('sg-steps-mode-badge');
    const publicBadge = document.getElementById('public-steps-mode-badge');
    const sgExplainer = document.getElementById('sg-steps-explainer');
    const publicExplainer = document.getElementById('public-steps-explainer');

    if (selectSg && sgSteps !== undefined) {
      selectSg.value = String(sgSteps);
    }
    if (selectPublic && publicSteps !== undefined) {
      selectPublic.value = String(publicSteps);
    }

    const currentSg = selectSg ? parseInt(selectSg.value, 10) : sgSteps;
    const currentPublic = selectPublic ? parseInt(selectPublic.value, 10) : publicSteps;

    if (sgBadge) {
      if (currentSg === 1) {
        sgBadge.textContent = "⚡ Instant (1 Ad)";
        sgBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono";
      } else {
        sgBadge.textContent = "100 Ads (Standard)";
        sgBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono";
      }
    }
    if (sgExplainer) {
      if (currentSg === 1) {
        sgExplainer.innerHTML = `<span class="text-amber-400 font-semibold">⚡ Instant Bypass Active:</span> Users watch only 1 sponsor ad, hitting 100% instantly to release Singapore Master Node.`;
      } else {
        sgExplainer.textContent = "Current mode: Users must watch 100 sponsor ads across 9 sequential steps (Standard monetization).";
      }
    }

    if (publicBadge) {
      if (currentPublic === 1) {
        publicBadge.textContent = "⚡ Instant (1 Ad)";
        publicBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono";
      } else {
        publicBadge.textContent = "10 Ads (Standard)";
        publicBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono";
      }
    }
    if (publicExplainer) {
      if (currentPublic === 1) {
        publicExplainer.innerHTML = `<span class="text-amber-400 font-semibold">⚡ Instant Bypass Active:</span> Users watch 1 sponsor ad in the modal to immediately copy public server credentials.`;
      } else {
        publicExplainer.textContent = "Current mode: Users must watch 10 sponsor ads to copy server config (Standard verification).";
      }
    }
  }

  async function loadFunnelSettings() {
    // 1. Initial render from local cache
    const cached = (window.LegionStore && window.LegionStore.getFunnelSettings)
      ? window.LegionStore.getFunnelSettings()
      : { sg_steps: 100, public_steps: 10 };
    updateFunnelUI(cached.sg_steps, cached.public_steps);

    // 2. Sync live from Cloudflare Worker & MongoDB Atlas
    const statusEl = document.getElementById('funnel-save-status');
    if (statusEl) statusEl.textContent = "Syncing funnel modes...";
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/free/config`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const sgSteps = (data.sg_steps === 1) ? 1 : 100;
        const publicSteps = (data.public_steps === 1) ? 1 : 10;
        if (window.LegionStore && window.LegionStore.saveFunnelSettings) {
          window.LegionStore.saveFunnelSettings({ sg_steps: sgSteps, public_steps: publicSteps });
        }
        updateFunnelUI(sgSteps, publicSteps);
        if (statusEl) {
          statusEl.textContent = "✓ Synced with MongoDB";
          setTimeout(() => { if (statusEl && statusEl.textContent.includes("Synced")) statusEl.textContent = ""; }, 2500);
        }
      } else {
        if (statusEl) statusEl.textContent = "Using local cache";
      }
    } catch (e) {
      console.warn("loadFunnelSettings notice:", e);
      if (statusEl) statusEl.textContent = "Using local cache";
    }
  }

  async function handleSaveFunnelSettings() {
    const selectSg = document.getElementById('select-sg-steps');
    const selectPublic = document.getElementById('select-public-steps');
    const btn = document.getElementById('btn-save-funnel-settings');
    const statusEl = document.getElementById('funnel-save-status');

    const sgSteps = selectSg ? parseInt(selectSg.value, 10) : 100;
    const publicSteps = selectPublic ? parseInt(selectPublic.value, 10) : 10;

    // Save locally
    if (window.LegionStore && window.LegionStore.saveFunnelSettings) {
      window.LegionStore.saveFunnelSettings({ sg_steps: sgSteps, public_steps: publicSteps });
    }
    updateFunnelUI(sgSteps, publicSteps);

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ Saving to MongoDB Atlas...</span>`;
    }
    if (statusEl) statusEl.textContent = "Updating funnel settings...";

    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/free/admin/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Pin': DEFAULT_PIN
        },
        body: JSON.stringify({
          pin: DEFAULT_PIN,
          sg_steps: sgSteps,
          public_steps: publicSteps
        })
      });

      const resJson = await response.json();
      if (response.ok && resJson.success) {
        if (btn) {
          btn.innerHTML = `<span>✓ Saved to MongoDB!</span>`;
          btn.classList.add('bg-emerald-400');
          setTimeout(() => {
            btn.innerHTML = `<span>💾 Save Funnel Settings</span>`;
            btn.classList.remove('bg-emerald-400');
            btn.disabled = false;
          }, 2500);
        }
        if (statusEl) {
          statusEl.textContent = "✓ Funnel settings saved to MongoDB Atlas!";
          setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 3500);
        }
      } else {
        throw new Error(resJson.message || `HTTP ${response.status}`);
      }
    } catch (err) {
      console.error("Save funnel settings failed:", err);
      if (btn) {
        btn.innerHTML = `<span>💾 Saved Locally</span>`;
        btn.disabled = false;
        setTimeout(() => {
          btn.innerHTML = `<span>💾 Save Funnel Settings</span>`;
        }, 3000);
      }
      if (statusEl) statusEl.textContent = `Saved locally (DB: ${err.message})`;
      alert(`⚠️ Funnel settings saved locally, but MongoDB Atlas update failed:\n${err.message}`);
    }
  }

  // Event Listeners
  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Additional Loaders
    loadGlobalSettingsFromBackend();
    loadPublicServers();
    loadModalSettings();
    renderUsers();
    loadMasterConfig();
    loadFunnelSettings();

    // Master Config Event Listeners
    const masterTextarea = document.getElementById('admin-master-vpn-config');
    if (masterTextarea) {
      masterTextarea.addEventListener('input', (e) => updateMasterProtocolDisplay(e.target.value));
      masterTextarea.addEventListener('change', (e) => updateMasterProtocolDisplay(e.target.value));
    }
    const btnSaveMaster = document.getElementById('btn-save-master-config');
    if (btnSaveMaster) {
      btnSaveMaster.addEventListener('click', handleSaveMasterConfig);
    }

    // Funnel Settings Event Listeners
    const selectSg = document.getElementById('select-sg-steps');
    if (selectSg) {
      selectSg.addEventListener('change', () => {
        updateFunnelUI();
      });
    }
    const selectPublic = document.getElementById('select-public-steps');
    if (selectPublic) {
      selectPublic.addEventListener('change', () => {
        updateFunnelUI();
      });
    }
    const btnSaveFunnel = document.getElementById('btn-save-funnel-settings');
    if (btnSaveFunnel) {
      btnSaveFunnel.addEventListener('click', handleSaveFunnelSettings);
    }
    
    const btnRefAdmin = document.getElementById('btn-refresh-admin-logs');
    if (btnRefAdmin) btnRefAdmin.addEventListener('click', () => {
      loadAdminLogins();
    });

    const btnRefVisitors = document.getElementById('btn-refresh-visitor-logs');
    if (btnRefVisitors) btnRefVisitors.addEventListener('click', () => {
      loadVisitorLogs();
    });

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (closePkgModalBtn) closePkgModalBtn.addEventListener('click', closeEditModal);
    if (btnAddPkg) btnAddPkg.addEventListener('click', () => openEditModal());
    if (pkgForm) pkgForm.addEventListener('submit', handlePackageFormSubmit);
    
    const btnAddPublic = document.getElementById('btn-add-public-server');
    if (btnAddPublic) btnAddPublic.addEventListener('click', handleAddCustomServer);

    const closePubSrvModalBtn = document.getElementById('close-public-srv-modal');
    if (closePubSrvModalBtn) closePubSrvModalBtn.addEventListener('click', closePublicServerModal);
    
    const pubSrvForm = document.getElementById('public-server-edit-form');
    if (pubSrvForm) pubSrvForm.addEventListener('submit', handlePublicServerEditSubmit);

    const msForm = document.getElementById('admin-modal-settings-form');
    if (msForm) msForm.addEventListener('submit', handleModalSettingsSubmit);
  });
})();
