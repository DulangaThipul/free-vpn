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
  // Listens to window focus and document visibility to detect if user closed the ad too quickly (< 4 seconds)
  function initTabVisibilityTracker() {
    function handleReturn() {
      if (state.pendingAd && !state.pendingAd.failed) {
        setTimeout(() => {
          if (!state.pendingAd || state.pendingAd.failed) return;

          const dwellTime = Date.now() - state.pendingAd.adOpenedAt;
          const stepNumber = state.pendingAd.stepNumber;
          const quota = STEP_QUOTAS[stepNumber] || 10;
          const currentClicksBefore = state.stepClicks[stepNumber] || 0;
          const btn = dom[`stepBtn${stepNumber}`];
          const statusEl = dom[`stepStatus${stepNumber}`];
          const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';

          if (dwellTime < 4000) {
            // User returned in under 4 seconds! Reject verification
            state.pendingAd.failed = true;
            const warningMsg = lang === 'si'
              ? "⚠️ Verification අසම්පූර්ණයි: ඔබ Ad එක ඉක්මනින් වැසූ බැවින් count නොවුණි. කරුණාකර Ad එක තත්පර 4ක් වත් load වීමට ඉඩ දෙන්න."
              : "⚠️ Verification Failed: You closed the ad too quickly! Please allow the sponsored page to load for at least 4 seconds.";
            showToast(warningMsg, "error");
            triggerMobileHaptic();

            // Reset button
            if (btn) {
              btn.disabled = false;
              btn.classList.remove('opacity-85', 'cursor-not-allowed');
              const btnText = lang === 'si'
                ? `Ad එක Verify කරන්න (${currentClicksBefore}/${quota})`
                : `Click to Verify Ad (${currentClicksBefore}/${quota})`;
              btn.innerHTML = `<span>${btnText}</span>`;
            }
            if (statusEl) {
              const statusText = lang === 'si'
                ? `<span class="text-red-400 font-medium">⚠️ Ad එක ඉක්මනින් වැසූ බැවින් count නොවුණි (${currentClicksBefore}/${quota})</span>`
                : `<span class="text-red-400 font-medium">⚠️ Ad closed too fast - Not counted (${currentClicksBefore}/${quota})</span>`;
              statusEl.innerHTML = statusText;
            }
            
            state.isCooldown = false;
            state.pendingAd = null;
          } else {
            // Valid Click! >= 4000ms dwell time
            state.pendingAd.verified = true;
            state.stepClicks[stepNumber] = currentClicksBefore + 1;
            const currentClicks = state.stepClicks[stepNumber];
            state.isCooldown = false;
            state.pendingAd = null;

            triggerMobileHaptic();
            updateOverallProgress();

            if (currentClicks < quota) {
              // Check if Halfway
              const halfway = Math.floor(quota / 2);
              if (currentClicks === halfway) {
                showHalfwayInterstitialModal(stepNumber);
              }

              if (btn) {
                btn.disabled = false;
                btn.classList.remove('opacity-85', 'cursor-not-allowed');
                const btnText = lang === 'si'
                  ? `Ad එක Verify කරන්න (${currentClicks}/${quota})`
                  : `Click to Verify Ad (${currentClicks}/${quota})`;
                btn.innerHTML = `<span>${btnText}</span>`;
              }
              if (statusEl) {
                const statusText = lang === 'si'
                  ? `<span class="text-neon font-medium">${currentClicks}/${quota} Ads බලා ඇත. ඉදිරියට ක්ලික් කරන්න...</span>`
                  : `<span class="text-neon font-medium">${currentClicks}/${quota} Ads Verified. Keep clicking...</span>`;
                statusEl.innerHTML = statusText;
              }
            } else {
              // Quota reached
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
            }
          }
        }, 100);
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
        : 'bg-[#0f1412] border-emerald-500/40 text-emerald-200'
    }`;
    
    toast.innerHTML = `
      <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
          type === 'error' 
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
  // Fires popunders on 1st and 2nd clicks anywhere on the page, with a 35s cooldown
  function triggerPopunder(customUrl) {
    const config = window.LEGION_CONFIG || {};
    const ads = config.ADS || {};
    const url = customUrl || ads.POPUNDER_URL || "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816";

    if (url && url !== "#") {
      try {
        const adWin = window.open(url, '_blank');
        if (adWin) {
          adWin.blur();
          window.focus();
        }
      } catch (err) {
        console.warn("Popunder window open blocked:", err);
      }
    }
  }

  function initGlobalPopunder() {
    const config = window.LEGION_CONFIG || {};
    const cooldownSec = (config.ADS && config.ADS.POPUNDER_COOLDOWN_SECONDS) || 35;

    document.addEventListener('click', (e) => {
      const now = Date.now();
      // Reset quota when cooldown expires
      if (now - lastPopunderResetTime > cooldownSec * 1000) {
        popunderClickCount = 0;
        lastPopunderResetTime = now;
      }

      if (popunderClickCount < 2) {
        popunderClickCount++;
        // If clicking a step button or the accept rules button, that button triggers its own direct link synchronously.
        const isStepBtn = e.target.closest('[id^="step-btn-"]');
        const isRulesBtn = e.target.closest('#btn-accept-ad-rules');
        const isTurnstileBox = e.target.closest('#turnstile-box');

        if (!isStepBtn && !isRulesBtn && !isTurnstileBox) {
          triggerPopunder();
        }
      }
    }, true);
  }

  // --- MANDATORY SERVER NOTICE & RULES MODAL (#ad-rules-modal) ---
  function initAdRulesModal() {
    const accepted = sessionStorage.getItem('legion_rules_accepted');
    if (!accepted && dom.adRulesModal) {
      dom.adRulesModal.classList.remove('hidden');
      dom.adRulesModal.classList.add('flex');
    }

    if (dom.btnAcceptAdRules) {
      dom.btnAcceptAdRules.addEventListener('click', () => {
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
      });
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
      btn.addEventListener('click', () => {
        const pkgId = btn.getAttribute('data-id');
        const pkg = window.LegionStore.getPackageById(pkgId);
        if (pkg) {
          state.selectedPackage = pkg;
          showToast(`Opening ${pkg.title} in new tab...`, "success");
        }
        triggerMobileHaptic();
      });
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
        window.open(link, '_blank');
      } catch (err) {
        console.warn("Direct link opener error:", err);
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

  // --- Unified 9-Step 100-Ad Action Handler with 4s Dwell Time Enforcement ---
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

    // 3. Strict Rate-Limit Check
    if (state.isCooldown) {
      const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
      const waitNotice = lang === 'si'
        ? "⏳ කරුණාකර Ad verification එක අවසන් වන තෙක් රැඳී සිටින්න..."
        : "⏳ Please allow the current ad verification to complete...";
      showToast(waitNotice, "info");
      return;
    }

    const quota = STEP_QUOTAS[stepNumber] || 10;
    state.currentStep = stepNumber;

    // 4. Record timestamp and start pending verification for Dwell Time Enforcement
    state.pendingAd = {
      stepNumber: stepNumber,
      adOpenedAt: Date.now(),
      failed: false,
      verified: false
    };

    // 5. SYNCHRONOUSLY TRIGGER THE ADSTERRA SMARTLINK DIRECTLY ON USER GESTURE!
    triggerAdLink(stepNumber);

    // 6. Enter UI Waiting State (Wait for focus to return)
    state.isCooldown = true;
    const btn = dom[`stepBtn${stepNumber}`];
    const statusEl = dom[`stepStatus${stepNumber}`];
    const lang = (window.LegionI18n && window.LegionI18n.getLanguage()) || 'en';
    const currentClicksBefore = state.stepClicks[stepNumber] || 0;

    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-85', 'cursor-not-allowed');
      const cooldownText = lang === 'si'
        ? `⏳ Ad එක Verify වෙමින්... Ad tab එකේ රැඳී සිටින්න.`
        : `⏳ Verifying Ad... Please stay on ad tab.`;
      btn.innerHTML = `<span>${cooldownText}</span>`;
    }

    if (statusEl) {
      const inspectingText = lang === 'si'
        ? `<span class="text-neon flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-neon animate-ping"></span> Ad එක පරීක්ෂා කරමින්... තත්පර 4ක් රැඳී සිටින්න.</span>`
        : `<span class="text-neon flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-neon animate-ping"></span> Checking Ad... Stay for 4s.</span>`;
      statusEl.innerHTML = inspectingText;
    }

    // Trigger Turnstile modal during Step 9 interaction
    if (stepNumber === 9 && !state.turnstileCompleted && currentClicksBefore === 0) {
      showTurnstileModal();
    }
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
    if (pkgTitleEl) pkgTitleEl.textContent = data.package_title || "Singapore Trojan Node";

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

  // --- Copy to Clipboard helper ---
  function setupCopyButtons() {
    document.querySelectorAll('.js-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
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
      });
    });

    const downloadBtn = document.getElementById('btn-download-trojan');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', downloadTrojanConfig);
    }
  }

  // DOM Content Loaded Handler
  document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    initTabVisibilityTracker();
    initBackNavigationTrap();
    initLenis();
    initVideoBackground();
    initLivePingTicker();
    initGlobalPopunder();
    initAdRulesModal();
    initTurnstileBoxClick();
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
        btn.addEventListener('click', () => handleStepClick(i));
      }
    }

    // Modal close handler
    if (dom.closeConfigModal) {
      dom.closeConfigModal.addEventListener('click', () => {
        if (dom.configModal) {
          dom.configModal.classList.add('hidden');
          dom.configModal.classList.remove('flex');
        }
      });
    }

    // Scroll to packages CTA
    const startClaimBtns = document.querySelectorAll('.js-scroll-claim');
    startClaimBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const section = document.getElementById('packages-selection-section');
        if (section) {
          if (window.lenisInstance) {
            window.lenisInstance.scrollTo(section);
          } else {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  });

  // Export public app helpers
  window.LegionApp = {
    showToast: showToast,
    resetFunnel: resetFunnel,
    renderPackages: renderPackages
  };
})();
