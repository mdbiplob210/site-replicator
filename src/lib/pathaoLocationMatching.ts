export type PathaoLocationItem = { id: string | number; name: string };

export const PATHAO_DISTRICT_OPTIONS = [
  "Dhaka", "Chittagong", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Barisal", "Sylhet", "Rangpur", "Mymensingh",
  "Comilla", "Cumilla", "Gazipur", "Narayanganj", "Bogra", "Bogura", "Cox's Bazar", "Coxs Bazar", "Feni", "Tangail",
  "Jessore", "Jashore", "Brahmanbaria", "Narsingdi", "Manikganj", "Munshiganj", "Madaripur", "Gopalganj", "Faridpur",
  "Shariatpur", "Rajbari", "Kishoreganj", "Netrokona", "Sherpur", "Jamalpur", "Dinajpur", "Nilphamari", "Kurigram",
  "Lalmonirhat", "Gaibandha", "Thakurgaon", "Panchagarh", "Chapainawabganj", "Naogaon", "Natore", "Nawabganj",
  "Pabna", "Sirajganj", "Joypurhat", "Habiganj", "Sunamganj", "Moulvibazar", "Noakhali", "Lakshmipur", "Chandpur",
  "Pirojpur", "Jhalokathi", "Jhalokati", "Bhola", "Patuakhali", "Barguna", "Satkhira", "Narail", "Magura", "Kushtia",
  "Meherpur", "Chuadanga", "Jhenaidah", "Bandarban", "Rangamati", "Khagrachari", "Keraniganj", "Savar", "Tongi",
];

export const PATHAO_THANA_OPTIONS = [
export const PATHAO_ZONE_OPTIONS = [
  "Dhaka Metro", "Dhaka Sub", "Chittagong Metro", "Chittagong Sub",
  "Rajshahi Metro", "Khulna Metro", "Sylhet Metro", "Rangpur Metro",
  "Barisal Metro", "Mymensingh Metro", "Outside Metro",
];

  "Mirpur", "Uttara", "Gulshan", "Dhanmondi", "Mohammadpur", "Motijheel", "Tejgaon", "Badda", "Rampura", "Khilgaon",
  "Banani", "Cantonment", "Lalbagh", "Demra", "Jatrabari", "Kadamtali", "Shyampur", "Sutrapur", "Wari", "Hazaribagh",
  "Kamrangirchar", "Panchlaish", "Halishahar", "Bayezid", "Double Mooring", "Pahartali", "Bakalia", "Chandgaon",
  "Fatullah", "Siddhirganj", "Sonargaon", "Rupganj", "Araihazar", "Keraniganj", "Dohar", "Dhamrai", "Tongi",
  "Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur", "Ghatail", "Kalihati", "Madhupur", "Mirzapur",
  "Nagarpur", "Sakhipur", "Basail", "Delduar", "Hemayetpur", "Ashulia", "Keraniganj Sadar", "Ukhia", "Ramu",
  "Teknaf", "Chakaria", "Pallabi", "Kafrul", "Turag", "Ramna", "Adabor", "Agrabad", "Patenga", "Kotwali",
  "Khulshi", "EPZ", "Bandar", "Hathazari", "Fatikchhari", "Sitakunda",
];

const LOCATION_GENERIC_WORDS = new Set([
  "city", "district", "zila", "jela", "jila", "division", "upazila", "thana", "metro", "area", "road", "block",
  "house", "home", "flat", "floor", "sector", "para", "bazar", "bazaar",
]);

const LOCATION_CONTEXT_KEYWORDS = ["district", "zila", "jela", "jila", "city", "thana", "upazila", "area", "zone"];

const AMBIGUOUS_ZONE_HINTS = new Set(["sadar", "kotwali", "bandar", "bondor", "metro", "sub", "city", "outside"]);

const BANGLA_DIGIT_MAP: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

const LOCATION_ALIAS_PATTERNS: Array<[RegExp, string]> = [
  [/\bchattogram\b/g, "chittagong"],
  [/\bchattograma\b/g, "chittagong"],
  [/\bchattagrama\b/g, "chittagong"],
  [/\bchattagram\b/g, "chittagong"],
  [/\bchatgram\b/g, "chittagong"],
  [/\bctg\b/g, "chittagong"],
  [/\bcumilla\b/g, "comilla"],
  [/\bjashore\b/g, "jessore"],
  [/\bborishal\b/g, "barisal"],
  [/\bcoxs\s*bazar\b/g, "cox bazar"],
  [/\bb\s*baria\b/g, "brahmanbaria"],
  [/\bchandgao\b/g, "chandgaon"],
  [/\bchandagao\b/g, "chandgaon"],
  [/\bbayejid\b/g, "bayazid"],
  [/\bbayjid\b/g, "bayazid"],
  [/\bhathajari\b/g, "hathazari"],
  [/\bfatikchari\b/g, "fatikchhari"],
  [/\buttora\b/g, "uttara"],
  [/\bmoddho\b/g, "middle"],
  [/\bdhaka\s+metro\b/g, "dhaka"],
  [/\bnarayangonj\b/g, "narayanganj"],
  [/\bgajipur\b/g, "gazipur"],
];

