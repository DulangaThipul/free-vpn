/**
 * LEGION Free VPN - Advanced Security, Anti-Tamper & AdBlock Detection Suite
 * 
 * Features:
 * 1. Multi-Vector AdBlocker & Private DNS Detection (Real Network Probe + DOM Bait + Script Trap)
 * 2. Brave Browser Shield Detection
 * 3. Aggressive Anti-DevTools & Inspector Blocker (Debugger Loop Trap, Dimensional Delta, Console Getter, Keyblock)
 * 4. Tamper-Proof Anti-Deletion Observer (Guards against DevTools element deletion & CSS bypasses)
 */

(function () {
  'use strict';

  // Global Security Registry
  const securityState = {
    isLocked: false,
    activeModalId: null,
    devtoolsDetected: false,
    braveDetected: false,
    adblockDetected: false
  };

  // Helper: Enforce CSS & DOM Lockdown
  function lockInterface(modalId) {
    securityState.isLocked = true;
    securityState.activeModalId = modalId;

    // Add locking class to both html and body
    document.documentElement.classList.add('security-locked');
    document.body.classList.add('security-locked');

    // Ensure the required modal exists in the DOM
    ensureModalExists(modalId);

    // Synchronize modal visibility
    const allModals = ['adblock-modal', 'brave-blocker-modal', 'devtools-blocker-modal'];
    allModals.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        if (id === modalId) {
          el.classList.remove('hidden');
          el.classList.add('flex', 'modal-security-critical');
          el.style.display = 'flex';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
        } else {
          el.classList.add('hidden');
          el.classList.remove('flex', 'modal-security-critical');
          el.style.display = 'none';
        }
      }
    });
  }

  // Fallback Modal Generator if modal is missing or deleted from DOM
  function ensureModalExists(modalId) {
    if (document.getElementById(modalId)) return;

    const modalWrapper = document.createElement('div');
    modalWrapper.id = modalId;
    modalWrapper.className = 'fixed inset-0 z-[9999999] modal-glass flex items-center justify-center p-3 sm:p-4 modal-security-critical';

    if (modalId === 'devtools-blocker-modal') {
      modalWrapper.innerHTML = `
        <div class="m3-surface-2 p-6 sm:p-8 rounded-3xl border border-red-500/70 max-w-md w-full text-center shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-950/40 border border-red-500/50 text-red-400 mx-auto flex items-center justify-center mb-4">
            <svg class="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-white flex flex-col items-center gap-1">
            <span class="text-red-500">⚠️ Developer Options Strictly Blocked</span>
          </h2>
          <div class="space-y-3 mt-3 text-left bg-surface-100 p-4 rounded-2xl border border-red-950/80">
            <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              <strong>Warning:</strong> Developer Tools, Inspect Element, and DOM tampering are strictly prohibited on this portal to prevent service abuse.
            </p>
          </div>
          <p class="text-xs text-red-400 font-semibold mt-3 p-2.5 bg-red-950/40 rounded-xl border border-red-900/60 text-center">
            Please close Developer Tools and reload the page.
          </p>
          <button onclick="window.location.reload()" class="w-full mt-5 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm m3-btn">
            Reload Page
          </button>
        </div>
      `;
    } else if (modalId === 'brave-blocker-modal') {
      modalWrapper.innerHTML = `
        <div class="m3-surface-2 p-6 sm:p-8 rounded-3xl border border-orange-500/70 max-w-md w-full text-center shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-orange-950/40 border border-orange-500/50 text-orange-400 mx-auto flex items-center justify-center mb-4">
            <svg class="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-white flex flex-col items-center gap-1">
            <span class="text-orange-400">Brave Browser Not Supported</span>
          </h2>
          <div class="space-y-3 mt-3 text-left bg-surface-100 p-4 rounded-2xl border border-orange-950/80">
            <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              Brave Browser automatically activates built-in Shields that block the sponsored advertisements required to fund and maintain our free Singapore VPN servers.
            </p>
          </div>
          <p class="text-xs text-orange-400 font-semibold mt-3 p-2.5 bg-orange-950/40 rounded-xl border border-orange-900/60 text-center">
            Please switch to <strong>Google Chrome, Microsoft Edge, Firefox, or Safari</strong> to continue.
          </p>
        </div>
      `;
    } else if (modalId === 'adblock-modal') {
      modalWrapper.innerHTML = `
        <div class="m3-surface-2 p-6 sm:p-8 rounded-3xl border border-red-500/70 max-w-md w-full text-center shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-950/40 border border-red-500/50 text-red-400 mx-auto flex items-center justify-center mb-4">
            <svg class="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-white flex flex-col items-center gap-1">
            <span class="text-red-400" data-i18n="modal_adblock_title">Ad Blocker or Private DNS Detected</span>
          </h2>
          <div class="space-y-3 mt-3 text-left bg-surface-100 p-4 rounded-2xl border border-red-950/80">
            <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans" data-i18n="modal_adblock_desc">
              Our Singapore VPS servers are funded purely through sponsored advertisements. Free VPN access is blocked while an AdBlocker, NextDNS, or AdGuard Private DNS is active.
            </p>
          </div>
          <p class="text-xs text-emerald-400 font-semibold mt-3 p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-900/60 text-center" data-i18n="modal_adblock_tip">
            Please disable your AdBlocker or Private DNS and click Reload.
          </p>
          <button onclick="window.LegionSecurity.recheckAdBlock()" class="w-full mt-5 py-3.5 rounded-2xl bg-neon hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm m3-btn" data-i18n="modal_adblock_btn">
            I Have Disabled AdBlocker - Reload
          </button>
        </div>
      `;
    }

    document.body.appendChild(modalWrapper);
  }

  // --- 1. AGGRESSIVE ANTI-DEVTOOLS & INSPECT BLOCKER ---
  function initAntiDevTools() {
    // A. Disable Context Menu
    window.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      return false;
    }, { capture: true });

    // B. Block Shortcuts (F12, Ctrl+Shift+I/J/C/K/E, Ctrl+U, Ctrl+S, Mac Cmd equivalents)
    window.addEventListener('keydown', function (e) {
      const code = e.keyCode || e.which;
      const key = e.key;

      // F12 Key
      if (key === 'F12' || code === 123) {
        e.preventDefault();
        e.stopPropagation();
        triggerDevToolsWarning();
        return false;
      }

      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      if (ctrlOrCmd) {
        // Inspect / DevTools shortcuts (Ctrl+Shift+I / J / C / K / E)
        if (shift && (key === 'I' || key === 'i' || key === 'J' || key === 'j' || key === 'C' || key === 'c' || key === 'K' || key === 'k' || key === 'E' || key === 'e' || code === 73 || code === 74 || code === 67 || code === 75 || code === 69)) {
          e.preventDefault();
          e.stopPropagation();
          triggerDevToolsWarning();
          return false;
        }

        // View Source (Ctrl+U) & Save Page (Ctrl+S)
        if (key === 'u' || key === 'U' || key === 's' || key === 'S' || code === 85 || code === 83) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    }, { capture: true });

    // C. Dimensional Delta Check (Detects docked DevTools)
    const threshold = 175;
    function checkDimensions() {
      // Exclude mobile browsers where mobile viewport height shifts due to navigation bar
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (!isMobile) {
        const widthDelta = window.outerWidth - window.innerWidth > threshold;
        const heightDelta = window.outerHeight - window.innerHeight > threshold;
        if (widthDelta || heightDelta) {
          triggerDevToolsWarning();
        }
      }
    }

    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkDimensions, 200);
    });
    setInterval(checkDimensions, 1000);

    // D. Debugger Loop Trap ("developer tab එක block කරන්න හැම විදිහකටම")
    // When DevTools is OPEN, browser pauses on debugger constructor in Sources panel.
    // Every time user resumes, it hits the trap again (every 250ms), blocking inspection.
    // Also, performance.now() measures how long it took: > 100ms means DevTools paused it!
    function debuggerLoopTrap() {
      const t0 = performance.now();
      (function () {}.constructor('debugger')());
      const elapsed = performance.now() - t0;

      if (elapsed > 100) {
        triggerDevToolsWarning();
      }
    }
    setInterval(debuggerLoopTrap, 250);

    // E. Console Object Getter Trap (Detects undocked or open console)
    const baitObj = new Image();
    Object.defineProperty(baitObj, 'id', {
      get: function () {
        triggerDevToolsWarning();
        return 'trap';
      }
    });

    setInterval(function () {
      try {
        console.log('%c', baitObj);
        console.clear();
      } catch (err) {}
    }, 1500);
  }

  function triggerDevToolsWarning() {
    securityState.devtoolsDetected = true;
    lockInterface('devtools-blocker-modal');
  }

  // --- 2. ANTI-TAMPER MUTATION OBSERVER & SENTINEL ---
  // If a user in Brave/Chrome uses DevTools or scripts to delete the blocker modal,
  // the observer immediately blanks the body and reloads the page!
  function initAntiTamperObserver() {
    const observer = new MutationObserver(function (mutations) {
      if (!securityState.isLocked) return;

      // 1. Check if 'security-locked' class was removed from html or body
      if (!document.documentElement.classList.contains('security-locked') || !document.body.classList.contains('security-locked')) {
        document.documentElement.classList.add('security-locked');
        document.body.classList.add('security-locked');
      }

      // 2. Check if the active modal was removed from DOM or hidden
      const activeId = securityState.activeModalId;
      if (activeId) {
        const modal = document.getElementById(activeId);
        if (!modal || modal.classList.contains('hidden') || modal.style.display === 'none') {
          // Tamper detected! Nuke body to prevent access
          document.body.innerHTML = '<div style="background:#000000;color:#ff3333;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;text-align:center;padding:20px;">' +
            '<h1 style="font-size:24px;font-weight:bold;margin-bottom:12px;">⚠️ SECURITY TAMPERING DETECTED</h1>' +
            '<p style="color:#ffffff;font-size:14px;max-width:400px;line-height:1.6;">DOM elements were modified or removed. Reloading site security...</p>' +
            '</div>';
          setTimeout(function () {
            window.location.reload();
          }, 600);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden']
    });

    // Heartbeat verification every 500ms
    setInterval(function () {
      if (securityState.isLocked && securityState.activeModalId) {
        const modal = document.getElementById(securityState.activeModalId);
        if (!modal || modal.classList.contains('hidden') || modal.style.display === 'none') {
          window.location.reload();
        }
      }
    }, 500);
  }

  // --- 3. BRAVE BROWSER DETECTION ---
  async function checkBraveBrowser() {
    try {
      if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
        const isBrave = await navigator.brave.isBrave();
        if (isBrave) {
          securityState.braveDetected = true;
          lockInterface('brave-blocker-modal');
          return true;
        }
      }
    } catch (e) {
      console.warn("Brave check error:", e);
    }
    return false;
  }

  // --- 4. ULTIMATE MULTI-VECTOR ADBLOCKER & PRIVATE DNS DETECTION ---
  function triggerAdBlock() {
    if (securityState.devtoolsDetected || securityState.braveDetected) return;
    securityState.adblockDetected = true;
    lockInterface('adblock-modal');
  }

  // Vector 1: DOM Cosmetic Bait
  function checkDomBait() {
    try {
      const bait = document.createElement('div');
      bait.id = 'banner-ad-sponsor';
      bait.className = 'ad ads adsbox ad-placement doubleclick ad-placeholder BannerAd text-ad pub_300x250 pub_728x90 sponsor-post ad-slot';
      bait.innerHTML = '&nbsp;';
      bait.style.setProperty('position', 'absolute', 'important');
      bait.style.setProperty('top', '-9999px', 'important');
      bait.style.setProperty('left', '-9999px', 'important');
      bait.style.setProperty('width', '10px', 'important');
      bait.style.setProperty('height', '10px', 'important');
      bait.style.setProperty('pointer-events', 'none', 'important');
      document.body.appendChild(bait);

      const styles = window.getComputedStyle(bait);
      const isBlocked = (
        bait.offsetHeight === 0 ||
        bait.offsetWidth === 0 ||
        bait.clientHeight === 0 ||
        styles.display === 'none' ||
        styles.visibility === 'hidden' ||
        styles.opacity === '0'
      );
      if (bait.parentNode) {
        document.body.removeChild(bait);
      }
      return isBlocked;
    } catch (e) {
      return false;
    }
  }

  // Vector 2: Local Bait Files (advertisement.js / ads.js)
  function checkBaitFiles() {
    if (window.__adblock_detector_passed !== true && window.__legion_ads_js_loaded !== true) {
      return true;
    }
    return false;
  }

  // Vector 3: Real Ad Domain Network Probes (Catches NextDNS, AdGuard DNS, Pi-hole, ControlD)
  async function checkNetworkAdBlock() {
    const probeUrls = [
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
      'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
      'https://bellnewyork.org/22/08fcf6f647e8306da74abc152fa8f88f',
      'https://adservice.google.com/adsid/integrator.js'
    ];

    for (const url of probeUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (err) {
        return true;
      }
    }
    return false;
  }

  // Vector 4: Live Ad Slot Container Verification (Empty Container Detection)
  function checkLiveAdSlots() {
    const adBoxes = document.querySelectorAll('.ad-slot-box');
    if (!adBoxes || adBoxes.length === 0) return false;
    
    let hasRenderedAd = false;
    adBoxes.forEach(function (box) {
      const iframes = box.querySelectorAll('iframe');
      if (iframes.length > 0) {
        iframes.forEach(function (ifr) {
          if (ifr.offsetHeight > 0 || ifr.offsetWidth > 0) {
            hasRenderedAd = true;
          }
        });
      }
    });
    return !hasRenderedAd;
  }

  async function checkAdBlocker() {
    if (securityState.braveDetected || securityState.devtoolsDetected) return;

    // Check pre-triggered flag
    if (window.__ad_blocked_detected === true) {
      triggerAdBlock();
      return;
    }

    // 1. Check DOM bait
    if (checkDomBait()) {
      triggerAdBlock();
      return;
    }

    // 2. Check Bait files
    if (checkBaitFiles()) {
      triggerAdBlock();
      return;
    }

    // 3. Check Network (DNS & Network level blocks)
    const netBlocked = await checkNetworkAdBlock();
    if (netBlocked) {
      triggerAdBlock();
      return;
    }
  }

  // Set an aggressive interval to catch adblockers toggled on late
  setInterval(() => {
    if (!securityState.adblockDetected && !securityState.devtoolsDetected && !securityState.braveDetected) {
      checkAdBlocker();
    }
  }, 2500);

  // --- INITIALIZATION ---
  function initSuite() {
    initAntiDevTools();
    initAntiTamperObserver();

    // Check for Brave first, then check AdBlocker
    checkBraveBrowser().then(function (isBrave) {
      if (!isBrave) {
        checkAdBlocker();
      }
    });

    // Verification check after 2 seconds for live ad slots
    setTimeout(function () {
      if (!securityState.isLocked && !securityState.braveDetected && !securityState.devtoolsDetected) {
        if (checkLiveAdSlots()) {
          triggerAdBlock();
        }
      }
    }, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSuite);
  } else {
    initSuite();
  }

  // Public Interface
  window.LegionSecurity = {
    triggerAdBlock: triggerAdBlock,
    recheckAdBlock: function () {
      window.location.reload();
    },
    getState: function () {
      return Object.assign({}, securityState);
    }
  };
})();
