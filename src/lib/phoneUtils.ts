/**
 * Bangladesh phone number utilities
 * - Converts Bengali digits (০-৯) to English (0-9)
 * - Only allows digits, +, and leading 0
 * - Validates BD format: 01X-XXXXXXXX (11 digits)
 */

const bengaliDigitMap: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

/** Convert Bengali digits to English and strip non-digit chars (except leading +) */
export function sanitizePhoneInput(raw: string): string {
  let result = "";
  for (const ch of raw) {
    if (bengaliDigitMap[ch]) {
      result += bengaliDigitMap[ch];
    } else if (/[0-9]/.test(ch)) {
      result += ch;
    } else if (ch === "+" && result.length === 0) {
      result += ch;
    }
    // silently drop all other characters
  }
  return result;
}

/** Validate Bangladesh phone: 01[3-9]XXXXXXXX (11 digits) or +8801... */
export function isValidBDPhone(phone: string): boolean {
  const cleaned = phone.replace(/^\+?880/, "0");
  return /^01[3-9]\d{8}$/.test(cleaned);
}
