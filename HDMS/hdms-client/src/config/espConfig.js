/**
 * ESP32 Hardware Configuration
 * Configure your ESP32 IP address here
 */

// Replace with your ESP32's IP address (shown in Serial Monitor when it boots)
// Note: we trim trailing slashes so we don't end up with double slashes
const DEFAULT_ESP32_URL = (import.meta.env.VITE_ESP32_URL || "http://192.168.137.176").replace(/\/$/, "");
const ESP32_STORAGE_KEY = "hdms.esp32.baseUrl";

const normalizeEspUrl = (value) => {
  if (!value) return "";
  let url = value.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  return url.replace(/\/$/, "");
};

export const getESP32BaseUrlInfo = () => {
  if (typeof window === "undefined") {
    return { baseUrl: DEFAULT_ESP32_URL, source: "env" };
  }

  const stored = window.localStorage.getItem(ESP32_STORAGE_KEY) || "";
  const normalizedStored = normalizeEspUrl(stored);

  if (normalizedStored) {
    return { baseUrl: normalizedStored, source: "localStorage" };
  }

  return { baseUrl: DEFAULT_ESP32_URL, source: "env" };
};

export const setESP32BaseUrl = (value) => {
  if (typeof window === "undefined") {
    return { baseUrl: DEFAULT_ESP32_URL, source: "env" };
  }

  const normalized = normalizeEspUrl(value);
  if (!normalized) {
    window.localStorage.removeItem(ESP32_STORAGE_KEY);
    return { baseUrl: DEFAULT_ESP32_URL, source: "env" };
  }

  window.localStorage.setItem(ESP32_STORAGE_KEY, normalized);
  return { baseUrl: normalized, source: "localStorage" };
};

const ESP32_CONFIG = {
  // Example: "http://192.168.137.114"
  directBaseUrl: DEFAULT_ESP32_URL,

  // Local dev proxy path (see vite.config.js) to avoid CORS/mixed-content
  proxyBasePath: "/esp",
  
  // Endpoints
  endpoints: {
    openGate: "/open-gate",
    status: "/status"
  },
  
  // Timeout for ESP32 requests (ms)
  timeout: 5000
};

/**
 * Trigger the servo gate to open for 5 seconds
 * Call this when a token is successfully validated
 * 
 * @returns {Promise<void>}
 */
export async function triggerServoGate() {
  const { baseUrl, source } = getESP32BaseUrlInfo();
  const proxyUrl = `${ESP32_CONFIG.proxyBasePath}${ESP32_CONFIG.endpoints.openGate}`;
  const directUrl = `${baseUrl}${ESP32_CONFIG.endpoints.openGate}`;

  // Helper to run fetch with a given mode (cors/no-cors)
  const doFetch = async (url, mode) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ESP32_CONFIG.timeout);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "text/plain"
        },
        mode,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  // 1) Try via same-origin proxy (avoids CORS/mixed-content)
  // Only use proxy when ESP32 URL comes from env (proxy target is static in vite.config.js)
  if (source === "env") {
    try {
      const resProxy = await doFetch(proxyUrl, "cors");
      if (resProxy.ok) {
        console.log("[Hardware] ✓ Servo gate triggered via proxy");
        return true;
      }
      console.warn(`[Hardware] Proxy call returned status ${resProxy.status}, falling back to direct...`);
    } catch (proxyErr) {
      console.warn("[Hardware] Proxy call failed, falling back to direct:", proxyErr?.message || proxyErr);
    }
  }

  // 2) Direct call to ESP32 (may be blocked if page is https and ESP is http)
  const isMixedContent = typeof window !== "undefined" && window.location?.protocol === "https:" && directUrl.startsWith("http://");
  if (isMixedContent) {
    console.warn("[Hardware] Browser may block ESP32 call due to mixed content (page is https, ESP32 is http). Open the app over http://localhost:5174 or expose ESP32 via https.");
  }

  console.log(`[Hardware] Opening servo gate at ${directUrl}`);

  try {
    const response = await doFetch(directUrl, "cors");
    if (response.ok) {
      console.log("[Hardware] ✓ Servo gate triggered successfully (direct, cors)");
      return true;
    }

    console.warn(`[Hardware] Servo gate returned status ${response.status} with CORS, retrying without CORS...`);
    await doFetch(directUrl, "no-cors");
    console.log("[Hardware] ✓ Servo gate trigger sent (direct, no-cors fallback)");
    return true; // assume success when sent
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("[Hardware] Servo gate request timeout - ESP32 may be unreachable");
    } else {
      console.error("[Hardware] Failed to trigger servo gate:", error.message);
    }

    // 3) Last-resort: image beacon to bypass fetch restrictions
    try {
      const beaconUrl = `${directUrl}${directUrl.includes("?") ? "&" : "?"}ts=${Date.now()}`;
      const img = new Image();
      img.src = beaconUrl;
      console.warn("[Hardware] Sent image beacon fallback; cannot confirm success due to browser restrictions.");
      return true;
    } catch (beaconErr) {
      console.error("[Hardware] Image beacon fallback failed:", beaconErr.message);
    }

    return false;
  }
}

/**
 * Check if ESP32 is online
 * Tries proxy first (to avoid CORS/mixed-content), then direct
 * 
 * @returns {Promise<boolean>}
 */
export async function checkESP32Status() {
  const { baseUrl, source } = getESP32BaseUrlInfo();
  const proxyUrl = `${ESP32_CONFIG.proxyBasePath}${ESP32_CONFIG.endpoints.status}`;
  const directUrl = `${baseUrl}${ESP32_CONFIG.endpoints.status}`;

  const doFetch = async (url, mode = "cors") => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ESP32_CONFIG.timeout);
    try {
      const response = await fetch(url, { method: "GET", mode, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  if (source === "env") {
    try {
      const resProxy = await doFetch(proxyUrl, "cors");
      if (resProxy.ok) return true;
    } catch (err) {
      // ignore
    }
  }

  try {
    const resDirect = await doFetch(directUrl, "cors");
    return resDirect.ok;
  } catch (err) {
    return false;
  }
}

export default ESP32_CONFIG;
