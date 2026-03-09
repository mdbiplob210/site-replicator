/**
 * Security utilities: input validation, sanitization, rate limiting
 */
import { supabase } from "@/integrations/supabase/client";

// ═══ Input Sanitization ═══

/** Strip HTML tags from user input */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

/** Sanitize string input: trim, limit length, strip HTML */
export function sanitizeInput(input: string, maxLength = 500): string {
  if (!input) return "";
  return stripHtml(input).substring(0, maxLength);
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

/** Validate phone number (Bangladesh format) */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(\+?880|0)?1[3-9]\d{8}$/.test(cleaned);
}

/** Validate password strength */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে" };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "পাসওয়ার্ড এ কমপক্ষে একটি বড় হাতের অক্ষর থাকতে হবে" };
  if (!/[a-z]/.test(password)) return { valid: false, message: "পাসওয়ার্ড এ কমপক্ষে একটি ছোট হাতের অক্ষর থাকতে হবে" };
  if (!/[0-9]/.test(password)) return { valid: false, message: "পাসওয়ার্ড এ কমপক্ষে একটি সংখ্যা থাকতে হবে" };
  return { valid: true, message: "" };
}

// ═══ Login Rate Limiting ═══

const LOGIN_WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

/** Record a login attempt */
export async function recordLoginAttempt(email: string, success: boolean): Promise<void> {
  try {
    // Get IP from edge function
    let ip = "unknown";
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-client-info`,
        { method: "GET" }
      );
      const data = await res.json();
      ip = data?.ip || "unknown";
    } catch {}

    await supabase.from("login_attempts" as any).insert({
      ip_address: ip,
      email,
      success,
    });
  } catch {
    // Don't block login if tracking fails
  }
}

/** Check if login is rate limited */
export async function isLoginRateLimited(email: string): Promise<{ limited: boolean; remainingSeconds: number }> {
  try {
    const windowAgo = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from("login_attempts" as any)
      .select("attempted_at")
      .eq("email", email)
      .eq("success", false)
      .gte("attempted_at", windowAgo)
      .order("attempted_at", { ascending: false });

    if (error || !data) return { limited: false, remainingSeconds: 0 };

    if (data.length >= MAX_ATTEMPTS) {
      const oldestAttempt = new Date((data as any[])[data.length - 1].attempted_at).getTime();
      const unlockTime = oldestAttempt + LOGIN_WINDOW_MINUTES * 60 * 1000;
      const remaining = Math.max(0, Math.ceil((unlockTime - Date.now()) / 1000));
      return { limited: remaining > 0, remainingSeconds: remaining };
    }

    return { limited: false, remainingSeconds: 0 };
  } catch {
    return { limited: false, remainingSeconds: 0 };
  }
}

// ═══ CSRF Token (for forms that need it) ═══

export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ═══ Content Security ═══

/** Sanitize URL to prevent javascript: protocol attacks */
export function sanitizeUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed) || /^vbscript:/i.test(trimmed)) {
    return "";
  }
  return trimmed;
}

/** Validate file upload */
export function validateFileUpload(
  file: File,
  options: { maxSizeMB?: number; allowedTypes?: string[] } = {}
): { valid: boolean; message: string } {
  const { maxSizeMB = 2, allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"] } = options;

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, message: `ফাইল সাইজ ${maxSizeMB}MB এর বেশি হতে পারবে না` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: `এই ফাইল টাইপ অনুমোদিত নয়। অনুমোদিত: ${allowedTypes.join(", ")}` };
  }

  // Check for double extensions (e.g., image.php.jpg)
  const name = file.name.toLowerCase();
  const dangerousExts = [".php", ".exe", ".sh", ".bat", ".cmd", ".js", ".html", ".htm", ".svg"];
  if (dangerousExts.some((ext) => name.includes(ext + "."))) {
    return { valid: false, message: "সন্দেহজনক ফাইল নাম সনাক্ত হয়েছে" };
  }

  return { valid: true, message: "" };
}
