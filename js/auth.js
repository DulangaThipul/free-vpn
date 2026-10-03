/**
 * LEGION Free VPN - Google Authentication Engine
 * Supports Material 3 Google Sign-In with persistent session storage
 * Integrated with Cloudflare Worker Backend Ban Guard & User Activity Logger
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'legion_vpn_user_session';

  function getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const user = data ? JSON.parse(data) : null;
      if (user && window.LegionStore && window.LegionStore.isUserBanned(user.email)) {
        // User is banned! Revoke session
        localStorage.removeItem(STORAGE_KEY);
        showBannedUserModal();
        return null;
      }
      return user;
    } catch (e) {
      return null;
    }
  }

  function setCurrentUser(user) {
    if (user) {
      // Check if banned before saving
      if (window.LegionStore && window.LegionStore.isUserBanned(user.email)) {
        showBannedUserModal();
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      // Log login event in admin store
      if (window.LegionStore && window.LegionStore.recordUserLogin) {
        window.LegionStore.recordUserLogin(user);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    updateAuthUI();
  }

  function updateAuthUI() {
    const user = getCurrentUser();
    const guestNav = document.getElementById('nav-guest-actions');
    const userNav = document.getElementById('nav-user-actions');
    const userNameEl = document.getElementById('nav-user-name');
    const userAvatarEl = document.getElementById('nav-user-avatar');
    const authGateNotice = document.getElementById('auth-gate-notice');
    const funnelContainer = document.getElementById('claim-funnel-card');
    const packagesSection = document.getElementById('packages-selection-section');

    if (user) {
      // User is authenticated
      if (guestNav) guestNav.classList.add('hidden');
      if (userNav) {
        userNav.classList.remove('hidden');
        userNav.classList.add('flex');
      }
      if (userNameEl) userNameEl.textContent = user.name || 'Legion Member';
      if (userAvatarEl) userAvatarEl.src = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
      if (authGateNotice) authGateNotice.classList.add('hidden');
      if (funnelContainer) {
        funnelContainer.classList.remove('opacity-50', 'pointer-events-none');
      }
      if (packagesSection) packagesSection.classList.remove('hidden');
    } else {
      // Guest - Lock claim funnel until Google Sign-in
      if (guestNav) guestNav.classList.remove('hidden');
      if (userNav) {
        userNav.classList.add('hidden');
        userNav.classList.remove('flex');
      }
      if (authGateNotice) authGateNotice.classList.remove('hidden');
      if (funnelContainer) {
        funnelContainer.classList.add('opacity-50', 'pointer-events-none');
      }
      if (packagesSection) packagesSection.classList.remove('hidden');
    }
  }

  function showBannedUserModal() {
    const modal = document.getElementById('banned-user-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      alert("Access Denied: Your account has been suspended by the administrator.");
    }
  }

  function openLoginModal() {
    const modal = document.getElementById('google-login-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  function closeLoginModal() {
    const modal = document.getElementById('google-login-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  async function simulateGoogleSignIn(customEmail, customName) {
    const name = customName || "Google Explorer";
    const email = (customEmail || "user@gmail.com").toLowerCase().trim();

    // 1. Local Store Ban Check
    if (window.LegionStore && window.LegionStore.isUserBanned(email)) {
      closeLoginModal();
      showBannedUserModal();
      return;
    }

    // 2. Cloudflare Worker Ban Cross-Validation (Prevents bypassing via localStorage clear)
    const config = window.LEGION_CONFIG || {};
    if (config.API_ENDPOINT && config.API_ENDPOINT.startsWith('http') && !config.API_ENDPOINT.includes('example')) {
      try {
        const baseWorkerUrl = config.API_ENDPOINT.replace(/\/claim$/, '');
        const banRes = await fetch(`${baseWorkerUrl}/check-ban?email=${encodeURIComponent(email)}`);
        if (banRes.ok) {
          const banData = await banRes.json();
          if (banData && banData.banned) {
            if (window.LegionStore && window.LegionStore.banUser) {
              window.LegionStore.banUser(email, "Worker Fair-Use Policy Enforcement");
            }
            closeLoginModal();
            showBannedUserModal();
            return;
          }
        }
      } catch (err) {
        console.warn("Worker ban cross-check notice:", err.message);
      }
    }

    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}&backgroundColor=060a08`;

    const user = {
      id: "usr_" + Math.random().toString(36).substring(2, 10),
      name: name,
      email: email,
      avatar: avatar,
      loggedInAt: Date.now()
    };

    setCurrentUser(user);
    closeLoginModal();
    
    if (window.LegionApp && window.LegionApp.showToast) {
      window.LegionApp.showToast(`Signed in as ${user.name}! 10-Step claim unlocked.`, "success");
    }

    // Refresh packages view
    if (window.LegionApp && window.LegionApp.renderPackages) {
      window.LegionApp.renderPackages();
    }
  }

  function logout() {
    setCurrentUser(null);
    if (window.LegionApp && window.LegionApp.resetFunnel) {
      window.LegionApp.resetFunnel();
    }
    if (window.LegionApp && window.LegionApp.showToast) {
      window.LegionApp.showToast("Signed out successfully.");
    }
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();

    // Attach listeners
    const googleLoginBtns = document.querySelectorAll('.js-google-login-trigger');
    googleLoginBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openLoginModal();
      });
    });

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }

    const modalCloseBtn = document.getElementById('close-google-modal');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeLoginModal);
    }

    const confirmGoogleBtn = document.getElementById('btn-confirm-google-auth');
    if (confirmGoogleBtn) {
      confirmGoogleBtn.addEventListener('click', () => {
        const emailInput = document.getElementById('google-auth-email');
        const nameInput = document.getElementById('google-auth-name');
        const email = emailInput && emailInput.value ? emailInput.value.trim() : 'legion.user@gmail.com';
        const name = nameInput && nameInput.value ? nameInput.value.trim() : 'Legion Member';
        simulateGoogleSignIn(email, name);
      });
    }
  });

  window.LegionAuth = {
    getUser: getCurrentUser,
    openLoginModal: openLoginModal,
    logout: logout,
    simulateGoogleSignIn: simulateGoogleSignIn
  };
})();
