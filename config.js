/**
 * LEGION Free VPN - Public Configuration File
 * Optimized for MAXIMUM AD REVENUE MONETIZATION, ABUSE PREVENTION, and ROBUST BACKEND DELIVERIES.
 */

window.LEGION_CONFIG = {
  // Website branding
  SITE_NAME: "LEGION Free VPN",
  LOCATION: "Singapore (SG-01 Fast VPS Cluster)",
  
  // Hero Video Background
  HERO_VIDEO_URL: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-code-31910-large.mp4",
  
  // Real Cloudflare Worker API Endpoint
  API_BASE_URL: "https://legion-vpn-api.legiongraphics.workers.dev",
  API_ENDPOINT: "https://legion-vpn-api.legiongraphics.workers.dev/claim", 
  
  // Adsterra / Monetag / CPA Network Monetization Settings
  ADS: {
    // Popunder Script URL & Direct Fallback (Disabled for auto-load safety)
    POPUNDER_SCRIPT_URL: "",
    POPUNDER_URL: "",
    
    // Cooldown in seconds before resetting global 2-click popunder quota
    POPUNDER_COOLDOWN_SECONDS: 35,

    // Primary Smartlink applied across sequential verification steps & back-trap fallback
    SMARTLINK_URL: "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",

    // Step Ad Click Quotas for the 9-Step 100-Ad Engine
    // Steps 1, 2, 3, 4, 6, 7, 8 = 10 clicks each (70 total)
    // Steps 5 & 9 (Boss Milestones) = 15 clicks each (30 total)
    // Grand Total = 100 Ad Interactions
    STEP_QUOTAS: {
      1: 10,
      2: 10,
      3: 10,
      4: 10,
      5: 15,
      6: 10,
      7: 10,
      8: 10,
      9: 15
    },
    TOTAL_ADS_REQUIRED: 100,

    // 9-Step Sequential Direct Smartlinks
    DIRECT_LINKS: [
      "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
      "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
      "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
      "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
      "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
      "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
      "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
      "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
      "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816"
    ],

    // Legacy individual aliases
    STEP_1_DIRECT_LINK: "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
    STEP_2_DIRECT_LINK: "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
    STEP_3_DIRECT_LINK: "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
    STEP_4_DIRECT_LINK: "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
    STEP_5_DIRECT_LINK: "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
    STEP_6_DIRECT_LINK: "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
    STEP_7_DIRECT_LINK: "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
    STEP_8_DIRECT_LINK: "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
    STEP_9_DIRECT_LINK: "https://ardance.org/4/a17425dfbc3bcf392107aeae62ecb816",
    
    // Timer seconds fallback
    STEP_WAIT_SECONDS: 5,

    // Social Bar Settings (Disabled for auto-load safety)
    ENABLE_SOCIAL_BAR: false,
    SOCIAL_BAR_SCRIPT_URL: "",

    // Native Banner & Display Banner Zones (Disabled for auto-load safety)
    NATIVE_BANNER: {
      CONTAINER_ID: "",
      SCRIPT_URL: ""
    },
    BANNERS: {}
  },
  
  // Premium Plan Details
  PREMIUM: {
    PRICE: "LKR 250 / mo",
    WEBSITE_ORDER: "https://vpn.legiongraphics.site",
    WHATSAPP_SUPPORT: "https://wa.me/441163504152"
  }
};
