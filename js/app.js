/**
 * LEGION Free VPN - Core Application Logic
 * Refactored for EXTREME 100-AD MONETIZATION ENGINE, 9-STEP FUNNEL, ANTI-TAB-SKIPPING, and MOBILE BACK-BUTTON NAVIGATION TRAP.
 * 
 * Implements:
 * - Anti-Tab-Skipping & Active Ad View Dwell Time Enforcement (window 'focus' & 'visibilitychange' validation < 3s rejection)
 * - Strict 3-Second Button Click Rate-Limit & Cooldown
 * - Mobile Browser Back-Button History Trap (history.pushState keeps user on portal & triggers fallback smartlink)
 * - 9-Step 100-Ad Extreme Funnel (Steps 1-4, 6-8: 10 ads each; Steps 5 & 9 Boss Milestones: 15 ads each = 100 ads total)
 * - Real-Time Dynamic In-Button Click Counters ("Click to Verify Ad (X/Y)")
 * - Synchronous Adsterra/Monetag Smartlink Openers on click (Zero Popup Blocker Interception)
 * - Step 9 Mock Cloudflare Turnstile Challenge Modal with Interstitial Verification
 * - Real Cloudflare Worker API Connection (Strict 9-Step Handshake, Rate Limiting & Ban Defense)
 * - Dynamic ISP Trojan Node Provisioning (Dialog Social, TikTok, Airtel YouTube, Zoom, etc.)
 * - Pure Trojan & VLESS Protocol Delivery (WireGuard Excluded)
 * - Lenis Smooth Scrolling Integration & Mobile Haptics
 */

