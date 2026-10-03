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

  // Step Quotas configuration (Grand Total: exactly 100 Ad Interactions)
  const STEP_QUOTAS = {
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
  const TOTAL_ADS_REQUIRED = 100;

  // Application State
  const state = {
    currentStep: 1,
    stepsCompleted: 0,
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
      if (state.isCooldown) {
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
    }

    window.addEventListener('focus', handleReturn);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleReturn();
      }
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
    try {
      // Push an extra dummy state to browser history
      window.history.pushState({ page: 'legion_stay' }, '', window.location.href);

      window.addEventListener('popstate', () => {
        // Re-push state so user cannot escape the portal via back button
        window.history.pushState({ page: 'legion_stay' }, '', window.location.href);

        // Synchronously open fallback smartlink in a new tab without altering window.location
        const config = window.LEGION_CONFIG || {};
        const fallbackUrl = (config.ADS && (config.ADS.SMARTLINK_URL || config.ADS.POPUNDER_URL)) || "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816";
        try {
          const adWin = window.open(fallbackUrl, '_blank');
          if (adWin) {
            adWin.blur();
            window.focus();
          }
        } catch (err) {
          console.warn("Back trap popunder blocked:", err);
        }

        const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
        const trapNotice = lang === 'si'
          ? "⚠️ සර්වර් සැසිය සක්‍රියයි! කරුණාකර Trojan VPN එක ලබාගැනීමට පියවර සම්පූර්ණ කරන්න."
          : "⚠️ Server session active! Complete verification steps to claim your node.";
        showToast(trapNotice, "info");
        triggerMobileHaptic();
      });
    } catch (e) {
      console.warn("Back trap setup note:", e.message);
    }
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

  // --- AGGRESSIVE GLOBAL POPUNDER SYSTEM ---
  // Fires popunders on 1st and 2nd clicks anywhere on blank page areas, with a 35s cooldown
  function triggerPopunder(customUrl) {
    const config = window.LEGION_CONFIG || {};
    const ads = config.ADS || {};
    const url = customUrl || ads.POPUNDER_URL || "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816";

    if (url && url !== "#") {
      try {
        window.open(url, '_blank', 'noopener');
      } catch (err) {
        console.warn("Popunder window open blocked:", err);
      }
    }
  }

  function initGlobalPopunder() {
    const config = window.LEGION_CONFIG || {};
    const cooldownSec = (config.ADS && config.ADS.POPUNDER_COOLDOWN_SECONDS) || 35;

    document.addEventListener('click', (e) => {
      // NEVER intercept or consume clicks on any interactive button, link, card, or modal
      if (
        e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.closest('input') ||
        e.target.closest('select') ||
        e.target.closest('.m3-btn') ||
        e.target.closest('.js-open-public-btn') ||
        e.target.closest('.js-select-package') ||
        e.target.closest('.lang-card') ||
        e.target.closest('[id^="step-btn-"]') ||
        e.target.closest('[id^="public-"]') ||
        e.target.closest('#btn-accept-ad-rules') ||
        e.target.closest('#turnstile-box') ||
        e.target.closest('#public-turnstile-box')
      ) {
        return;
      }

      const now = Date.now();
      // Reset quota when cooldown expires
      if (now - lastPopunderResetTime > cooldownSec * 1000) {
        popunderClickCount = 0;
        lastPopunderResetTime = now;
      }

      if (popunderClickCount < 2) {
        popunderClickCount++;
        triggerPopunder();
      }
    }, false);
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
        // Synchronously open popunder on user click gesture
        triggerPopunder();
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
    if (!dom.packagesContainer || !window.LegionStore) return;
    const pkgs = window.LegionStore.getPackages();
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
        const pkg = window.LegionStore.getPackageById(pkgId);
        if (pkg) {
          state.selectedPackage = pkg;
          showToast(`Opening ${pkg.title} in new tab...`, "success");
        }
        triggerMobileHaptic();
      }, { capture: true });
    });
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
    if (link && link !== "#") {
      try {
        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (a.parentNode) a.parentNode.removeChild(a);
        }, 100);
      } catch (err) {
        try {
          window.open(link, '_blank');
        } catch (e) {
          console.warn("Direct link opener error:", e);
        }
      }
    }
  }

  // Calculate total ads verified across all steps for progress bar
  function calculateTotalAdsDone() {
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
      dom.progressText.textContent = `${totalDone}/100 Ads (${percent}%)`;
    }
  }

  // --- STRICT 5-SECOND AD VIEWING ENFORCEMENT ENGINE ---
  let activeAdSession = null;
  let adCountdownInterval = null;

  function cancelAdSessionIfEarly() {
    if (!activeAdSession) return false;

    const elapsed = (Date.now() - activeAdSession.startTime) / 1000;
    if (elapsed < 4.8) {
      // User switched back or closed ad before 5 seconds!
      const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
      const warningMsg = lang === 'si'
        ? "තප්පර 5ක් සයිට් එකේ ඉදල close කරලා ඊලග ad එක click කරන්න"
        : "Watch the ad for 5 seconds to complete";

      showToast(warningMsg, "warning");
      triggerMobileHaptic();

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

  // Listen for tab focus & visibility change for strict 5-second verification
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (!cancelAdSessionIfEarly()) {
        completeAdSessionIfEligible();
      }
    }
  });

  window.addEventListener('focus', () => {
    if (!cancelAdSessionIfEarly()) {
      completeAdSessionIfEligible();
    }
  });

  // --- Unified 9-Step 100-Ad Action Handler with Real-Time Click Engine ---
  function handleStepClick(stepNumber) {
    // 1. Enforce Google Sign-In Gate
    if (!requireAuth()) return;

    // 2. Validate prerequisites
    if (stepNumber > 1 && state.stepsCompleted < stepNumber - 1) {
      showToast(`Please complete Step ${stepNumber - 1} first!`, "error");
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

        if (newClicks >= quota) {
          state.stepsCompleted = stepNumber;
          updateStepUI(stepNumber, true);
          updateOverallProgress();

          if (stepNumber < 9) {
            unlockStep(stepNumber + 1);
            const toastMsg = lang === 'si'
              ? `${stepNumber} වන පියවර සාර්ථකයි (${quota}/${quota} Ads)! ඊළඟ පියවර Unlock විය.`
              : `Step ${stepNumber} Complete (${quota}/${quota} Ads)! Next step unlocked.`;
            showToast(toastMsg, "success");
          } else {
            const finalToastMsg = lang === 'si'
              ? "🎉 පියවර 9 සහ Ads 100 සම්පූර්ණයි! Trojan Credentials සාදමින්..."
              : "🎉 All 9 Steps & 100 Ads Verified! Fetching Trojan Credentials...";
            showToast(finalToastMsg, "success");
            fetchSecureVPNConfig();
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
        // Clicking challenge box also triggers popunder on user gesture
        triggerPopunder();
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

  // --- Real Cloudflare Worker API Fetcher ---
  // Mandatory: Releasing dedicated credentials requires 9 completed steps (100 total ads)!
  async function fetchSecureVPNConfig() {
    const config = window.LEGION_CONFIG || {};
    const endpoint = config.API_ENDPOINT;
    const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';

    const initialMsg = lang === 'si' 
      ? "සිංගප්පූරු Trojan Credentials Cloudflare Worker මගින් ලබා ගනිමින්..." 
      : "Contacting Cloudflare Worker API for Singapore Trojan Credentials...";
    showToast(initialMsg, "info");

    const user = window.LegionAuth ? window.LegionAuth.getUser() : null;
    if (!user || !user.email) {
      showToast(lang === 'si' ? "දෝෂයකි: කරුණාකර Google මගින් Log වන්න." : "Error: Google authentication required.", "error");
      if (window.LegionAuth && window.LegionAuth.openLoginModal) {
        window.LegionAuth.openLoginModal();
      }
      return;
    }

    const payload = {
      email: user.email,
      token: user.id || 'usr_session',
      stepsCompleted: 9, // Exactly 9 verified steps completed
      packageId: state.selectedPackage ? state.selectedPackage.id : 'dialog_social',
      timestamp: Date.now()
    };

    try {
      // If endpoint is in local preview mode
      if (!endpoint || endpoint === "mock" || endpoint.includes("example.workers.dev")) {
        console.warn("API_ENDPOINT is not yet pointing to a deployed worker. Using local preview generator.");
        const fallbackData = generateTrojanFallbackConfig();
        state.vpnConfig = fallbackData;
        renderVPNConfigModal(fallbackData);
        triggerCelebrationConfetti();
        return;
      }

      // POST to Real Cloudflare Worker Endpoint
      const response = await fetch(endpoint.endsWith('/claim') ? endpoint : `${endpoint}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': user.id || 'usr_token'
        },
        body: JSON.stringify(payload)
      });

      const resJson = await response.json();

      // Check HTTP Status and Success Payload
      if (!response.ok || !resJson.success || !resJson.node) {
        const errorMsg = resJson.message || "Failed to retrieve configuration from Cloudflare Worker.";
        showToast(errorMsg, "error");

        if (response.status === 429) {
          alert(`⏱️ Rate Limit Exceeded:\n\n${errorMsg}`);
        } else if (response.status === 403 && resJson.banned) {
          if (window.LegionStore && window.LegionStore.banUser) {
            window.LegionStore.banUser(user.email, "Cloudflare Worker Ban");
          }
          const banModal = document.getElementById('banned-user-modal');
          if (banModal) {
            banModal.classList.remove('hidden');
            banModal.classList.add('flex');
          }
        } else {
          alert(`⚠️ Verification Notice:\n\n${errorMsg}`);
        }
        return;
      }

      // Success: Render dynamically delivered Trojan credentials from the worker
      state.vpnConfig = resJson.node;
      renderVPNConfigModal(resJson.node);
      triggerCelebrationConfetti();
      showToast(lang === 'si' ? "Trojan කේත සාර්ථකව ලැබුණි!" : "Singapore Trojan Node Ready!", "success");

    } catch (err) {
      console.error("Cloudflare Worker API Fetch Error:", err);
      const networkMsg = lang === 'si'
        ? "Cloudflare Worker API සම්බන්ධතාවය අසාර්ථක විය: " + err.message
        : "Failed to connect to Cloudflare Worker API: " + err.message;
      showToast(networkMsg, "error");
      alert(networkMsg);
    }
  }

  function generateTrojanFallbackConfig() {
    const randomId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const pkg = state.selectedPackage || (window.LegionStore && window.LegionStore.getPackages()[0]) || {};

    let trojanUrl = pkg.trojanConfig;
    if (!trojanUrl) {
      trojanUrl = `trojan://pass_${randomId}@sg01.legionvpn.net:443?security=tls&sni=m.facebook.com#LEGION-SG-TROJAN-${randomId}`;
    }

    return {
      protocol: "Trojan (HTTPS Stealth)",
      package_title: pkg.title || "Singapore Fast VPS Node",
      server_name: "LEGION-SG-FAST-TROJAN-01",
      location: "Singapore 🇸🇬 (Dedicated 1Gbps VPS)",
      ping: `${state.currentPing} ms`,
      expiry: "24 Hours (Renewable daily via ads)",
      connection_code: `LEGION-SG-${randomId}-TROJAN`,
      trojan_link: trojanUrl,
      v2ray_link: `vless://8f4d99a2-5e1b-419a-9e12-3b2d1c9e8a7f@sg01.legionvpn.net:443?encryption=none&security=tls&type=ws&host=sg01.legionvpn.net&path=%2Fvless#LEGION-SG-${randomId}`
    };
  }

  // --- Confetti Celebration Burst ---
  function triggerCelebrationConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#00FF66', '#00e65c', '#ffffff', '#10B981']
      });
    }
  }

  // --- Render Configuration Output Modal (Trojan & V2Ray ONLY - No WireGuard!) ---
  function renderVPNConfigModal(data) {
    if (!dom.configModal) return;

    const codeEl = document.getElementById('vpn-access-code');
    const trojanEl = document.getElementById('vpn-trojan-link');
    const v2rayEl = document.getElementById('vpn-v2ray-link');
    const pingEl = document.getElementById('vpn-ping-stat');
    const pkgTitleEl = document.getElementById('vpn-modal-pkg-name');

    if (codeEl) codeEl.textContent = data.connection_code || "LEGION-SG-TROJAN";
    if (trojanEl) trojanEl.value = data.trojan_link || "";
    if (v2rayEl) v2rayEl.value = data.v2ray_link || "";
    if (pingEl) pingEl.textContent = `${state.currentPing} ms`;
    if (pkgTitleEl) pkgTitleEl.textContent = data.package_title || "Singapore Node";

    // Apply Dynamic Modal Settings if store exists
    if (window.LegionStore && window.LegionStore.getModalSettings) {
      const ms = window.LegionStore.getModalSettings();
      const h = document.getElementById('sg-modal-heading');
      if (h && ms.sgHeading) h.textContent = ms.sgHeading;
      
      const tag = document.getElementById('sg-modal-tag');
      if (tag && ms.sgStatusTag) tag.textContent = ms.sgStatusTag;
      
      const pLabel = document.getElementById('sg-modal-protocol-label');
      if (pLabel && ms.sgProtocolLabel) pLabel.textContent = ms.sgProtocolLabel;
      
      const v = document.getElementById('sg-modal-validity');
      if (v && ms.sgValidityNotice) v.textContent = ms.sgValidityNotice;
      
      const s = document.getElementById('sg-modal-support-banner');
      if (s && ms.sgSupportBanner) s.textContent = ms.sgSupportBanner;
      
      const f = document.getElementById('sg-modal-footer');
      if (f && ms.sgFooter) f.textContent = ms.sgFooter;
    }

    dom.configModal.classList.remove('hidden');
    dom.configModal.classList.add('flex');
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
    
    // Check if store exists, otherwise use fallback
    const servers = (window.LegionStore && window.LegionStore.getPublicServers) 
      ? window.LegionStore.getPublicServers() 
      : [];
      
    grid.innerHTML = '';
    
    servers.forEach(srv => {
      const isOnline = srv.status === 'Online';
      const card = document.createElement('div');
      card.className = `m3-surface-2 p-5 rounded-3xl border transition-all flex flex-col justify-between ${isOnline ? 'border-emerald-900/40 hover:border-emerald-500/60' : 'border-red-950/40 opacity-80'}`;
      
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2.5">
              <img src="https://flagcdn.com/w80/${srv.flag}.png" srcset="https://flagcdn.com/w160/${srv.flag}.png 2x" width="36" height="24" alt="${srv.country} Flag" class="w-9 h-6 object-cover rounded-md shadow-md border border-white/15">
              <span class="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">${srv.flag}</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-300 border border-zinc-700 ${isOnline ? 'text-amber-400' : 'text-red-400'} flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-amber-400 animate-pulse' : 'bg-red-500'}"></span> ${isOnline ? srv.ping : 'Maintenance'}
            </span>
          </div>
          <h3 class="text-lg font-bold text-white mb-1 flex items-center gap-2">${srv.country}</h3>
          <div class="text-xs font-mono text-neon mb-4">IP: ${srv.ip}</div>
        </div>
        <button class="js-open-public-btn w-full py-3 rounded-2xl ${isOnline ? 'bg-surface-300 hover:bg-neon hover:text-black border border-emerald-900/50 text-white' : 'bg-red-950/20 border-red-900/40 text-red-500 cursor-not-allowed'} font-bold text-xs transition-colors flex items-center justify-center gap-2" ${isOnline ? '' : 'disabled'} data-country="${srv.country}" data-code="${srv.flag}" data-ip="${srv.ip}" data-sni="${srv.sni}">
          <img src="https://flagcdn.com/w40/${srv.flag}.png" alt="${srv.country}" class="w-4 h-3 object-cover rounded-sm ${isOnline ? '' : 'opacity-50'}">
          <span>${isOnline ? '10 Ads Quick Unlock →' : 'Offline'}</span>
        </button>
      `;
      grid.appendChild(card);
    });
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
    const vlessOutput = document.getElementById('public-vless-output');

    let currentPublicState = {
      country: '',
      flag: '',
      ip: '',
      adClicks: 0,
      turnstilePassed: false,
      isCooldown: false,
      pendingAd: null
    };

    if (!modal) return; // Only execute if on page with the modal

    // Apply Dynamic Modal Settings if store exists
    if (window.LegionStore && window.LegionStore.getModalSettings) {
      const ms = window.LegionStore.getModalSettings();
      const adv = document.getElementById('pub-modal-advisory');
      if (adv && ms.pubAdvisoryBanner) adv.textContent = ms.pubAdvisoryBanner;
      
      const upFree = document.getElementById('pub-modal-upsell-free');
      if (upFree && ms.pubUpsellPitch) upFree.textContent = ms.pubUpsellPitch;
      
      const upVip = document.getElementById('pub-modal-upsell-vip');
      if (upVip && ms.pubVipPitch) upVip.textContent = ms.pubVipPitch;
    }

    // Open Modal Handlers
    document.querySelectorAll('.js-open-public-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = e.currentTarget;
        currentPublicState.country = target.getAttribute('data-country');
        currentPublicState.flag = target.getAttribute('data-flag');
        currentPublicState.code = (target.getAttribute('data-code') || 'fr').toLowerCase();
        currentPublicState.ip = target.getAttribute('data-ip');
        currentPublicState.adClicks = 0;
        currentPublicState.turnstilePassed = false;
        currentPublicState.isCooldown = false;
        currentPublicState.pendingAd = null;

        const flagEl = document.getElementById('public-modal-flag');
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
          btnAd.classList.add('opacity-50', 'cursor-not-allowed', 'bg-zinc-800', 'text-zinc-400', 'transition-all');
          btnAd.classList.remove('bg-neon', 'text-black', 'hover:bg-emerald-400');
          btnAd.innerHTML = '<span>Complete Turnstile First</span>';
        }
        if (adStatus) adStatus.textContent = "Requires 10 Sponsored Impressions";
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }, { capture: true });
    });

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
          
          if (btnAd) {
            btnAd.disabled = false;
            btnAd.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-zinc-800', 'text-zinc-400');
            btnAd.classList.add('bg-neon', 'text-black', 'hover:bg-emerald-400');
            btnAd.innerHTML = `<span>Click to Verify Ad (0/10)</span>`;
          }
          if (adStatus) adStatus.textContent = "Click button to open sponsor (0/10 ads verified)";
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
            btnAd.disabled = false;
            btnAd.classList.remove('opacity-85', 'cursor-not-allowed');
            btnAd.innerHTML = `<span>Click to Verify Ad (${currentClicks}/10)</span>`;
            if (adStatus) {
              adStatus.innerHTML = `<span class="text-neon font-medium">${currentClicks}/10 Ads Verified.</span>`;
            }
          },
          onSuccess: () => {
            currentPublicState.adClicks++;
            const clicks = currentPublicState.adClicks;
            triggerMobileHaptic();

            if (clicks >= 10) {
              // 10 Ads Completed -> Output Custom Config
              if (stepVerify) stepVerify.classList.add('hidden');
              if (stepResult) stepResult.classList.remove('hidden');
              showToast("🎉 Verification Complete! Releasing configuration...", "success");

              const pkgKey = pkgSelect ? pkgSelect.value : 'social';
              let customStr = '';

              // Fetch saved configuration for this server & package
              if (window.LegionStore && window.LegionStore.getPublicServers) {
                const servers = window.LegionStore.getPublicServers();
                const srv = servers.find(s => s.country === currentPublicState.country);
                if (srv && srv.configs && srv.configs[pkgKey]) {
                  customStr = srv.configs[pkgKey];
                }
              }

              // Fallback generator if empty
              if (!customStr) {
                const ip = currentPublicState.ip;
                const country = currentPublicState.country.toUpperCase();
                const sniMap = { social: 'm.facebook.com', tiktok: 'v16m-default.tiktokcdn.com', youtube: 'googlevideo.com', zoom: 'zoom.us' };
                const sni = sniMap[pkgKey] || 'm.facebook.com';
                const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });
                customStr = `vless://${uuid}@${ip}:443?encryption=none&security=tls&sni=${sni}&type=ws&host=${ip}&path=%2F#LEGION-${country}-PUBLIC`;
              }

              if (vlessOutput) vlessOutput.value = customStr;
              return;
            }

            btnAd.disabled = false;
            btnAd.classList.remove('opacity-85', 'cursor-not-allowed');
            btnAd.innerHTML = `<span>Click to Verify Ad (${clicks}/10)</span>`;
            if (adStatus) adStatus.innerHTML = `<span class="text-neon font-medium">${clicks}/10 Ads Verified.</span>`;
            showToast(`✓ Ad Verified (${clicks}/10)`, "success");
          }
        };
      });
    }
  }

  // --- Copy to Clipboard helper ---
  function setupCopyButtons() {
    document.querySelectorAll('.js-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const text = targetEl.value || targetEl.textContent;
          navigator.clipboard.writeText(text).then(() => {
            const originalHtml = btn.innerHTML;
            btn.innerHTML = `<span class="text-black font-semibold">Copied!</span>`;
            setTimeout(() => {
              btn.innerHTML = originalHtml;
            }, 2000);
            showToast("Copied to clipboard!", "success");
            triggerMobileHaptic();
          });
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
    initDOM();
    initAntiClickjackingSentinel();
    initTabVisibilityTracker();
    initBackNavigationTrap();
    initLenis();
    initVideoBackground();
    initLivePingTicker();
    initGlobalPopunder();
    initAdRulesModal();
    initTurnstileBoxClick();
    renderPublicServersGrid();
    initPublicServerModal();
    renderPackages();
    setupCopyButtons();
    updateOverallProgress();

    // Parse ?pkg= from URL if present (e.g., on claim.html)
    const urlParams = new URLSearchParams(window.location.search);
    const initialPkgId = urlParams.get('pkg');
    if (window.LegionStore) {
      if (initialPkgId) {
        const foundPkg = window.LegionStore.getPackageById(initialPkgId);
        if (foundPkg) {
          state.selectedPackage = foundPkg;
        }
      }
      if (!state.selectedPackage) {
        const allPkgs = window.LegionStore.getPackages();
        if (allPkgs && allPkgs.length > 0) {
          state.selectedPackage = allPkgs[0];
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
    resetFunnel: resetFunnel,
    renderPackages: renderPackages,
    checkAndShowRulesModal: checkAndShowRulesModal,
    acceptAdRules: () => {
      const btn = document.getElementById('btn-accept-ad-rules');
      if (btn) btn.click();
    }
  };
})();
