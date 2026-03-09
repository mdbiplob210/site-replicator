// Detect client IP using free API
let cachedIp: string | null = null;

export async function getClientIp(): Promise<string> {
  if (cachedIp) return cachedIp;
  try {
    const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    cachedIp = data.ip || "unknown";
    return cachedIp!;
  } catch {
    return "unknown";
  }
}

// Parse user agent into detailed device info
export function parseDeviceInfo(ua?: string): {
  device: string;
  os: string;
  browser: string;
  deviceInfo: string;
  screenSize: string;
} {
  const userAgent = ua || navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPod/i.test(userAgent);
  const isTablet = /iPad|Tablet|PlayBook/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent));
  const device = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

  // OS detection with version
  let os = "Unknown OS";
  if (/Android/i.test(userAgent)) {
    const ver = userAgent.match(/Android\s([\d.]+)/)?.[1] || "";
    os = `Android ${ver}`.trim();
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    const ver = userAgent.match(/OS\s([\d_]+)/)?.[1]?.replace(/_/g, ".") || "";
    os = `iOS ${ver}`.trim();
  } else if (/Mac OS X/i.test(userAgent)) {
    const ver = userAgent.match(/Mac OS X\s([\d_.]+)/)?.[1]?.replace(/_/g, ".") || "";
    os = `macOS ${ver}`.trim();
  } else if (/Windows/i.test(userAgent)) {
    const ver = userAgent.match(/Windows NT\s([\d.]+)/)?.[1] || "";
    const winMap: Record<string, string> = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" };
    os = `Windows ${winMap[ver] || ver}`.trim();
  } else if (/Linux/i.test(userAgent)) {
    os = "Linux";
  } else if (/CrOS/i.test(userAgent)) {
    os = "Chrome OS";
  }

  // Browser detection with version
  let browser = "Unknown Browser";
  if (/Edg\//i.test(userAgent)) {
    const ver = userAgent.match(/Edg\/([\d.]+)/)?.[1]?.split(".")[0] || "";
    browser = `Edge ${ver}`.trim();
  } else if (/OPR|Opera/i.test(userAgent)) {
    const ver = userAgent.match(/OPR\/([\d.]+)/)?.[1]?.split(".")[0] || "";
    browser = `Opera ${ver}`.trim();
  } else if (/SamsungBrowser/i.test(userAgent)) {
    browser = "Samsung Browser";
  } else if (/UCBrowser/i.test(userAgent)) {
    browser = "UC Browser";
  } else if (/Firefox/i.test(userAgent)) {
    const ver = userAgent.match(/Firefox\/([\d.]+)/)?.[1]?.split(".")[0] || "";
    browser = `Firefox ${ver}`.trim();
  } else if (/Chrome/i.test(userAgent)) {
    const ver = userAgent.match(/Chrome\/([\d.]+)/)?.[1]?.split(".")[0] || "";
    browser = `Chrome ${ver}`.trim();
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    const ver = userAgent.match(/Version\/([\d.]+)/)?.[1]?.split(".")[0] || "";
    browser = `Safari ${ver}`.trim();
  }

  // Device model detection
  let model = "";
  if (/iPhone/i.test(userAgent)) model = "iPhone";
  else if (/iPad/i.test(userAgent)) model = "iPad";
  else if (/SM-[A-Z]\d+/i.test(userAgent)) model = userAgent.match(/SM-[A-Z]\d+/i)?.[0] || "Samsung";
  else if (/Pixel/i.test(userAgent)) model = "Google Pixel";
  else if (/HUAWEI|HW/i.test(userAgent)) model = "Huawei";
  else if (/Xiaomi|Redmi|POCO/i.test(userAgent)) model = userAgent.match(/Xiaomi|Redmi\s?\w+|POCO\s?\w+/i)?.[0] || "Xiaomi";
  else if (/OPPO|CPH/i.test(userAgent)) model = "OPPO";
  else if (/vivo/i.test(userAgent)) model = "Vivo";
  else if (/realme/i.test(userAgent)) model = "Realme";
  else if (/OnePlus/i.test(userAgent)) model = "OnePlus";

  const screenSize = typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "";

  const parts = [device, os, browser];
  if (model) parts.push(model);

  return {
    device,
    os,
    browser,
    deviceInfo: parts.join(" | "),
    screenSize,
  };
}
