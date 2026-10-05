/**
 * LEGION Free VPN - Internationalization (i18n) Engine
 * Supports: Sinhala (si) & English (en) - Mobile-First 6-Step Edition
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'legion_vpn_language';

  const translations = {
    en: {
      lang_name: "English",
      brand_sub: "SG-FAST VPS CLUSTER",
      server_online: "SG:",
      sign_in_google: "Sign in with Google",
      badge_hero: "Dedicated Singapore 1Gbps VPS Node",
      hero_title_1: "Next-Gen Freedom with",
      hero_title_2: "LEGION Free Singapore VPN",
      why_free_title: "How is this 100% Free?",
      why_free_desc: "High-speed Singapore VPS servers cost real money to host. We sustain all server infrastructure purely through ad revenue. By completing our 9-step sponsored 100-ad verification, you generate the funding we need to keep buying and renewing fast servers for you.",
      why_free_sub: "Want zero ads and instant private connection? You can upgrade to our Premium Package (LKR 100) anytime!",
      btn_claim_hero: "Claim Free VPN (100 Ads / 9 Steps)",
      btn_premium_hero: "Get Premium (LKR 100)",
      metric_uplink: "Uplink Port",
      metric_ping: "SG Live Ping",
      metric_free: "Free Daily",
      ad_sponsored: "Sponsored Advertisement",
      ad_banner_note: "Insert your CPA Network ad code into this container",
      funnel_tag: "Zero Subscription Required",
      funnel_title: "Unlock Singapore VPN Node (100 Ads)",
      funnel_desc: "Complete 9 sponsored verification steps (100 total ad interactions) to claim your high-speed Singapore Trojan credentials.",
      auth_gate_title: "🔐 Google Authentication Required to Prevent Node Abuse",
      auth_gate_desc: "Please sign in with your Google account so our Singapore VPS cluster can assign your unique session token.",
      auth_gate_btn: "Sign in to Start Verification",
      status_label: "Node Allocation Status",
      
      // Support Disclaimer Banner
      disclaimer_title: "⚠️ STRICT NOTICE: NO INBOX SUPPORT FOR FREE VPN",
      disclaimer_desc: "Please DO NOT send messages or inquiries to our WhatsApp or Telegram Inbox regarding Free VPN issues. We provide ABSOLUTELY ZERO troubleshooting or maintenance for free servers. Direct personal support is strictly reserved for paid Premium Package users.",

      // 9 Steps 100-Ad Reward Funnel
      step1_title: "Singapore Routing (10 Ads)",
      step1_desc: "Connect to Singapore SG-01 VPS gateway and reserve session slot.",
      step1_btn: "Click to Verify Ad (0/10)",
      
      step2_title: "Bandwidth Allocation (10 Ads)",
      step2_desc: "Allocate dedicated 1Gbps uplink speed for your session.",
      step2_btn: "Unlock in Step 1",
      
      step3_title: "Trojan Key Pair (10 Ads)",
      step3_desc: "Generate 256-bit Trojan encryption credentials for ISP bypass.",
      step3_btn: "Unlock in Step 2",

      step4_title: "DNS Leak Protection (10 Ads)",
      step4_desc: "Activate stealth tunneling & Singapore DNS resolver.",
      step4_btn: "Unlock in Step 3",

      step5_title: "★ Mid-Boss: TLS Obfuscation (15 Ads)",
      step5_desc: "Apply anti-censorship camouflage for bypass on strict ISPs.",
      step5_btn: "Unlock in Step 4",

      step6_title: "Anti-DDoS Relay (10 Ads)",
      step6_desc: "Route traffic through Singapore DDoS-shielded reverse proxies.",
      step6_btn: "Unlock in Step 5",

      step7_title: "VLESS Transport (10 Ads)",
      step7_desc: "Generate WebSocket & gRPC transport failover protocols.",
      step7_btn: "Unlock in Step 6",

      step8_title: "Route Optimization (10 Ads)",
      step8_desc: "Calibrate low-latency routing and packet integrity filters.",
      step8_btn: "Unlock in Step 7",

      step9_title: "★ Final Boss: Security & Config (15 Ads)",
      step9_desc: "Complete Cloudflare Turnstile challenge & unlock dedicated Trojan configs.",
      step9_btn: "Unlock in Step 8",

      // Mandatory Rules Modal
      rules_modal_title: "⚠️ Server Funding Notice & Portal Rules",
      rules_modal_desc: "Our Singapore 1Gbps VPS servers are funded 100% by sponsored ad revenue. Popunder ads, sponsored tabs, and multi-step verification are strictly required to keep free nodes alive and renewed. Direct personal support is zero for Free VPN.",
      rules_modal_agree: "I Understand & Agree (Continue)",

      step_pending: "Pending",
      step_locked: "Locked",
      step_ready: "Ready to verify",
      step_done: "✓ Step Complete",
      ad_infeed_note: "Ads shown here directly fund Singapore server hosting bandwidth",
      
      // Premium
      premium_tag: "★ Instant Zero-Ad VIP Access",
      premium_title: "LEGION VIP Dedicated VPS",
      premium_desc: "Don't want to complete ad steps? Get dedicated Singapore 1Gbps ports with 100% ad-free instant Trojan & OpenVPN profiles, private IPs, and priority 24/7 support for just LKR 100/mo.",
      premium_feat_1: "Zero Advertisements (100% Ad-Free)",
      premium_feat_2: "Private Dedicated Singapore Static IP",
      premium_feat_3: "Full Trojan, V2Ray & OpenVPN Support",
      premium_feat_4: "Low-Ping Gaming & Streaming Optimized",
      premium_pass: "Monthly Pass",
      premium_month: "/ month",
      premium_bot_note: "Instant activation via Website or WhatsApp.",
      btn_website: "Order via Website",
      btn_whatsapp: "Order via WhatsApp",
      footer_desc: "100% Free High-Speed Singapore VPS Nodes funded by user-supported ad impressions.",
      footer_copy: "© 2026 LEGION VPN Project. All Rights Reserved.",
      strict_notice_title: "⚠️ STRICT NOTICE: NO INBOX SUPPORT FOR FREE VPN",
      strict_notice_desc: "Please DO NOT send messages or inquiries to our WhatsApp or Telegram inbox regarding Free VPN issues. We provide ABSOLUTELY ZERO troubleshooting or maintenance for free servers. Direct personal support is strictly reserved for paid Premium Package users.",
      
      // Modals
      modal_adblock_title: "Ad Blocker / Private DNS Detected",
      modal_adblock_desc: "Our Singapore VPS servers cost real money to maintain. We do not charge subscription fees; instead, we pay server bills through sponsored ad views.",
      modal_adblock_tip: "Please turn off your AdBlocker or Private DNS (NextDNS/AdGuard), or whitelist our site, then click below.",
      modal_adblock_btn: "I Have Disabled AdBlocker - Reload",
      
      modal_brave_title: "Brave Browser Not Supported",
      modal_brave_desc: "Brave Browser automatically activates strict shields that prevent our server funding ads from functioning.",
      modal_brave_tip: "To use our Free Singapore VPN, please open this site in Google Chrome, Microsoft Edge, Firefox, or Safari.",
      
      modal_devtools_title: "Developer Options Strictly Blocked",
      modal_devtools_desc: "Developer Tools, Inspect Element, and DOM tampering are strictly prohibited on this portal.",
      modal_devtools_tip: "Please close Developer Tools and reload the page to continue.",
      
      modal_auth_title: "Sign in with Google",
      modal_auth_desc: "Authenticate to assign your dedicated Singapore VPS slot",
      modal_auth_btn: "Authorize Google Session",
      
      modal_config_tag: "✓ Handshake Completed & Verified",
      modal_config_title: "Your Singapore Node Credentials",
      modal_config_sub: "Delivered securely from our Cloudflare API endpoint.",
      token_label: "Session Token / Connection Code",
      v2ray_label: "V2Ray / VLESS Configuration Link",
      copy_btn: "Copy",
      copy_vless_btn: "Copy VLESS",
      app_tip: "Paste the copied configuration directly into v2rayN, v2rayNG, Nekobox, or Clash Meta apps to connect!"
    },
    si: {
      lang_name: "සිංහල",
      brand_sub: "සිංගප්පූරු අධිවේගී VPS CLUSTER",
      server_online: "SG:",
      sign_in_google: "Google ගිණුමෙන් Log වෙන්න",
      badge_hero: "Dedicated Singapore 1Gbps VPS Node",
      hero_title_1: "Next-Gen Freedom with",
      hero_title_2: "LEGION Free Singapore VPN",
      why_free_title: "මේක 100% නොමිලේ දෙන්නෙ කොහොමද?",
      why_free_desc: "සිංගප්පූරු අධිවේගී VPS සර්වර් පවත්වාගෙන යන්න ලොකු මුදලක් වැය වෙනවා. අපි මේ සර්වර් වියදම් පියවගන්නේ ඔයාලා බලන Ads වලින් ලැබෙන මුදලින් පමණයි. අපේ පියවර 9 කින් යුත් Ads 100 ක් බැලීමෙන්, ඔයාලට දිගටම වේගවත් සර්වර් අලුත් කරලා නොමිලේ දෙන්න අපිට සහයෝගය ලැබෙනවා.",
      why_free_sub: "Ads බලන්නෙ නැතුව ක්ෂණිකව VPN එක ගන්න ඕනිද? රු. 100 කට අපේ Premium Package එකක් ලබාගන්න පුළුවන්!",
      btn_claim_hero: "නොමිලේ VPN ගන්න (Ads 100 / පියවර 9)",
      btn_premium_hero: "Premium ගන්න (LKR 100)",
      metric_uplink: "Port වේගය",
      metric_ping: "සජීවී SG Ping එක",
      metric_free: "සම්පූර්ණ නොමිලේ",
      ad_sponsored: "අනුග්‍රාහක දැන්වීම",
      ad_banner_note: "ඔබගේ CPA / Adsterra දැන්වීම් කේතය මෙතැනට ඇතුළත් කරන්න",
      funnel_tag: "මුදල් අය කිරීමක් නොමැත",
      funnel_title: "සිංගප්පූරු VPN එක ලබාගන්න (Ads 100)",
      funnel_desc: "පියවර 9 (Ads 100 ක verification එකක්) සම්පූර්ණ කර ඔබගේ අධිවේගී Trojan VPN කේතය ක්ෂණිකව ලබාගන්න.",
      auth_gate_title: "🔐 සර්වර් ආරක්ෂාව සඳහා Google මගින් Log විය යුතුය",
      auth_gate_desc: "ඔබට වෙන්වූ සිංගප්පූරු සර්වර් Slot එක ලබාදීම සඳහා කරුණාකර ඔබගේ Google ගිණුමෙන් සම්බන්ධ වන්න.",
      auth_gate_btn: "Google මගින් Log වී ආරම්භ කරන්න",
      status_label: "සර්වර් සම්බන්ධතා ප්‍රගතිය",
      
      // Support Disclaimer Banner
      disclaimer_title: "⚠️ STRICT NOTICE: NO INBOX SUPPORT FOR FREE VPN",
      disclaimer_desc: "Please DO NOT send messages or inquiries to our WhatsApp or Telegram inbox regarding Free VPN issues. We provide ABSOLUTELY ZERO troubleshooting or maintenance for free servers. Direct personal support is strictly reserved for paid Premium Package users.",

      // 9 Steps 100-Ad Reward Funnel
      step1_title: "සිංගප්පූරු Routing (Ads 10)",
      step1_desc: "Singapore SG-01 VPS එකට සම්බන්ධ වී ඔබගේ session slot එක වෙන් කරගන්න.",
      step1_btn: "Ad එක Verify කරන්න (0/10)",
      
      step2_title: "Bandwidth වෙන් කිරීම (Ads 10)",
      step2_desc: "ඔබගේ session එක සඳහා 1Gbps අධිවේගී Uplink Bandwidth වෙන් කරගන්න.",
      step2_btn: "පළමු පියවරෙන් Unlock වේ",

      step3_title: "Trojan Key Pair (Ads 10)",
      step3_desc: "256-bit ආරක්ෂිත Trojan Encryption Keys සාදා ගන්න.",
      step3_btn: "දෙවන පියවරෙන් Unlock වේ",

      step4_title: "DNS Leak & Security Shield (Ads 10)",
      step4_desc: "Singapore DNS Leak Protection සහ Stealth Tunnel ආරක්ෂාව සක්‍රිය කරගන්න.",
      step4_btn: "තෙවන පියවරෙන් Unlock වේ",

      step5_title: "★ Mid-Boss: TLS Obfuscation (Ads 15)",
      step5_desc: "ISP බාධා සහ Censorship මඟහැරීම සඳහා TLS Camouflage සක්‍රිය කරගන්න.",
      step5_btn: "සිව්වන පියවරෙන් Unlock වේ",

      step6_title: "Anti-DDoS Relay Shield (Ads 10)",
      step6_desc: "Singapore DDoS-shielded reverse proxies හරහා සම්බන්ධතාවය ආරක්ෂා කරගන්න.",
      step6_btn: "පස්වන පියවරෙන් Unlock වේ",

      step7_title: "VLESS Transport Layer (Ads 10)",
      step7_desc: "WebSocket සහ gRPC transport failover protocols සක්‍රිය කරගන්න.",
      step7_btn: "හයවන පියවරෙන් Unlock වේ",

      step8_title: "Route Optimization (Ads 10)",
      step8_desc: "අඩු latency සහ packet integrity පරීක්ෂාව සම්පූර්ණ කරගන්න.",
      step8_btn: "හත්වන පියවරෙන් Unlock වේ",

      step9_title: "★ Final Boss: Security & Config (Ads 15)",
      step9_desc: "Cloudflare Turnstile ආරක්ෂණ පරීක්ෂාව සම්පූර්ණ කර Trojan VPN එක Unlock කරගන්න.",
      step9_btn: "අටවන පියවරෙන් Unlock වේ",

      // Mandatory Rules Modal
      rules_modal_title: "⚠️ Server Funding Notice & Portal Rules",
      rules_modal_desc: "Our Singapore 1Gbps VPS servers are funded 100% by sponsored ad revenue. Popunder ads, sponsored tabs, and multi-step verification are strictly required to keep free nodes alive and renewed. Direct personal support is zero for Free VPN.",
      rules_modal_agree: "I Understand & Agree (Continue)",

      step_pending: "ඉතිරිව ඇත",
      step_locked: "අගුළු දමා ඇත",
      step_ready: "Verify කිරීමට සූදානම්",
      step_done: "✓ පියවර සම්පූර්ණයි",
      ad_infeed_note: "මෙහි පෙන්වන දැන්වීම් මගින් සිංගප්පූරු සර්වර් බිල්පත් ගෙවීමට උපකාරී වේ",
      
      // Premium
      premium_tag: "★ Ads කිසිවක් නැති ක්ෂණික VIP සේවාව",
      premium_title: "LEGION VIP Dedicated VPS",
      premium_desc: "Ads බලන්න වෙලාවක් නැද්ද? මසකට රු. 100 කට 1Gbps Dedicated සිංගප්පූරු Private IP එකක්, Zero Ads, සහ Trojan / OpenVPN / V2Ray ගොනු 24/7 VIP සේවාව සමඟ ක්ෂණිකව ලබාගන්න.",
      premium_feat_1: "කිසිදු දැන්වීමක් නොමැත (Zero Ads)",
      premium_feat_2: "තමන්ටම වෙන්වූ සිංගප්පූරු Private Static IP එකක්",
      premium_feat_3: "Trojan, V2Ray සහ OpenVPN පූර්ණ සහය",
      premium_feat_4: "Online Gaming සඳහා Low-Ping පහසුකම",
      premium_pass: "මාසික ගාස්තුව",
      premium_month: "/ මසකට",
      premium_bot_note: "Website හෝ WhatsApp හරහා ක්ෂණිකව ලබාගත හැක.",
      btn_website: "වෙබ් අඩවියෙන් ඇනවුම් කරන්න",
      btn_whatsapp: "WhatsApp මගින් ඇනවුම් කරන්න",
      footer_desc: "පරිශීලක සහයෝගී දැන්වීම් මගින් 100% නොමිලේ ක්‍රියාත්මක වන සිංගප්පූරු VPS සේවාව.",
      footer_copy: "© 2026 LEGION VPN Project. සියලු හිමිකම් ඇවිරිණි.",
      strict_notice_title: "⚠️ දැඩි නිවේදනයයි: නොමිලේ VPN සඳහා INBOX සහායක් නොමැත",
      strict_notice_desc: "කරුණාකර Free VPN සම්බන්ධ ගැටළු පිළිබඳව අපගේ WhatsApp හෝ Telegram inbox වෙත පණිවිඩ එවන්න එපා. නොමිලේ ලබාදෙන servers සඳහා කිසිදු ආකාරයක දෝශ නිරාකරණයක් හෝ නඩත්තුවක් අප විසින් සිදු නොකරයි. සෘජු පුද්ගලික සහාය ලබාදෙන්නේ මුදල් ගෙවා Premium Package මිලදී ගත් පරිශීලකයින්ට පමණි.",
      
      // Modals
      modal_adblock_title: "Ad Blocker or Private DNS Detected",
      modal_adblock_desc: "Our Singapore VPS servers are funded purely through sponsored advertisements. Free VPN access is blocked while an AdBlocker, NextDNS, or AdGuard Private DNS is active.",
      modal_adblock_tip: "Please disable your AdBlocker or Private DNS and click Reload.",
      modal_adblock_btn: "I Have Disabled AdBlocker - Reload",
      
      modal_brave_title: "Brave Browser Not Supported",
      modal_brave_desc: "Brave Browser automatically activates built-in Shields that block the sponsored advertisements required to fund and maintain our free Singapore VPN servers.",
      modal_brave_tip: "Please switch to Google Chrome, Microsoft Edge, Firefox, or Safari to continue.",
      
      modal_devtools_title: "⚠️ Developer Options Strictly Blocked",
      modal_devtools_desc: "Developer Tools, Inspect Element, and DOM tampering are strictly prohibited on this portal to prevent service abuse.",
      modal_devtools_tip: "Please close Developer Tools and reload the page.",
      
      modal_auth_title: "Google මගින් Log වන්න",
      modal_auth_desc: "ඔබට වෙන්වූ සිංගප්පූරු VPS Slot එක ලබාගැනීමට ගිණුම තහවුරු කරන්න",
      modal_auth_btn: "Google ගිණුම තහවුරු කරන්න",
      
      modal_config_tag: "✓ සර්වර් සම්බන්ධතාවය සාර්ථකයි",
      modal_config_title: "ඔබගේ සිංගප්පූරු VPN තොරතුරු",
      modal_config_sub: "Cloudflare API මගින් ආරක්ෂිතව ලබාදෙන ලදී.",
      token_label: "Session Token / Connection Code",
      v2ray_label: "V2Ray / VLESS Configuration Link එක",
      copy_btn: "Copy කරන්න",
      copy_vless_btn: "VLESS Copy කරන්න",
      app_tip: "මෙම කේතය v2rayN, v2rayNG, Nekobox, හෝ Clash Meta ඇප් එකට Paste කර VPN Connect කරගන්න!"
    }
  };

  function getLanguage() {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  }

  function setLanguage(lang) {
    const selectedLang = (lang === 'si') ? 'si' : 'en';
    localStorage.setItem(STORAGE_KEY, selectedLang);
    applyTranslations(selectedLang);
    updateLanguageButtons(selectedLang);
  }

  function applyTranslations(lang) {
    const dict = translations[lang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });

    document.documentElement.lang = lang;
  }

  function updateLanguageButtons(lang) {
    const btnEn = document.getElementById('lang-btn-en');
    const btnSi = document.getElementById('lang-btn-si');

    if (btnEn && btnSi) {
      if (lang === 'si') {
        btnSi.classList.add('bg-neon', 'text-black', 'font-bold');
        btnSi.classList.remove('text-zinc-400');
        btnEn.classList.remove('bg-neon', 'text-black', 'font-bold');
        btnEn.classList.add('text-zinc-400');
      } else {
        btnEn.classList.add('bg-neon', 'text-black', 'font-bold');
        btnEn.classList.remove('text-zinc-400');
        btnSi.classList.remove('bg-neon', 'text-black', 'font-bold');
        btnSi.classList.add('text-zinc-400');
      }
    }
  }

  function showLanguagePickerOnRefresh() {
    const lang = getLanguage();
    applyTranslations(lang);
    updateLanguageButtons(lang);

    // If on claim.html, do NOT show the language picker popup; inherit language from index.html!
    const isClaimPage = window.location.pathname.includes('claim.html') || !!document.getElementById('claim-funnel-section');
    if (isClaimPage) {
      return;
    }

    const modal = document.getElementById('language-picker-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  function selectLanguageAndClose(lang) {
    setLanguage(lang);
    const modal = document.getElementById('language-picker-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    // Smoothly sequence Rules Modal in the user's chosen language if not accepted yet
    if (window.LegionApp && typeof window.LegionApp.checkAndShowRulesModal === 'function') {
      window.LegionApp.checkAndShowRulesModal();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    showLanguagePickerOnRefresh();

    const bindLangBtn = (id, lang) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const triggerHandler = (e) => {
        if (e) {
          e.stopPropagation();
          if (e.cancelable) e.preventDefault();
        }
        selectLanguageAndClose(lang);
      };

      // Listen on capture phase on multiple touch/click events for instantaneous response
      btn.addEventListener('click', triggerHandler, { capture: true });
      btn.addEventListener('pointerdown', triggerHandler, { capture: true });
      btn.addEventListener('touchend', triggerHandler, { capture: true });
    };

    bindLangBtn('choose-lang-si', 'si');
    bindLangBtn('choose-lang-en', 'en');

    const navBtnSi = document.getElementById('lang-btn-si');
    const navBtnEn = document.getElementById('lang-btn-en');

    if (navBtnSi) {
      navBtnSi.addEventListener('click', (e) => {
        e.stopPropagation();
        setLanguage('si');
      }, { capture: true });
    }
    if (navBtnEn) {
      navBtnEn.addEventListener('click', (e) => {
        e.stopPropagation();
        setLanguage('en');
      }, { capture: true });
    }
  });

  window.LegionI18n = {
    getLanguage: getLanguage,
    setLanguage: setLanguage,
    selectLanguageAndClose: selectLanguageAndClose,
    translate: (key) => {
      const lang = getLanguage() || 'en';
      return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
    }
  };
})();
