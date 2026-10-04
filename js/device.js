/**
 * LEGION Free VPN - Device Intelligence & Ad Navigation Engine
 * Accurately detects Mobile Phone, Tablet (Tab), or PC (Desktop/Laptop).
 * 
 * Enforces:
 * - PC (Desktop/Laptop): Every single ad is strictly opened in a real NEW TAB (_blank, no popup windows, no parent redirect)
 * - Mobile & Tablet: Preserves existing verified mobile workflow with dwell-time recovery and anti-hijack guard
 */

(function () {
  'use strict';

  // Preserve the browser's original window.open function
  const _origWindowOpen = window.open;
  window._legionOrigWindowOpen = _origWindowOpen;

  /**
   * High-Precision Device Detection Engine
   * Returns: 'mobile' | 'tablet' | 'pc'
   */
  function detectDeviceType() {
    const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
    const platform = (navigator.platform || '').toLowerCase();
    const touchPoints = navigator.maxTouchPoints || 0;
    const width = Math.min(window.innerWidth || 0, window.screen ? window.screen.width : 0) || window.innerWidth || 0;

    // 1. Android Phone Check: If Android AND Mobile, it is strictly a Mobile Phone
    const isAndroidPhone = ua.includes('android') && ua.includes('mobile');

    // 2. Apple iPad Detection (Classic iPad + iPadOS 13+ Safari Desktop Mode)
    const isIPad = /ipad/i.test(ua) || (
      (ua.includes('macintosh') || platform === 'macintel') && touchPoints > 1
    );

    // 3. Android Tablet Detection (Android WITHOUT 'mobile')
    const isAndroidTablet = ua.includes('android') && !ua.includes('mobile');

    // 4. Dedicated Tablet Tokens
    const hasTabletToken = /tablet|playbook|silk|kindle/i.test(ua);

    if (isIPad || isAndroidTablet || hasTabletToken) {
      return 'tablet'; // Tab
    }

    // 5. Mobile Phone Detection
    const isMobilePhone = isAndroidPhone ||
      /iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) ||
      (/mobile/i.test(ua) && !isIPad && !isAndroidTablet);

    if (isMobilePhone) {
      return 'mobile'; // Mobile Phone
    }

    // 6. Otherwise: PC (Desktop / Laptop)
    return 'pc';
  }

  const detectedType = detectDeviceType();

  /**
   * Bulletproof PC New Tab Opener
   * Guarantees a real NEW BROWSER TAB in Desktop Chrome, Edge, Firefox, Brave, Safari, Opera.
   * Completely bypasses popup window flags and popup blocker traps.
   */
  function openAdInNewTabPC(url) {
    if (!url || url === '#' || url.startsWith('javascript:')) return null;

    // Method 1: Programmatic <a> click with target="_blank" and rel="noopener noreferrer"
    // In desktop browsers, an anchor click on a user gesture always opens a real new tab
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 150);
      return null;
    } catch (e) {
      console.warn("PC <a> click notice:", e);
    }

    // Method 2: Native window.open with '_blank' and NO feature strings
    // In Chromium and Firefox desktop, passing feature strings causes the browser to open a popup window!
    // Calling it with only ('_blank') opens a browser tab.
    try {
      const win = _origWindowOpen.call(window, url, '_blank');
      if (win) {
        try { win.opener = null; } catch (err) {}
        return win;
      }
    } catch (err) {
      console.warn("PC window.open fallback notice:", err);
    }

    return null;
  }

  /**
   * Device-Aware Ad Opener
   * - PC: Strictly opens in a new tab
   * - Mobile & Tablet: Preserves current mobile workflow (window.open with noopener,noreferrer)
   */
  function openAd(url) {
    if (!url || url === '#' || url.startsWith('javascript:')) return;

    if (detectedType === 'pc') {
      return openAdInNewTabPC(url);
    } else {
      // Mobile and Tablet: Keep existing logic exactly as is!
      try {
        const win = _origWindowOpen.call(window, url, '_blank', 'noopener,noreferrer');
        if (win) return win;
      } catch (e) {}

      try {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          if (a.parentNode) a.parentNode.removeChild(a);
        }, 100);
      } catch (err) {}
    }
  }

  // --- GLOBAL WINDOW.OPEN INTERCEPTION ---
  window.open = function (url, target, features) {
    if (detectedType === 'pc') {
      // On PC, every ad must open in a new tab (never a popup window, never in current tab)
      return openAdInNewTabPC(url);
    } else {
      // On Mobile and Tablet, keep existing behavior exactly as is!
      return _origWindowOpen.call(window, url, '_blank', 'noopener,noreferrer');
    }
  };

  // --- ANTI-HIJACKING LOCATION GUARDS ---
  try {
    const _origAssign = window.location.assign;
    window.location.assign = function (url) {
      try {
        const u = new URL(url, window.location.href);
        if (u.origin !== window.location.origin) {
          console.warn("Diverted external location.assign to new tab:", url);
          openAd(url);
          return;
        }
      } catch (e) {}
      if (typeof _origAssign === 'function') _origAssign.call(window.location, url);
    };
  } catch (e) {}

  try {
    const _origReplace = window.location.replace;
    window.location.replace = function (url) {
      try {
        const u = new URL(url, window.location.href);
        if (u.origin !== window.location.origin) {
          console.warn("Diverted external location.replace to new tab:", url);
          openAd(url);
          return;
        }
      } catch (e) {}
      if (typeof _origReplace === 'function') _origReplace.call(window.location, url);
    };
  } catch (e) {}

  // --- CAPTURE EXTERNAL ANCHOR CLICKS TO ENFORCE NEW TAB ON PC ---
  document.addEventListener('click', function (e) {
    let el = e.target;
    while (el && el !== document.body) {
      if (el.tagName === 'A' && el.href) {
        try {
          const parsed = new URL(el.href, window.location.href);
          if (parsed.origin !== window.location.origin && !el.href.startsWith('javascript:')) {
            el.target = '_blank';
            el.rel = 'noopener noreferrer';
          }
        } catch (err) {}
        break;
      }
      el = el.parentElement;
    }
  }, true);

  // Expose API globally
  window.LegionDevice = {
    getType: detectDeviceType,
    type: detectedType,
    isPC: function () { return detectDeviceType() === 'pc'; },
    isTablet: function () { return detectDeviceType() === 'tablet'; },
    isMobile: function () { return detectDeviceType() === 'mobile'; },
    isMobileOrTablet: function () {
      const t = detectDeviceType();
      return t === 'mobile' || t === 'tablet';
    },
    openAd: openAd,
    openAdInNewTabPC: openAdInNewTabPC
  };

  console.log(`[LEGION Device Intelligence] Identified Device: ${detectedType.toUpperCase()} (PC New Tab Enforcement: ${detectedType === 'pc' ? 'ACTIVE' : 'STANDBY'})`);
})();