(function () {
  'use strict';

  // --- DEVICE INTELLIGENCE & AD NAVIGATION CONTROLLER ---
  const _origWindowOpen = window._legionOrigWindowOpen || window.open;

  /**
   * Device Detection Engine
   * Exactly matches user specification:
   * const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
   */
  function isMobileOrTabletDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
  }

  /**
   * Explicit Device-Aware Ad Dispatcher
   * 1. DESKTOP / PC BEHAVIOR (!isMobileOrTablet):
   *    - Directly and synchronously executes native window.open(adUrl, '_blank')
   *    - NO setTimeout, NO async promise callbacks, NO synthetic anchor click wrappers
   *    - Calling native window.open directly on click retains user activation so popup blockers don't block it
   *    - Focus remains on the original tab, but ad launches in a brand-new browser tab cleanly
   *    - Step count / state updates smoothly without reloading or freezing
   * 2. MOBILE / TABLET BEHAVIOR (isMobileOrTablet):
   *    - Saves current verification step in localStorage immediately
   *    - Dispatches ad via clean isolated tab without allowing location hijack
   *    - Recovers state seamlessly on tab switch / visibilitychange
   */
  function dispatchAdLink(adUrl) {
    if (!adUrl || adUrl === '#' || adUrl.startsWith('javascript:')) return null;

    const isMobileOrTablet = isMobileOrTabletDevice();

    if (!isMobileOrTablet) {
      // 2. DESKTOP / PC: Direct, synchronous native window.open with '_blank' and NO feature strings
      try {
        const win = (_origWindowOpen || window.open).call(window, adUrl, '_blank');
        if (win) {
          try { win.opener = null; } catch (e) {}
          return win;
        }
      } catch (e) {
        console.warn("[PC Ad Dispatcher] Direct window.open notice:", e);
      }
      return null;
    }

    // 3. MOBILE / TABLET:
    // a. Save progress immediately
    if (typeof saveVerificationProgress === 'function') {
      saveVerificationProgress();
    }

    // b. Dispatch ad via clean isolated tab
    try {
      const win = (_origWindowOpen || window.open).call(window, adUrl, '_blank');
      if (win) {
        try { win.opener = null; } catch (e) {}
        return win;
      }
    } catch (e) {}

    // Fallback for strict mobile WebKit
    try {
      const a = document.createElement('a');
      a.href = adUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.position = 'fixed';
      a.style.left = '-9999px';
      a.style.top = '-9999px';
      a.style.width = '1px';
      a.style.height = '1px';
      a.style.opacity = '0.01';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 150);
    } catch (err) {
      console.warn("[Mobile Ad Dispatcher] Fallback notice:", err);
    }
    return null;
  }

  // Ensure window.LegionDevice exists with updated dispatcher
  if (!window.LegionDevice) {
    window.LegionDevice = {
      isMobileOrTablet: isMobileOrTabletDevice,
      isPC: () => !isMobileOrTabletDevice(),
      isDesktop: () => !isMobileOrTabletDevice(),
      openAd: dispatchAdLink,
      openAdInNewTabPC: dispatchAdLink,
      dispatchAd: dispatchAdLink
    };
  }

  // Prevent rogue external navigation via window.location.assign and replace
  try {
    const _origAssign = window.location.assign;
    window.location.assign = function (url) {
      if (!url) return;
      try {
        const strUrl = String(url).trim();
        if (/^(https?:|\/\/)/i.test(strUrl)) {
          const URLCtor = window.URL || URL;
          const u = new URLCtor(strUrl, window.location.href);
          if (u.origin !== window.location.origin) {
            console.warn("[ANTI-HIJACK SHIELD] Blocked rogue location.assign to:", strUrl);
            return;
          }
        }
      } catch (e) {
        console.warn("[ANTI-HIJACK SHIELD] Blocked suspicious location.assign:", url);
        return;
      }
      if (typeof _origAssign === 'function') _origAssign.call(window.location, url);
    };
  } catch (e) {}

  try {
    const _origReplace = window.location.replace;
    window.location.replace = function (url) {
      if (!url) return;
      try {
        const strUrl = String(url).trim();
        if (/^(https?:|\/\/)/i.test(strUrl)) {
          const URLCtor = window.URL || URL;
          const u = new URLCtor(strUrl, window.location.href);
          if (u.origin !== window.location.origin) {
            console.warn("[ANTI-HIJACK SHIELD] Blocked rogue location.replace to:", strUrl);
            return;
          }
        }
      } catch (e) {
        console.warn("[ANTI-HIJACK SHIELD] Blocked suspicious location.replace:", url);
        return;
      }
      if (typeof _origReplace === 'function') _origReplace.call(window.location, url);
    };
  } catch (e) {}

  // Enforce target="_blank" and rel="noopener noreferrer" on external anchor clicks & block synthetic clicks
  document.addEventListener('click', (e) => {
    let el = e.target;
    while (el && el !== document.body) {
      if (el.tagName === 'A' && el.href) {
        try {
          const parsed = new URL(el.href, window.location.href);
          if (parsed.origin !== window.location.origin && !el.href.startsWith('javascript:')) {
            if (!e.isTrusted) {
              console.warn("[ANTI-HIJACK SHIELD] Blocked untrusted synthetic click on external link:", el.href);
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
            el.target = '_blank';
            el.rel = 'noopener noreferrer';
          }
        } catch (err) {}
        break;
      }
      el = el.parentElement;
    }
  }, true);


  // Step Quotas configuration (Grand Total: exactly 100 Ad Interactions in Standard Mode)
  const DEFAULT_STEP_QUOTAS = {
    1: 10,
    2: 10,
    3: 10,
    4: 10,
    5: 15, // Mid-Boss Milestone
    6: 10,
    7: 10,
    8: 10,
    9: 15  // Final Boss Milestone
  };
  // Default Hardcoded ISP Packages (Immediate Zero-Latency Fallback)
  const DEFAULT_PACKAGES = [
    {
      id: "pkg_dialog_social",
      title: "Dialog Social (20 GB)",
      badge: "Normal Package",
      badgeType: "normal",
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
      inStock: true,
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

  // Default Hardcoded Public Servers (Immediate Zero-Latency Fallback)
  const DEFAULT_PUBLIC_SERVERS = [
    { id: "pub_fr", country: "France", flag: "fr", ip: "141.94.33.194", ping: "280ms Ping", sni: "m.facebook.com", status: "Maintenance", isOnline: false, isOffline: false, isMaintenance: true, configs: { social: "vless://141-94-33-194-fr@141.94.33.194:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=141.94.33.194&path=%2F#LEGION-FRANCE-PUBLIC" } },
    { id: "pub_de", country: "Germany", flag: "de", ip: "57.129.121.229", ping: "260ms Ping", sni: "m.facebook.com", status: "Offline", isOnline: false, isOffline: true, isMaintenance: false, configs: { social: "vless://57-129-121-229-de@57.129.121.229:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=57.129.121.229&path=%2F#LEGION-GERMANY-PUBLIC" } },
    { id: "pub_gb", country: "United Kingdom", flag: "gb", ip: "54.36.162.84", ping: "270ms Ping", sni: "m.facebook.com", status: "Online", isOnline: true, isOffline: false, isMaintenance: false, configs: { social: "vless://54-36-162-84-gb@54.36.162.84:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=54.36.162.84&path=%2F#LEGION-UK-PUBLIC" } },
    { id: "pub_nl", country: "Netherlands", flag: "nl", ip: "51.158.147.186", ping: "255ms Ping", sni: "m.facebook.com", status: "Maintenance", isOnline: false, isOffline: false, isMaintenance: true, configs: { social: "vless://51-158-147-186-nl@51.158.147.186:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=51.158.147.186&path=%2F#LEGION-NETHERLANDS-PUBLIC" } },
    { id: "pub_it", country: "Italy", flag: "it", ip: "57.131.38.151", ping: "290ms Ping", sni: "m.facebook.com", status: "Maintenance", isOnline: false, isOffline: false, isMaintenance: true, configs: { social: "vless://57-131-38-151-it@57.131.38.151:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=57.131.38.151&path=%2F#LEGION-ITALY-PUBLIC" } },
    { id: "pub_ca", country: "Canada", flag: "ca", ip: "158.69.208.120", ping: "320ms Ping", sni: "m.facebook.com", status: "Maintenance", isOnline: false, isOffline: false, isMaintenance: true, configs: { social: "vless://158-69-208-120-ca@158.69.208.120:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=158.69.208.120&path=%2F#LEGION-CANADA-PUBLIC" } }
  ];

  /**
   * Bulletproof Package Data Normalization
   * Converts any raw input (null, undefined, object key-value map, or array) into a valid array of packages.
   */
  function getNormalizedPackages(pkgData) {
    if (!pkgData) return DEFAULT_PACKAGES;
    let list = [];
    if (Array.isArray(pkgData)) {
      list = pkgData;
    } else if (typeof pkgData === 'object') {
      // Handles key-value object e.g. { dialog_social: {...}, airtel_tiktok: {...} }
      list = DEFAULT_PACKAGES.map(basePkg => {
        let k = (basePkg.id || '').replace(/^pkg_/, '');
        if (k === 'airtel_yt') k = 'airtel_youtube';
        const override = pkgData[k] || pkgData[basePkg.id] || pkgData[basePkg.id.replace(/^pkg_/, '')];
        if (override) {
          return {
            ...basePkg,
            inStock: override.inStock !== undefined ? !!override.inStock : basePkg.inStock,
            ispPrice: override.price || override.ispPrice || basePkg.ispPrice
          };
        }
        return basePkg;
      });
      // Also include any extra keys present in pkgData
      Object.keys(pkgData).forEach(key => {
        const item = pkgData[key];
        const normKey = key.replace(/^pkg_/, '');
        const exists = list.some(p => p.id === 'pkg_' + normKey || p.id === key);
        if (!exists && item && typeof item === 'object') {
          list.push({
            id: key.startsWith('pkg_') ? key : ('pkg_' + key),
            title: item.title || (key.toUpperCase() + ' Bypass'),
            badge: item.badge || 'Custom Package',
            badgeType: item.badgeType || 'normal',
            network: item.network || 'Universal',
            simType: item.simType || 'Mobile Sim',
            ispPrice: item.price || item.ispPrice || 'Standard',
            desc: item.desc || 'High-speed encrypted bypass tunnel.',
            logins: item.logins || 'Up to 2 Logins',
            inStock: item.inStock !== undefined ? !!item.inStock : true,
            trojanConfig: item.trojanConfig || ''
          });
        }
      });
    } else {
      list = DEFAULT_PACKAGES;
    }

    if (!Array.isArray(list) || list.length === 0) {
      list = DEFAULT_PACKAGES;
    }

    return list.map((pkg, idx) => {
      const fallback = DEFAULT_PACKAGES[idx] || DEFAULT_PACKAGES[0];
      return {
        id: pkg.id || fallback.id,
        title: pkg.title || fallback.title,
        badge: pkg.badge || fallback.badge,
        badgeType: pkg.badgeType || fallback.badgeType,
        network: pkg.network || fallback.network,
        simType: pkg.simType || fallback.simType,
        ispPrice: pkg.ispPrice || pkg.price || fallback.ispPrice,
        desc: pkg.desc || fallback.desc,
        logins: pkg.logins || fallback.logins,
        inStock: pkg.inStock !== undefined ? !!pkg.inStock : true,
        trojanConfig: pkg.trojanConfig || fallback.trojanConfig
      };
    });
  }

  /**
   * Bulletproof Public Servers Normalization
   * Converts any raw input (null, undefined, object key-value map, or array) into a valid array of servers.
   */
  function getNormalizedPublicServers(srvData) {
    let list = [];
    if (Array.isArray(srvData) && srvData.length > 0) {
      list = srvData;
    } else if (srvData && typeof srvData === 'object' && !Array.isArray(srvData)) {
      list = Object.values(srvData);
    }
    if (!Array.isArray(list) || list.length === 0) {
      list = DEFAULT_PUBLIC_SERVERS;
    }

    list = list.filter(s => s && s.id !== 'pub_es' && s.id !== 'pub_sg');
    if (list.length === 0) list = DEFAULT_PUBLIC_SERVERS;

    return list.map((srv, idx) => {
      const fallback = DEFAULT_PUBLIC_SERVERS[idx] || DEFAULT_PUBLIC_SERVERS[0];
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

      return {
        id: srv.id || fallback.id,
        country: srv.country || fallback.country,
        flag: srv.flag || fallback.flag,
        ip: srv.ip || fallback.ip,
        ping: srv.ping || fallback.ping,
        sni: srv.sni || fallback.sni,
        status: isOff ? 'Offline' : (isMaint ? 'Maintenance' : 'Online'),
        isOnline: isOn,
        isOffline: isOff,
        isMaintenance: isMaint,
        configs: srv.configs || fallback.configs
      };
    });
  }

  let STEP_QUOTAS = { ...DEFAULT_STEP_QUOTAS };
  let TOTAL_ADS_REQUIRED = 100;

  // Application State
  const state = {
    currentStep: 1,
    stepsCompleted: 0,
    sgSteps: 100,
    publicSteps: 10,
    isCooldown: false,
    cooldownInterval: null,
    vpnConfig: null,
    currentPing: 45,
    selectedPackage: null,
    turnstileCompleted: false,
    // Active Ad Tracking for Anti-Tab-Skipping & Dwell Time Enforcement
    pendingAd: null, // { stepNumber, adOpenedAt, failed: false }
    // Real-time click counter for each of the 9 steps
    stepClicks: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0
    }
  };

  // Popunder Tracking State
  let popunderClickCount = 0;
  let lastPopunderResetTime = Date.now();

  // DOM Elements cache
  let dom = {};


  // --- BULLETPROOF PROGRESS PERSISTENCE & TELEMETRY PIPELINE ---
  const PROGRESS_STORAGE_KEY = 'legion_verification_progress';

  function saveVerificationProgress() {
    try {
      const user = window.LegionAuth ? window.LegionAuth.getUser() : null;
      const dataToSave = {
        currentStep: state.currentStep,
        stepsCompleted: state.stepsCompleted,
        stepClicks: state.stepClicks,
        selectedPackage: state.selectedPackage,
        userEmail: user ? user.email : (state.userEmail || null),
        vpnConfig: state.vpnConfig,
        turnstileCompleted: state.turnstileCompleted,
        claimedSession: state.claimedSession || null,
        timestamp: Date.now()
      };
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.warn("Could not save verification progress to localStorage:", err);
    }
  }

  function restoreVerificationProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data) return false;

      // Restore package if stored
      if (data.selectedPackage && (!state.selectedPackage || !state.selectedPackage.id)) {
        state.selectedPackage = data.selectedPackage;
        const titleEl = document.getElementById('claim-pkg-title');
        const descEl = document.getElementById('claim-pkg-desc');
        const priceEl = document.getElementById('claim-pkg-price');
        const simEl = document.getElementById('claim-pkg-sim');
        if (titleEl) titleEl.textContent = state.selectedPackage.title;
        if (descEl) descEl.textContent = state.selectedPackage.desc || 'High-speed Trojan protocol configuration.';
        if (priceEl) priceEl.textContent = state.selectedPackage.ispPrice || 'Free VPS Slot';
        if (simEl) simEl.textContent = '📶 ' + (state.selectedPackage.simType || 'Mobile Sim');
      }

      // Restore step clicks
      if (data.stepClicks && typeof data.stepClicks === 'object') {
        state.stepClicks = { ...state.stepClicks, ...data.stepClicks };
      }

      // Restore completed steps
      if (typeof data.stepsCompleted === 'number' && data.stepsCompleted > 0) {
        state.stepsCompleted = data.stepsCompleted;
      }

      // Restore current step
      if (typeof data.currentStep === 'number' && data.currentStep > 0) {
        state.currentStep = data.currentStep;
      } else {
        state.currentStep = Math.min(9, (state.stepsCompleted || 0) + 1);
      }

      if (data.turnstileCompleted) {
        state.turnstileCompleted = true;
      }
      if (data.vpnConfig) {
        state.vpnConfig = data.vpnConfig;
      }
      if (data.claimedSession) {
        state.claimedSession = data.claimedSession;
      }

      // Refresh UI for all 9 steps
      const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
      for (let i = 1; i <= 9; i++) {
        if (i <= state.stepsCompleted) {
          updateStepUI(i, true);
        } else if (i === state.stepsCompleted + 1) {
          unlockStep(i);
          const clicks = state.stepClicks[i] || 0;
          const quota = STEP_QUOTAS[i] || 10;
          const btn = dom[`stepBtn${i}`];
          const statusEl = dom[`stepStatus${i}`];
          if (btn) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'opacity-85', 'cursor-not-allowed', 'bg-zinc-800', 'text-zinc-400');
            btn.classList.add('bg-neon', 'hover:bg-emerald-400', 'text-black', 'm3-btn');
            const btnText = lang === 'si'
              ? `Ad එක Verify කරන්න (${clicks}/${quota})`
              : `Click to Verify Ad (${clicks}/${quota})`;
            btn.innerHTML = `<span>${btnText}</span>`;
          }
          if (statusEl && clicks > 0) {
            statusEl.innerHTML = `<span class="text-neon font-medium">${clicks}/${quota} Ads Verified.</span>`;
          }
        }
      }

      updateOverallProgress();
      return true;
    } catch (err) {
      console.warn("Could not restore verification progress:", err);
      return false;
    }
  }

  function sendTelemetryLog(eventData) {
    try {
      const apiBase = getApiBaseUrl();
      const user = window.LegionAuth ? window.LegionAuth.getUser() : null;
      const pkg = state.selectedPackage || {};
      const payload = {
        event: eventData.event || 'page_view',
        path: window.location.pathname,
        step: state.currentStep,
        stepsCompleted: state.stepsCompleted,
        totalAdsVerified: calculateTotalAdsDone(),
        packageId: pkg.id || pkg.key || eventData.packageId || null,
        packageTitle: pkg.title || eventData.packageTitle || null,
        userEmail: user ? user.email : (eventData.userEmail || null),
        deviceType: (window.LegionDevice ? window.LegionDevice.getType() : 'pc'),
        details: eventData.details || null,
        timestamp: new Date().toISOString(),
        ...eventData
      };

      if (typeof navigator !== 'undefined' && navigator.sendBeacon && eventData.event === 'page_unload') {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(`${apiBase}/api/telemetry/log`, blob);
      } else {
        fetch(`${apiBase}/api/telemetry/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {}
  }

  function initDOM() {
    dom = {
      heroVideo: document.getElementById('hero-bg-video'),
      videoSource: document.getElementById('hero-video-source'),
      progressBar: document.getElementById('funnel-progress-bar'),
      progressText: document.getElementById('funnel-progress-text'),
      
      // Step cards, buttons, and status labels for all 9 steps
      stepCard1: document.getElementById('step-card-1'),
      stepCard2: document.getElementById('step-card-2'),
      stepCard3: document.getElementById('step-card-3'),
      stepCard4: document.getElementById('step-card-4'),
      stepCard5: document.getElementById('step-card-5'),
      stepCard6: document.getElementById('step-card-6'),
      stepCard7: document.getElementById('step-card-7'),
      stepCard8: document.getElementById('step-card-8'),
      stepCard9: document.getElementById('step-card-9'),
      
      stepBtn1: document.getElementById('step-btn-1'),
      stepBtn2: document.getElementById('step-btn-2'),
      stepBtn3: document.getElementById('step-btn-3'),
      stepBtn4: document.getElementById('step-btn-4'),
      stepBtn5: document.getElementById('step-btn-5'),
      stepBtn6: document.getElementById('step-btn-6'),
      stepBtn7: document.getElementById('step-btn-7'),
      stepBtn8: document.getElementById('step-btn-8'),
      stepBtn9: document.getElementById('step-btn-9'),
      
      stepStatus1: document.getElementById('step-status-1'),
      stepStatus2: document.getElementById('step-status-2'),
      stepStatus3: document.getElementById('step-status-3'),
      stepStatus4: document.getElementById('step-status-4'),
      stepStatus5: document.getElementById('step-status-5'),
      stepStatus6: document.getElementById('step-status-6'),
      stepStatus7: document.getElementById('step-status-7'),
      stepStatus8: document.getElementById('step-status-8'),
      stepStatus9: document.getElementById('step-status-9'),

      // Modals
      adRulesModal: document.getElementById('ad-rules-modal'),
      btnAcceptAdRules: document.getElementById('btn-accept-ad-rules'),
      turnstileModal: document.getElementById('turnstile-modal'),
      turnstileBox: document.getElementById('turnstile-box'),
      turnstileCheckbox: document.getElementById('turnstile-checkbox'),
      turnstileSpinner: document.getElementById('turnstile-spinner'),
      turnstileStatusText: document.getElementById('turnstile-status-text'),
      toastContainer: document.getElementById('toast-container'),
      configModal: document.getElementById('vpn-config-modal'),
      closeConfigModal: document.getElementById('close-config-modal'),

      // Live Ping Elements
      navLivePingVal: document.getElementById('nav-live-ping-val'),
      heroLivePingVal: document.getElementById('hero-live-ping-val'),
      vpnPingStat: document.getElementById('vpn-ping-stat'),

      // Packages Container
      packagesContainer: document.getElementById('home-packages-grid')
    };
  }

  // --- ANTI-TAB-SKIPPING & DWELL TIME ENFORCEMENT ---
  // Cleanly restores button readiness when user returns from ad tab
  function initTabVisibilityTracker() {
    function handleReturn() {
      // 1. Handle active ad countdown return
      if (activeAdSession) {
        const elapsed = (Date.now() - activeAdSession.startTime) / 1000;
        if (elapsed < 1.2) {
          return; // Ignore immediate touch/click gesture focus noise
        }
        if (!cancelAdSessionIfEarly()) {
          completeAdSessionIfEligible();
        }
      } else if (state.isCooldown) {
        state.isCooldown = false;
        const stepNum = state.currentStep;
        const quota = STEP_QUOTAS[stepNum] || 10;
        const currentClicks = state.stepClicks[stepNum] || 0;
        const btn = dom[`stepBtn${stepNum}`];
        if (btn && state.stepsCompleted < stepNum) {
          btn.disabled = false;
          btn.classList.remove('opacity-85', 'cursor-not-allowed');
          const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
          const btnText = lang === 'si'
            ? `Ad එක Verify කරන්න (${currentClicks}/${quota})`
            : `Click to Verify Ad (${currentClicks}/${quota})`;
          btn.innerHTML = `<span>${btnText}</span>`;
        }
      }

      // 2. Synchronize progress
      restoreVerificationProgress();
    }

    window.addEventListener('blur', () => {
      if (activeAdSession) activeAdSession.hasLeftWindow = true;
    });

    window.addEventListener('focus', handleReturn);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleReturn();
      } else {
        if (activeAdSession) activeAdSession.hasLeftWindow = true;
        saveVerificationProgress();
      }
    });

    window.addEventListener('pageshow', () => {
      restoreVerificationProgress();
    });

    window.addEventListener('pagehide', () => {
      saveVerificationProgress();
    });

    window.addEventListener('beforeunload', () => {
      saveVerificationProgress();
    });
  }

  function showHalfwayInterstitialModal(stepNum) {
    const modal = document.getElementById('halfway-interstitial-modal');
    const btn = document.getElementById('btn-halfway-continue');
    if (modal && btn) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      
      const clickHandler = () => {
        triggerPopunder();
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        btn.removeEventListener('click', clickHandler);
      };
      
      btn.addEventListener('click', clickHandler);
    }
  }

  // --- MOBILE BROWSER BACK NAVIGATION HISTORY TRAP ---
  // Traps back-button navigation to prevent users from exiting to browser homepage,
  // keeping them on the portal while triggering the sponsored fallback smartlink in a new tab.
  function initBackNavigationTrap() {
    // Intentionally disabled to prevent history loop traps and unwanted bounces to home page
  }

  // --- Lenis Smooth Scrolling ---
  function initLenis() {
    if (typeof Lenis !== 'undefined') {
      const lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        smoothTouch: false
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      window.lenisInstance = lenis;
    }
  }

  // --- Dynamic Video Background Loader ---
  function initVideoBackground() {
    const config = window.LEGION_CONFIG;
    if (config && config.HERO_VIDEO_URL && dom.heroVideo) {
      if (dom.videoSource) {
        dom.videoSource.src = config.HERO_VIDEO_URL;
        dom.heroVideo.load();
        dom.heroVideo.play().catch(e => {
          console.log("Autoplay note:", e.message);
        });
      }
    }
  }

  // --- Real-Time Live Ping Generator (40 - 400 ms range, every 1s) ---
  function initLivePingTicker() {
    function updatePing() {
      const isSpike = Math.random() < 0.25;
      let newPing;
      if (isSpike) {
        newPing = Math.floor(Math.random() * (400 - 180 + 1)) + 180;
      } else {
        newPing = Math.floor(Math.random() * (160 - 40 + 1)) + 40;
      }
      state.currentPing = newPing;

      let colorClass = "text-neon";
      if (newPing > 220) {
        colorClass = "text-amber-400";
      } else if (newPing > 120) {
        colorClass = "text-emerald-400";
      }

      if (dom.navLivePingVal) {
        dom.navLivePingVal.textContent = `${newPing} ms`;
        dom.navLivePingVal.className = `font-mono font-bold ${colorClass}`;
      }

      if (dom.heroLivePingVal) {
        dom.heroLivePingVal.textContent = `${newPing} ms`;
        dom.heroLivePingVal.className = `text-lg sm:text-2xl font-black font-mono tracking-tight ${colorClass}`;
      }

      if (dom.vpnPingStat) {
        dom.vpnPingStat.textContent = `${newPing} ms`;
        dom.vpnPingStat.className = `font-bold font-mono ${colorClass}`;
      }
    }

    updatePing();
    setInterval(updatePing, 1000);
  }

  // --- Mobile Tactile Haptic Vibration Feedback ---
  function triggerMobileHaptic() {
    if (navigator.vibrate) {
      try {
        navigator.vibrate([40, 50, 40]);
      } catch (e) {}
    }
  }

  // --- Toast Notification Helper ---
  function showToast(message, type = 'info') {
    if (!dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 transform translate-y-2 opacity-0 shadow-2xl max-w-[90vw] text-xs sm:text-sm ${
      type === 'success' 
        ? 'bg-[#06180e] border-[#00FF66] text-[#00FF66]' 
        : type === 'error'
        ? 'bg-[#200808] border-red-500 text-red-300'
        : type === 'warning'
        ? 'bg-[#261505] border-amber-500 text-amber-300'
        : 'bg-[#0f1412] border-emerald-500/40 text-emerald-200'
    }`;
    
    toast.innerHTML = `
      <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
          type === 'error' || type === 'warning'
            ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }"/>
      </svg>
      <span class="font-medium leading-tight">${message}</span>
    `;

    dom.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 350);
    }, 4500);
  }

  // --- HIGH-REVENUE CLICK-TRIGGERED POPUNDER ENGINE ---
  let lastPopunderTime = 0;

  function triggerPopunder(customUrl) {
    const now = Date.now();
    const config = window.LEGION_CONFIG || {};
    const ads = config.ADS || {};
    const cooldownSec = (ads.POPUNDER_COOLDOWN_SECONDS || 25);

    if (now - lastPopunderTime < cooldownSec * 1000) {
      return false;
    }

    const url = customUrl || ads.POPUNDER_URL || ads.SMARTLINK_URL || "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816";
    if (!url || url === "#") return false;

    lastPopunderTime = now;
    // Spawns ad cleanly in a new tab while user remains on the portal
    dispatchAdLink(url);
    return true;
  }

  function initGlobalPopunder() {
    document.addEventListener('click', (e) => {
      // Do not double-trigger on explicit verification buttons (they have their own direct handlers)
      if (
        e.target.closest('[id^="step-btn-"]') ||
        e.target.closest('#public-ad-btn') ||
        e.target.closest('#btn-copy-master-config') ||
        e.target.closest('#btn-copy-public-config')
      ) {
        return;
      }

      // Fire click-triggered popunder on user clicks (packages, cards, page areas)
      triggerPopunder();
    }, true);
  }

  // --- SOCIAL BAR FLOATING WIDGET LOADER ---
  function initSocialBar() {
    const config = window.LEGION_CONFIG || {};
    const ads = config.ADS || {};
    if (ads.ENABLE_SOCIAL_BAR && ads.SOCIAL_BAR_SCRIPT_URL) {
      setTimeout(() => {
        try {
          const s = document.createElement('script');
          s.type = 'text/javascript';
          s.src = ads.SOCIAL_BAR_SCRIPT_URL;
          s.async = true;
          document.body.appendChild(s);
        } catch (e) {
          console.warn("[Social Bar Notice]:", e);
        }
      }, 1500);
    }
  }

  // --- ANTI-CLICKJACKING SENTINEL ---
  // Neutralizes rogue transparent full-screen overlay layers injected by ad networks
  // ensuring user clicks penetrate immediately to underlying buttons on click #1
  function initAntiClickjackingSentinel() {
    const neutralizer = () => {
      const overlays = document.querySelectorAll('body > a, body > div');
      overlays.forEach(el => {
        if (!el || (el.id && (el.id.includes('modal') || el.id.includes('toast') || el.id.includes('packages'))) || el.classList.contains('modal-glass') || el.tagName === 'HEADER' || el.tagName === 'MAIN' || el.tagName === 'FOOTER' || el.tagName === 'SECTION') {
          return;
        }
        const s = window.getComputedStyle(el);
        if ((s.position === 'fixed' || s.position === 'absolute') &&
            el.offsetWidth >= window.innerWidth * 0.8 &&
            el.offsetHeight >= window.innerHeight * 0.8) {
          // If it's a full-page layer without visible text
          if (s.opacity === '0' || s.backgroundColor === 'transparent' || s.backgroundColor === 'rgba(0, 0, 0, 0)' || (el.innerText && el.innerText.trim().length === 0)) {
            el.style.setProperty('pointer-events', 'none', 'important');
          }
        }
      });
    };

    const observer = new MutationObserver(neutralizer);
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    setInterval(neutralizer, 350);
  }

  // --- MANDATORY SERVER NOTICE & RULES MODAL (#ad-rules-modal) ---
  function checkAndShowRulesModal() {
    const accepted = sessionStorage.getItem('legion_rules_accepted');
    if (!accepted && dom.adRulesModal) {
      dom.adRulesModal.classList.remove('hidden');
      dom.adRulesModal.classList.add('flex');
    }
  }

  function initAdRulesModal() {
    // Only show on load if language picker modal is NOT open (prevent modal backdrop collisions)
    const langModal = document.getElementById('language-picker-modal');
    const isLangModalActive = langModal && !langModal.classList.contains('hidden');

    if (!isLangModalActive) {
      checkAndShowRulesModal();
    }

    if (dom.btnAcceptAdRules) {
      const handleAccept = (e) => {
        if (e) {
          e.stopPropagation();
          if (e.cancelable) e.preventDefault();
        }
        sessionStorage.setItem('legion_rules_accepted', 'true');
        
        if (dom.adRulesModal) {
          dom.adRulesModal.classList.add('hidden');
          dom.adRulesModal.classList.remove('flex');
        }

        const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
        const msg = lang === 'si'
          ? "නීති රීති පිළිගන්නා ලදී. Singapore VPS Cluster එක Unlock විය!"
          : "Portal rules accepted. Singapore VPS cluster unlocked!";
        showToast(msg, "success");
        triggerMobileHaptic();
      };

      dom.btnAcceptAdRules.addEventListener('click', handleAccept, { capture: true });
      dom.btnAcceptAdRules.addEventListener('pointerdown', handleAccept, { capture: true });
    }
  }


  // --- Render Packages on Home Screen ---
  function renderPackages() {
    if (!dom.packagesContainer) return;
    try {
      const rawPkgs = (window.LegionStore && window.LegionStore.getPackages)
        ? window.LegionStore.getPackages()
        : DEFAULT_PACKAGES;
      const pkgs = getNormalizedPackages(rawPkgs);
      dom.packagesContainer.innerHTML = '';

      pkgs.forEach(pkg => {
        const card = document.createElement('div');
        
        let badgeClass = "bg-surface-300 border-zinc-700 text-zinc-300";
        let badgeIcon = "✓";
        if (pkg.badgeType === "best" || pkg.badge === "Best Choice") {
          badgeClass = "bg-emerald-950/80 border-emerald-500/50 text-neon";
          badgeIcon = "★";
        } else if (pkg.badgeType === "warning" || pkg.badge === "Not Recommended") {
          badgeClass = "bg-red-950/60 border-red-500/40 text-red-300";
          badgeIcon = "✕";
        }

        card.className = `m3-surface-2 p-5 sm:p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
          pkg.inStock ? 'border-emerald-900/40 hover:border-neon' : 'border-zinc-800 opacity-60'
        }`;

        card.innerHTML = `
          <div>
            <!-- Badges -->
            <div class="flex items-center justify-between gap-2 mb-4">
              <span class="text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${badgeClass}">
                <span>${badgeIcon}</span> ${pkg.badge || 'Package'}
              </span>
              <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-100 border border-emerald-950 text-zinc-400 flex items-center gap-1">
                📶 ${pkg.simType || 'Mobile Sim'}
              </span>
            </div>

            <!-- Title -->
            <h3 class="text-base sm:text-lg font-black text-white mb-1.5">${pkg.title}</h3>
            
            <!-- ISP Price -->
            <div class="text-xs font-bold text-neon mb-3 font-mono">
              ISP Package Price: ${pkg.ispPrice || 'Standard'}
            </div>

            <!-- Description -->
            <p class="text-xs text-zinc-400 mb-4 leading-relaxed line-clamp-2">
              ${pkg.desc || ''}
            </p>

            <!-- Login limit indicator -->
            <div class="text-[11px] text-amber-300 font-semibold mb-6 flex items-center gap-1.5">
              <span>💡</span> ${pkg.logins || 'Up to 2 Logins (Unlimited 3 Logins)'}
            </div>
          </div>

          <!-- Action Button (Click Here vs Out of Stock) -->
          <div>
            ${pkg.inStock ? `
              <a href="claim.html?pkg=${encodeURIComponent(pkg.id)}" target="_blank" rel="noopener noreferrer" data-id="${pkg.id}" class="js-select-package w-full py-3.5 rounded-2xl bg-neon hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm tracking-wide m3-btn flex items-center justify-center gap-2 neon-glow transition-all">
                <span>Click Here (Select VPN)</span> →
              </a>
            ` : `
              <button disabled class="w-full py-3.5 rounded-2xl bg-zinc-900 border border-red-950 text-zinc-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                <span class="text-red-400">✕</span> Out of Stock (අවසන් වී ඇත)
              </button>
            `}
          </div>
        `;

        dom.packagesContainer.appendChild(card);
      });

      // Attach click handlers to "Click Here" links
      document.querySelectorAll('.js-select-package').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const pkgId = btn.getAttribute('data-id');
          const pkg = (window.LegionStore && window.LegionStore.getPackageById)
            ? window.LegionStore.getPackageById(pkgId)
            : pkgs.find(p => p.id === pkgId);
          if (pkg) {
            state.selectedPackage = pkg;
            saveVerificationProgress();
            sendTelemetryLog({ event: 'package_selected', packageId: pkg.id, packageTitle: pkg.title });
            showToast(`Opening ${pkg.title} in new tab...`, "success");
          }
          triggerMobileHaptic();
        }, { capture: true });
      });
    } catch (err) {
      console.error("[renderPackages error]:", err);
    }
  }

  // --- SYNCHRONOUS AD TRIGGER & DIRECT SMARTLINK OPENER ---
  // Mandatory: Must execute synchronously during the click event to avoid browser popup blockers!
  function getDirectLink(stepNumber) {
    const config = window.LEGION_CONFIG || {};
    const ads = config.ADS || {};
    if (ads.DIRECT_LINKS && ads.DIRECT_LINKS.length >= stepNumber) {
      return ads.DIRECT_LINKS[stepNumber - 1];
    }
    return ads.SMARTLINK_URL || ads[`STEP_${stepNumber}_DIRECT_LINK`] || ads.POPUNDER_URL || "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816";
  }

  function triggerAdLink(stepNumber) {
    const link = getDirectLink(stepNumber);
    if (!link || link === "#") return;
    dispatchAdLink(link);
  }

  // Calculate total ads verified across all steps for progress bar
  function calculateTotalAdsDone() {
    if (state.sgSteps === 1) {
      return (state.stepsCompleted >= 1 || (state.stepClicks && state.stepClicks[1] >= 1)) ? 1 : 0;
    }
    let total = 0;
    for (let i = 1; i <= 9; i++) {
      if (state.stepsCompleted >= i) {
        total += (STEP_QUOTAS[i] || 10);
      } else if (state.currentStep === i) {
        total += (state.stepClicks[i] || 0);
      }
    }
    return Math.min(TOTAL_ADS_REQUIRED, total);
  }

  function updateOverallProgress() {
    const totalDone = calculateTotalAdsDone();
    const percent = Math.min(100, Math.round((totalDone / TOTAL_ADS_REQUIRED) * 100));
    if (dom.progressBar) {
      dom.progressBar.style.width = `${percent}%`;
    }
    if (dom.progressText) {
      const label = (TOTAL_ADS_REQUIRED === 1) 
        ? `${totalDone}/1 Ad (${percent}%)` 
        : `${totalDone}/100 Ads (${percent}%)`;
      dom.progressText.textContent = label;
    }
  }

  // --- DYNAMIC AD VERIFICATION FUNNEL CONTROLLER ---
  function updateClaimPageFunnelUI() {
    const isInstant = (state.sgSteps === 1);
    const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';

    const modeBadge = document.getElementById('sg-funnel-mode-badge');
    const modeDesc = document.getElementById('sg-funnel-mode-desc');

    if (modeBadge) {
      if (isInstant) {
        modeBadge.textContent = "⚡ Instant 1-Step Unlock";
        modeBadge.className = "ad-slot-badge mb-1 inline-block bg-amber-500/20 text-amber-300 border-amber-500/40";
      } else {
        modeBadge.textContent = "Dedicated Singapore Uplink";
        modeBadge.className = "ad-slot-badge mb-1 inline-block";
      }
    }

    if (modeDesc) {
      if (isInstant) {
        modeDesc.innerHTML = `<span class="text-amber-400 font-bold">⚡ Instant Unlock Active:</span> Complete Step 1 below (1 Ad) to instantly claim your 30-day Singapore VPN credentials!`;
      } else {
        modeDesc.textContent = "🛡️ Watch sponsor ads sequentially by clicking the step buttons below.";
      }
    }

    // Step 1 Button text and quota update
    if (dom.stepBtn1 && !state.stepsCompleted) {
      const quota = STEP_QUOTAS[1] || (isInstant ? 1 : 10);
      const clicks = (state.stepClicks && state.stepClicks[1]) || 0;
      const btnText = lang === 'si'
        ? `Ad එක Verify කරන්න (${clicks}/${quota})`
        : `Click to Verify Ad (${clicks}/${quota})`;
      dom.stepBtn1.innerHTML = `<span>${btnText}</span>`;
    }

    // Steps 2-9 visual bypass indicator if Instant mode is active
    for (let s = 2; s <= 9; s++) {
      const card = dom[`stepCard${s}`];
      const statusEl = dom[`stepStatus${s}`];
      const btn = dom[`stepBtn${s}`];

      if (isInstant) {
        if (statusEl && !state.stepsCompleted) {
          statusEl.innerHTML = `<span class="text-amber-400 font-mono text-[10px]">⚡ Instant Bypass</span>`;
        }
        if (btn && !state.stepsCompleted) {
          btn.innerHTML = `<span>⚡ Unlocked in Step 1</span>`;
        }
      }
    }

    updateOverallProgress();
  }

  function updatePublicServersFunnelUI() {
    renderPublicServersGrid();
  }

  function applyFunnelSettings(sgSteps, publicSteps) {
    state.sgSteps = (sgSteps === 1) ? 1 : 100;
    state.publicSteps = (publicSteps === 1) ? 1 : 10;

    if (state.sgSteps === 1) {
      TOTAL_ADS_REQUIRED = 1;
      STEP_QUOTAS = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 };
    } else {
      TOTAL_ADS_REQUIRED = 100;
      STEP_QUOTAS = { ...DEFAULT_STEP_QUOTAS };
    }

    updateClaimPageFunnelUI();
    updatePublicServersFunnelUI();
  }

  async function syncFunnelSettings() {
    // 1. Initial application from local cache
    if (window.LegionStore && window.LegionStore.getFunnelSettings) {
      const cached = window.LegionStore.getFunnelSettings();
      applyFunnelSettings(cached.sg_steps, cached.public_steps);
    }

    // 2. Fetch live settings from Cloudflare Worker API (MongoDB Atlas)
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
        applyFunnelSettings(sgSteps, publicSteps);
      }
    } catch (e) {
      console.warn("[syncFunnelSettings notice]:", e);
    }
  }

  function applyModalSettingsToDOM(ms) {
    if (!ms) return;
    const tag = document.getElementById('sg-modal-tag');
    if (tag && ms.sgStatusTag) tag.textContent = ms.sgStatusTag;
    const v = document.getElementById('sg-modal-validity');
    if (v && ms.sgValidityNotice) v.textContent = ms.sgValidityNotice;
    const s = document.getElementById('sg-modal-support-banner');
    if (s && ms.sgSupportBanner) s.textContent = ms.sgSupportBanner;

    const heading = document.getElementById('sg-modal-heading');
    if (heading && ms.sgHeading) heading.textContent = ms.sgHeading;
    const proto = document.getElementById('sg-modal-protocol-label');
    if (proto && ms.sgProtocolLabel) proto.textContent = ms.sgProtocolLabel;
    const footer = document.getElementById('sg-modal-footer');
    if (footer && ms.sgFooter) footer.textContent = ms.sgFooter;

    const adv = document.getElementById('pub-modal-advisory');
    if (adv && ms.pubAdvisoryBanner) adv.textContent = ms.pubAdvisoryBanner;
    const upFree = document.getElementById('pub-modal-upsell-free');
    if (upFree && ms.pubUpsellPitch) upFree.textContent = ms.pubUpsellPitch;
    const upVip = document.getElementById('pub-modal-upsell-vip');
    if (upVip && ms.pubVipPitch) upVip.textContent = ms.pubVipPitch;
  }

  async function syncModalSettings() {
    if (window.LegionStore && window.LegionStore.getModalSettings) {
      applyModalSettingsToDOM(window.LegionStore.getModalSettings());
    }

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
          if (window.LegionStore && window.LegionStore.saveModalSettings) {
            window.LegionStore.saveModalSettings(liveMs);
          }
          applyModalSettingsToDOM(liveMs);
        }
      }
    } catch (e) {
      console.warn("[syncModalSettings notice]:", e);
    }
  }

  async function syncGlobalSettings() {
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
          if (settings.packages) {
            const normPkgs = getNormalizedPackages(settings.packages);
            if (window.LegionStore && window.LegionStore.savePackages) {
              window.LegionStore.savePackages(normPkgs);
            }
          }
          if (settings.public_servers) {
            const normSrvs = getNormalizedPublicServers(settings.public_servers);
            if (window.LegionStore && window.LegionStore.savePublicServers) {
              window.LegionStore.savePublicServers(normSrvs);
            }
          }
          if (window.LegionStore && window.LegionStore.applyGlobalSettings) {
            window.LegionStore.applyGlobalSettings(settings);
          }
          if (settings.sg_steps !== undefined || settings.public_steps !== undefined) {
            applyFunnelSettings(settings.sg_steps, settings.public_steps);
          }
          renderPublicServersGrid();
          renderPackages();
          if (settings.modal_settings) {
            applyModalSettingsToDOM(settings.modal_settings);
          }

          const urlParams = new URLSearchParams(window.location.search);
          const pkgId = urlParams.get('pkg') || (state.selectedPackage && state.selectedPackage.id);
          if (pkgId && window.LegionStore && window.LegionStore.getPackageById) {
            const updatedPkg = window.LegionStore.getPackageById(pkgId);
            if (updatedPkg) {
              state.selectedPackage = updatedPkg;
              const titleEl = document.getElementById('claim-pkg-title');
              const descEl = document.getElementById('claim-pkg-desc');
              const priceEl = document.getElementById('claim-pkg-price');
              const simEl = document.getElementById('claim-pkg-sim');

              if (titleEl) titleEl.textContent = updatedPkg.title;
              if (descEl) descEl.textContent = updatedPkg.desc || 'High-speed Trojan protocol configuration.';
              if (priceEl) priceEl.textContent = updatedPkg.ispPrice || 'Free VPS Slot';
              if (simEl) simEl.textContent = '📶 ' + (updatedPkg.simType || 'Mobile Sim');
            }
          }
        }
      }
    } catch (e) {
      console.warn('[syncGlobalSettings notice]:', e);
    }
  }

  async function syncPublicServers() {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/free/public-servers`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const liveServers = data.servers || data.public_servers;
        if (liveServers) {
          const normServers = getNormalizedPublicServers(liveServers);
          if (window.LegionStore && window.LegionStore.savePublicServers) {
            window.LegionStore.savePublicServers(normServers);
          }
          renderPublicServersGrid();
        }
      }
    } catch (e) {
      console.warn("[syncPublicServers notice]:", e);
    }
  }

  // --- Material 3 Central Warning & Validation Popup Window ---
  function showWarningPopupModal(options = {}) {
    const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
    
    let modal = document.getElementById('warning-popup-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'warning-popup-modal';
      modal.className = 'fixed inset-0 z-[99999999] hidden modal-glass items-center justify-center p-4';
      modal.innerHTML = '<div class="m3-surface-2 p-6 sm:p-8 rounded-3xl border border-amber-500/60 max-w-md w-full text-center shadow-2xl relative max-h-[90vh] overflow-y-auto">' +
        '<div class="w-16 h-16 rounded-3xl bg-amber-950/40 border border-amber-500/50 text-amber-400 mx-auto flex items-center justify-center mb-4 sm:mb-5 shadow-[0_0_20px_rgba(245,158,11,0.25)]">' +
          '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>' +
          '</svg>' +
        '</div>' +
        '<h3 class="text-xl sm:text-2xl font-black text-white mb-2" id="warning-popup-title">' +
          'දැන්වීම නැරඹීම අසම්පූර්ණයි!' +
        '</h3>' +
        '<div class="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 mb-5 text-left">' +
          '<p class="text-xs sm:text-sm text-amber-200 leading-relaxed font-sans font-medium" id="warning-popup-desc-si">' +
            'තප්පර 5ක් සයිට් එකේ ඉදල close කරලා ඊලග ad එක click කරන්න.' +
          '</p>' +
          '<p class="text-[11px] sm:text-xs text-zinc-400 mt-2 leading-relaxed border-t border-amber-500/20 pt-2" id="warning-popup-desc-en">' +
            'Watch the sponsor ad for at least 5 seconds before returning to verify.' +
          '</p>' +
        '</div>' +
        '<button id="btn-close-warning-modal" class="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm m3-btn shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2">' +
          '<span id="warning-popup-btn-text">මම තේරුම් ගත්තා (OK)</span>' +
        '</button>' +
      '</div>';
      document.body.appendChild(modal);
    }

    const closeBtn = modal.querySelector('#btn-close-warning-modal');
    if (closeBtn && !closeBtn._hasBound) {
      closeBtn._hasBound = true;
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWarningPopupModal();
      });
    }

    if (!modal._hasBackdropBound) {
      modal._hasBackdropBound = true;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeWarningPopupModal();
        }
      });
    }

    const titleEl = modal.querySelector('#warning-popup-title');
    const descSiEl = modal.querySelector('#warning-popup-desc-si');
    const descEnEl = modal.querySelector('#warning-popup-desc-en');
    const btnTextEl = modal.querySelector('#warning-popup-btn-text');

    if (titleEl) {
      titleEl.textContent = lang === 'si'
        ? (options.titleSi || 'දැන්වීම නැරඹීම අසම්පූර්ණයි!')
        : (options.titleEn || 'Action Incomplete!');
    }
    if (descSiEl) {
      descSiEl.textContent = options.descSi || 'තප්පර 5ක් සයිට් එකේ ඉදල close කරලා ඊලග ad එක click කරන්න.';
    }
    if (descEnEl) {
      descEnEl.textContent = options.descEn || 'Watch the sponsor ad for at least 5 seconds before returning to verify.';
    }
    if (btnTextEl) {
      btnTextEl.textContent = lang === 'si'
        ? (options.btnSi || 'මම තේරුම් ගත්තා (OK)')
        : (options.btnEn || 'I Understand (OK)');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
    triggerMobileHaptic();
  }

  function closeWarningPopupModal() {
    const modal = document.getElementById('warning-popup-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      modal.style.display = 'none';
    }
  }

  // --- STRICT 5-SECOND AD VIEWING ENFORCEMENT ENGINE ---
  let activeAdSession = null;
  let adCountdownInterval = null;

  function cancelAdSessionIfEarly() {
    if (!activeAdSession) return false;

    const elapsed = (Date.now() - activeAdSession.startTime) / 1000;

    // 1. Immunity period: Ignore touch/click micro-events in first 1.2s on mobile
    if (elapsed < 1.2) {
      return false;
    }

    // 2. If the user never actually switched away from the tab, let the button countdown run down naturally
    if (!activeAdSession.hasLeftWindow && document.visibilityState === 'visible') {
      return false;
    }

    if (elapsed < 4.8) {
      // User switched back or closed ad before 5 seconds!
      const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
      const warningMsg = lang === 'si'
        ? "තප්පර 5ක් සයිට් එකේ ඉදල close කරලා ඊලග ad එක click කරන්න"
        : "Watch the ad for 5 seconds to complete";

      showToast(warningMsg, "warning");
      triggerMobileHaptic();

      // Show prominent, unmissable center popup modal
      showWarningPopupModal({
        titleSi: "දැන්වීම නැරඹීම අසම්පූර්ණයි!",
        titleEn: "Ad Viewing Incomplete!",
        descSi: "තප්පර 5ක් සයිට් එකේ ඉදල close කරලා ඊලග ad එක click කරන්න.",
        descEn: "Watch the sponsor ad for at least 5 seconds before returning to verify.",
        btnSi: "මම තේරුම් ගත්තා (OK)",
        btnEn: "I Understand (OK)"
      });

      if (adCountdownInterval) {
        clearInterval(adCountdownInterval);
        adCountdownInterval = null;
      }

      const session = activeAdSession;
      activeAdSession = null;
      if (session.onReset) {
        session.onReset();
      }
      return true;
    }
    return false;
  }

  function completeAdSessionIfEligible() {
    if (!activeAdSession) return;
    const elapsed = (Date.now() - activeAdSession.startTime) / 1000;
    if (elapsed >= 4.8) {
      if (adCountdownInterval) {
        clearInterval(adCountdownInterval);
        adCountdownInterval = null;
      }
      const session = activeAdSession;
      activeAdSession = null;
      if (session.onSuccess) {
        session.onSuccess();
      }
    }
  }

  // --- Unified 9-Step 100-Ad Action Handler with Real-Time Click Engine ---
  function handleStepClick(stepNumber) {
    // 1. Enforce Google Sign-In Gate
    if (!requireAuth()) return;

    // 2. Validate prerequisites
    if (stepNumber > 1 && state.stepsCompleted < stepNumber - 1) {
      showToast(`Please complete Step ${stepNumber - 1} first!`, "error");
      showWarningPopupModal({
        titleSi: "????? ?? ????? ?????!",
        titleEn: "Sequential Step Required!",
        descSi: `??????? ????? ${stepNumber - 1} ?? ????? ???????? ?? ${stepNumber} ?? ????? Unlock ??????.`,
        descEn: `Please complete Step ${stepNumber - 1} first before proceeding to Step ${stepNumber}.`,
        btnSi: "??? (OK)",
        btnEn: "Got it"
      });
      return;
    }
    if (state.stepsCompleted >= stepNumber) {
      showToast(`Step ${stepNumber} is already complete!`, "info");
      return;
    }

    // 3. Prevent duplicate click while ad countdown is active
    if (state.isCooldown || activeAdSession) {
      return;
    }

    const quota = STEP_QUOTAS[stepNumber] || 10;
    const currentClicks = state.stepClicks[stepNumber] || 0;
    state.currentStep = stepNumber;

    const btn = dom[`stepBtn${stepNumber}`];
    const statusEl = dom[`stepStatus${stepNumber}`];
    const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';

    // 4. Open Adsterra Smartlink Synchronously on User Gesture!
    triggerAdLink(stepNumber);

    // 5. Start 5-second countdown on button UI
    let countdown = 5;
    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-85', 'cursor-not-allowed');
      const waitText = lang === 'si'
        ? `Ad එක බලන්න (${countdown}s)...`
        : `Watch Ad (${countdown}s)...`;
      btn.innerHTML = `<span>⏳ ${waitText}</span>`;
    }
    if (statusEl) {
      statusEl.innerHTML = `<span class="text-amber-400 font-medium">⏳ ${lang === 'si' ? 'තප්පර 5ක් ad එකේ රැඳෙන්න...' : 'Stay on sponsor site for 5s...'}</span>`;
    }

    if (adCountdownInterval) {
      clearInterval(adCountdownInterval);
      adCountdownInterval = null;
    }

    adCountdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        if (btn) {
          const waitText = lang === 'si'
            ? `Ad එක බලන්න (${countdown}s)...`
            : `Watch Ad (${countdown}s)...`;
          btn.innerHTML = `<span>⏳ ${waitText}</span>`;
        }
      } else {
        clearInterval(adCountdownInterval);
        adCountdownInterval = null;
        if (!document.hidden && activeAdSession) {
          completeAdSessionIfEligible();
        }
      }
    }, 1000);

    activeAdSession = {
      startTime: Date.now(),
      onReset: () => {
        if (btn) {
          btn.disabled = false;
          btn.classList.remove('opacity-85', 'cursor-not-allowed');
          const nextText = lang === 'si'
            ? `Ad එක Verify කරන්න (${currentClicks}/${quota})`
            : `Click to Verify Ad (${currentClicks}/${quota})`;
          btn.innerHTML = `<span>${nextText}</span>`;
        }
        if (statusEl) {
          statusEl.innerHTML = `<span class="text-neon font-medium">${currentClicks}/${quota} Ads Verified.</span>`;
        }
      },
      onSuccess: () => {
        state.stepClicks[stepNumber] = (state.stepClicks[stepNumber] || 0) + 1;
        const newClicks = state.stepClicks[stepNumber];

        triggerMobileHaptic();
        updateOverallProgress();
        saveVerificationProgress();
        sendTelemetryLog({
          event: 'ad_verified',
          step: stepNumber,
          clicks: newClicks,
          quota: quota,
          totalAdsVerified: calculateTotalAdsDone()
        });

        if (newClicks >= quota) {
          state.stepsCompleted = (state.sgSteps === 1) ? 9 : stepNumber;
          updateStepUI(stepNumber, true);
          updateOverallProgress();
          saveVerificationProgress();
          sendTelemetryLog({
            event: 'step_completed',
            step: stepNumber,
            totalAdsVerified: calculateTotalAdsDone(),
            progressSummary: (state.sgSteps === 1) ? "1/1 Ad Complete (Instant Unlock)" : `Step ${stepNumber} Complete (${quota}/${quota} Ads)`
          });

          if (state.sgSteps === 1 || stepNumber >= 9) {
            const finalToastMsg = lang === 'si'
              ? ((state.sgSteps === 1) ? "🎉 1-Step Instant Verification සාර්ථකයි! Trojan Credentials සාදමින්..." : "🎉 පියවර 9 සහ Ads 100 සම්පූර්ණයි! Trojan Credentials සාදමින්...")
              : ((state.sgSteps === 1) ? "🎉 Instant 1-Step Verification Complete! Fetching Trojan Credentials..." : "🎉 All 9 Steps & 100 Ads Verified! Fetching Trojan Credentials...");
            showToast(finalToastMsg, "success");
            fetchSecureVPNConfig();
          } else {
            unlockStep(stepNumber + 1);
            const toastMsg = lang === 'si'
              ? `${stepNumber} වන පියවර සාර්ථකයි (${quota}/${quota} Ads)! ඊළඟ පියවර Unlock විය.`
              : `Step ${stepNumber} Complete (${quota}/${quota} Ads)! Next step unlocked.`;
            showToast(toastMsg, "success");
          }
          return;
        }

        const halfway = Math.floor(quota / 2);
        if (newClicks === halfway) {
          showHalfwayInterstitialModal(stepNumber);
        }

        if (btn) {
          btn.disabled = false;
          btn.classList.remove('opacity-85', 'cursor-not-allowed');
          const nextText = lang === 'si'
            ? `Ad එක Verify කරන්න (${newClicks}/${quota})`
            : `Click to Verify Ad (${newClicks}/${quota})`;
          btn.innerHTML = `<span>${nextText}</span>`;
        }
        if (statusEl) {
          const statusText = lang === 'si'
            ? `<span class="text-neon font-medium">${newClicks}/${quota} Ads Verified. ඉදිරියට යන්න...</span>`
            : `<span class="text-neon font-medium">${newClicks}/${quota} Ads Verified. Keep clicking...</span>`;
          statusEl.innerHTML = statusText;
        }

        if (stepNumber === 9 && !state.turnstileCompleted && newClicks === 1) {
          showTurnstileModal();
        }
      }
    };
  }

  // --- Step 9 Cloudflare Turnstile Modal Interstitial ---
  function showTurnstileModal() {
    if (!dom.turnstileModal) return;

    state.turnstileCompleted = false;
    dom.turnstileModal.classList.remove('hidden');
    dom.turnstileModal.classList.add('flex');

    if (dom.turnstileCheckbox) {
      dom.turnstileCheckbox.innerHTML = '<div id="turnstile-spinner" class="w-4 h-4 border-2 border-neon border-t-transparent rounded-full animate-spin"></div>';
    }
    if (dom.turnstileStatusText) {
      dom.turnstileStatusText.textContent = "Verifying security token with Cloudflare...";
    }

    // Auto-resolve turnstile verification after 2.5s
    setTimeout(() => {
      resolveTurnstileSuccess();
    }, 2500);
  }

  function resolveTurnstileSuccess() {
    if (state.turnstileCompleted) return;
    state.turnstileCompleted = true;

    if (dom.turnstileCheckbox) {
      dom.turnstileCheckbox.innerHTML = '<span class="text-neon font-black text-sm">✓</span>';
    }
    if (dom.turnstileStatusText) {
      dom.turnstileStatusText.textContent = "Verification Successful! (Human Verified)";
    }

    triggerMobileHaptic();

    setTimeout(() => {
      if (dom.turnstileModal) {
        dom.turnstileModal.classList.add('hidden');
        dom.turnstileModal.classList.remove('flex');
      }
    }, 800);
  }

  function initTurnstileBoxClick() {
    if (dom.turnstileBox) {
      dom.turnstileBox.addEventListener('click', () => {
        resolveTurnstileSuccess();
      });
    }
  }

  // --- Auth Verification Guard ---
  function requireAuth() {
    const user = window.LegionAuth ? window.LegionAuth.getUser() : null;
    if (!user) {
      const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
      const authNotice = lang === 'si' 
        ? "කරුණාකර ඉස්සෙල්ලම Google මගින් Sign in වෙන්න!" 
        : "Please sign in with Google first to verify steps and claim your node!";
      showToast(authNotice, "error");
      
      if (window.LegionAuth && window.LegionAuth.openLoginModal) {
        window.LegionAuth.openLoginModal();
      }
      return false;
    }

    const email = (user.email || state.userEmail || '').trim().toLowerCase();
    const isGmail = /^[a-z0-9](\.?[a-z0-9]){4,}@gmail\.com$/i.test(email);
    if (!isGmail) {
      if (window.LegionAuth && window.LegionAuth.showInvalidEmailModal) {
        window.LegionAuth.showInvalidEmailModal();
      } else {
        showWarningPopupModal({
          titleSi: "⚠️ අවලංගු Email ලිපිනයක්!",
          titleEn: "⚠️ Invalid Email Provider",
          descSi: "Temporary / Disposable mail ලිපින භාවිතය සම්පූර්ණයෙන්ම තහනම්ය. කරුණාකර ඔබගේ නිල @gmail.com ගිණුමෙන් Sign in වන්න.",
          descEn: "⚠️ Invalid Email Provider: Temporary / Disposable mail addresses are strictly prohibited. Please sign in using your official @gmail.com account to claim high-speed Singapore nodes.",
          btnSi: "මම තේරුම් ගත්තා (OK)",
          btnEn: "Understood (OK)"
        });
      }
      if (window.LegionAuth && window.LegionAuth.logout) {
        window.LegionAuth.logout();
      }
      return false;
    }

    return true;
  }

  // --- Update Step Visual UI upon Completion ---
  function updateStepUI(stepNum, isComplete) {
    const card = dom[`stepCard${stepNum}`];
    const btn = dom[`stepBtn${stepNum}`];
    const statusEl = dom[`stepStatus${stepNum}`];
    const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
    const quota = STEP_QUOTAS[stepNum] || 10;

    if (isComplete) {
      if (card) {
        card.classList.remove('opacity-40', 'pointer-events-none', 'neon-border');
        card.classList.add('border-emerald-500/60', 'bg-surface-300');
      }
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `
          <span class="flex items-center gap-1.5 text-black font-extrabold">
            <svg class="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            ${lang === 'si' ? `සාර්ථකයි (${quota}/${quota} Ads)` : `Verified (${quota}/${quota} Ads)`}
          </span>
        `;
        btn.className = "w-full py-3.5 rounded-2xl bg-emerald-400 text-black font-bold flex items-center justify-center cursor-default text-xs sm:text-sm";
      }
      if (statusEl) {
        statusEl.innerHTML = `<span class="text-emerald-400 font-bold flex items-center gap-1">✓ Complete (${quota} Ads)</span>`;
      }
    }
  }

  function unlockStep(stepNum) {
    state.currentStep = stepNum;
    const card = dom[`stepCard${stepNum}`];
    const btn = dom[`stepBtn${stepNum}`];
    const statusEl = dom[`stepStatus${stepNum}`];
    const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
    const quota = STEP_QUOTAS[stepNum] || 10;
    const clicks = state.stepClicks[stepNum] || 0;

    if (card) {
      card.classList.remove('opacity-40', 'pointer-events-none');
      card.classList.add('neon-border');
    }
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'opacity-85', 'cursor-not-allowed', 'bg-zinc-800', 'text-zinc-400');
      btn.classList.add('bg-neon', 'hover:bg-emerald-400', 'text-black', 'm3-btn');
      
      const btnText = lang === 'si'
        ? `Ad එක Verify කරන්න (${clicks}/${quota})`
        : `Click to Verify Ad (${clicks}/${quota})`;
      btn.innerHTML = `<span>${btnText}</span>`;
    }
    if (statusEl) {
      statusEl.innerHTML = `<span class="text-neon font-semibold">${lang === 'si' ? 'Verify කිරීමට සූදානම්' : 'Ready to verify'}</span>`;
    }
  }

  // --- Protocol Auto-Detection ---
  function detectProtocol(url) {
    const u = (url || '').trim().toLowerCase();
    if (u.startsWith('trojan://')) return 'Trojan';
    if (u.startsWith('vless://')) return 'VLESS';
    if (u.startsWith('vmess://')) return 'VMess';
    return 'VPN';
  }

  // --- Confetti Celebration Burst (particleCount: 160, spread: 100, origin: { y: 0.6 }) ---
  function triggerCelebrationConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  }

  function getApiBaseUrl() {
    const cfg = window.LEGION_CONFIG || {};
    if (cfg.API_BASE_URL) return cfg.API_BASE_URL.replace(/\/+$/, '');
    if (cfg.API_ENDPOINT) return cfg.API_ENDPOINT.replace(/\/claim\/?$/, '').replace(/\/+$/, '');
    return "https://freevpn.dulangathipul.workers.dev";
  }

  // --- Single Master VPN Config Delivery (Connected to MongoDB Atlas) ---
  async function deliverMasterVPNConfig(preferredPkgId) {
    // 1. Identify selected package ID (from argument, state, public state, or URL)
    const rawPkgId = preferredPkgId || 
                     (state.selectedPackage && (state.selectedPackage.id || state.selectedPackage.key)) || 
                     (currentPublicState && currentPublicState.selectedPackageKey) || 
                     (new URLSearchParams(window.location.search).get('pkg')) || 
                     'dialog_social';
    const pkgKey = (window.LegionStore && window.LegionStore.normalizePackageKey)
      ? window.LegionStore.normalizePackageKey(rawPkgId)
      : (rawPkgId || 'dialog_social').replace(/^pkg_/, '');

    let masterConfig = (window.LegionStore && window.LegionStore.getMasterConfig)
      ? window.LegionStore.getMasterConfig()
      : '';
    let protocol = detectProtocol(masterConfig);

    // 2. Fetch tailored credentials from MongoDB Atlas / Worker API: GET /api/free/config?pkg=<pkgKey>
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/free/config?pkg=${encodeURIComponent(pkgKey)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          masterConfig = data.config.trim();
          protocol = data.protocol || detectProtocol(masterConfig);
          if (data.raw_master_config && window.LegionStore && window.LegionStore.saveMasterConfig) {
            window.LegionStore.saveMasterConfig(data.raw_master_config);
          }
        }
      }
    } catch (err) {
      console.warn("MongoDB Atlas fetch fallback to local cache:", err);
    }

    if (!masterConfig) {
      masterConfig = 'trojan://y9emfz6sx1orp6ka@dulangafree.legiongraphics.site:119/?security=tls&fp=ios&sni=dulangafree.zoom.us&type=tcp&headerType=none#LEGION-VPN%20Free%20All%20ISP';
    }

    // 3. Client-side guarantee: Ensure SNI & tag match selected package even if offline or cached
    if (window.LegionStore && window.LegionStore.injectPackageSni) {
      masterConfig = window.LegionStore.injectPackageSni(masterConfig, pkgKey);
    }
    protocol = detectProtocol(masterConfig);

    // Save in app state
    state.vpnConfig = {
      master_config: masterConfig,
      protocol: protocol,
      trojan_link: masterConfig,
      v2ray_link: masterConfig,
      package_id: pkgKey
    };

    // Send background user claim telemetry
    try {
      const user = window.LegionAuth ? window.LegionAuth.getUser() : null;
      const userEmail = (user ? user.email : state.userEmail || '').trim().toLowerCase();
      if (userEmail) {
        const apiBase = getApiBaseUrl();
        fetch(`${apiBase}/api/telemetry/user-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            action: 'Node Claim',
            steps: state.stepsCompleted || (state.sgSteps === 1 ? 1 : 9)
          })
        }).catch(() => {});
      }
    } catch (e) {}

    saveVerificationProgress();
    sendTelemetryLog({
      event: 'node_claimed',
      packageId: pkgKey,
      protocol: protocol,
      totalAdsVerified: 100
    });
    renderCelebratoryCompletionModal(masterConfig, protocol, pkgKey);
    triggerCelebrationConfetti();
  }

  // Backwards compatibility wrapper
  async function fetchSecureVPNConfig() {
    await deliverMasterVPNConfig();
  }

  // --- Celebratory Completion Modal Renderer ---
  function renderCelebratoryCompletionModal(rawConfig, protocol, packageKey) {
    const configModal = dom.configModal || document.getElementById('vpn-config-modal');
    if (!configModal) return;

    const headingEl = document.getElementById('sg-modal-heading');
    const subtextEl = document.getElementById('sg-modal-subtext');
    const rawConfigInput = document.getElementById('vpn-master-config-raw');
    const protocolLabelEl = document.getElementById('sg-modal-protocol-label');
    const copyLabel = document.getElementById('btn-copy-master-label');
    const modalBox = document.getElementById('vpn-config-modal-box');
    const pingEl = document.getElementById('vpn-ping-stat');

    // Heading: 🎉 Congratulations! Copy Your Premium Free Singapore <PROTOCOL> Account
    if (headingEl) {
      headingEl.innerHTML = `🎉 Congratulations! Copy Your Premium Free Singapore <span id="sg-modal-protocol-name" class="text-neon">${protocol}</span> Account`;
    }

    // Subtext: "Your high-speed Singapore node is ready to use."
    if (subtextEl) {
      const map = (window.LegionStore && window.LegionStore.ISP_SNI_MAP) || {};
      const normKey = (window.LegionStore && window.LegionStore.normalizePackageKey)
        ? window.LegionStore.normalizePackageKey(packageKey)
        : packageKey;
      const pkgInfo = map[normKey];
      if (pkgInfo && pkgInfo.name) {
        subtextEl.textContent = `Your high-speed Singapore node for ${pkgInfo.name} is ready to use.`;
      } else {
        subtextEl.textContent = "Your high-speed Singapore node is ready to use.";
      }
    }

    if (protocolLabelEl) {
      protocolLabelEl.textContent = protocol;
    }

    if (pingEl) {
      pingEl.textContent = `${state.currentPing || 45} ms`;
    }

    // Config Box: Readonly text input displaying the raw config URL
    if (rawConfigInput) {
      rawConfigInput.value = rawConfig;
    }

    // Copy Action button label: Copy <PROTOCOL> Config
    if (copyLabel) {
      copyLabel.textContent = `Copy ${protocol} Config`;
    }

    // Populate legacy inputs if present
    const trojanEl = document.getElementById('vpn-trojan-link');
    const v2rayEl = document.getElementById('vpn-v2ray-link');
    if (trojanEl) trojanEl.value = rawConfig;
    if (v2rayEl) v2rayEl.value = rawConfig;

    // Apply custom modal settings if configured by admin
    if (window.LegionStore && window.LegionStore.getModalSettings) {
      const ms = window.LegionStore.getModalSettings();
      applyModalSettingsToDOM(ms);
      syncModalSettings().catch(() => {});
      const tag = document.getElementById('sg-modal-tag');
      if (tag && ms.sgStatusTag) tag.textContent = ms.sgStatusTag;
      const v = document.getElementById('sg-modal-validity');
      if (v && ms.sgValidityNotice) v.textContent = ms.sgValidityNotice;
      const s = document.getElementById('sg-modal-support-banner');
      if (s && ms.sgSupportBanner) s.textContent = ms.sgSupportBanner;
    }

    // Pulsing green glow animation on modal container
    if (modalBox) {
      modalBox.classList.add('neon-pulse-glow');
    }

    // Reveal modal
    configModal.classList.remove('hidden');
    configModal.classList.add('flex');
  }

  // --- Download Trojan Configuration as .txt file ---
  function downloadTrojanConfig() {
    if (!state.vpnConfig) return;
    const trojanLink = state.vpnConfig.trojan_link || "";
    const v2rayLink = state.vpnConfig.v2ray_link || "";
    const pkgName = state.vpnConfig.package_title || "LEGION Free VPN";
    const sessionCode = state.vpnConfig.connection_code || "SG-TROJAN";

    const fileContent = `=====================================================
LEGION FREE VPN - SINGAPORE HIGH-SPEED VPS NODE
Package: ${pkgName}
Session: ${sessionCode}
Protocol: Trojan (Port 443 HTTPS TLS) + V2Ray / VLESS
Generated At: ${new Date().toLocaleString()}
Notice: Free VPN has NO inbox support. Upgrade to VIP (LKR 250) for 24/7 dedicated support.
=====================================================

1. TROJAN CONFIGURATION LINK:
${trojanLink}

2. V2RAY / VLESS CONFIGURATION LINK:
${v2rayLink}

INSTRUCTIONS:
- Open v2rayNG (Android), Nekobox, Clash Meta, or v2rayN (Windows).
- Click '+' -> 'Import config from Clipboard' or paste the link above.
- Enjoy 100% Free Singapore High-Speed Browsing!
=====================================================`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LEGION_${sessionCode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded Trojan Config file (.txt)!", "success");
    triggerMobileHaptic();
  }

  // --- Reset Funnel Helper (9 Steps) ---
  function resetFunnel() {
    state.currentStep = 1;
    state.stepsCompleted = 0;
    state.isCooldown = false;
    state.pendingAd = null;
    if (state.cooldownInterval) {
      clearInterval(state.cooldownInterval);
      state.cooldownInterval = null;
    }

    for (let k = 1; k <= 9; k++) {
      state.stepClicks[k] = 0;
    }
    updateOverallProgress();

    for (let i = 1; i <= 9; i++) {
      const card = dom[`stepCard${i}`];
      const btn = dom[`stepBtn${i}`];
      const statusEl = dom[`stepStatus${i}`];
      const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
      const quota = STEP_QUOTAS[i] || 10;

      if (i === 1) {
        if (card) {
          card.classList.remove('opacity-40', 'pointer-events-none', 'border-emerald-500/60', 'bg-surface-300');
          card.classList.add('neon-border');
        }
        if (btn) {
          btn.disabled = false;
          btn.className = "w-full py-3.5 rounded-2xl bg-neon hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm tracking-wide m3-btn flex items-center justify-center gap-2 neon-glow";
          btn.innerHTML = `<span>${lang === 'si' ? `Ad එක Verify කරන්න (0/${quota})` : `Click to Verify Ad (0/${quota})`}</span>`;
        }
        if (statusEl) statusEl.innerHTML = `<span class="text-neon">${lang === 'si' ? 'Verify කිරීමට සූදානම්' : 'Ready to verify'}</span>`;
      } else {
        if (card) {
          card.classList.add('opacity-40', 'pointer-events-none');
          card.classList.remove('neon-border', 'border-emerald-500/60', 'bg-surface-300');
        }
        if (btn) {
          btn.disabled = true;
          btn.className = "w-full py-3.5 rounded-2xl bg-zinc-800 text-zinc-400 font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 cursor-not-allowed";
          btn.innerHTML = `<span>${lang === 'si' ? `${i-1} වන පියවරෙන් Unlock වේ` : `Unlock in Step ${i-1}`}</span>`;
        }
        if (statusEl) statusEl.innerHTML = `<span class="text-zinc-600">${lang === 'si' ? 'අගුළු දමා ඇත' : 'Locked'}</span>`;
      }
    }
  }

  // --- Dynamic Render of Public Servers (index.html only) ---
  function renderPublicServersGrid() {
    const grid = document.getElementById('public-servers-grid');
    if (!grid) return;
    
    try {
      const rawServers = (window.LegionStore && window.LegionStore.getPublicServers) 
        ? window.LegionStore.getPublicServers() 
        : DEFAULT_PUBLIC_SERVERS;
      const servers = getNormalizedPublicServers(rawServers);
        
      grid.innerHTML = '';
      
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

        const card = document.createElement('div');
        let borderClass = 'border-emerald-900/40 hover:border-emerald-500/60';
        if (isOffline) {
          borderClass = 'border-red-950/70 bg-surface-100/40 opacity-80';
        } else if (isMaintenance) {
          borderClass = 'border-amber-950/70 bg-surface-100/40 opacity-80';
        }
        card.className = `m3-surface-2 p-5 rounded-3xl border transition-all flex flex-col justify-between ${borderClass}`;
        
        const isInstantPublic = (state.publicSteps === 1);
        const unlockBtnText = isInstantPublic ? '⚡ 1 Ad Instant Unlock →' : '10 Ads Quick Unlock →';

        let pillHtml = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-300 border border-zinc-700 text-amber-400 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> ${srv.ping || '45ms Ping'}
        </span>`;
        if (isOffline) {
          pillHtml = `<span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Offline
          </span>`;
        } else if (isMaintenance) {
          pillHtml = `<span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Maintenance
          </span>`;
        }

        let btnHtml = `<button class="js-open-public-btn w-full py-3 rounded-2xl bg-surface-300 hover:bg-neon hover:text-black border border-emerald-900/50 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer" data-id="${srv.id || srv.country}" data-country="${srv.country}" data-code="${srv.flag}" data-ip="${srv.ip}" data-sni="${srv.sni}">
          <img src="https://flagcdn.com/w40/${srv.flag}.png" alt="${srv.country}" class="w-4 h-3 object-cover rounded-sm">
          <span>${unlockBtnText}</span>
        </button>`;
        if (isOffline) {
          btnHtml = `<button class="w-full py-3 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed opacity-80" disabled>
            <img src="https://flagcdn.com/w40/${srv.flag}.png" alt="${srv.country}" class="w-4 h-3 object-cover rounded-sm opacity-40">
            <span>🔴 Server Offline</span>
          </button>`;
        } else if (isMaintenance) {
          btnHtml = `<button class="w-full py-3 rounded-2xl bg-amber-950/30 border border-amber-900/50 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed opacity-80" disabled>
            <img src="https://flagcdn.com/w40/${srv.flag}.png" alt="${srv.country}" class="w-4 h-3 object-cover rounded-sm opacity-40">
            <span>🟠 Under Maintenance</span>
          </button>`;
        }

        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2.5">
                <img src="https://flagcdn.com/w80/${srv.flag}.png" srcset="https://flagcdn.com/w160/${srv.flag}.png 2x" width="36" height="24" alt="${srv.country} Flag" class="w-9 h-6 object-cover rounded-md shadow-md border border-white/15">
                <span class="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">${srv.flag}</span>
              </div>
              ${pillHtml}
            </div>
            <h3 class="text-lg font-bold text-white mb-1 flex items-center gap-2">${srv.country}</h3>
            <div class="text-xs font-mono text-neon mb-4">IP: ${srv.ip || '—'}</div>
          </div>
          ${btnHtml}
        `;
        grid.appendChild(card);
      });
    } catch (err) {
      console.error("[renderPublicServersGrid error]:", err);
    }
  }

  // --- Global Public Servers Modal State & Opener ---
  let currentPublicState = {
    id: '',
    country: '',
    flag: '',
    code: '',
    ip: '',
    adClicks: 0,
    turnstilePassed: false,
    isCooldown: false,
    pendingAd: null,
    selectedPackageKey: 'social'
  };

  function openPublicServerModal(target) {
    if (!target) return;
    const modal = document.getElementById('public-server-modal');
    if (!modal) return;

    const titleEl = document.getElementById('public-modal-title');
    const ipEl = document.getElementById('public-modal-ip');
    const flagEl = document.getElementById('public-modal-flag');
    const stepPkg = document.getElementById('public-step-pkg');
    const stepVerify = document.getElementById('public-step-verify');
    const stepResult = document.getElementById('public-step-result');
    const pkgSelect = document.getElementById('public-pkg-select');
    const btnStart = document.getElementById('public-btn-start');
    const turnstileCheckbox = document.getElementById('public-turnstile-checkbox');
    const turnstileText = document.getElementById('public-turnstile-text');
    const btnAd = document.getElementById('public-btn-ad');
    const adStatus = document.getElementById('public-ad-status');

    const srvId = target.getAttribute('data-id');
    currentPublicState.id = srvId;
    currentPublicState.country = target.getAttribute('data-country') || 'Germany';
    currentPublicState.flag = target.getAttribute('data-code') || 'de';
    currentPublicState.code = (target.getAttribute('data-code') || 'de').toLowerCase();
    currentPublicState.ip = target.getAttribute('data-ip') || '—';
    currentPublicState.adClicks = 0;
    currentPublicState.turnstilePassed = false;
    currentPublicState.isCooldown = false;
    currentPublicState.pendingAd = null;

    const ALL_PACKAGES = [
      { key: 'social', label: 'Dialog / Mobitel / Airtel / Hutch Social (20 GB)' },
      { key: 'tiktok', label: 'Dialog / Airtel TikTok Unlimited' },
      { key: 'youtube', label: 'Airtel / Dialog YouTube Unlimited' },
      { key: 'zoom', label: 'Airtel / Hutch Zoom (30 GB)' }
    ];

    if (pkgSelect) {
      pkgSelect.innerHTML = ALL_PACKAGES.map((p, idx) => 
        `<option value="${p.key}" ${idx === 0 ? 'selected' : ''}>${p.label}</option>`
      ).join('');
      pkgSelect.disabled = false;
    }

    if (btnStart) {
      btnStart.disabled = false;
      btnStart.classList.remove('opacity-50', 'cursor-not-allowed');
      const isInstantPublic = (state.publicSteps === 1);
      btnStart.innerHTML = isInstantPublic
        ? '<span>⚡ Confirm Package & 1-Ad Instant Unlock →</span>'
        : '<span>Confirm Package & Start Verification →</span>';
    }

    if (flagEl) {
      flagEl.src = `https://flagcdn.com/w80/${currentPublicState.code}.png`;
      flagEl.srcset = `https://flagcdn.com/w160/${currentPublicState.code}.png 2x`;
      flagEl.alt = `${currentPublicState.country} Flag`;
    }

    if (titleEl) titleEl.textContent = `${currentPublicState.country} Public Server`;
    if (ipEl) ipEl.textContent = currentPublicState.ip;
    
    if (stepPkg) stepPkg.classList.remove('hidden');
    if (stepVerify) stepVerify.classList.add('hidden');
    if (stepResult) stepResult.classList.add('hidden');
    
    if (turnstileCheckbox) turnstileCheckbox.innerHTML = '';
    if (turnstileText) turnstileText.textContent = "Verify you are human";
    if (btnAd) {
      btnAd.disabled = true;
      btnAd.classList.add('opacity-50', 'cursor-not-allowed', 'bg-zinc-800', 'text-zinc-400');
      btnAd.classList.remove('bg-neon', 'text-black', 'hover:bg-emerald-400');
      btnAd.innerHTML = '<span>Complete Turnstile First</span>';
    }
    const isInstantPublic = (state.publicSteps === 1);
    if (adStatus) {
      adStatus.textContent = isInstantPublic
        ? "Requires 1 Sponsored Impression (⚡ Instant Unlock)"
        : "Requires 10 Sponsored Impressions";
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
  }

  // --- Global Public Servers (10 Ads Quick Access) ---
  function initPublicServerModal() {
    const modal = document.getElementById('public-server-modal');
    const closeBtn = document.getElementById('close-public-modal');
    const titleEl = document.getElementById('public-modal-title');
    const ipEl = document.getElementById('public-modal-ip');
    
    const stepPkg = document.getElementById('public-step-pkg');
    const stepVerify = document.getElementById('public-step-verify');
    const stepResult = document.getElementById('public-step-result');
    const pkgSelect = document.getElementById('public-pkg-select');
    const btnStart = document.getElementById('public-btn-start');
    
    const turnstileBox = document.getElementById('public-turnstile-box');
    const turnstileCheckbox = document.getElementById('public-turnstile-checkbox');
    const turnstileText = document.getElementById('public-turnstile-text');
    const btnAd = document.getElementById('public-btn-ad');
    const adStatus = document.getElementById('public-ad-status');
    const publicPill = document.getElementById('public-progress-pill');
    
    const resultConfig = document.getElementById('public-result-config') || document.getElementById('public-vless-output');
    const btnCopy = document.getElementById('public-btn-copy') || (stepResult ? stepResult.querySelector('.js-copy-btn') : null);

    if (btnCopy) {
      btnCopy.addEventListener('click', (e) => {
        e.stopPropagation();
        const out = document.getElementById('public-result-config') || document.getElementById('public-vless-output');
        if (out) {
          copyTextToClipboard(out.value, btnCopy);
        }
      });
    }
    
    // Apply Modal Dynamic Settings from Store
    if (window.LegionStore && window.LegionStore.getModalSettings) {
      const ms = window.LegionStore.getModalSettings();
      const adv = document.getElementById('pub-modal-advisory');
      if (adv && ms.pubAdvisoryBanner) adv.textContent = ms.pubAdvisoryBanner;
      
      const upFree = document.getElementById('pub-modal-upsell-free');
      if (upFree && ms.pubUpsellPitch) upFree.textContent = ms.pubUpsellPitch;
      
      const upVip = document.getElementById('pub-modal-upsell-vip');
      if (upVip && ms.pubVipPitch) upVip.textContent = ms.pubVipPitch;
    }

    // Delegated Click Handler on Document: Always fires for any .js-open-public-btn
    if (!document._hasPublicServerBtnDelegation) {
      document._hasPublicServerBtnDelegation = true;
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.js-open-public-btn');
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          openPublicServerModal(btn);
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }, { capture: true });
    }

    // Step A -> Step B
    if (btnStart) {
      btnStart.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pkgSelect) {
          currentPublicState.selectedPackageKey = pkgSelect.value;
        }
        if (stepPkg) stepPkg.classList.add('hidden');
        if (stepVerify) stepVerify.classList.remove('hidden');
      }, { capture: true });
    }

    // Step B: Turnstile
    if (turnstileBox) {
      turnstileBox.addEventListener('click', () => {
        if (currentPublicState.turnstilePassed) return;
        if (turnstileCheckbox) turnstileCheckbox.innerHTML = '<div class="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>';
        if (turnstileText) turnstileText.textContent = "Verifying...";
        
        // Auto-resolve in 1.8s
        setTimeout(() => {
          currentPublicState.turnstilePassed = true;
          if (turnstileCheckbox) turnstileCheckbox.innerHTML = '<span class="text-emerald-400 font-bold text-sm">✓</span>';
          if (turnstileText) turnstileText.textContent = "Success";
          triggerMobileHaptic();
          
          const isInstantPublicNow = (state.publicSteps === 1);
          const currentQuota = isInstantPublicNow ? 1 : 10;
          if (btnAd) {
            btnAd.disabled = false;
            btnAd.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-zinc-800', 'text-zinc-400');
            btnAd.classList.add('bg-neon', 'text-black', 'hover:bg-emerald-400');
            btnAd.innerHTML = `<span>Click to Verify Ad (0/${currentQuota})</span>`;
          }
          if (adStatus) adStatus.textContent = `Click button to open sponsor (0/${currentQuota} ads verified)`;
        }, 1800);
      });
    }

    // Step B: 10 Ad Multi-Click logic with Strict 5-Second Viewing Verification
    if (btnAd) {
      btnAd.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!currentPublicState.turnstilePassed || currentPublicState.isCooldown || activeAdSession) return;

        // Trigger smartlink synchronously on user gesture
        triggerAdLink(1);

        const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
        const currentClicks = currentPublicState.adClicks;

        btnAd.disabled = true;
        btnAd.classList.add('opacity-85', 'cursor-not-allowed');

        let countdown = 5;
        const updatePublicCountdown = () => {
          const waitMsg = lang === 'si'
            ? `Ad එක බලන්න (${countdown}s)...`
            : `Watch Ad (${countdown}s)...`;
          btnAd.innerHTML = `<span>⏳ ${waitMsg}</span>`;
          if (adStatus) {
            adStatus.innerHTML = `<span class="text-amber-400 font-medium">⏳ ${lang === 'si' ? 'තප්පර 5ක් ad එකේ රැඳෙන්න...' : 'Stay on sponsor site for 5s...'}</span>`;
          }
        };
        updatePublicCountdown();

        if (adCountdownInterval) {
          clearInterval(adCountdownInterval);
          adCountdownInterval = null;
        }

        adCountdownInterval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            updatePublicCountdown();
          } else {
            clearInterval(adCountdownInterval);
            adCountdownInterval = null;
            if (!document.hidden && activeAdSession) {
              completeAdSessionIfEligible();
            }
          }
        }, 1000);

        activeAdSession = {
          startTime: Date.now(),
          onReset: () => {
            const isInstantPublicNow = (state.publicSteps === 1);
            const currentQuota = isInstantPublicNow ? 1 : 10;
            btnAd.disabled = false;
            btnAd.classList.remove('opacity-85', 'cursor-not-allowed');
            btnAd.innerHTML = `<span>Click to Verify Ad (${currentClicks}/${currentQuota})</span>`;
            if (adStatus) {
              adStatus.innerHTML = `<span class="text-neon font-medium">${currentClicks}/${currentQuota} Ads Verified.</span>`;
            }
          },
          onSuccess: () => {
            currentPublicState.adClicks++;
            const clicks = currentPublicState.adClicks;
            const isInstantPublicNow = (state.publicSteps === 1);
            const currentQuota = isInstantPublicNow ? 1 : 10;
            triggerMobileHaptic();

            if (clicks >= currentQuota) {
              // Ads Completed -> Keep public modal open, show Step C (stepResult), populate deliveredConfig
              if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                modal.style.display = 'flex';
              }
              if (stepVerify) stepVerify.classList.add('hidden');
              if (stepResult) stepResult.classList.remove('hidden');

              const pkgKey = currentPublicState.selectedPackageKey || 'social';
              const servers = (window.LegionStore && window.LegionStore.getPublicServers)
                ? window.LegionStore.getPublicServers()
                : DEFAULT_PUBLIC_SERVERS;
              const srv = servers.find(s => s && (s.id === currentPublicState.id || s.country === currentPublicState.country)) || servers[0];

              let baseConfig = (srv && srv.configs && (srv.configs[pkgKey] || srv.configs.social || Object.values(srv.configs)[0])) || '';
              if (!baseConfig && srv) {
                const ip = srv.ip || currentPublicState.ip || '141.94.33.194';
                const targetTag = `LEGION-${(srv.country || 'PUBLIC').toUpperCase()}-${pkgKey.toUpperCase()}`;
                baseConfig = `vless://${ip.replace(/\./g, '-')}-${(srv.flag || 'node')}@${ip}:443?encryption=none&security=tls&type=ws&host=${ip}&path=%2F#${encodeURIComponent(targetTag)}`;
              }

              const deliveredConfig = (window.LegionStore && window.LegionStore.injectPackageSni)
                ? window.LegionStore.injectPackageSni(baseConfig, pkgKey)
                : baseConfig;

              const resultOutput = document.getElementById('public-result-config') || document.getElementById('public-vless-output');
              if (resultOutput) {
                resultOutput.value = deliveredConfig;
              }

              const resultLabel = document.getElementById('public-result-label') || (stepResult ? stepResult.querySelector('label') : null);
              if (resultLabel) {
                resultLabel.textContent = `✓ Verification Complete (${clicks}/${currentQuota} Ads)`;
              }

              const copyBtnEl = document.getElementById('public-btn-copy') || (stepResult ? stepResult.querySelector('.js-copy-btn') : null);
              if (copyBtnEl) {
                copyBtnEl.onclick = (evt) => {
                  evt.preventDefault();
                  evt.stopPropagation();
                  copyTextToClipboard(deliveredConfig, copyBtnEl);
                };
              }

              if (typeof triggerCelebrationConfetti === 'function') {
                triggerCelebrationConfetti();
              }
              triggerMobileHaptic();

              const srvName = (srv && srv.country) ? srv.country : (currentPublicState.country || 'Public Server');
              showToast(`🎉 Verification Complete! ${srvName} node unlocked.`, "success");
              return;
            }

            btnAd.disabled = false;
            btnAd.classList.remove('opacity-85', 'cursor-not-allowed');
            btnAd.innerHTML = `<span>Click to Verify Ad (${clicks}/${currentQuota})</span>`;
            if (adStatus) adStatus.innerHTML = `<span class="text-neon font-medium">${clicks}/${currentQuota} Ads Verified.</span>`;
            showToast(`✓ Ad Verified (${clicks}/${currentQuota})`, "success");
          }
        };
      });
    }
  }

  // --- Copy to Clipboard helper with cross-browser fallback ---
  function copyTextToClipboard(text, btnEl) {
    if (!text) return;
    function showCopyFeedback() {
      if (btnEl) {
        const originalHtml = btnEl.innerHTML;
        btnEl.innerHTML = `<span class="text-black font-extrabold">✓ Copied!</span>`;
        btnEl.classList.remove('bg-neon');
        btnEl.classList.add('bg-emerald-400', 'scale-[1.02]');
        setTimeout(() => {
          btnEl.innerHTML = originalHtml;
          btnEl.classList.add('bg-neon');
          btnEl.classList.remove('bg-emerald-400', 'scale-[1.02]');
        }, 2200);
      }
      showToast("Config copied to clipboard!", "success");
      triggerMobileHaptic();
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(showCopyFeedback).catch(() => {
        fallbackExecCopy(text, showCopyFeedback);
      });
    } else {
      fallbackExecCopy(text, showCopyFeedback);
    }
  }

  function fallbackExecCopy(text, callback) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const ok = document.execCommand('copy');
      if (ok && callback) {
        callback();
      } else {
        prompt("Copy to clipboard manually: Ctrl+C, Enter", text);
      }
    } catch (e) {
      prompt("Copy to clipboard manually: Ctrl+C, Enter", text);
    }
    document.body.removeChild(textarea);
  }

  function setupCopyButtons() {
    // Master 1-Click Copy Button
    const masterCopyBtn = document.getElementById('btn-copy-master-config');
    if (masterCopyBtn) {
      masterCopyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rawInput = document.getElementById('vpn-master-config-raw');
        const text = (rawInput && rawInput.value)
          ? rawInput.value
          : (window.LegionStore && window.LegionStore.getMasterConfig ? window.LegionStore.getMasterConfig() : '');
        copyTextToClipboard(text, masterCopyBtn);
      }, { capture: true });
    }

    // Generic .js-copy-btn buttons
    document.querySelectorAll('.js-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const text = targetEl.value || targetEl.textContent;
          copyTextToClipboard(text, btn);
        }
      }, { capture: true });
    });

    const downloadBtn = document.getElementById('btn-download-trojan');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadTrojanConfig();
      }, { capture: true });
    }
  }

  // DOM Content Loaded Handler
  document.addEventListener('DOMContentLoaded', () => {
    try { initDOM(); } catch (e) { console.warn('initDOM:', e); }
    try { initAntiClickjackingSentinel(); } catch (e) { console.warn('sentinel:', e); }
    try { initTabVisibilityTracker(); } catch (e) { console.warn('visibility:', e); }
    try { initBackNavigationTrap(); } catch (e) { console.warn('backtrap:', e); }
    try { initLenis(); } catch (e) { console.warn('lenis:', e); }
    try { initVideoBackground(); } catch (e) { console.warn('video:', e); }
    try { initLivePingTicker(); } catch (e) { console.warn('ping:', e); }
    try { initGlobalPopunder(); } catch (e) { console.warn('popunder:', e); }
    try { initSocialBar(); } catch (e) { console.warn('socialbar:', e); }
    try { initAdRulesModal(); } catch (e) { console.warn('adrules:', e); }
    try { initTurnstileBoxClick(); } catch (e) { console.warn('turnstile:', e); }

    // RENDER IMMEDIATE FALLBACK / CACHED ITEMS INSTANTLY (No Blank Containers!)
    try { renderPublicServersGrid(); } catch (e) { console.error('renderPublicServersGrid:', e); }
    try { renderPackages(); } catch (e) { console.error('renderPackages:', e); }

    // Background Async Sync Operations
    try { syncGlobalSettings(); } catch (e) { console.warn('syncGlobalSettings:', e); }
    try { syncFunnelSettings(); } catch (e) { console.warn('syncFunnelSettings:', e); }
    try { syncPublicServers(); } catch (e) { console.warn('syncPublicServers:', e); }
    try { syncModalSettings(); } catch (e) { console.warn('syncModalSettings:', e); }
    try { initPublicServerModal(); } catch (e) { console.warn('initPublicServerModal:', e); }
    try { setupCopyButtons(); } catch (e) { console.warn('setupCopyButtons:', e); }
    try { updateOverallProgress(); } catch (e) { console.warn('updateOverallProgress:', e); }
    try { restoreVerificationProgress(); } catch (e) { console.warn('restoreVerificationProgress:', e); }
    try { sendTelemetryLog({ event: 'page_view', path: window.location.pathname }); } catch (e) {}

    // Parse ?pkg= from URL if present (e.g., on claim.html)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const initialPkgId = urlParams.get('pkg');
      if (initialPkgId) {
        const foundPkg = (window.LegionStore && window.LegionStore.getPackageById)
          ? window.LegionStore.getPackageById(initialPkgId)
          : DEFAULT_PACKAGES.find(p => p.id === initialPkgId || p.id === 'pkg_' + initialPkgId);
        if (foundPkg) {
          state.selectedPackage = foundPkg;
        }
      }
      if (!state.selectedPackage) {
        const allPkgs = (window.LegionStore && window.LegionStore.getPackages)
          ? window.LegionStore.getPackages()
          : DEFAULT_PACKAGES;
        const normPkgs = getNormalizedPackages(allPkgs);
        if (normPkgs && normPkgs.length > 0) {
          state.selectedPackage = normPkgs[0];
        }
      }
      
      // If on claim page, update the package banner immediately
      if (state.selectedPackage) {
        const titleEl = document.getElementById('claim-pkg-title');
        const descEl = document.getElementById('claim-pkg-desc');
        const priceEl = document.getElementById('claim-pkg-price');
        const simEl = document.getElementById('claim-pkg-sim');

        if (titleEl) titleEl.textContent = state.selectedPackage.title;
        if (descEl) descEl.textContent = state.selectedPackage.desc || 'High-speed Trojan protocol configuration.';
        if (priceEl) priceEl.textContent = state.selectedPackage.ispPrice || 'Free VPS Slot';
        if (simEl) simEl.textContent = '📶 ' + (state.selectedPackage.simType || 'Mobile Sim');
      }
    } catch (e) {
      console.warn('Package URL parameter init warning:', e);
    }

    // Attach unified 9-step click handlers (Immediate synchronous direct link trigger!)
    for (let i = 1; i <= 9; i++) {
      const btn = dom[`stepBtn${i}`];
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleStepClick(i);
        }, { capture: true });
      }
    }

    // Modal close handler
    if (dom.closeConfigModal) {
      dom.closeConfigModal.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dom.configModal) {
          dom.configModal.classList.add('hidden');
          dom.configModal.classList.remove('flex');
        }
      }, { capture: true });
    }

    // Scroll to packages CTA
    const startClaimBtns = document.querySelectorAll('.js-scroll-claim');
    startClaimBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const section = document.getElementById('packages-selection-section');
        if (section) {
          if (window.lenisInstance) {
            window.lenisInstance.scrollTo(section);
          } else {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, { capture: true });
    });
  });

  // Export public app helpers
  window.LegionApp = {
    showToast: showToast,
    showWarningModal: showWarningPopupModal,
    showWarningPopupModal: showWarningPopupModal,
    getCurrentSteps: () => (state.stepsCompleted || 0),
    resetFunnel: resetFunnel,
    renderPackages: renderPackages,
    renderPublicServersGrid: renderPublicServersGrid,
    getNormalizedPackages: getNormalizedPackages,
    getNormalizedPublicServers: getNormalizedPublicServers,
    checkAndShowRulesModal: checkAndShowRulesModal,
    acceptAdRules: () => {
      const btn = document.getElementById('btn-accept-ad-rules');
      if (btn) btn.click();
    }
  };
})();