const BANGLA_VOWEL_SIGNS = new Set(["া", "ি", "ী", "ু", "ূ", "ৃ", "ে", "ৈ", "ো", "ৌ"]);
const BANGLA_CONSONANTS = new Set([
  "ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ", "ঝ", "ঞ", "ট", "ঠ", "ড", "ঢ", "ণ",
  "ত", "থ", "দ", "ধ", "ন", "প", "ফ", "ব", "ভ", "ম", "য", "র", "ল", "শ", "ষ",
  "স", "হ", "ড়", "ঢ়", "য়",
]);

const BANGLA_ROMAN_MAP: Record<string, string> = {
  "অ": "o", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri", "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou",
  "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
  "ং": "ng", "ঃ": "h", "ঁ": "n", "্": "",
  "ক": "k", "খ": "kh", "গ": "g", "ঘ": "gh", "ঙ": "ng", "চ": "ch", "ছ": "chh", "জ": "j", "ঝ": "jh", "ঞ": "n",
  "ট": "t", "ঠ": "th", "ড": "d", "ঢ": "dh", "ণ": "n", "ত": "t", "থ": "th", "দ": "d", "ধ": "dh", "ন": "n",
  "প": "p", "ফ": "f", "ব": "b", "ভ": "v", "ম": "m", "য": "y", "র": "r", "ল": "l", "শ": "s", "ষ": "s", "স": "s", "হ": "h", "ড়": "r", "ঢ়": "rh", "য়": "y",
};

