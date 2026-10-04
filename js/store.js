/**
 * LEGION Free VPN - Data Store (Packages, Trojan Configurations & User Registry)
 * Shared between index.html and admin.html via localStorage
 */

(function () {
  'use strict';

  const PACKAGES_KEY = 'legion_vpn_packages';
  const USERS_KEY = 'legion_vpn_users_registry';
  const BANNED_KEY = 'legion_vpn_banned_users';
  const MASTER_CONFIG_KEY = 'legion_master_vpn_config';

  const DEFAULT_MASTER_CONFIG = 'trojan://y9emfz6sx1orp6ka@dulangafree.legiongraphics.site:119/?security=tls&fp=ios&sni=dulangafree.zoom.us&type=tcp&headerType=none#LEGION-VPN%20Free%20All%20ISP';

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

  const PUBLIC_SERVERS_KEY = 'legion_vpn_public_servers';
  const MODAL_SETTINGS_KEY = 'legion_vpn_modal_settings';

  const DEFAULT_PUBLIC_SERVERS = [
    { id: "pub_fr", country: "France", flag: "fr", ip: "141.94.33.194", ping: "280ms Ping", sni: "m.facebook.com", status: "Online", configs: { social: "vless://141-94-33-194-fr@141.94.33.194:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=141.94.33.194&path=%2F#LEGION-FRANCE-PUBLIC" } },
    { id: "pub_de", country: "Germany", flag: "de", ip: "57.129.121.229", ping: "260ms Ping", sni: "m.facebook.com", status: "Online", configs: { social: "vless://57-129-121-229-de@57.129.121.229:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=57.129.121.229&path=%2F#LEGION-GERMANY-PUBLIC" } },
    { id: "pub_gb", country: "United Kingdom", flag: "gb", ip: "54.36.162.84", ping: "270ms Ping", sni: "m.facebook.com", status: "Online", configs: { social: "vless://54-36-162-84-gb@54.36.162.84:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=54.36.162.84&path=%2F#LEGION-UK-PUBLIC" } },
    { id: "pub_nl", country: "Netherlands", flag: "nl", ip: "51.158.147.186", ping: "255ms Ping", sni: "m.facebook.com", status: "Online", configs: { social: "vless://51-158-147-186-nl@51.158.147.186:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=51.158.147.186&path=%2F#LEGION-NETHERLANDS-PUBLIC" } },
    { id: "pub_it", country: "Italy", flag: "it", ip: "57.131.38.151", ping: "290ms Ping", sni: "m.facebook.com", status: "Online", configs: { social: "vless://57-131-38-151-it@57.131.38.151:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=57.131.38.151&path=%2F#LEGION-ITALY-PUBLIC" } },
    { id: "pub_ca", country: "Canada", flag: "ca", ip: "158.69.208.120", ping: "320ms Ping", sni: "m.facebook.com", status: "Online", configs: { social: "vless://158-69-208-120-ca@158.69.208.120:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=158.69.208.120&path=%2F#LEGION-CANADA-PUBLIC" } },
  ];

  const DEFAULT_MODAL_SETTINGS = {
    sgHeading: "Your Singapore Node Credentials",
    sgStatusTag: "✓ Handshake Completed & Verified",
    sgProtocolLabel: "Trojan / TLS Stealth",
    sgValidityNotice: "Valid: 5 Days (50GB High-Speed Limit)",
    sgSupportBanner: "Need help? Join our Telegram support group for troubleshooting.",
    sgFooter: "Recommended Apps: v2rayNG (Android), Nekobox (PC), Shadowrocket (iOS)",
    pubAdvisoryBanner: "⚠️ High Latency / Speed Advisory: ශ්‍රී ලංකාවේ සිට මෙම රටවලට ඇති භෞතික දුර අධික වීම (Intercontinental Distance) සහ International Routing Hops වැඩිවීම නිසා Latency / Ping අගය 250ms - 380ms දක්වා ඉහළ යයි. මේවා සාමාන්‍ය Web Browsing සඳහා ප්‍රමාණවත් වේ.",
    pubUpsellPitch: "Ads 100 ක් බලා 1Gbps Dedicated Port එකක් ලබාගන්න (Valid: Days 5 | Quota: 50GB).",
    pubVipPitch: "රු. 250 කට >1Gbps Ultra-Speed, Zero Ads, Unlimited Data (Valid: 30 Days / 1 Month)."
  };

  function getPublicServers() {
    try {
      const data = localStorage.getItem(PUBLIC_SERVERS_KEY);
      if (data) {
        let parsed = JSON.parse(data);
        // Force remove Spain and Singapore
        parsed = parsed.filter(s => s.id !== 'pub_es' && s.id !== 'pub_sg');
        return parsed;
      }
    } catch (e) {}
    localStorage.setItem(PUBLIC_SERVERS_KEY, JSON.stringify(DEFAULT_PUBLIC_SERVERS));
    return DEFAULT_PUBLIC_SERVERS;
  }

  function savePublicServers(servers) {
    localStorage.setItem(PUBLIC_SERVERS_KEY, JSON.stringify(servers));
  }

  function getModalSettings() {
    try {
      const data = localStorage.getItem(MODAL_SETTINGS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    localStorage.setItem(MODAL_SETTINGS_KEY, JSON.stringify(DEFAULT_MODAL_SETTINGS));
    return DEFAULT_MODAL_SETTINGS;
  }

  function saveModalSettings(settings) {
    localStorage.setItem(MODAL_SETTINGS_KEY, JSON.stringify(settings));
  }

  // ISP Package SNI & Tag Mapping
  const ISP_SNI_MAP = {
    dialog_social: {
      sni: "m.facebook.com",
      name: "Dialog Social (20 GB)",
      tag: "LEGION-VPN-DIALOG-SOCIAL"
    },
    dialog_tiktok: {
      sni: "www.tiktok.com",
      name: "Dialog TikTok Unlimited",
      tag: "LEGION-VPN-DIALOG-TIKTOK"
    },
    airtel_tiktok: {
      sni: "www.tiktok.com",
      name: "Airtel TikTok Unlimited",
      tag: "LEGION-VPN-AIRTEL-TIKTOK"
    },
    airtel_youtube: {
      sni: "api.youtube.com",
      name: "Airtel YouTube Unlimited",
      tag: "LEGION-VPN-AIRTEL-YOUTUBE"
    },
    airtel_zoom: {
      sni: "zoom.us",
      name: "Airtel Zoom (30 GB)",
      tag: "LEGION-VPN-AIRTEL-ZOOM"
    },
    hutch_zoom: {
      sni: "zoom.us",
      name: "Hutch Zoom (30 GB)",
      tag: "LEGION-VPN-HUTCH-ZOOM"
    }
  };

  function normalizePackageKey(key) {
    if (!key) return "dialog_social";
    let k = key.toString().toLowerCase().trim();
    if (k.startsWith("pkg_")) k = k.slice(4);
    if (k === "airtel_yt") return "airtel_youtube";
    if (k === "airtel_zm") return "airtel_zoom";
    if (k === "hutch_zm") return "hutch_zoom";
    if (k === "dialog_soc") return "dialog_social";
    if (k === "social") return "dialog_social";
    if (k === "tiktok") return "dialog_tiktok";
    if (k === "youtube") return "airtel_youtube";
    if (k === "zoom") return "airtel_zoom";
    return k;
  }

  function injectPackageSni(rawConfigUrl, packageKey) {
    if (!rawConfigUrl) return rawConfigUrl;

    const normKey = normalizePackageKey(packageKey);
    const pkg = ISP_SNI_MAP[normKey];
    if (!pkg) return rawConfigUrl;

    const targetSni = pkg.sni;
    const targetTag = pkg.tag;

    // Handle VMess Base64 JSON
    if (rawConfigUrl.startsWith("vmess://")) {
      try {
        const b64 = rawConfigUrl.substring(8);
        const jsonStr = (typeof atob === "function") ? atob(b64) : "";
        if (jsonStr) {
          const vmessObj = JSON.parse(jsonStr);
          vmessObj.sni = targetSni;
          if (vmessObj.host) vmessObj.host = targetSni;
          vmessObj.ps = targetTag;
          const newB64 = (typeof btoa === "function") ? btoa(JSON.stringify(vmessObj)) : "";
          return "vmess://" + newB64;
        }
      } catch (e) {}
    }

    // Handle Trojan / VLESS
    try {
      let hashIndex = rawConfigUrl.indexOf('#');
      let urlWithoutHash = hashIndex !== -1 ? rawConfigUrl.substring(0, hashIndex) : rawConfigUrl;
      let queryIndex = urlWithoutHash.indexOf('?');

      if (queryIndex !== -1) {
        let basePart = urlWithoutHash.substring(0, queryIndex);
        let queryString = urlWithoutHash.substring(queryIndex + 1);
        let searchParams = new URLSearchParams(queryString);

        searchParams.set('sni', targetSni);
        if (searchParams.has('host')) {
          searchParams.set('host', targetSni);
        }

        return `${basePart}?${searchParams.toString()}#${targetTag}`;
      } else {
        return `${urlWithoutHash}?security=tls&sni=${encodeURIComponent(targetSni)}#${targetTag}`;
      }
    } catch (err) {
      console.warn("injectPackageSni error:", err);
      return rawConfigUrl;
    }
  }

  function getMasterConfig() {
    try {
      const data = localStorage.getItem(MASTER_CONFIG_KEY);
      if (data && data.trim()) {
        const trimmed = data.trim();
        if (trimmed.includes('sample-uuid@sg01.legionvpn.net')) {
          localStorage.setItem(MASTER_CONFIG_KEY, DEFAULT_MASTER_CONFIG);
          return DEFAULT_MASTER_CONFIG;
        }
        return trimmed;
      }
    } catch (e) {}
    try {
      localStorage.setItem(MASTER_CONFIG_KEY, DEFAULT_MASTER_CONFIG);
    } catch (e) {}
    return DEFAULT_MASTER_CONFIG;
  }

  function saveMasterConfig(config) {
    const val = (config || '').trim();
    try {
      localStorage.setItem(MASTER_CONFIG_KEY, val);
    } catch (e) {}
    return val;
  }

  // Global store export
  window.LegionStore = {
    ISP_SNI_MAP: ISP_SNI_MAP,
    normalizePackageKey: normalizePackageKey,
    injectPackageSni: injectPackageSni,
    getMasterConfig: getMasterConfig,
    saveMasterConfig: saveMasterConfig,
    getPackages: getPackages,
    savePackages: savePackages,
    getPackageById: getPackageById,
    togglePackageStock: togglePackageStock,
    updatePackage: updatePackage,
    getUsers: getUsers,
    recordUserLogin: recordUserLogin,
    isUserBanned: isUserBanned,
    toggleBanUser: toggleBanUser,
    getPublicServers: getPublicServers,
    savePublicServers: savePublicServers,
    getModalSettings: getModalSettings,
    saveModalSettings: saveModalSettings
  };
})();

