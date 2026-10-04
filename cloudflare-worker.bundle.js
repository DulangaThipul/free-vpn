/**
 * LEGION Free VPN - Cloudflare Worker API
 * 
 * Pure V8-native implementation with ZERO external dependencies or Node.js imports.
 * Directly compatible with the Cloudflare Workers Dashboard web editor.
 * 
 * Endpoints:
 * - GET  /api/free/config       : Retrieves active Master VPN Config & detected protocol
 * - POST /api/free/admin/config : Upserts Master VPN Config to MongoDB Atlas (PIN: 80664227)
 * - POST /claim                 : Issues Singapore VPN session credentials
 * - GET  /status                : API health and cluster monitoring
 */

// MongoDB Atlas Configuration & Default Fallback
const MONGO_CONFIG = {
  dataSource: "Cluster1",
  database: "free-legion-vpn",
  collection: "settings",
  adminPin: "80664227",
  defaultRawConfig: "trojan://y9emfz6sx1orp6ka@dulangafree.legiongraphics.site:119/?security=tls&fp=ios&sni=dulangafree.zoom.us&type=tcp&headerType=none#LEGION-VPN%20Free%20All%20ISP",
  defaultSgSteps: 100,
  defaultPublicSteps: 10
};

// In-Memory Edge Runtime Cache
let activeMasterConfig = {
  raw_config: MONGO_CONFIG.defaultRawConfig,
  protocol: "Trojan",
  sg_steps: 100,
  public_steps: 10,
  updated_at: new Date().toISOString()
};

// Default Public Servers (Fallback & Initial State)
const DEFAULT_PUBLIC_SERVERS = [
  { id: "pub_fr", country: "France", flag: "fr", ip: "141.94.33.194", ping: "280ms Ping", sni: "m.facebook.com", status: "Online", configs: { social: "vless://141-94-33-194-fr@141.94.33.194:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=141.94.33.194&path=%2F#LEGION-FRANCE-PUBLIC" } },
  { id: "pub_de", country: "Germany", flag: "de", ip: "57.129.121.229", ping: "260ms Ping", sni: "m.facebook.com", status: "Online", configs: { social: "vless://57-129-121-229-de@57.129.121.229:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=57.129.121.229&path=%2F#LEGION-GERMANY-PUBLIC" } },
  { id: "pub_gb", country: "United Kingdom", flag: "gb", ip: "54.36.162.84", ping: "270ms Ping", sni: "m.facebook.com", status: "Online", configs: { social: "vless://54-36-162-84-gb@54.36.162.84:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=54.36.162.84&path=%2F#LEGION-UK-PUBLIC" } },
  { id: "pub_nl", country: "Netherlands", flag: "nl", ip: "51.158.147.186", ping: "255ms Ping", sni: "m.facebook.com", status: "Online", configs: { social: "vless://51-158-147-186-nl@51.158.147.186:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=51.158.147.186&path=%2F#LEGION-NETHERLANDS-PUBLIC" } },
  { id: "pub_it", country: "Italy", flag: "it", ip: "57.131.38.151", ping: "290ms Ping", sni: "m.facebook.com", status: "Online", configs: { social: "vless://57-131-38-151-it@57.131.38.151:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=57.131.38.151&path=%2F#LEGION-ITALY-PUBLIC" } },
  { id: "pub_ca", country: "Canada", flag: "ca", ip: "158.69.208.120", ping: "320ms Ping", sni: "m.facebook.com", status: "Online", configs: { social: "vless://158-69-208-120-ca@158.69.208.120:443?encryption=none&security=tls&sni=m.facebook.com&type=ws&host=158.69.208.120&path=%2F#LEGION-CANADA-PUBLIC" } }
];

// Default Modal Settings (Fallback & Initial State)
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

// In-Memory Edge Runtime Cache for Public Servers & Modals
let activePublicServers = JSON.parse(JSON.stringify(DEFAULT_PUBLIC_SERVERS));
let activeModalSettings = JSON.parse(JSON.stringify(DEFAULT_MODAL_SETTINGS));

// Default ISP Packages
const DEFAULT_PACKAGES = [
  {
    id: "pkg_dialog_social",
    title: "Dialog Social (20 GB)",
    badge: "Normal Package",
    badgeType: "normal",
    network: "Dialog",
    simType: "Mobile Sim",
    ispPrice: "Rs. 348",
    desc: "Dialog 20GB Social work plan high-speed tunnel.",
    logins: "Up to 2 Logins (Unlimited 3 Logins)",
    inStock: false,
    trojanConfig: "trojan://legion-dialog-social-pass@sg01.legionvpn.net:443?security=tls&sni=m.facebook.com&type=tcp#LEGION-Dialog-Social-SG"
  },
  {
    id: "pkg_dialog_tiktok",
    title: "Dialog TikTok Unlimited",
    badge: "Not Recommended",
    badgeType: "warning",
    network: "Dialog",
    simType: "Mobile Sim",
    ispPrice: "Rs. 297/wk",
    desc: "50GB පසු වේගය 2Mbps දක්වා අඩු වේ.",
    logins: "Up to 2 Logins (Unlimited 3 Logins)",
    inStock: false,
    trojanConfig: "trojan://legion-dialog-tiktok-pass@sg01.legionvpn.net:443?security=tls&sni=www.tiktok.com&type=tcp#LEGION-Dialog-TikTok-SG"
  },
  {
    id: "pkg_airtel_tiktok",
    title: "Airtel TikTok Unlimited",
    badge: "Best Choice",
    badgeType: "best",
    network: "Airtel",
    simType: "Mobile Sim",
    ispPrice: "Rs. 297/wk",
    desc: "Fastest speeds and zero restrictions on Airtel network.",
    logins: "Up to 2 Logins (Unlimited 3 Logins)",
    inStock: false,
    trojanConfig: "trojan://legion-airtel-tiktok-pass@sg01.legionvpn.net:443?security=tls&sni=www.tiktok.com&type=tcp#LEGION-Airtel-TikTok-SG"
  },
  {
    id: "pkg_airtel_yt",
    title: "Airtel YouTube Unlimited",
    badge: "Best Choice",
    badgeType: "best",
    network: "Airtel",
    simType: "Mobile Sim",
    ispPrice: "Rs. 260",
    desc: "High stability tunneling for unlimited daily browsing.",
    logins: "Up to 2 Logins (Unlimited 3 Logins)",
    inStock: false,
    trojanConfig: "trojan://legion-airtel-yt-pass@sg01.legionvpn.net:443?security=tls&sni=api.youtube.com&type=tcp#LEGION-Airtel-YouTube-SG"
  },
  {
    id: "pkg_airtel_zoom",
    title: "Airtel Zoom (30 GB)",
    badge: "Normal Package",
    badgeType: "normal",
    network: "Airtel",
    simType: "Mobile Sim",
    ispPrice: "Rs. 215",
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
    ispPrice: "Rs. 224",
    desc: "Hutch network bypass for day-to-day internet needs.",
    logins: "Up to 2 Logins (Unlimited 3 Logins)",
    inStock: true,
    trojanConfig: "trojan://legion-hutch-zoom-pass@sg01.legionvpn.net:443?security=tls&sni=zoom.us&type=tcp#LEGION-Hutch-Zoom-SG"
  }
];

function packagesArrayToMap(list) {
  const map = {};
  if (!Array.isArray(list)) return map;
  list.forEach(p => {
    let key = (p.id || '').replace(/^pkg_/, '');
    if (key === 'airtel_yt') key = 'airtel_youtube';
    map[key] = {
      inStock: !!p.inStock,
      price: p.ispPrice || p.price || ''
    };
  });
  return map;
}

function mergePackagesWithMap(baseList, pkgMap) {
  if (!pkgMap || typeof pkgMap !== 'object') return baseList;
  return baseList.map(p => {
    let key = (p.id || '').replace(/^pkg_/, '');
    if (key === 'airtel_yt') key = 'airtel_youtube';
    const override = pkgMap[key];
    if (override) {
      return {
        ...p,
        inStock: override.inStock !== undefined ? override.inStock : p.inStock,
        ispPrice: override.price || override.ispPrice || p.ispPrice
      };
    }
    return p;
  });
}

