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
  defaultRawConfig: "trojan://y9emfz6sx1orp6ka@dulangafree.legiongraphics.site:119/?security=tls&fp=ios&sni=dulangafree.zoom.us&type=tcp&headerType=none#LEGION-VPN%20Free%20All%20ISP"
};

// In-Memory Edge Runtime Cache
let activeMasterConfig = {
  raw_config: MONGO_CONFIG.defaultRawConfig,
  protocol: "Trojan",
  updated_at: new Date().toISOString()
};

// Rate Limit Tracking
const RATE_LIMIT_STORE = new Map();
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

// In-Memory Telemetry Ring Buffers (Edge Memory Fallback)
const VISITOR_LOGS_CACHE = [];
const ADMIN_LOGINS_CACHE = [];
const MAX_LOG_CACHE = 100;

function addVisitorLogCache(log) {
  VISITOR_LOGS_CACHE.unshift(log);
  if (VISITOR_LOGS_CACHE.length > MAX_LOG_CACHE) VISITOR_LOGS_CACHE.pop();
}

function addAdminLoginCache(log) {
  ADMIN_LOGINS_CACHE.unshift(log);
  if (ADMIN_LOGINS_CACHE.length > MAX_LOG_CACHE) ADMIN_LOGINS_CACHE.pop();
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
    // 3. GET /api/free/config
    // Fetches master_config from free-legion-vpn.settings
    // =========================================================================
    if (url.pathname === "/api/free/config" || url.pathname.endsWith("/api/free/config") || url.pathname.endsWith("/free/config")) {
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
            return new Response(JSON.stringify({
              success: true,
              config: finalConfig,
              protocol: detected,
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
          const result = await fetchAtlasDataApi("findOne", {
            filter: { _id: "master_config" }
          }, env);

          if (result && result.document && result.document.raw_config) {
            const doc = result.document;
            const raw = doc.raw_config;
            activeMasterConfig = {
              raw_config: raw,
              protocol: doc.protocol || detectProtocol(raw),
              updated_at: doc.updated_at || new Date().toISOString()
            };
            const finalConfig = pkgParam ? injectPackageSni(raw, pkgParam) : raw;
            const detected = detectProtocol(finalConfig);
            return new Response(JSON.stringify({
              success: true,
              config: finalConfig,
              protocol: detected,
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
        if (!rawConfig) {
          return new Response(JSON.stringify({
            success: false,
            message: "Bad Request: Missing raw_config URL string"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const protocol = detectProtocol(rawConfig);
        const now = new Date().toISOString();

        // Update runtime state immediately
        activeMasterConfig = {
          raw_config: rawConfig,
          protocol: protocol,
          updated_at: now
        };

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
            await fetchAtlasDataApi("updateOne", {
              collection: "settings",
              filter: { _id: "master_config" },
              update: {
                $set: {
                  raw_config: rawConfig,
                  protocol: protocol,
                  updated_at: now
                }
              },
              upsert: true
            }, env);
            atlasPersisted = true;
          } catch (err) {
            console.warn("Atlas Data API updateOne notice:", err.message);
          }
        }

        await logAdminActivity("save_master_config", "Success", request, env, {
          protocol: protocol,
          raw_config_snippet: rawConfig.substring(0, 40) + "..."
        });

        return new Response(JSON.stringify({
          success: true,
          message: "Configuration saved to MongoDB.",
          protocol: protocol,
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

        const requiredSteps = parseInt(env && env.REQUIRED_STEPS, 10) || 9;
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
        await logVisitorActivity({
          event: "node_claimed",
          userEmail: userEmail,
          packageId: packageId,
          packageTitle: matchedPkg ? matchedPkg.name : "Singapore Master Node",
          step: 9,
          stepsCompleted: 9,
          totalAdsVerified: 100,
          progressSummary: "100/100 Ads Verified (Claimed)",
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
    if (url.pathname === "/api/admin/logs" || url.pathname.endsWith("/admin/logs") || url.pathname.endsWith("/api/free/admin/logs")) {
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
      const verifiedPin = (env && env.ADMIN_PIN) || MONGO_CONFIG.adminPin;

      if (pin !== verifiedPin) {
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
          logs: logs
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
        logs: logs
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
