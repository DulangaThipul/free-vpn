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
  // Replace with your deployed Cloudflare Worker URL (e.g., https://legion-vpn-api.username.workers.dev/claim)
  API_ENDPOINT: "https://legion-vpn-api.legiongraphics.workers.dev/claim", 
  
  // Adsterra / Monetag / CPA Network Monetization Settings
  ADS: {
    // Primary Popunder Smartlink URL (Triggered on 1st & 2nd global clicks and Terms Modal)
    POPUNDER_URL: "https://www.profitablecpmrate.com/popunder_main",
    
    // Cooldown in seconds before resetting global 2-click popunder quota (e.g. 35 seconds)
    POPUNDER_COOLDOWN_SECONDS: 35,

    // 10-Step Sequential Direct Smartlinks (1 per step, cycling automatically)
    DIRECT_LINKS: [
      "https://www.profitablecpmrate.com/direct_step1",
      "https://www.profitablecpmrate.com/direct_step2",
      "https://www.profitablecpmrate.com/direct_step3",
      "https://www.profitablecpmrate.com/direct_step4",
      "https://www.profitablecpmrate.com/direct_step5",
      "https://www.profitablecpmrate.com/direct_step6",
      "https://www.profitablecpmrate.com/direct_step7",
      "https://www.profitablecpmrate.com/direct_step8",
      "https://www.profitablecpmrate.com/direct_step9",
      "https://www.profitablecpmrate.com/direct_step10"
    ],

    // Legacy individual aliases for backwards compatibility
    STEP_1_DIRECT_LINK: "https://www.profitablecpmrate.com/direct_step1",
    STEP_2_DIRECT_LINK: "https://www.profitablecpmrate.com/direct_step2",
    STEP_3_DIRECT_LINK: "https://www.profitablecpmrate.com/direct_step3",
    STEP_4_DIRECT_LINK: "https://www.profitablecpmrate.com/direct_step4",
    STEP_5_DIRECT_LINK: "https://www.profitablecpmrate.com/direct_step5",
    STEP_6_DIRECT_LINK: "https://www.profitablecpmrate.com/direct_step6",
    STEP_7_DIRECT_LINK: "https://www.profitablecpmrate.com/direct_step7",
    STEP_8_DIRECT_LINK: "https://www.profitablecpmrate.com/direct_step8",
    STEP_9_DIRECT_LINK: "https://www.profitablecpmrate.com/direct_step9",
    STEP_10_DIRECT_LINK: "https://www.profitablecpmrate.com/direct_step10",
    
    // Timer seconds user must wait per step before unlocking the next button (5 seconds)
    STEP_WAIT_SECONDS: 5,

    // Social Bar / In-Page Push Notification Monetization settings
    ENABLE_SOCIAL_BAR: true,
    SOCIAL_BAR_SCRIPT_URL: "//pl23456789.profitablecpmrate.com/socialbar.js"
  },
  
  // Premium Plan Details (LKR 250 with website & whatsapp order)
  PREMIUM: {
    PRICE: "LKR 250 / mo",
    WEBSITE_ORDER: "https://vpn.legiongraphics.site",
    WHATSAPP_SUPPORT: "https://wa.me/441163504152"
  }
};