// Default Global Settings (Exact MongoDB Atlas _id: "global_settings" Schema)
const DEFAULT_GLOBAL_SETTINGS = {
  _id: "global_settings",
  master_config: "trojan://y9emfz6sx1orp6ka@dulangafree.legiongraphics.site:119/?security=tls&fp=ios&sni=dulangafree.zoom.us&type=tcp&headerType=none#LEGION-VPN%20Free%20All%20ISP",
  raw_config: "trojan://y9emfz6sx1orp6ka@dulangafree.legiongraphics.site:119/?security=tls&fp=ios&sni=dulangafree.zoom.us&type=tcp&headerType=none#LEGION-VPN%20Free%20All%20ISP",
  protocol: "Trojan",
  sg_steps: 1,
  public_steps: 1,
  packages: {
    dialog_social: { inStock: false, price: "Rs. 348" },
    dialog_tiktok: { inStock: false, price: "Rs. 297/wk" },
    airtel_tiktok: { inStock: false, price: "Rs. 297/wk" },
    airtel_youtube: { inStock: false, price: "Rs. 260" },
    airtel_zoom: { inStock: true, price: "Rs. 215" },
    hutch_zoom: { inStock: true, price: "Rs. 224" }
  },
  package_list: DEFAULT_PACKAGES,
  public_servers: DEFAULT_PUBLIC_SERVERS,
  modal_settings: {
    sg_heading: "Your Singapore Node Credentials",
    sg_validity: "Valid: 5 Days (50GB Limit)",
    support_text: "Need help? Join our Telegram support group.",
    sgHeading: "Your Singapore Node Credentials",
    sgValidityNotice: "Valid: 5 Days (50GB Limit)",
    sgSupportBanner: "Need help? Join our Telegram support group."
  },
  updated_at: new Date().toISOString()
};

let activeGlobalSettings = JSON.parse(JSON.stringify(DEFAULT_GLOBAL_SETTINGS));

// Rate Limit Tracking
const RATE_LIMIT_STORE = new Map();
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

// In-Memory Telemetry Ring Buffers (Edge Memory Fallback)
const VISITOR_LOGS_CACHE = [
  {
    timestamp: new Date().toISOString(),
    slTime: "Just now (SLT)",
    ip: "112.134.195.42",
    country: "LK",
    city: "Colombo",
    location: "Colombo, Sri Lanka",
    isp: "Sri Lanka Telecom",
    device: "Mobile Phone",
    deviceSummary: "Mobile Phone (Android · Chrome)",
    event: "page_view",
    step: 1,
    stepsCompleted: 0,
    totalAdsVerified: 0,
    progressSummary: "Live Visitor Session Active",
    userEmail: "visitor@slt.lk"
  }
];
const ADMIN_LOGINS_CACHE = [
  {
    timestamp: new Date().toISOString(),
    slTime: "Just now (SLT)",
    ip: "112.134.195.42",
    country: "LK",
    city: "Colombo",
    location: "Colombo, Sri Lanka",
    isp: "Sri Lanka Telecom",
    action: "admin_dashboard_login",
    device: "Desktop",
    deviceSummary: "Desktop (Windows · Chrome)",
    status: "Success"
  }
];
const MAX_LOG_CACHE = 100;

function addVisitorLogCache(log) {
  VISITOR_LOGS_CACHE.unshift(log);
  if (VISITOR_LOGS_CACHE.length > MAX_LOG_CACHE) VISITOR_LOGS_CACHE.pop();
}

function addAdminLoginCache(log) {
  ADMIN_LOGINS_CACHE.unshift(log);
  if (ADMIN_LOGINS_CACHE.length > MAX_LOG_CACHE) ADMIN_LOGINS_CACHE.pop();
}
// In-Memory User Activity Logs Cache
let USER_ACTIVITY_LOGS_CACHE = [
  {
    email: "dulanga.graphics@gmail.com",
    name: "Dulanga Admin",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dulanga.graphics@gmail.com&backgroundColor=060a08",
    firstSignIn: "2026-10-04T12:00:00.000Z",
    lastActivity: "2026-10-04T18:30:00.000Z",
    loginCount: 5,
    ip: "112.134.140.21",
    country: "Sri Lanka",
    countryCode: "LK",
    isp: "Dialog Axiata PLC",
    deviceSummary: "PC (Desktop) (Windows 11 · Chrome)",
    banned: false
  },
  {
    email: "legion.member@gmail.com",
    name: "Legion Explorer",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=legion.member@gmail.com&backgroundColor=060a08",
    firstSignIn: "2026-10-04T14:15:00.000Z",
    lastActivity: "2026-10-04T19:45:00.000Z",
    loginCount: 2,
    ip: "123.231.112.85",
    country: "Sri Lanka",
    countryCode: "LK",
    isp: "SLT Mobitel",
    deviceSummary: "Mobile Phone (Android · Chrome)",
    banned: false
  }
];

function addUserActivityLogCache(doc) {
  const existingIdx = USER_ACTIVITY_LOGS_CACHE.findIndex(u => u.email.toLowerCase() === doc.email.toLowerCase());
  if (existingIdx !== -1) {
    USER_ACTIVITY_LOGS_CACHE[existingIdx] = {
      ...USER_ACTIVITY_LOGS_CACHE[existingIdx],
      ...doc,
      loginCount: (USER_ACTIVITY_LOGS_CACHE[existingIdx].loginCount || 1) + 1
    };
  } else {
    USER_ACTIVITY_LOGS_CACHE.unshift({
      firstSignIn: doc.timestamp || new Date().toISOString(),
      loginCount: 1,
      ...doc
    });
    if (USER_ACTIVITY_LOGS_CACHE.length > 50) {
      USER_ACTIVITY_LOGS_CACHE.pop();
    }
  }
}


// Administrator-Banned User Emails
const BANNED_EMAILS = new Set([
  "abuser@spam.com",
  "spammer@botnet.org",
  "cheat@vpnbreaker.net"
]);

// Mapping of ISP packages to their exact Bug SNIs & Remark Titles
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

// Carrier Bug Host & SNI Templates
const ISP_PACKAGE_TEMPLATES = {
  dialog_social: {
    packageName: "Dialog Social (20 GB)",
    serverHost: "sg-dialog.legionvpn.net",
    sni: "m.facebook.com",
    port: 443,
    carrier: "Dialog Sri Lanka",
    protocolName: "Trojan (HTTPS Facebook SNI Stealth)"
  },
  dialog_tiktok: {
    packageName: "Dialog TikTok Unlimited",
    serverHost: "sg-tiktok.legionvpn.net",
    sni: "www.tiktok.com",
    port: 443,
    carrier: "Dialog Sri Lanka",
    protocolName: "Trojan (HTTPS TikTok SNI Stealth)"
  },
  airtel_tiktok: {
    packageName: "Airtel TikTok Unlimited",
    serverHost: "sg-airtel-tt.legionvpn.net",
    sni: "www.tiktok.com",
    port: 443,
    carrier: "Airtel Sri Lanka",
    protocolName: "Trojan (HTTPS TikTok SNI Stealth)"
  },
  airtel_youtube: {
    packageName: "Airtel YouTube Unlimited",
    serverHost: "sg-airtel-yt.legionvpn.net",
    sni: "api.youtube.com",
    port: 443,
    carrier: "Airtel Sri Lanka",
    protocolName: "Trojan (HTTPS YouTube SNI Stealth)"
  },
  airtel_zoom: {
    packageName: "Airtel Zoom (30 GB)",
    serverHost: "sg-airtel-zm.legionvpn.net",
    sni: "zoom.us",
    port: 443,
    carrier: "Airtel Sri Lanka",
    protocolName: "Trojan (HTTPS Zoom SNI Stealth)"
  },
  hutch_zoom: {
    packageName: "Hutch Zoom (30 GB)",
    serverHost: "sg-hutch-zm.legionvpn.net",
    sni: "zoom.us",
    port: 443,
    carrier: "Hutch Sri Lanka",
    protocolName: "Trojan (HTTPS Zoom SNI Stealth)"
  }
};

/**
 * Protocol Scheme Detector
 */
function detectProtocol(url) {
  const u = (url || "").trim().toLowerCase();
  if (u.startsWith("trojan://")) return "Trojan";
  if (u.startsWith("vless://")) return "VLESS";
  if (u.startsWith("vmess://")) return "VMess";
  return "VPN";
}

/**
 * Normalizes user/client package keys (e.g. "pkg_dialog_social", "social", "airtel_yt")
 */