const THANA_TO_CITY_HINTS: Array<{ cityHints: string[]; zoneHints: string[] }> = [
  { cityHints: ["Dhaka"], zoneHints: ["Mirpur", "Pallabi", "Kafrul", "Uttara", "Turag", "Gulshan", "Banani", "Badda", "Rampura", "Khilgaon", "Demra", "Jatrabari", "Kadamtali", "Sutrapur", "Wari", "Mohammadpur", "Dhanmondi", "Tejgaon", "Motijheel", "Adabor", "Hazaribagh", "Kamrangirchar", "Keraniganj", "Dohar", "Dhamrai", "Ashulia", "Hemayetpur"] },
  { cityHints: ["Gazipur"], zoneHints: ["Tongi", "Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur"] },
  { cityHints: ["Narayanganj"], zoneHints: ["Fatullah", "Siddhirganj", "Sonargaon", "Rupganj", "Araihazar", "Bandar"] },
  { cityHints: ["Chittagong", "Chattogram"], zoneHints: ["Panchlaish", "Halishahar", "Bayezid", "Double Mooring", "Pahartali", "Bakalia", "Chandgaon", "Agrabad", "Patenga", "Khulshi", "EPZ", "Hathazari", "Fatikchhari", "Sitakunda"] },
  { cityHints: ["Tangail"], zoneHints: ["Ghatail", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Basail", "Delduar"] },
  { cityHints: ["Cox's Bazar", "Coxs Bazar"], zoneHints: ["Ukhia", "Ramu", "Teknaf", "Chakaria"] },
  { cityHints: ["Savar", "Dhaka"], zoneHints: ["Savar"] },
];

const uniqueNormalizedStrings = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const transliterateBanglaText = (value: string) => {
  let output = "";

  for (let index = 0; index < value.length; index += 1) {
    const current = value[index];
    const next = value[index + 1];

    if (BANGLA_CONSONANTS.has(current)) {
      output += BANGLA_ROMAN_MAP[current] || "";
      if (next === "্" || BANGLA_VOWEL_SIGNS.has(next)) {
        continue;
      }
      output += "a";
      continue;
    }

    output += BANGLA_ROMAN_MAP[current] ?? current;
  }

  return output.replace(/a$/g, "");
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizePathaoLocationName = (value: string) => {
  const digitNormalized = value.replace(/[০-৯]/g, (char) => BANGLA_DIGIT_MAP[char] ?? char);
  const romanized = /[\u0980-\u09FF]/.test(digitNormalized) ? transliterateBanglaText(digitNormalized) : digitNormalized;

  let normalized = romanized
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[।,:;()[\]{}]/g, " ")
    .replace(/['`./\\-]/g, " ");

  for (const [pattern, replacement] of LOCATION_ALIAS_PATTERNS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized.replace(/\s+/g, " ").trim();
};

const toPhoneticKey = (value: string) =>
  normalizePathaoLocationName(value)
    .replace(/z/g, "j")
    .replace(/q/g, "k")
    .replace(/x/g, "ks")
    .replace(/ph/g, "f")
    .replace(/bh/g, "v")
    .replace(/sh/g, "s")
    .replace(/[aeiou]/g, "")
    .replace(/(.)\1+/g, "$1")
    .replace(/\s+/g, "");

export const getPathaoLocationMatchScore = (address: string, candidate: string) => {
  const normalizedAddress = normalizePathaoLocationName(address);
  const normalizedCandidate = normalizePathaoLocationName(candidate);

  if (!normalizedAddress || !normalizedCandidate) return 0;

  let score = 0;

  if (normalizedAddress.includes(normalizedCandidate)) {
    score = Math.max(score, 120 + normalizedCandidate.length);
  }

  const addressTokens = normalizedAddress.split(" ").filter(Boolean);
  const candidateTokens = normalizedCandidate
    .split(" ")
    .filter((token) => token.length > 1 && !LOCATION_GENERIC_WORDS.has(token));

  const tokenHits = candidateTokens.filter((candidateToken) =>
    addressTokens.some(
      (addressToken) =>
        addressToken === candidateToken ||
        addressToken.includes(candidateToken) ||
        candidateToken.includes(addressToken),
    ),
  ).length;

  if (tokenHits > 0) {
    score = Math.max(score, 72 + tokenHits * 12 + normalizedCandidate.length);
  }

  const contextPattern = candidateTokens
    .map((candidateToken) => `(?:${LOCATION_CONTEXT_KEYWORDS.join("|")})\\s+${escapeRegExp(candidateToken)}`)
    .join("|");

  if (contextPattern && new RegExp(`\\b(?:${contextPattern})\\b`).test(normalizedAddress)) {
    score = Math.max(score, 144 + normalizedCandidate.length);
  }

  const addressKey = toPhoneticKey(address);
  const candidateKey = toPhoneticKey(candidate);
  if (candidateKey.length >= 3 && addressKey.includes(candidateKey)) {
    score = Math.max(score, 88 + candidateKey.length);
  }

  return score;
};

export const extractPathaoLocationHints = (address: string) => {
  const normalizedAddress = normalizePathaoLocationName(address);

  if (!normalizedAddress) {
    return { cityHints: [] as string[], zoneHints: [] as string[] };
  }

  const cityHints = PATHAO_DISTRICT_OPTIONS.filter((district) =>
    normalizedAddress.includes(normalizePathaoLocationName(district)),
  );

  const zoneHints = PATHAO_THANA_OPTIONS.filter((thana) => {
    const normalizedThana = normalizePathaoLocationName(thana);
    return !AMBIGUOUS_ZONE_HINTS.has(normalizedThana) && normalizedAddress.includes(normalizedThana);
  });

  const inferredCityHints = THANA_TO_CITY_HINTS.flatMap((entry) => {
    const matched = entry.zoneHints.some((zoneHint) =>
      normalizedAddress.includes(normalizePathaoLocationName(zoneHint)),
    );
    return matched ? entry.cityHints : [];
  });

  return {
    cityHints: uniqueNormalizedStrings([...cityHints, ...inferredCityHints]),
    zoneHints: uniqueNormalizedStrings(zoneHints),
  };
};

export const findPathaoLocationByHints = (
  locations: PathaoLocationItem[],
  hints: string[],
) => {
  const normalizedHints = uniqueNormalizedStrings(
    hints.map((hint) => normalizePathaoLocationName(hint)).filter(Boolean),
  );

  if (normalizedHints.length === 0) return null;

  let bestMatch: PathaoLocationItem | null = null;
  let bestScore = 0;

  for (const hint of normalizedHints) {
    for (const location of locations) {
      const normalizedLocation = normalizePathaoLocationName(location.name);
      let score = 0;

      if (normalizedLocation === hint) score = 220;
      else if (normalizedLocation.startsWith(`${hint} `) || normalizedLocation.endsWith(` ${hint}`)) score = 190;
      else if (normalizedLocation.includes(hint) || hint.includes(normalizedLocation)) score = 160;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = location;
      }
    }
  }

  return bestMatch;
};

export const findBestPathaoLocationMatch = (
  address: string,
  locations: PathaoLocationItem[],
) => {
  const scoredMatches = locations
    .map((location) => ({ location, score: getPathaoLocationMatchScore(address, location.name) }))
    .sort((left, right) => right.score - left.score);

  const best = scoredMatches[0];
  const secondBest = scoredMatches[1];

  if (!best || best.score < 78) return null;

  const hasStrongLead = !secondBest || best.score - secondBest.score >= 8;
  const hasHighConfidence = best.score >= 132;

  return hasStrongLead || hasHighConfidence ? best.location : null;
};

export const resolvePathaoLocationMatch = (
  address: string,
  locations: PathaoLocationItem[],
  hints: string[],
) => {
  return findPathaoLocationByHints(locations, hints) ?? findBestPathaoLocationMatch(address, locations);
};