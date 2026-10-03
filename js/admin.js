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

  function handleLogin(e) {
    e.preventDefault();
    const pin = passInput.value.trim();
    if (pin === DEFAULT_PIN) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'authorized');
      passInput.value = '';
      checkAuth();
    } else {
      alert("Invalid Security PIN! Default PIN is: 80664227");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    checkAuth();
  }

  // --- Data Loader ---
  function loadDashboardData() {
    packages = window.LegionStore.getPackages();
    users = window.LegionStore.getUsers();
    renderStats();
    renderPackages();
    renderUsers();
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
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.LegionStore.togglePackageStock(id);
        loadDashboardData();
      });
    });

    document.querySelectorAll('.js-edit-pkg').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditModal(id);
      });
    });
  }

  // --- Render Users Table ---
  function renderUsers() {
    if (!usersTableEl) return;
    usersTableEl.innerHTML = '';

    if (users.length === 0) {
      usersTableEl.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-zinc-500">
            No user logins recorded yet. Users will appear here automatically when they sign in with Google on the main site.
          </td>
        </tr>
      `;
      return;
    }

    users.forEach(u => {
      const isBanned = window.LegionStore.isUserBanned(u.email);
      const tr = document.createElement('tr');
      tr.className = `hover:bg-surface-200/50 transition-colors ${isBanned ? 'bg-red-950/10' : ''}`;

      tr.innerHTML = `
        <td class="py-3.5 px-4 flex items-center gap-2.5">
          <img src="${u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}" class="w-7 h-7 rounded-full bg-emerald-950 border border-neon/40">
          <span class="font-semibold text-white">${u.name || 'Anonymous'}</span>
        </td>
        <td class="py-3.5 px-4 font-mono text-zinc-300">${u.email}</td>
        <td class="py-3.5 px-4 text-zinc-400">${u.firstLogin || 'Recent'}</td>
        <td class="py-3.5 px-4 text-zinc-400 font-mono">${u.lastLogin || 'Recent'}</td>
        <td class="py-3.5 px-4 font-mono text-zinc-300">${u.loginCount || 1}</td>
        <td class="py-3.5 px-4">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isBanned 
              ? 'bg-red-950 border border-red-500/50 text-red-400' 
              : 'bg-emerald-950 border border-neon/50 text-neon'
          }">
            ${isBanned ? 'BANNED' : 'ACTIVE'}
          </span>
        </td>
        <td class="py-3.5 px-4 text-right">
          <button data-email="${u.email}" class="js-toggle-ban px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isBanned 
              ? 'bg-emerald-900/40 hover:bg-emerald-800 text-neon border border-neon/40' 
              : 'bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/40'
          }">
            ${isBanned ? 'Unban User' : 'Ban User'}
          </button>
        </td>
      `;

      usersTableEl.appendChild(tr);
    });

    document.querySelectorAll('.js-toggle-ban').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-email');
        const isBannedNow = window.LegionStore.toggleBanUser(email);
        alert(`User ${email} has been ${isBannedNow ? 'BANNED' : 'UNBANNED'}!`);
        loadDashboardData();
      });
    });
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
  }

  // --- Public Servers Manager ---
  function renderPublicServers() {
    const table = document.getElementById('admin-public-servers-table');
    if (!table) return;
    
    const servers = window.LegionStore.getPublicServers();
    table.innerHTML = '';
    
    servers.forEach(srv => {
      const isOnline = srv.status === 'Online';
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-200/50 transition-colors';
      tr.innerHTML = `
        <td class="py-3.5 px-4 flex items-center gap-2">
          <img src="https://flagcdn.com/w40/${srv.flag}.png" class="w-5 h-3.5 rounded-sm object-cover">
          <span class="font-bold text-white">${srv.country}</span>
        </td>
        <td class="py-3.5 px-4 font-mono text-neon text-[11px]">${srv.ip}</td>
        <td class="py-3.5 px-4 font-mono text-amber-400">${srv.ping}</td>
        <td class="py-3.5 px-4 font-mono text-zinc-300 text-[10px]">${srv.sni}</td>
        <td class="py-3.5 px-4">
          <button class="js-toggle-srv-status px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isOnline 
              ? 'bg-emerald-950 border border-neon/50 text-neon hover:bg-emerald-900' 
              : 'bg-red-950 border border-red-500/50 text-red-400 hover:bg-red-900'
          }" data-id="${srv.id}">
            ${srv.status}
          </button>
        </td>
        <td class="py-3.5 px-4 text-right">
          <button class="js-edit-srv px-3 py-1.5 rounded-xl bg-surface-300 hover:bg-surface-200 text-zinc-300 border border-zinc-700 text-xs font-bold transition-all" data-id="${srv.id}">
            Edit
          </button>
        </td>
      `;
      table.appendChild(tr);
    });

    document.querySelectorAll('.js-toggle-srv-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const srv = servers.find(s => s.id === id);
        if (srv) {
          srv.status = srv.status === 'Online' ? 'Maintenance' : 'Online';
          window.LegionStore.savePublicServers(servers);
          renderPublicServers();
        }
      });
    });

    document.querySelectorAll('.js-edit-srv').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const srv = servers.find(s => s.id === id);
        if (srv) {
          document.getElementById('edit-pub-srv-id').value = srv.id;
          document.getElementById('pub-srv-modal-title').textContent = `Edit ${srv.country} Node`;
          document.getElementById('edit-pub-srv-ip').value = srv.ip || '';
          document.getElementById('edit-pub-srv-ping').value = srv.ping || '';
          
          document.getElementById('edit-pub-srv-social').value = (srv.configs && srv.configs.social) ? srv.configs.social : '';
          document.getElementById('edit-pub-srv-tiktok').value = (srv.configs && srv.configs.tiktok) ? srv.configs.tiktok : '';
          document.getElementById('edit-pub-srv-youtube').value = (srv.configs && srv.configs.youtube) ? srv.configs.youtube : '';
          document.getElementById('edit-pub-srv-zoom').value = (srv.configs && srv.configs.zoom) ? srv.configs.zoom : '';
          
          const modal = document.getElementById('public-server-edit-modal');
          modal.classList.remove('hidden');
          modal.classList.add('flex');
        }
      });
    });
  }

  function closePublicServerModal() {
    const modal = document.getElementById('public-server-edit-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  function handlePublicServerEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-pub-srv-id').value;
    const servers = window.LegionStore.getPublicServers();
    const srv = servers.find(s => s.id === id);
    if (srv) {
      srv.ip = document.getElementById('edit-pub-srv-ip').value.trim();
      srv.ping = document.getElementById('edit-pub-srv-ping').value.trim();
      
      if (!srv.configs) srv.configs = {};
      srv.configs.social = document.getElementById('edit-pub-srv-social').value.trim();
      srv.configs.tiktok = document.getElementById('edit-pub-srv-tiktok').value.trim();
      srv.configs.youtube = document.getElementById('edit-pub-srv-youtube').value.trim();
      srv.configs.zoom = document.getElementById('edit-pub-srv-zoom').value.trim();
      
      window.LegionStore.savePublicServers(servers);
      renderPublicServers();
      closePublicServerModal();
      showAdminToast("Public Server Config Saved!", "success");
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
      window.LegionStore.savePublicServers(servers);
      renderPublicServers();
    }
  }

  // --- Modal Settings Manager ---
  function loadModalSettings() {
    const ms = window.LegionStore.getModalSettings();
    const fields = ['sgHeading', 'sgStatusTag', 'sgProtocolLabel', 'sgValidityNotice', 'sgSupportBanner', 'sgFooter', 'pubAdvisoryBanner', 'pubUpsellPitch', 'pubVipPitch'];
    fields.forEach(f => {
      const el = document.getElementById('ms-' + f);
      if (el) el.value = ms[f];
    });
  }

  function handleModalSettingsSubmit(e) {
    e.preventDefault();
    const fields = ['sgHeading', 'sgStatusTag', 'sgProtocolLabel', 'sgValidityNotice', 'sgSupportBanner', 'sgFooter', 'pubAdvisoryBanner', 'pubUpsellPitch', 'pubVipPitch'];
    const ms = {};
    fields.forEach(f => {
      const el = document.getElementById('ms-' + f);
      if (el) ms[f] = el.value.trim();
    });
    window.LegionStore.saveModalSettings(ms);
    alert("Modal settings successfully saved and pushed to clients!");
  }

  // --- Users Manager ---
  function renderUsers() {
    const table = document.getElementById('admin-users-table');
    if (!table) return;
    table.innerHTML = '';
    
    const users = window.LegionStore.getUsers() || [];
    document.getElementById('stat-total-users').textContent = users.length;
    
    let bannedCount = 0;

    users.forEach(u => {
      const isBanned = window.LegionStore.isUserBanned(u.email);
      if (isBanned) bannedCount++;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
          <img src="${u.avatar}" class="w-6 h-6 rounded-full bg-surface-300">
          ${u.name}
        </td>
        <td class="py-3.5 px-4 text-zinc-400">${u.email}</td>
        <td class="py-3.5 px-4 text-zinc-500">${u.createdAt || u.lastLogin || 'Unknown'}</td>
        <td class="py-3.5 px-4 text-zinc-400">${u.lastLogin || 'Unknown'}</td>
        <td class="py-3.5 px-4"><span class="px-2 py-0.5 rounded-md bg-surface-300 text-white font-mono">${u.loginCount || 1}</span></td>
        <td class="py-3.5 px-4">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${isBanned ? 'bg-red-950 text-red-400 border border-red-500/50' : 'bg-neon/10 text-neon border border-neon/30'}">
            ${isBanned ? 'BANNED' : 'ACTIVE'}
          </span>
        </td>
        <td class="py-3.5 px-4 text-right">
          <button class="js-toggle-ban px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isBanned 
              ? 'bg-surface-300 hover:bg-surface-200 text-zinc-300 border border-zinc-700' 
              : 'bg-red-950 hover:bg-red-900 text-red-400 border border-red-500/50'
          }" data-email="${u.email}">
            ${isBanned ? 'Unban' : 'Ban User'}
          </button>
        </td>
      `;
      table.appendChild(tr);
    });

    document.getElementById('stat-banned-users').textContent = bannedCount;

    document.querySelectorAll('.js-toggle-ban').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-email');
        if (email) {
          window.LegionStore.toggleBanUser(email);
          renderUsers();
        }
      });
    });
  }

  // Event Listeners
  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Additional Loaders
    renderPublicServers();
    loadModalSettings();
    renderUsers();

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