function normalizePackageKey(key) {
  if (!key) return "";
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

/**
 * Injects the correct package SNI and remark tag into the raw Master Trojan / VLESS config
 */
function injectPackageSni(rawConfigUrl, packageKey) {
  if (!rawConfigUrl) return rawConfigUrl;
  
  const normKey = normalizePackageKey(packageKey);
  const pkg = ISP_SNI_MAP[normKey];
  if (!pkg) return rawConfigUrl;

  const targetSni = pkg.sni;
  const targetTag = pkg.tag;

  // Handle VMess (Base64 JSON)
  if (rawConfigUrl.startsWith("vmess://")) {
    try {
      const b64 = rawConfigUrl.substring(8);
      const jsonStr = (typeof atob === "function")
        ? atob(b64)
        : (typeof Buffer !== "undefined" ? Buffer.from(b64, 'base64').toString('utf-8') : "");
      if (jsonStr) {
        const vmessObj = JSON.parse(jsonStr);
        vmessObj.sni = targetSni;
        if (vmessObj.host) vmessObj.host = targetSni;
        vmessObj.ps = targetTag;
        const newB64 = (typeof btoa === "function")
          ? btoa(JSON.stringify(vmessObj))
          : Buffer.from(JSON.stringify(vmessObj)).toString('base64');
        return "vmess://" + newB64;
      }
    } catch (e) {
      return rawConfigUrl;
    }
  }

  // Handle Trojan / VLESS (URL scheme with query parameters & remark hash)
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

/**
 * User-Agent Device, OS & Browser Parser
 */
function parseUserAgent(ua) {
  if (!ua) return { device: "Unknown", os: "Unknown", browser: "Unknown", summary: "Unknown Device" };
  const u = ua.toLowerCase();

  const isIPad = /ipad/i.test(u);
  const isAndroidTablet = u.includes("android") && !u.includes("mobile");
  const isTablet = isIPad || isAndroidTablet || /tablet|playbook|silk|kindle/i.test(u);
  const isMobile = !isTablet && (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(u) || (u.includes("android") && u.includes("mobile")));

  let device = "PC (Desktop)";
  if (isTablet) {
    device = "Tablet (Tab)";
  } else if (isMobile) {
    device = "Mobile Phone";
  } else {
    device = "PC (Desktop)";
  }

  let os = "Unknown";
  if (u.includes("windows nt 10")) os = "Windows 10/11";
  else if (u.includes("windows")) os = "Windows";
  else if (u.includes("android")) os = "Android";
  else if (u.includes("iphone") || u.includes("ipad") || u.includes("ipod")) os = "iOS";
  else if (u.includes("mac os") || u.includes("macintosh")) os = "macOS";
  else if (u.includes("linux")) os = "Linux";

  let browser = "Unknown";
  if (u.includes("edg/")) browser = "Edge";
  else if (u.includes("chrome/") && !u.includes("edg/")) browser = "Chrome";
  else if (u.includes("safari/") && !u.includes("chrome/")) browser = "Safari";
  else if (u.includes("firefox/")) browser = "Firefox";
  else if (u.includes("opera") || u.includes("opr/")) browser = "Opera";

  return {
    device,
    os,
    browser,
    summary: `${device} (${os} · ${browser})`
  };
}

/**
 * Format timestamp in Sri Lanka Time (UTC+5:30)
 */
function formatSriLankaTime(date) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).format(date) + " (SLT)";
  } catch (e) {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const sl = new Date(utc + (5.5 * 3600000));
    return sl.toISOString().replace('T', ' ').substring(0, 19) + " (SLT)";
  }
}

/**
 * Extract Cloudflare CF-Headers & Client Telemetry
 */
function extractRequestTelemetry(request) {
  const ip = request.headers.get("cf-connecting-ip") || 
             request.headers.get("x-real-ip") || 
             request.headers.get("x-forwarded-for") || 
             "127.0.0.1";
  
  const cf = request.cf || {};
  const country = cf.country || "Unknown";
  const city = cf.city || "Unknown";
  const isp = cf.asOrganization || cf.colo || "Unknown";
  const ua = request.headers.get("user-agent") || "";
  const parsedUa = parseUserAgent(ua);
  
  const now = new Date();
  const isoTime = now.toISOString();
  const slTime = formatSriLankaTime(now);

  let pathname = "/";
  try {
    pathname = new URL(request.url).pathname;
  } catch (e) {}

  return {
    ip,
    country,
    city,
    location: (city !== "Unknown" && country !== "Unknown") ? `${city}, ${country}` : country,
    isp,
    userAgent: ua,
    device: parsedUa.device,
    os: parsedUa.os,
    browser: parsedUa.browser,
    deviceSummary: parsedUa.summary,
    timestamp: isoTime,
    slTime: slTime,
    path: pathname
  };
}

/**
 * MongoDB Atlas Data API Helper (Native HTTPS Fetch)
 */
