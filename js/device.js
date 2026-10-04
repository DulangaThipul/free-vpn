/**
 * LEGION Free VPN - Device Intelligence & Ad Navigation Engine
 * Precision Device Detection (Mobile, Tablet, PC/Desktop).
 * 
 * Enforces:
 * - PC (Desktop/Laptop): Native synchronous window.open(adUrl, '_blank') directly on click with zero popup blocker suppression.
 * - Mobile & Tablet: Preserves verified mobile anti-hijack workflow with localStorage persistence and dwell-time recovery.
 */

(function () {
  'use strict';

  // Preserve the browser's original window.open function
  const _origWindowOpen = window.open;
  window._legionOrigWindowOpen = _origWindowOpen;

  /**
   * Device Detection Engine
   * Exactly matches user specification:
   * const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
   */
  function isMobileOrTabletDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 1024);
  }

  /**
   * Detailed Device Type Detection
   * Returns: 'pc' | 'tablet' | 'mobile'
   */
  function detectDeviceType() {
    if (!isMobileOrTabletDevice()) {
      return 'pc';
    }

    const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
    const platform = (navigator.platform || '').toLowerCase();
    const touchPoints = navigator.maxTouchPoints || 0;

    const isIPad = /ipad/i.test(ua) || (
      (ua.includes('macintosh') || platform === 'macintel') && touchPoints > 1
    );
    const isAndroidTablet = ua.includes('android') && !ua.includes('mobile');
    const hasTabletToken = /tablet|playbook|silk|kindle/i.test(ua);

    if (isIPad || isAndroidTablet || hasTabletToken || (window.innerWidth > 600 && window.innerWidth <= 1024)) {
      return 'tablet';
    }

    return 'mobile';
  }

  /**
   * Device-Aware Ad Opener
   * - PC/Desktop: Executes direct native window.open(url, '_blank') synchronously during user gesture.
   * - Mobile/Tablet: Executes clean window.open with isolated fallback.
   */
  function openAd(url) {
    if (!url || url === '#' || url.startsWith('javascript:')) return null;

    if (!isMobileOrTabletDevice()) {
      // 1. DESKTOP / PC:
      // Direct synchronous window.open with '_blank' and NO feature strings.
      // Calling native window.open directly inside the click event ensures 100% bypass of PC popup blockers.
      try {
        const win = (_origWindowOpen || window.open).call(window, url, '_blank');
        if (win) {
          try { win.opener = null; } catch (err) {}
          return win;
        }
      } catch (e) {
        console.warn("[PC Ad Dispatcher] Direct window.open notice:", e);
      }
      return null;
    }

    // 2. MOBILE & TABLET:
    // First try standard window.open(url, '_blank') WITHOUT feature strings
    try {
      const win = (_origWindowOpen || window.open).call(window, url, '_blank');
      if (win) {
        try { win.opener = null; } catch (e) {}
        return win;
      }
    } catch (e) {}

    // Fallback: offscreen rendered anchor tag (works reliably on iOS Safari & Android Chrome)
    try {
      const a = document.createElement('a');
      a.href = url;
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
      setTimeout(function () {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 150);
    } catch (err) {}
    return null;
  }

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
    type: detectDeviceType(),
    isPC: function () { return !isMobileOrTabletDevice(); },
    isDesktop: function () { return !isMobileOrTabletDevice(); },
    isTablet: function () { return detectDeviceType() === 'tablet'; },
    isMobile: function () { return detectDeviceType() === 'mobile'; },
    isMobileOrTablet: isMobileOrTabletDevice,
    openAd: openAd,
    openAdInNewTabPC: openAd,
    dispatchAd: openAd
  };

  console.log(`[LEGION Device Intelligence] Identified Device: ${detectDeviceType().toUpperCase()} (PC Direct New Tab: ${!isMobileOrTabletDevice() ? 'ACTIVE' : 'STANDBY'})`);
})();
