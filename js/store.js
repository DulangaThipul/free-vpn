/**
 * LEGION Free VPN - Data Store (Packages, Trojan Configurations & User Registry)
 * Shared between index.html and admin.html via localStorage
 */

(function () {
  'use strict';

  const PACKAGES_KEY = 'legion_vpn_packages';
  const USERS_KEY = 'legion_vpn_users_registry';
  const BANNED_KEY = 'legion_vpn_banned_users';

  // Default ISP Packages tailored for Sri Lankan Networks (as per user's design)
  const DEFAULT_PACKAGES = [
    {
      id: "pkg_dialog_social",
      title: "Dialog Social (20 GB)",
      badge: "Normal Package",
      badgeType: "normal", // normal, best, warning
      network: "Dialog",
      simType: "Mobile Sim",
      ispPrice: "Rs. 348 (20 GB)",
      desc: "Dialog 20GB Social work plan high-speed tunnel.",
      logins: "Up to 2 Logins (Unlimited 3 Logins)",
      inStock: true,
      trojanConfig: "trojan://legion-dialog-social-pass@sg01.legionvpn.net:443?security=tls&sni=m.facebook.com&type=tcp#LEGION-Dialog-Social-SG"
    },
    {
      id: "pkg_dialog_tiktok",
      title: "Dialog TikTok Unlimited",
      badge: "Not Recommended",
      badgeType: "warning",
      network: "Dialog",
      simType: "Mobile Sim",
      ispPrice: "Rs. 297/Wk | Rs. 997/Mo",
      desc: "50GB පසු වේගය 2Mbps දක්වා අඩු වේ. 50GB වඩා අවශ්‍ය නම් 1-Week plan එක සතියෙන් සතිය renew කරන්න.",
      logins: "Up to 2 Logins (Unlimited 3 Logins)",
      inStock: true,
      trojanConfig: "trojan://legion-dialog-tiktok-pass@sg01.legionvpn.net:443?security=tls&sni=v16.musical.ly&type=tcp#LEGION-Dialog-TikTok-SG"
    },
    {
      id: "pkg_airtel_tiktok",
      title: "Airtel TikTok Unlimited",
      badge: "Best Choice",
      badgeType: "best",
      network: "Airtel",
      simType: "Mobile Sim",
      ispPrice: "Rs. 297/Wk | Rs. 997/Mo",
      desc: "Fastest speeds and zero restrictions on Airtel network.",
      logins: "Up to 2 Logins (Unlimited 3 Logins)",
      inStock: true,
      trojanConfig: "trojan://legion-airtel-tiktok-pass@sg01.legionvpn.net:443?security=tls&sni=api.tiktokv.com&type=tcp#LEGION-Airtel-TikTok-SG"
    },
    {
      id: "pkg_airtel_yt",
      title: "Airtel YouTube Unlimited",
      badge: "Best Choice",
      badgeType: "best",
      network: "Airtel",
      simType: "Mobile Sim",
      ispPrice: "Rs. 260 (Unlimited)",
      desc: "High stability tunneling for unlimited daily browsing.",
      logins: "Up to 2 Logins (Unlimited 3 Logins)",
      inStock: true,
      trojanConfig: "trojan://legion-airtel-yt-pass@sg01.legionvpn.net:443?security=tls&sni=googlevideo.com&type=tcp#LEGION-Airtel-YouTube-SG"
    },
    {
      id: "pkg_airtel_zoom",
      title: "Airtel Zoom (30 GB)",
      badge: "Normal Package",
      badgeType: "normal",
      network: "Airtel",
      simType: "Mobile Sim",
      ispPrice: "Rs. 215 (Old SIMs only)",
      desc: "Standard speed tunneling for registered older SIMs.",
      logins: "Up to 2 Logins (Unlimited 3 Logins)",
      inStock: false, // Out of stock example
      trojanConfig: "trojan://legion-airtel-zoom-pass@sg01.legionvpn.net:443?security=tls&sni=zoom.us&type=tcp#LEGION-Airtel-Zoom-SG"
    },
    {
      id: "pkg_hutch_zoom",
      title: "Hutch Zoom (30 GB)",
      badge: "Normal Package",
      badgeType: "normal",
      network: "Hutch",
      simType: "Mobile Sim",
      ispPrice: "Rs. 224 (30 GB)",
      desc: "Hutch network bypass for day-to-day internet needs.",
      logins: "Up to 2 Logins (Unlimited 3 Logins)",
      inStock: true,
      trojanConfig: "trojan://legion-hutch-zoom-pass@sg01.legionvpn.net:443?security=tls&sni=zoom.us&type=tcp#LEGION-Hutch-Zoom-SG"
    }
  ];

  // Helper Methods
  function getPackages() {
    try {
      const data = localStorage.getItem(PACKAGES_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(PACKAGES_KEY, JSON.stringify(DEFAULT_PACKAGES));
    return DEFAULT_PACKAGES;
  }

  function savePackages(packages) {
    localStorage.setItem(PACKAGES_KEY, JSON.stringify(packages));
  }

  function getPackageById(id) {
    const list = getPackages();
    return list.find(p => p.id === id) || list[0];
  }

  function togglePackageStock(id) {
    const list = getPackages();
    const pkg = list.find(p => p.id === id);
    if (pkg) {
      pkg.inStock = !pkg.inStock;
      savePackages(list);
    }
    return pkg;
  }

  function updatePackage(id, updatedFields) {
    const list = getPackages();
    const index = list.findIndex(p => p.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedFields };
      savePackages(list);
      return list[index];
    }
    return null;
  }

  // --- Users & Ban Management ---
  function getUsers() {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function recordUserLogin(user) {
    if (!user || !user.email) return;
    const users = getUsers();
    const now = new Date();
    const timeFormatted = now.toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    });

    const existingIndex = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex !== -1) {
      users[existingIndex].name = user.name || users[existingIndex].name;
      users[existingIndex].avatar = user.avatar || users[existingIndex].avatar;
      users[existingIndex].lastLogin = timeFormatted;
      users[existingIndex].lastLoginTimestamp = Date.now();
      users[existingIndex].loginCount = (users[existingIndex].loginCount || 1) + 1;
    } else {
      users.unshift({
        id: user.id || "usr_" + Math.random().toString(36).substring(2, 9),
        name: user.name || "Legion Member",
        email: user.email,
        avatar: user.avatar,
        firstLogin: timeFormatted,
        lastLogin: timeFormatted,
        lastLoginTimestamp: Date.now(),
        loginCount: 1,
        banned: false
      });
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getBannedUsers() {
    try {
      const data = localStorage.getItem(BANNED_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function isUserBanned(email) {
    if (!email) return false;
    const banned = getBannedUsers();
    return banned.includes(email.toLowerCase().trim());
  }

  function toggleBanUser(email) {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    let banned = getBannedUsers();
    const users = getUsers();

    const isCurrentlyBanned = banned.includes(cleanEmail);
    if (isCurrentlyBanned) {
      banned = banned.filter(e => e !== cleanEmail);
    } else {
      banned.push(cleanEmail);
    }
    localStorage.setItem(BANNED_KEY, JSON.stringify(banned));

    // Update in user list too
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (user) {
      user.banned = !isCurrentlyBanned;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    return !isCurrentlyBanned;
  }

  // Global store export
  window.LegionStore = {
    getPackages: getPackages,
    savePackages: savePackages,
    getPackageById: getPackageById,
    togglePackageStock: togglePackageStock,
    updatePackage: updatePackage,
    getUsers: getUsers,
    recordUserLogin: recordUserLogin,
    isUserBanned: isUserBanned,
    toggleBanUser: toggleBanUser
  };
})();