async function fetchAtlasDataApi(action, payload, env) {
  const endpoint = (env && env.MONGODB_DATA_API_URL) || "https://data.mongodb-api.com/app/data-zvqnh6t/endpoint/data/v1/action";
  const apiKey = (env && env.MONGODB_API_KEY) || (env && env.DATA_API_KEY) || "";
  const dataSource = (env && env.MONGODB_CLUSTER) || MONGO_CONFIG.dataSource;
  const database = (env && env.MONGODB_DATABASE) || MONGO_CONFIG.database;
  const targetCollection = payload.collection || (env && env.MONGODB_COLLECTION) || MONGO_CONFIG.collection;

  const url = `${endpoint.replace(/\/+$/, "")}/${action}`;
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  if (apiKey) {
    headers["apiKey"] = apiKey;
  }

  const { collection, ...restPayload } = payload;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      dataSource,
      database,
      collection: targetCollection,
      ...restPayload
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Atlas Data API status ${response.status}: ${errorText}`);
  }

  return await response.json();
}

/**
 * Log Visitor Activity to visitor_logs Collection & Edge Cache
 */
async function logVisitorActivity(eventPayload, request, env) {
  const telemetry = extractRequestTelemetry(request);
  const logDoc = {
    ...telemetry,
    event: eventPayload.event || "page_view",
    userEmail: eventPayload.userEmail || "Anonymous",
    packageId: eventPayload.packageId || null,
    packageTitle: eventPayload.packageTitle || null,
    step: eventPayload.step || 1,
    stepsCompleted: eventPayload.stepsCompleted || 0,
    totalAdsVerified: eventPayload.totalAdsVerified || 0,
    progressSummary: eventPayload.progressSummary || (eventPayload.totalAdsVerified ? `${eventPayload.totalAdsVerified}/100 Ads` : `Step ${eventPayload.step || 1}`),
    details: eventPayload.details || null
  };

  if (eventPayload.deviceType === 'tablet') {
    logDoc.device = 'Tablet (Tab)';
    logDoc.deviceSummary = `Tablet (Tab) (${telemetry.os} · ${telemetry.browser})`;
  } else if (eventPayload.deviceType === 'mobile') {
    logDoc.device = 'Mobile Phone';
    logDoc.deviceSummary = `Mobile Phone (${telemetry.os} · ${telemetry.browser})`;
  } else if (eventPayload.deviceType === 'pc') {
    logDoc.device = 'PC (Desktop)';
    logDoc.deviceSummary = `PC (Desktop) (${telemetry.os} · ${telemetry.browser})`;
  }

  addVisitorLogCache(logDoc);

  if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
    try {
      await fetchAtlasDataApi("insertOne", {
        collection: "visitor_logs",
        document: logDoc
      }, env);
    } catch (e) {
      console.warn("MongoDB visitor_logs insert notice:", e.message);
    }
  }

  return logDoc;
}

/**
 * Log Admin Activity to admin_logins Collection & Edge Cache
 */
async function logAdminActivity(action, status, request, env, extra = {}) {
  const telemetry = extractRequestTelemetry(request);
  const adminDoc = {
    ...telemetry,
    action: action,
    status: status,
    ...extra
  };

  addAdminLoginCache(adminDoc);

  if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
    try {
      await fetchAtlasDataApi("insertOne", {
        collection: "admin_logins",
        document: adminDoc
      }, env);
    } catch (e) {
      console.warn("MongoDB admin_logins insert notice:", e.message);
    }
  }

  return adminDoc;
}

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400"
    };

    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const clientIp = request.headers.get("cf-connecting-ip") || 
                     request.headers.get("x-real-ip") || 
                     request.headers.get("x-forwarded-for") || 
                     "127.0.0.1";

    // 2. Health & Cluster Status
    if (url.pathname === "/" || url.pathname === "/status" || url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "LEGION Free Singapore VPN API Online",
        timestamp: Date.now(),
        cluster: "Singapore VPS Cluster SG-01 (1Gbps)",
        mongodb: "Atlas Data API Compatible",
        activeProtocol: activeMasterConfig.protocol
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // =========================================================================
    // 2.5 GET /api/free/global-settings (or /api/free/settings)
    // Returns the entire unified settings document (_id: "global_settings")
    // =========================================================================
    if (
      (url.pathname === "/api/free/global-settings" ||
      url.pathname === "/api/global-settings" ||
      url.pathname === "/api/free/settings" ||
      url.pathname === "/api/settings" ||
      url.pathname.endsWith("/global-settings") ||
      url.pathname.endsWith("/settings")) &&
      !url.pathname.includes("/admin/")
    ) {
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use GET." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 1. Check Cloudflare KV
      if (env && env.LEGION_KV) {
        try {
          const kvSettings = await env.LEGION_KV.get("global_settings", "json");
          if (kvSettings && typeof kvSettings === "object") {
            activeGlobalSettings = { ...activeGlobalSettings, ...kvSettings };
            return new Response(JSON.stringify({
              success: true,
              settings: activeGlobalSettings,
              data: activeGlobalSettings,
              source: "cloudflare_kv"
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        } catch (e) {}
      }

      // 2. Fetch from MongoDB Atlas collection "settings" (_id: "global_settings")
      if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
        try {
          const result = await fetchAtlasDataApi("findOne", {
            collection: "settings",
            filter: { _id: "global_settings" }
          }, env);

          if (result && result.document) {
            const doc = result.document;
            activeGlobalSettings = {
              ...activeGlobalSettings,
              ...doc,
              packages: doc.packages || activeGlobalSettings.packages,
              package_list: doc.package_list || (doc.packages ? mergePackagesWithMap(DEFAULT_PACKAGES, doc.packages) : activeGlobalSettings.package_list),
              public_servers: Array.isArray(doc.public_servers) && doc.public_servers.length > 0 ? doc.public_servers : activeGlobalSettings.public_servers,
              modal_settings: doc.modal_settings || activeGlobalSettings.modal_settings,
              master_config: doc.master_config || doc.raw_config || activeGlobalSettings.master_config,
              raw_config: doc.raw_config || doc.master_config || activeGlobalSettings.raw_config,
              sg_steps: doc.sg_steps !== undefined ? doc.sg_steps : activeGlobalSettings.sg_steps,
              public_steps: doc.public_steps !== undefined ? doc.public_steps : activeGlobalSettings.public_steps,
              updated_at: doc.updated_at || new Date().toISOString()
            };
            activeMasterConfig.raw_config = activeGlobalSettings.master_config;
            activeMasterConfig.sg_steps = activeGlobalSettings.sg_steps;
            activeMasterConfig.public_steps = activeGlobalSettings.public_steps;
            activePublicServers = activeGlobalSettings.public_servers;
            activeModalSettings = activeGlobalSettings.modal_settings;

            return new Response(JSON.stringify({
              success: true,
              settings: activeGlobalSettings,
              data: activeGlobalSettings,
              source: "mongodb_atlas"
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        } catch (e) {
          console.warn("Atlas findOne global_settings notice:", e.message);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        settings: activeGlobalSettings,
        data: activeGlobalSettings,
        source: "edge_runtime"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // =========================================================================
    // 2.6 POST /api/free/admin/global-settings (or /api/free/admin/settings)
    // Persists the entire unified settings document (_id: "global_settings") into MongoDB Atlas
    // Requires PIN: 80664227
    // =========================================================================
    if (
      url.pathname === "/api/free/admin/global-settings" ||
      url.pathname.endsWith("/admin/global-settings") ||
      url.pathname === "/api/free/admin/settings" ||
      url.pathname.endsWith("/admin/settings")
    ) {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use POST." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const body = await request.json().catch(() => ({}));
        const headerPin = request.headers.get("x-admin-pin") || 
                          (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        const pin = (headerPin || body.pin || body.adminPin || "").trim();
        const verifiedPin = (env && env.ADMIN_PIN) || MONGO_CONFIG.adminPin || "80664227";

        if (pin !== verifiedPin && pin !== "80664227") {
          await logAdminActivity("save_global_settings_attempt", "Invalid PIN", request, env, {
            pinAttempt: pin ? "****" : "empty"
          });
          return new Response(JSON.stringify({
            success: false,
            message: "Unauthorized: Invalid Admin PIN"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const now = new Date().toISOString();
        const updateFields = {
          updated_at: now
        };

        const rawConfig = body.master_config || body.raw_config || body.rawConfig || body.config;
        if (rawConfig && typeof rawConfig === 'string') {
          updateFields.master_config = rawConfig.trim();
          updateFields.raw_config = rawConfig.trim();
          updateFields.protocol = detectProtocol(rawConfig.trim());
          activeGlobalSettings.master_config = updateFields.master_config;
          activeGlobalSettings.raw_config = updateFields.raw_config;
          activeGlobalSettings.protocol = updateFields.protocol;
          activeMasterConfig.raw_config = updateFields.master_config;
          activeMasterConfig.protocol = updateFields.protocol;
        }

        if (body.sg_steps !== undefined) {
          const s = parseInt(body.sg_steps, 10);
          updateFields.sg_steps = (s === 1) ? 1 : 100;
          activeGlobalSettings.sg_steps = updateFields.sg_steps;
          activeMasterConfig.sg_steps = updateFields.sg_steps;
        }
        if (body.public_steps !== undefined) {
          const p = parseInt(body.public_steps, 10);
          updateFields.public_steps = (p === 1) ? 1 : 10;
          activeGlobalSettings.public_steps = updateFields.public_steps;
          activeMasterConfig.public_steps = updateFields.public_steps;
        }

        if (body.packages) {
          if (Array.isArray(body.packages)) {
            updateFields.packages = packagesArrayToMap(body.packages);
            updateFields.package_list = body.packages;
          } else if (typeof body.packages === 'object') {
            updateFields.packages = body.packages;
            updateFields.package_list = mergePackagesWithMap(DEFAULT_PACKAGES, body.packages);
          }
          activeGlobalSettings.packages = updateFields.packages;
          activeGlobalSettings.package_list = updateFields.package_list;
        } else if (body.package_list && Array.isArray(body.package_list)) {
          updateFields.packages = packagesArrayToMap(body.package_list);
          updateFields.package_list = body.package_list;
          activeGlobalSettings.packages = updateFields.packages;
          activeGlobalSettings.package_list = updateFields.package_list;
        }

        if (body.public_servers && Array.isArray(body.public_servers)) {
          updateFields.public_servers = body.public_servers;
          activeGlobalSettings.public_servers = body.public_servers;
          activePublicServers = body.public_servers;
        }

        if (body.modal_settings && typeof body.modal_settings === 'object') {
          updateFields.modal_settings = { ...activeGlobalSettings.modal_settings, ...body.modal_settings };
          activeGlobalSettings.modal_settings = updateFields.modal_settings;
          activeModalSettings = updateFields.modal_settings;
        }

        activeGlobalSettings.updated_at = now;

        if (env && env.LEGION_KV) {
          try {
            await env.LEGION_KV.put("global_settings", JSON.stringify(activeGlobalSettings));
            await env.LEGION_KV.put("master_config", JSON.stringify(activeMasterConfig));
            await env.LEGION_KV.put("public_servers", JSON.stringify(activeGlobalSettings.public_servers));
            await env.LEGION_KV.put("modal_settings", JSON.stringify(activeGlobalSettings.modal_settings));
          } catch (e) {}
        }

        let atlasPersisted = false;
        if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
          try {
            await fetchAtlasDataApi("updateOne", {
              collection: "settings",
              filter: { _id: "global_settings" },
              update: { $set: updateFields },
              upsert: true
            }, env);
            atlasPersisted = true;
          } catch (e) {
            console.warn("Atlas updateOne global_settings notice:", e.message);
          }
        }

        await logAdminActivity("save_global_settings", "Success", request, env, {
          fieldsUpdated: Object.keys(updateFields)
        });

        return new Response(JSON.stringify({
          success: true,
          message: "Global settings persisted to MongoDB Atlas.",
          settings: activeGlobalSettings,
          atlasSynced: atlasPersisted
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          message: "Failed to persist global settings: " + err.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // =========================================================================
    // 2.7 GET /api/free/packages & POST /api/free/admin/packages
    // =========================================================================
    if ((url.pathname === "/api/free/packages" || url.pathname === "/api/packages" || url.pathname.endsWith("/packages") || url.pathname.endsWith("/free/packages")) && !url.pathname.includes("/admin/")) {
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use GET." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({
        success: true,
        packages: activeGlobalSettings.packages,
        package_list: activeGlobalSettings.package_list,
        source: "edge_runtime"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/api/free/admin/packages" || url.pathname.endsWith("/free/admin/packages") || url.pathname === "/api/admin/packages") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use POST." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const body = await request.json().catch(() => ({}));
        const headerPin = request.headers.get("x-admin-pin") || 
                          (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        const pin = (headerPin || body.pin || body.adminPin || "").trim();
        const verifiedPin = (env && env.ADMIN_PIN) || MONGO_CONFIG.adminPin || "80664227";

        if (pin !== verifiedPin && pin !== "80664227") {
          return new Response(JSON.stringify({
            success: false,
            message: "Unauthorized: Invalid Admin PIN"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const now = new Date().toISOString();
        const incomingPkgs = body.packages || body.package_list || (Array.isArray(body) ? body : null);
        let pkgMap = {};
        let pkgList = [];

        if (Array.isArray(incomingPkgs)) {
          pkgMap = packagesArrayToMap(incomingPkgs);
          pkgList = incomingPkgs;
        } else if (incomingPkgs && typeof incomingPkgs === 'object') {
          pkgMap = incomingPkgs;
          pkgList = mergePackagesWithMap(DEFAULT_PACKAGES, incomingPkgs);
        }

        activeGlobalSettings.packages = pkgMap;
        activeGlobalSettings.package_list = pkgList;
        activeGlobalSettings.updated_at = now;

        let atlasPersisted = false;
        if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
          try {
            await fetchAtlasDataApi("updateOne", {
              collection: "settings",
              filter: { _id: "global_settings" },
              update: {
                $set: {
                  packages: pkgMap,
                  package_list: pkgList,
                  updated_at: now
                }
              },
              upsert: true
            }, env);
            atlasPersisted = true;
          } catch (e) {
            console.warn("Atlas updateOne packages notice:", e.message);
          }
        }

        await logAdminActivity("save_packages", "Success", request, env, {
          packageCount: pkgList.length
        });

        return new Response(JSON.stringify({
          success: true,
          message: "Packages saved to MongoDB Atlas.",
          packages: pkgMap,
          package_list: pkgList,
          atlasSynced: atlasPersisted
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          message: "Failed to update packages: " + err.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // =========================================================================
    // 3. GET /api/free/config
    // Fetches master_config from free-legion-vpn.settings
    // =========================================================================
    if ((url.pathname === "/api/free/config" || url.pathname === "/api/config" || url.pathname.endsWith("/api/free/config") || url.pathname.endsWith("/free/config")) && !url.pathname.includes("/admin/")) {
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use GET." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const pkgParam = url.searchParams.get("pkg") || url.searchParams.get("package") || url.searchParams.get("packageId") || "";
      const normKey = pkgParam ? normalizePackageKey(pkgParam) : "";
      const matchedPkg = ISP_SNI_MAP[normKey];

      // Check Cloudflare KV if bound
      if (env && env.LEGION_KV) {
        try {
          const kvVal = await env.LEGION_KV.get("master_config", "json");
          if (kvVal && kvVal.raw_config) {
            const raw = kvVal.raw_config;
            const finalConfig = pkgParam ? injectPackageSni(raw, pkgParam) : raw;
            const detected = detectProtocol(finalConfig);
            const sgSteps = (kvVal.sg_steps === 1) ? 1 : 100;
            const publicSteps = (kvVal.public_steps === 1) ? 1 : 10;
            activeMasterConfig.sg_steps = sgSteps;
            activeMasterConfig.public_steps = publicSteps;
            return new Response(JSON.stringify({
              success: true,
              config: finalConfig,
              protocol: detected,
              sg_steps: sgSteps,
              public_steps: publicSteps,
              raw_master_config: raw,
              package: normKey || undefined,
              sni: matchedPkg ? matchedPkg.sni : undefined,
              tag: matchedPkg ? matchedPkg.tag : undefined,
              updated_at: kvVal.updated_at || null,
              source: "kv"
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        } catch (e) {
          console.warn("KV read error:", e);
        }
      }

      // Query MongoDB Atlas Data API if configured
      if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
        try {
          let result = await fetchAtlasDataApi("findOne", {
            collection: "settings",
            filter: { _id: "global_settings" }
          }, env);

          if (!result || !result.document || (!result.document.raw_config && !result.document.master_config)) {
            result = await fetchAtlasDataApi("findOne", {
              collection: "settings",
              filter: { _id: "master_config" }
            }, env);
          }

          if (result && result.document && (result.document.raw_config || result.document.master_config)) {
            const doc = result.document;
            const raw = doc.master_config || doc.raw_config;
            const sgSteps = (doc.sg_steps === 1) ? 1 : (doc.sg_steps !== undefined ? doc.sg_steps : (activeMasterConfig.sg_steps || 100));
            const publicSteps = (doc.public_steps === 1) ? 1 : (doc.public_steps !== undefined ? doc.public_steps : (activeMasterConfig.public_steps || 10));
            activeMasterConfig = {
              raw_config: raw,
              protocol: doc.protocol || detectProtocol(raw),
              sg_steps: sgSteps,
              public_steps: publicSteps,
              updated_at: doc.updated_at || new Date().toISOString()
            };
            const finalConfig = pkgParam ? injectPackageSni(raw, pkgParam) : raw;
            const detected = detectProtocol(finalConfig);
            return new Response(JSON.stringify({
              success: true,
              config: finalConfig,
              protocol: detected,
              sg_steps: sgSteps,
              public_steps: publicSteps,
              raw_master_config: raw,
              package: normKey || undefined,
              sni: matchedPkg ? matchedPkg.sni : undefined,
              tag: matchedPkg ? matchedPkg.tag : undefined,
              updated_at: doc.updated_at || null,
              source: "mongodb_atlas"
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        } catch (err) {
          console.warn("Atlas Data API findOne notice:", err.message);
        }
      }

      // Return Active Config
      const raw = activeMasterConfig.raw_config;
      const finalConfig = pkgParam ? injectPackageSni(raw, pkgParam) : raw;
      const detected = detectProtocol(finalConfig);
      return new Response(JSON.stringify({
        success: true,
        config: finalConfig,
        protocol: detected,
        sg_steps: activeMasterConfig.sg_steps || 100,
        public_steps: activeMasterConfig.public_steps || 10,
        raw_master_config: raw,
        package: normKey || undefined,
        sni: matchedPkg ? matchedPkg.sni : undefined,
        tag: matchedPkg ? matchedPkg.tag : undefined,
        updated_at: activeMasterConfig.updated_at,
        source: "edge_runtime"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // =========================================================================
    // 4. POST /api/free/admin/config
    // Requires PIN 80664227. Upserts _id: "master_config" in settings collection
    // =========================================================================
    if (url.pathname === "/api/free/admin/config" || url.pathname.endsWith("/api/free/admin/config") || url.pathname.endsWith("/free/admin/config")) {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use POST." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const body = await request.json().catch(() => ({}));
        const headerPin = request.headers.get("x-admin-pin") || 
                          (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        const pin = (headerPin || body.pin || body.adminPin || "").trim();

        const verifiedPin = (env && env.ADMIN_PIN) || MONGO_CONFIG.adminPin;
        if (pin !== verifiedPin) {
          await logAdminActivity("save_master_config_attempt", "Invalid PIN", request, env, {
            pinAttempt: pin ? "****" : "empty"
          });
          return new Response(JSON.stringify({
            success: false,
            message: "Unauthorized: Invalid Admin PIN"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const rawConfig = (body.raw_config || body.rawConfig || body.config || "").trim();
        const sgSteps = (body.sg_steps !== undefined) ? parseInt(body.sg_steps, 10) : ((body.sgSteps !== undefined) ? parseInt(body.sgSteps, 10) : undefined);
        const publicSteps = (body.public_steps !== undefined) ? parseInt(body.public_steps, 10) : ((body.publicSteps !== undefined) ? parseInt(body.publicSteps, 10) : undefined);

        if (!rawConfig && sgSteps === undefined && publicSteps === undefined) {
          return new Response(JSON.stringify({
            success: false,
            message: "Bad Request: Missing raw_config URL string or funnel steps"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const now = new Date().toISOString();
        let protocol = activeMasterConfig.protocol;

        if (rawConfig) {
          protocol = detectProtocol(rawConfig);
          activeMasterConfig.raw_config = rawConfig;
          activeMasterConfig.protocol = protocol;
        }

        if (sgSteps !== undefined) {
          activeMasterConfig.sg_steps = (sgSteps === 1) ? 1 : 100;
        }
        if (publicSteps !== undefined) {
          activeMasterConfig.public_steps = (publicSteps === 1) ? 1 : 10;
        }
        activeMasterConfig.updated_at = now;

        // Persist to Cloudflare KV if bound
        if (env && env.LEGION_KV) {
          try {
            await env.LEGION_KV.put("master_config", JSON.stringify(activeMasterConfig));
          } catch (e) {
            console.warn("KV put error:", e);
          }
        }

        // Persist to MongoDB Atlas Data API if configured
        let atlasPersisted = false;
        if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
          try {
            const updateFields = {
              updated_at: now
            };
            if (rawConfig) {
              updateFields.master_config = rawConfig;
              updateFields.raw_config = rawConfig;
              updateFields.protocol = protocol;
            }
            if (sgSteps !== undefined) {
              updateFields.sg_steps = activeMasterConfig.sg_steps;
            }
            if (publicSteps !== undefined) {
              updateFields.public_steps = activeMasterConfig.public_steps;
            }

            await fetchAtlasDataApi("updateOne", {
              collection: "settings",
              filter: { _id: "global_settings" },
              update: {
                $set: updateFields
              },
              upsert: true
            }, env);

            await fetchAtlasDataApi("updateOne", {
              collection: "settings",
              filter: { _id: "master_config" },
              update: {
                $set: updateFields
              },
              upsert: true
            }, env).catch(() => {});
            atlasPersisted = true;
          } catch (err) {
            console.warn("Atlas Data API updateOne notice:", err.message);
          }
        }

        await logAdminActivity("save_master_config", "Success", request, env, {
          protocol: activeMasterConfig.protocol,
          sg_steps: activeMasterConfig.sg_steps,
          public_steps: activeMasterConfig.public_steps,
          raw_config_snippet: activeMasterConfig.raw_config ? (activeMasterConfig.raw_config.substring(0, 40) + "...") : ""
        });

        return new Response(JSON.stringify({
          success: true,
          message: "Configuration saved to MongoDB.",
          protocol: activeMasterConfig.protocol,
          sg_steps: activeMasterConfig.sg_steps,
          public_steps: activeMasterConfig.public_steps,
          updated_at: now,
          atlasSynced: atlasPersisted
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          message: "Failed to process config: " + err.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // =========================================================================
    // 4.1 GET /api/free/public-servers
    // Returns global public servers from MongoDB Atlas (_id: "global_settings")
    // =========================================================================
    if ((url.pathname === "/api/free/public-servers" || url.pathname === "/api/public-servers" || url.pathname.endsWith("/public-servers") || url.pathname.endsWith("/free/public-servers")) && !url.pathname.includes("/admin/")) {
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use GET." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 1. Try reading from KV if bound
      if (env && env.LEGION_KV) {
        try {
          const kvServers = await env.LEGION_KV.get("public_servers", "json");
          if (Array.isArray(kvServers) && kvServers.length > 0) {
            activePublicServers = kvServers;
            return new Response(JSON.stringify({
              success: true,
              servers: activePublicServers,
              public_servers: activePublicServers,
              source: "cloudflare_kv"
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        } catch (e) {}
      }

      // 2. Fetch from MongoDB Atlas collection "settings" (_id: "global_settings")
      if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
        try {
          const result = await fetchAtlasDataApi("findOne", {
            collection: "settings",
            filter: { _id: "global_settings" }
          }, env);

          if (result && result.document && Array.isArray(result.document.public_servers) && result.document.public_servers.length > 0) {
            activePublicServers = result.document.public_servers;
            return new Response(JSON.stringify({
              success: true,
              servers: activePublicServers,
              public_servers: activePublicServers,
              updated_at: result.document.updated_at,
              source: "mongodb_atlas"
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        } catch (err) {
          console.warn("Atlas findOne public_servers notice:", err.message);
        }
      }

      // 3. Fallback to active edge cache / default public servers
      return new Response(JSON.stringify({
        success: true,
        servers: activePublicServers,
        public_servers: activePublicServers,
        source: "edge_runtime"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // =========================================================================
    // 4.2 POST /api/free/admin/public-servers
    // Saves updated public servers to MongoDB Atlas (_id: "global_settings"). Requires PIN 80664227.
    // =========================================================================
    if (url.pathname === "/api/free/admin/public-servers" || url.pathname.endsWith("/free/admin/public-servers") || url.pathname === "/api/admin/public-servers") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use POST." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const body = await request.json().catch(() => ({}));
        const headerPin = request.headers.get("x-admin-pin") || 
                          (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        const pin = (headerPin || body.pin || body.adminPin || "").trim();
        const verifiedPin = (env && env.ADMIN_PIN) || MONGO_CONFIG.adminPin;

        if (pin !== verifiedPin) {
          await logAdminActivity("save_public_servers_attempt", "Invalid PIN", request, env, {
            pinAttempt: pin ? "****" : "empty"
          });
          return new Response(JSON.stringify({
            success: false,
            message: "Unauthorized: Invalid Admin PIN"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const servers = body.servers || body.public_servers || (Array.isArray(body) ? body : null);
        if (!Array.isArray(servers)) {
          return new Response(JSON.stringify({
            success: false,
            message: "Bad Request: servers must be an array"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const now = new Date().toISOString();
        activePublicServers = servers;

        // KV
        if (env && env.LEGION_KV) {
          try {
            await env.LEGION_KV.put("public_servers", JSON.stringify(servers));
          } catch (e) {}
        }

        // MongoDB Atlas Data API
        let atlasPersisted = false;
        if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
          try {
            await fetchAtlasDataApi("updateOne", {
              collection: "settings",
              filter: { _id: "global_settings" },
              update: {
                $set: {
                  public_servers: servers,
                  updated_at: now
                }
              },
              upsert: true
            }, env);
            atlasPersisted = true;
          } catch (e) {
            console.warn("Atlas updateOne public_servers notice:", e.message);
          }
        }

        await logAdminActivity("save_public_servers", "Success", request, env, {
          serverCount: servers.length
        });

        return new Response(JSON.stringify({
          success: true,
          message: "Public servers saved to MongoDB.",
          servers: servers,
          count: servers.length,
          updated_at: now,
          atlasSynced: atlasPersisted
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          message: "Failed to update public servers: " + err.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // =========================================================================
    // 4.3 GET /api/free/modal-settings
    // Returns modal titles & notices from MongoDB Atlas (_id: "global_settings")
    // =========================================================================
    if ((url.pathname === "/api/free/modal-settings" || url.pathname === "/api/modal-settings" || url.pathname.endsWith("/modal-settings") || url.pathname.endsWith("/free/modal-settings")) && !url.pathname.includes("/admin/")) {
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use GET." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 1. Try reading from KV if bound
      if (env && env.LEGION_KV) {
        try {
          const kvMs = await env.LEGION_KV.get("modal_settings", "json");
          if (kvMs && typeof kvMs === "object") {
            activeModalSettings = { ...activeModalSettings, ...kvMs };
            return new Response(JSON.stringify({
              success: true,
              modal_settings: activeModalSettings,
              settings: activeModalSettings,
              source: "cloudflare_kv"
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        } catch (e) {}
      }

      // 2. Fetch from MongoDB Atlas collection "settings" (_id: "global_settings")
      if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
        try {
          const result = await fetchAtlasDataApi("findOne", {
            collection: "settings",
            filter: { _id: "global_settings" }
          }, env);

          if (result && result.document && result.document.modal_settings) {
            activeModalSettings = { ...DEFAULT_MODAL_SETTINGS, ...result.document.modal_settings };
            return new Response(JSON.stringify({
              success: true,
              modal_settings: activeModalSettings,
              settings: activeModalSettings,
              updated_at: result.document.updated_at,
              source: "mongodb_atlas"
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        } catch (err) {
          console.warn("Atlas findOne modal_settings notice:", err.message);
        }
      }

      // 3. Fallback to active edge cache / default modal settings
      return new Response(JSON.stringify({
        success: true,
        modal_settings: activeModalSettings,
        settings: activeModalSettings,
        source: "edge_runtime"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // =========================================================================
    // 4.4 POST /api/free/admin/modal-settings
    // Saves updated modal settings to MongoDB Atlas (_id: "global_settings"). Requires PIN 80664227.
    // =========================================================================
    if (url.pathname === "/api/free/admin/modal-settings" || url.pathname.endsWith("/free/admin/modal-settings") || url.pathname === "/api/admin/modal-settings") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use POST." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const body = await request.json().catch(() => ({}));
        const headerPin = request.headers.get("x-admin-pin") || 
                          (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        const pin = (headerPin || body.pin || body.adminPin || "").trim();
        const verifiedPin = (env && env.ADMIN_PIN) || MONGO_CONFIG.adminPin;

        if (pin !== verifiedPin) {
          await logAdminActivity("save_modal_settings_attempt", "Invalid PIN", request, env, {
            pinAttempt: pin ? "****" : "empty"
          });
          return new Response(JSON.stringify({
            success: false,
            message: "Unauthorized: Invalid Admin PIN"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const newSettings = body.modal_settings || body.settings || body;
        if (!newSettings || typeof newSettings !== "object") {
          return new Response(JSON.stringify({
            success: false,
            message: "Bad Request: modal_settings must be an object"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const now = new Date().toISOString();
        activeModalSettings = { ...activeModalSettings, ...newSettings };

        // KV
        if (env && env.LEGION_KV) {
          try {
            await env.LEGION_KV.put("modal_settings", JSON.stringify(activeModalSettings));
          } catch (e) {}
        }

        // MongoDB Atlas Data API
        let atlasPersisted = false;
        if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
          try {
            await fetchAtlasDataApi("updateOne", {
              collection: "settings",
              filter: { _id: "global_settings" },
              update: {
                $set: {
                  modal_settings: activeModalSettings,
                  updated_at: now
                }
              },
              upsert: true
            }, env);
            atlasPersisted = true;
          } catch (e) {
            console.warn("Atlas updateOne modal_settings notice:", e.message);
          }
        }

        await logAdminActivity("save_modal_settings", "Success", request, env, {});

        return new Response(JSON.stringify({
          success: true,
          message: "Modal settings saved to MongoDB.",
          modal_settings: activeModalSettings,
          updated_at: now,
          atlasSynced: atlasPersisted
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          message: "Failed to update modal settings: " + err.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 5. User Ban Verification
    if (url.pathname.endsWith("/check-ban") || url.pathname.endsWith("/api/check-ban")) {
      const emailToCheck = (url.searchParams.get("email") || "").toLowerCase().trim();
      const isBanned = BANNED_EMAILS.has(emailToCheck);
      return new Response(JSON.stringify({
        email: emailToCheck,
        banned: isBanned,
        message: isBanned ? "Account Suspended: Fair-use policy violation" : "Account active"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 6. Claim Session Endpoint
    if (url.pathname.endsWith("/claim") || url.pathname.endsWith("/api/claim")) {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use POST." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const payload = await request.json();
        const userEmail = (payload.email || "").toLowerCase().trim();
        const packageId = (payload.packageId || "dialog_social").toLowerCase().trim();
        const stepsCompleted = parseInt(payload.stepsCompleted, 10) || 0;

        if (!userEmail || !userEmail.includes("@")) {
          return new Response(JSON.stringify({
            success: false,
            message: "Authentication Error: Google sign-in required."
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const isGmail = /^[a-z0-9](\.?[a-z0-9]){4,}@gmail\.com$/i.test(userEmail) || userEmail.endsWith("@gmail.com");
        if (!userEmail.endsWith("@gmail.com") || !isGmail) {
          return new Response(JSON.stringify({
            success: false,
            message: "⚠️ Invalid Email Provider: Temporary / Disposable mail addresses are strictly prohibited. Please sign in using your official @gmail.com account to claim high-speed Singapore nodes."
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (BANNED_EMAILS.has(userEmail)) {
          return new Response(JSON.stringify({
            success: false,
            banned: true,
            message: "Account Suspended by Administrator."
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const isInstantSgMode = (activeMasterConfig.sg_steps === 1);
        const requiredSteps = isInstantSgMode ? 1 : (parseInt(env && env.REQUIRED_STEPS, 10) || 9);
        if (stepsCompleted < requiredSteps) {
          return new Response(JSON.stringify({
            success: false,
            message: `Verification Incomplete: Completed ${stepsCompleted}/${requiredSteps} steps.`
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Rate Limiting (1 claim per 12 hours)
        const now = Date.now();
        const ipKey = `ip_${clientIp}`;
        const emailKey = `email_${userEmail}`;

        let lastIpClaim = RATE_LIMIT_STORE.get(ipKey);
        let lastEmailClaim = RATE_LIMIT_STORE.get(emailKey);

        const isIpLimited = lastIpClaim && (now - lastIpClaim < TWELVE_HOURS_MS);
        const isEmailLimited = lastEmailClaim && (now - lastEmailClaim < TWELVE_HOURS_MS);

        if (isIpLimited || isEmailLimited) {
          const lastTime = Math.max(lastIpClaim || 0, lastEmailClaim || 0);
          const remainingMinutes = Math.ceil((TWELVE_HOURS_MS - (now - lastTime)) / 60000);
          return new Response(JSON.stringify({
            success: false,
            rateLimited: true,
            remainingMinutes: remainingMinutes,
            message: `12-Hour Rate Limit Active: Next node in ${remainingMinutes}m.`
          }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        RATE_LIMIT_STORE.set(ipKey, now);
        RATE_LIMIT_STORE.set(emailKey, now);

        const sessionCode = "LEGION-SG-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const baseConfig = activeMasterConfig.raw_config;
        const deliveredConfig = injectPackageSni(baseConfig, packageId);
        const deliveredProtocol = detectProtocol(deliveredConfig);
        const normKey = normalizePackageKey(packageId);
        const matchedPkg = ISP_SNI_MAP[normKey];

        const nodeData = {
          protocol: deliveredProtocol,
          package_id: packageId,
          package_title: matchedPkg ? matchedPkg.name : "Singapore Master Node",
          server_name: "LEGION-SG-MASTER-01",
          location: "Singapore 🇸🇬 (Dedicated 1Gbps VPS)",
          ping: `${Math.floor(Math.random() * (75 - 42 + 1)) + 42} ms`,
          expiry: "5 Days (Renewable daily via ads)",
          connection_code: sessionCode,
          master_config: deliveredConfig,
          trojan_link: deliveredConfig,
          v2ray_link: deliveredConfig,
          sni: matchedPkg ? matchedPkg.sni : undefined,
          tag: matchedPkg ? matchedPkg.tag : undefined,
          client_ip: clientIp,
          issued_to: userEmail,
          issued_at: new Date().toISOString()
        };

        // Log successful node claim in visitor_logs
        const totalAdsDone = isInstantSgMode ? 1 : 100;
        const progressSummary = isInstantSgMode 
          ? "1/1 Ad Verified (Instant Claimed)" 
          : "100/100 Ads Verified (Claimed)";

        await logVisitorActivity({
          event: "node_claimed",
          userEmail: userEmail,
          packageId: packageId,
          packageTitle: matchedPkg ? matchedPkg.name : "Singapore Master Node",
          step: isInstantSgMode ? 1 : 9,
          stepsCompleted: isInstantSgMode ? 1 : 9,
          totalAdsVerified: totalAdsDone,
          progressSummary: progressSummary,
          details: `Session ${sessionCode} (${deliveredProtocol})`
        }, request, env);

        return new Response(JSON.stringify({
          success: true,
          timestamp: now,
          node: nodeData,
          message: "Singapore VPN Node released successfully."
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          message: "Invalid Request: " + err.message
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // =========================================================================
    // 7. POST /api/telemetry/log
    // Ingests real-time client verification, milestone, and visitor telemetry
    // =========================================================================
    if (url.pathname === "/api/telemetry/log" || url.pathname.endsWith("/api/telemetry/log") || url.pathname.endsWith("/telemetry/log")) {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use POST." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const body = await request.json().catch(() => ({}));
        const logDoc = await logVisitorActivity(body, request, env);
        return new Response(JSON.stringify({
          success: true,
          message: "Telemetry logged successfully.",
          timestamp: logDoc.timestamp
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          message: "Telemetry ingestion error: " + err.message
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // =========================================================================
    // 7.5 POST /api/telemetry/user-login
    // Ingests Google Login and User Claim Telemetry into MongoDB Atlas user_activity_logs
    // =========================================================================
    if (
      url.pathname === "/api/telemetry/user-login" ||
      url.pathname === "/api/free/telemetry/user-login" ||
      url.pathname.endsWith("/telemetry/user-login")
    ) {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use POST." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const body = await request.json().catch(() => ({}));
        const userEmail = (body.email || "").toLowerCase().trim();
        if (!userEmail) {
          return new Response(JSON.stringify({ success: false, message: "Email required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const telemetry = extractRequestTelemetry(request);
        const now = new Date().toISOString();
        const userDoc = {
          email: userEmail,
          name: body.name || userEmail.split("@")[0] || "Google User",
          avatar: body.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userEmail)}&backgroundColor=060a08`,
          action: body.action || "Google Login",
          steps: body.steps !== undefined ? parseInt(body.steps, 10) : 0,
          ip: telemetry.ip,
          country: telemetry.country,
          countryCode: telemetry.countryCode,
          isp: telemetry.isp,
          device: telemetry.device,
          os: telemetry.os,
          browser: telemetry.browser,
          deviceSummary: telemetry.summary,
          lastActivity: now,
          timestamp: now,
          banned: BANNED_EMAILS.has(userEmail)
        };

        addUserActivityLogCache(userDoc);

        if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
          try {
            await fetchAtlasDataApi("updateOne", {
              collection: "user_activity_logs",
              filter: { email: userEmail },
              update: {
                $set: {
                  ...userDoc,
                  lastActivity: now
                },
                $setOnInsert: {
                  firstSignIn: now
                },
                $inc: {
                  loginCount: 1
                }
              },
              upsert: true
            }, env);
          } catch (e) {
            console.warn("Atlas user_activity_logs upsert notice:", e.message);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          message: "User login activity recorded.",
          email: userEmail
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          message: "User login telemetry error: " + err.message
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // =========================================================================
    // 8.5 POST /api/admin/ban-user
    // Updates user ban status in memory and MongoDB Atlas user_activity_logs
    // =========================================================================
    if (
      url.pathname === "/api/admin/ban-user" ||
      url.pathname === "/api/free/admin/ban-user" ||
      url.pathname.endsWith("/admin/ban-user")
    ) {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use POST." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const body = await request.json().catch(() => ({}));
      const headerPin = request.headers.get("x-admin-pin") || 
                        (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      const pin = (headerPin || body.pin || "").trim();
      const verifiedPin = (env && env.ADMIN_PIN) || MONGO_CONFIG.adminPin || "80664227";

      if (pin !== verifiedPin && pin !== "80664227") {
        return new Response(JSON.stringify({ success: false, message: "Unauthorized: Invalid PIN" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const banEmail = (body.email || "").toLowerCase().trim();
      const isBanned = body.banned !== undefined ? !!body.banned : true;
      if (isBanned) {
        BANNED_EMAILS.add(banEmail);
      } else {
        BANNED_EMAILS.delete(banEmail);
      }

      // Update in USER_ACTIVITY_LOGS_CACHE
      const cachedIdx = USER_ACTIVITY_LOGS_CACHE.findIndex(u => u.email.toLowerCase() === banEmail);
      if (cachedIdx !== -1) {
        USER_ACTIVITY_LOGS_CACHE[cachedIdx].banned = isBanned;
      }

      // Update in Atlas user_activity_logs
      if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
        try {
          await fetchAtlasDataApi("updateOne", {
            collection: "user_activity_logs",
            filter: { email: banEmail },
            update: { $set: { banned: isBanned, updatedAt: new Date().toISOString() } }
          }, env);
        } catch (e) {}
      }

      await logAdminActivity(isBanned ? "ban_user" : "unban_user", "Success", request, env, { email: banEmail });

      return new Response(JSON.stringify({
        success: true,
        email: banEmail,
        banned: isBanned,
        message: `User ${banEmail} ${isBanned ? "banned" : "unbanned"} successfully.`
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // =========================================================================
    // 8. POST /api/admin/login or /api/free/admin/login
    // Validates admin credentials & records authentication audit in admin_logins
    // =========================================================================
    if (url.pathname === "/api/admin/login" || url.pathname.endsWith("/admin/login") || url.pathname.endsWith("/api/free/admin/login")) {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use POST." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const body = await request.json().catch(() => ({}));
        const headerPin = request.headers.get("x-admin-pin") || 
                          (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
        const pin = (headerPin || body.pin || body.adminPin || "").trim();
        const verifiedPin = (env && env.ADMIN_PIN) || MONGO_CONFIG.adminPin;

        if (pin === verifiedPin) {
          await logAdminActivity("admin_dashboard_login", "Success", request, env);
          return new Response(JSON.stringify({
            success: true,
            token: "authorized",
            message: "Admin authentication successful."
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        } else {
          await logAdminActivity("admin_dashboard_login_attempt", "Invalid PIN", request, env, {
            pinAttempt: pin ? "****" : "empty"
          });
          return new Response(JSON.stringify({
            success: false,
            message: "Unauthorized: Invalid Admin PIN"
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          message: "Login error: " + err.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // =========================================================================
    // 9. GET /api/admin/logs (type=visitors | type=admin)
    // Fetches security audit logs and visitor traffic telemetry
    // =========================================================================
    const logsPath = url.pathname.toLowerCase().replace(/\/+$/, "");
    if (
      logsPath === "/api/admin/logs" ||
      logsPath === "/api/free/admin/logs" ||
      logsPath.endsWith("/admin/logs") ||
      logsPath.startsWith("/api/admin/logs") ||
      logsPath.startsWith("/api/free/admin/logs")
    ) {
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ success: false, message: "Method Not Allowed. Use GET." }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const headerPin = request.headers.get("x-admin-pin") || 
                        (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      const queryPin = url.searchParams.get("pin") || "";
      const pin = (headerPin || queryPin).trim();
      const verifiedPin = (env && env.ADMIN_PIN) || MONGO_CONFIG.adminPin || "80664227";

      if (pin !== verifiedPin && pin !== "80664227") {
        return new Response(JSON.stringify({
          success: false,
          message: "Unauthorized: Invalid Admin PIN"
        }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const logType = (url.searchParams.get("type") || "visitors").toLowerCase().trim();

      // Case A: Admin Logins & Security Audit
      if (logType === "admin" || logType === "admin_logins" || logType === "security") {
        let logs = [];
        if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
          try {
            const res = await fetchAtlasDataApi("find", {
              collection: "admin_logins",
              sort: { timestamp: -1 },
              limit: 50
            }, env);
            if (res && Array.isArray(res.documents)) {
              logs = res.documents;
            }
          } catch (e) {
            console.warn("Atlas find admin_logins notice:", e.message);
          }
        }
        if (logs.length === 0) {
          logs = ADMIN_LOGINS_CACHE.slice(0, 50);
        }
        return new Response(JSON.stringify({
          success: true,
          type: "admin",
          count: logs.length,
          logs: logs,
          adminLogs: logs
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Case C: Live User Sign-In & Activity Logs
      if (logType === "users" || logType === "user_activity" || logType === "user_logins") {
        let logs = [];
        if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
          try {
            const res = await fetchAtlasDataApi("find", {
              collection: "user_activity_logs",
              sort: { lastActivity: -1 },
              limit: 50
            }, env);
            if (res && Array.isArray(res.documents)) {
              logs = res.documents;
            }
          } catch (e) {
            console.warn("Atlas find user_activity_logs notice:", e.message);
          }
        }
        if (logs.length === 0) {
          logs = USER_ACTIVITY_LOGS_CACHE.slice(0, 50);
        }
        return new Response(JSON.stringify({
          success: true,
          type: "users",
          count: logs.length,
          logs: logs,
          users: logs
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Case B: Live Visitors & Verification Traffic Telemetry
      let logs = [];
      if (env && (env.MONGODB_DATA_API_URL || env.MONGODB_API_KEY)) {
        try {
          const res = await fetchAtlasDataApi("find", {
            collection: "visitor_logs",
            sort: { timestamp: -1 },
            limit: 50
          }, env);
          if (res && Array.isArray(res.documents)) {
            logs = res.documents;
          }
        } catch (e) {
          console.warn("Atlas find visitor_logs notice:", e.message);
        }
      }
      if (logs.length === 0) {
        logs = VISITOR_LOGS_CACHE.slice(0, 50);
      }
      return new Response(JSON.stringify({
        success: true,
        type: "visitors",
        count: logs.length,
        logs: logs,
        visitorLogs: logs,
        adminLogs: ADMIN_LOGINS_CACHE.slice(0, 50)
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 404
    return new Response(JSON.stringify({ error: "Endpoint Not Found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};
