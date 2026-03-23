export type PathaoLocationItem = { id: string | number; name: string };

// ═══════════════════════════════════════════════════════
// COMPREHENSIVE DISTRICT / CITY OPTIONS
// ═══════════════════════════════════════════════════════
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
  // Dhaka city
  "Mirpur", "Uttara", "Gulshan", "Dhanmondi", "Mohammadpur", "Motijheel", "Tejgaon", "Badda", "Rampura", "Khilgaon",
  "Banani", "Cantonment", "Lalbagh", "Demra", "Jatrabari", "Kadamtali", "Shyampur", "Sutrapur", "Wari", "Hazaribagh",
  "Kamrangirchar", "Pallabi", "Kafrul", "Turag", "Ramna", "Adabor", "Kalabagan", "Lalmatia", "Khilkhet", "Vatara",
  "Bhashantek", "Vashantek", "Bonosree", "South Banasree", "Mugda", "Sabujbagh", "Basabo", "Mogbazar", "Eskaton",
  "Hatirjheel", "Hatirjeel", "Rayerbag", "Matuail",
  // Dhaka sub
  "Keraniganj", "Dohar", "Dhamrai", "Tongi", "Hemayetpur", "Ashulia", "Keraniganj Sadar", "Savar",
  "Nawabganj", "Shimuliya",
  // Gazipur
  "Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur", "Joydebpur", "Kashimpur",
  // Narayanganj
  "Fatullah", "Siddhirganj", "Sonargaon", "Rupganj", "Araihazar", "Bandar", "Madanpur",
  // Chittagong city
  "Panchlaish", "Halishahar", "Bayezid", "Double Mooring", "Pahartali", "Bakalia", "Chandgaon",
  "Agrabad", "Patenga", "Kotwali", "Khulshi", "EPZ", "Bandar", "Karnaphuli",
  // Chittagong sub
  "Hathazari", "Fatikchhari", "Sitakunda", "Mirsharai", "Sandwip", "Patiya", "Boalkhali",
  "Anwara", "Rangunia", "Satkania", "Lohagara", "Banshkhali", "Bashkhali", "Chandanaish", "Raozan",
  // Tangail
  "Ghatail", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Basail", "Delduar", "Tangail Sadar",
  // Cox's Bazar
  "Ukhia", "Ramu", "Teknaf", "Chakaria", "Chokoria", "Cox's Bazar Sadar", "Kutubdia", "Maheshkhali", "Pekua",
  // Comilla
  "Comilla Sadar", "Comilla Sadar Dakshin", "Laksam", "Chauddagram", "Debidwar", "Muradnagar", "Brahmanpara",
  "Chandina", "Barura", "Burichang", "Homna", "Nangalkot", "Meghna", "Daudkandi", "Titas",
  // Rajshahi
  "Rajshahi Sadar", "Paba", "Boalia", "Rajpara", "Shah Makhdum", "Puthia", "Godagari", "Tanore",
  "Bagmara", "Durgapur", "Charghat", "Mohanpur",
  // Bogura
  "Bogra Sadar", "Bogura Sadar", "Shahjahanpur", "Kahalu", "Nandigram", "Adamdighi", "Dupchanchia",
  "Gabtali", "Kahaloo", "Sariakandi", "Sherpur", "Shibganj", "Sonatola",
  // Sylhet
  "Sylhet Sadar", "Zakiganj", "Jaintiapur", "Golapganj", "Beanibazar", "Companiganj", "Kanaighat",
  "Fenchuganj", "Bishwanath", "Balaganj", "Osmani Nagar", "Jointapur",
  // Rangpur
  "Rangpur Sadar", "Pirganj", "Pirgachha", "Mithapukur", "Badarganj", "Taraganj", "Gangachara", "Kaunia",
  // Khulna
  "Khulna Sadar", "Sonadanga", "Boyra", "Daulatpur", "Khalishpur", "Dumuria", "Phultala", "Terokhada",
  "Paikgachha", "Koyra", "Dighalia", "Batiaghata", "Rupsa",
  // Barisal
  "Barisal Sadar", "Bakerganj", "Babuganj", "Wazirpur", "Banaripara", "Gournadi", "Agailjhara",
  "Mehendiganj", "Muladi", "Hizla",
  // Mymensingh
  "Mymensingh Sadar", "Trishal", "Bhaluka", "Fulpur", "Muktagachha", "Gafargaon", "Haluaghat",
  "Ishwarganj", "Nandail", "Gouripur", "Phulbaria", "Tarakanda", "Dhobaura",
  // More upazilas
  "Narsingdi Sadar", "Monohardi", "Belabo", "Raipura", "Shibpur", "Palash",
  "Noakhali Sadar", "Maijdi", "Subarnachar", "Companiganj", "Chatkhil", "Begumganj", "Hatiya", "Senbag",
  "Feni Sadar", "Daganbhuiyan", "Chhagalnaiya", "Sonagazi", "Fulgazi", "Parshuram",
  "Habiganj Sadar", "Lakhai", "Nabiganj", "Bahubal", "Madhabpur", "Chunarughat", "Ajmiriganj", "Baniachang",
  "Sunamganj Sadar", "Jagannathpur", "Tahirpur", "Dharmapasha", "Derai", "Sulla", "Jamalganj",
  "Moulvibazar Sadar", "Sreemangal", "Kamalganj", "Rajnagar", "Kulaura", "Juri", "Barlekha",
  "Dinajpur Sadar", "Birampur", "Birganj", "Bochaganj", "Chirirbandar", "Fulbari", "Ghoraghat",
  "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur",
  "Nilphamari Sadar", "Saidpur", "Domar", "Dimla", "Jaldhaka", "Kishoreganj",
  "Kurigram Sadar", "Nageshwari", "Bhurungamari", "Phulbari", "Rajarhat", "Ulipur", "Chilmari", "Rowmari",
  "Lalmonirhat Sadar", "Aditmari", "Kaliganj", "Hatibandha", "Patgram",
  "Gaibandha Sadar", "Gobindaganj", "Palashbari", "Sadullapur", "Sundarganj", "Saghata", "Fulchhari",
  "Thakurgaon Sadar", "Pirganj", "Ranisankail", "Baliadangi", "Haripur",
  "Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia",
  "Chapainawabganj Sadar", "Shibganj", "Gomastapur", "Nachole", "Bholahat",
  "Naogaon Sadar", "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mohadevpur", "Niamatpur",
  "Patnitala", "Porsha", "Raninagar", "Sapahar",
  "Natore Sadar", "Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Singra",
  "Pabna Sadar", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Santhia", "Sujanagar",
  "Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur",
  "Tarash", "Ullapara",
  "Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi",
  "Kishoreganj Sadar", "Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj",
  "Katiadi", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail",
  "Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Kendua", "Khaliajuri",
  "Madan", "Mohanganj", "Purbadhala",
  "Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi",
  "Jamalpur Sadar", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari", "Bakshiganj",
  "Manikganj Sadar", "Daulatpur", "Ghior", "Harirampur", "Saturia", "Shivalaya", "Singair",
  "Munshiganj Sadar", "Gazaria", "Lohajang", "Sirajdikhan", "Sreenagar", "Tongibari",
  "Madaripur Sadar", "Kalkini", "Rajoir", "Shibchar",
  "Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara",
  "Faridpur Sadar", "Alfadanga", "Bhanga", "Boalmari", "Char Bhadrasan", "Madhukhali", "Nagarkanda", "Sadarpur",
  "Shariatpur Sadar", "Bhedarganj", "Damudya", "Gosairhat", "Naria", "Zanjira",
  "Rajbari Sadar", "Baliakandi", "Goalanda", "Pangsha", "Kalukhali",
  "Lakshmipur Sadar", "Kamalnagar", "Raipur", "Ramganj", "Ramgati",
  "Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti",
  "Pirojpur Sadar", "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Indurkani",
  "Jhalokathi Sadar", "Kathalia", "Nalchity", "Rajapur",
  "Bhola Sadar", "Borhanuddin", "Charfashion", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin",
  "Patuakhali Sadar", "Bauphal", "Dashmina", "Dumki", "Galachipa", "Kalapara", "Mirzaganj", "Rangabali",
  "Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali",
  "Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Shyamnagar", "Tala",
  "Narail Sadar", "Kalia", "Lohagara",
  "Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur",
  "Kushtia Sadar", "Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Mirpur",
  "Meherpur Sadar", "Gangni", "Mujibnagar",
  "Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar",
  "Jhenaidah Sadar", "Harinakunda", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa",
  "Bandarban Sadar", "Alikadam", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi",
  "Rangamati Sadar", "Baghaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai",
  "Kaukhali", "Langadu", "Naniarchar", "Rajasthali",
  "Khagrachari Sadar", "Dighinala", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga",
  "Panchhari", "Ramgarh",
];

export const PATHAO_ZONE_OPTIONS = [
  "Dhaka Metro", "Dhaka Sub", "Chittagong Metro", "Chittagong Sub",
  "Rajshahi Metro", "Khulna Metro", "Sylhet Metro", "Rangpur Metro",
  "Barisal Metro", "Mymensingh Metro", "Outside Metro",
];

// ═══════════════════════════════════════════════════════
// BANGLA ↔ ENGLISH LOCATION ALIAS MAP
// Much more comprehensive than before
// ═══════════════════════════════════════════════════════
const LOCATION_ALIAS_PATTERNS: Array<[RegExp, string]> = [
  // Division cities
  [/\bchattogram\b/g, "chittagong"], [/\bchattograma?\b/g, "chittagong"], [/\bchattagrama?\b/g, "chittagong"],
  [/\bchattagram\b/g, "chittagong"], [/\bchatgram\b/g, "chittagong"], [/\bctg\b/g, "chittagong"],
  [/\bcumilla\b/g, "comilla"], [/\bkulilla\b/g, "comilla"], [/\bkomilla\b/g, "comilla"],
  [/\bjashore\b/g, "jessore"], [/\bborishal\b/g, "barisal"], [/\bbarisal\b/g, "barisal"],
  [/\bcoxs?\s*bazar\b/g, "cox bazar"], [/\bkoksbazar\b/g, "cox bazar"], [/\bkoksh?\s*bajar\b/g, "cox bazar"],
  [/\bb\s*baria\b/g, "brahmanbaria"], [/\bbrahmonbaria\b/g, "brahmanbaria"],
  [/\bnarayangonj\b/g, "narayanganj"], [/\bnarayon\s*gonj\b/g, "narayanganj"],
  [/\bgajipur\b/g, "gazipur"], [/\bgazipur\b/g, "gazipur"],
  [/\bmymensing\b/g, "mymensingh"], [/\bmymensingh?\b/g, "mymensingh"], [/\bmoimonsingh?\b/g, "mymensingh"],
  [/\bpabna\b/g, "pabna"], [/\bbogra\b/g, "bogura"],
  
  // Common thana/area aliases
  [/\bchokoria\b/g, "chakaria"], [/\bciringa\b/g, "chiringa"],
  [/\bchandgao\b/g, "chandgaon"], [/\bchandagao\b/g, "chandgaon"],
  [/\bbayejid\b/g, "bayezid"], [/\bbayjid\b/g, "bayezid"],
  [/\bhathajari\b/g, "hathazari"], [/\bhathahajari\b/g, "hathazari"],
  [/\bfatikchari\b/g, "fatikchhari"], [/\bfotikchori\b/g, "fatikchhari"], [/\bfotikchhori\b/g, "fatikchhari"],
  [/\buttora\b/g, "uttara"], [/\buttarakhand\b/g, "uttara"],
  [/\bmoddho\b/g, "middle"],
  [/\bdhaka\s+metro\b/g, "dhaka"],
  [/\bpanchlais\b/g, "panchlaish"], [/\bpanchlaish\b/g, "panchlaish"],
  [/\bvashantek\b/g, "bhashantek"],
  [/\bjatrebary\b/g, "jatrabari"], [/\bjatrabary\b/g, "jatrabari"],
  [/\bbashkhali\b/g, "banshkhali"], [/\bbanshkhali\b/g, "banshkhali"],
  [/\bmirsarai\b/g, "mirsharai"], [/\bmirshorai\b/g, "mirsharai"],
  [/\brangunia\b/g, "rangunia"],
  [/\bsatkania\b/g, "satkania"], [/\bsatkaniya\b/g, "satkania"],
  [/\bmonohardi\b/g, "monohardi"], [/\bmanohordi\b/g, "monohardi"],
  [/\bkahaloo?\b/g, "kahalu"],
  [/\bputhia\b/g, "puthia"],
  [/\blalmohan\b/g, "lalmohan"],
  [/\bbhandaria\b/g, "bhandaria"], [/\bbhandariya\b/g, "bhandaria"],
  [/\bkanalhat\b/g, "kanaighat"], [/\bkanaighat\b/g, "kanaighat"],
  [/\bjagonnathpur\b/g, "jagannathpur"], [/\bjogonnath\s*pur\b/g, "jagannathpur"],
  [/\bsunamgonj\b/g, "sunamganj"],
  [/\bsreemongol\b/g, "sreemangal"], [/\bsrimongol\b/g, "sreemangal"], [/\bsrimangal\b/g, "sreemangal"],
  [/\bjoydebpur\b/g, "joydebpur"],
  [/\btarakanda\b/g, "tarakanda"],
  [/\bjokigonj\b/g, "zakiganj"], [/\bjokiganj\b/g, "zakiganj"], [/\bzokigonj\b/g, "zakiganj"], [/\bzokijoinj\b/g, "zakiganj"],
  [/\bbirampur\b/g, "birampur"],
  [/\bpirgonj\b/g, "pirganj"], [/\bpirganj\b/g, "pirganj"],
  [/\bullapara\b/g, "ullapara"],
  [/\bbelkuchi\b/g, "belkuchi"],
  [/\bchauddagram\b/g, "chauddagram"],
  [/\bnoakhali\b/g, "noakhali"], [/\bnoyakhali\b/g, "noakhali"],
  [/\bsubornochar\b/g, "subarnachar"], [/\bsubornachor\b/g, "subarnachar"],
  [/\bmaijdi\b/g, "maijdi"],
  [/\bkharushkul\b/g, "kharushkul"],
  [/\bchapainababgonj\b/g, "chapainawabganj"], [/\bchapainababganj\b/g, "chapainawabganj"],
  [/\bchapai\s*nawabganj\b/g, "chapainawabganj"],
  [/\bnasir\s*nagar\b/g, "nasirnagar"],
  [/\blakhai\b/g, "lakhai"],
  [/\bchounddogram\b/g, "chauddagram"],
  [/\bgojaria\b/g, "gazaria"], [/\bgazaria\b/g, "gazaria"],
  [/\bkodomtoli\b/g, "kadamtali"], [/\bkodomtoly\b/g, "kadamtali"],
  [/\bporsho?\b/g, "porsha"],
  [/\bthakurgao\b/g, "thakurgaon"], [/\bthakurgaon\b/g, "thakurgaon"],
  [/\bfotulla\b/g, "fatullah"], [/\bfatulla\b/g, "fatullah"],
  [/\bkasimpur\b/g, "kashimpur"], [/\bkashimpur\b/g, "kashimpur"],
  [/\bdohar\b/g, "dohar"],
  [/\bdhamrai\b/g, "dhamrai"],
  [/\bkeranigonj\b/g, "keraniganj"],
  [/\bkundeshwari\b/g, "kundeshwari"],
  [/\bnorshingdi\b/g, "narsingdi"], [/\bnarshingdi\b/g, "narsingdi"],
  [/\bvhaluka\b/g, "bhaluka"], [/\bbhaluka\b/g, "bhaluka"],
  [/\bfulpur\b/g, "fulpur"],
  [/\bchondrogona\b/g, "chandraghona"], [/\bchandroghona\b/g, "chandraghona"],
  [/\bkochua\b/g, "kachua"], [/\bkochiya\b/g, "kachua"],
];

const LOCATION_GENERIC_WORDS = new Set([
  "city", "district", "zila", "zela", "jela", "jila", "division", "upazila", "thana", "metro", "area", "road", "block",
  "house", "home", "flat", "floor", "sector", "para", "bazar", "bazaar", "market", "goli", "lane", "sarak",
  "post", "office", "college", "school", "madrasa", "mosque", "hospital", "plaza", "tower", "building",
  "village", "gram", "union", "mouza", "ward", "no", "number", "south", "north", "east", "west",
  "dakshin", "uttar", "purba", "paschim", "modhyo", "moddhyo",
]);

const LOCATION_CONTEXT_KEYWORDS = ["district", "zila", "zela", "jela", "jila", "city", "thana", "upazila", "area", "zone", "sadar"];

const AMBIGUOUS_ZONE_HINTS = new Set(["sadar", "kotwali", "bandar", "bondor", "metro", "sub", "city", "outside"]);

const BANGLA_DIGIT_MAP: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

const BANGLA_VOWEL_SIGNS = new Set(["া", "ি", "ী", "ু", "ূ", "ৃ", "ে", "ৈ", "ো", "ৌ"]);
const BANGLA_CONSONANTS = new Set([
  "ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ", "ঝ", "ঞ", "ট", "ঠ", "ড", "ঢ", "ণ",
  "ত", "থ", "দ", "ধ", "ন", "প", "ফ", "ব", "ভ", "ম", "য", "র", "ল", "শ", "ষ",
  "স", "হ", "ড়", "ঢ়", "য়",
]);

const BANGLA_ROMAN_MAP: Record<string, string> = {
  "অ": "o", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri", "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou",
  "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
  "ং": "ng", "ঃ": "h", "ঁ": "n", "্": "",
  "ক": "k", "খ": "kh", "গ": "g", "ঘ": "gh", "ঙ": "ng", "চ": "ch", "ছ": "chh", "জ": "j", "ঝ": "jh", "ঞ": "n",
  "ট": "t", "ঠ": "th", "ড": "d", "ঢ": "dh", "ণ": "n", "ত": "t", "থ": "th", "দ": "d", "ধ": "dh", "ন": "n",
  "প": "p", "ফ": "f", "ব": "b", "ভ": "v", "ম": "m", "য": "y", "র": "r", "ল": "l", "শ": "s", "ষ": "s", "স": "s", "হ": "h", "ড়": "r", "ঢ়": "rh", "য়": "y",
};

// ═══════════════════════════════════════════════════════
// COMPREHENSIVE THANA → CITY MAPPINGS
// Covers ALL major districts and their upazilas
// ═══════════════════════════════════════════════════════
const THANA_TO_CITY_HINTS: Array<{ cityHints: string[]; zoneHints: string[] }> = [
  // Dhaka
  { cityHints: ["Dhaka"], zoneHints: [
    "Mirpur", "Pallabi", "Kafrul", "Uttara", "Turag", "Gulshan", "Banani", "Badda", "Rampura", "Khilgaon",
    "Demra", "Jatrabari", "Kadamtali", "Sutrapur", "Wari", "Mohammadpur", "Dhanmondi", "Tejgaon", "Motijheel",
    "Adabor", "Hazaribagh", "Kamrangirchar", "Keraniganj", "Dohar", "Dhamrai", "Ashulia", "Hemayetpur",
    "Kalabagan", "Lalmatia", "Ramna", "Lalbagh", "Cantonment", "Khilkhet", "Vatara", "Bhashantek",
    "Vashantek", "Bonosree", "Mugda", "Sabujbagh", "Basabo", "Mogbazar", "Eskaton", "Hatirjheel",
    "Hatirjeel", "Rayerbag", "Matuail", "Shyampur", "Shimuliya", "Nawabganj"
  ]},
  // Gazipur
  { cityHints: ["Gazipur"], zoneHints: [
    "Tongi", "Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur", "Joydebpur", "Kashimpur"
  ]},
  // Narayanganj
  { cityHints: ["Narayanganj"], zoneHints: [
    "Fatullah", "Siddhirganj", "Sonargaon", "Rupganj", "Araihazar", "Bandar", "Madanpur"
  ]},
  // Chittagong
  { cityHints: ["Chittagong", "Chattogram"], zoneHints: [
    "Panchlaish", "Halishahar", "Bayezid", "Double Mooring", "Pahartali", "Bakalia", "Chandgaon",
    "Agrabad", "Patenga", "Khulshi", "EPZ", "Hathazari", "Fatikchhari", "Sitakunda", "Mirsharai",
    "Sandwip", "Patiya", "Boalkhali", "Anwara", "Rangunia", "Satkania", "Lohagara", "Banshkhali",
    "Chandanaish", "Raozan", "Karnaphuli", "Kotwali", "Chandraghona"
  ]},
  // Tangail
  { cityHints: ["Tangail"], zoneHints: ["Ghatail", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Basail", "Delduar", "Tangail Sadar"] },
  // Cox's Bazar
  { cityHints: ["Cox's Bazar", "Coxs Bazar"], zoneHints: ["Ukhia", "Ramu", "Teknaf", "Chakaria", "Chokoria", "Kutubdia", "Maheshkhali", "Pekua", "Kharushkul"] },
  // Savar (separate city in Pathao)
  { cityHints: ["Savar", "Dhaka"], zoneHints: ["Savar", "Ashulia", "Hemayetpur"] },
  // Comilla
  { cityHints: ["Comilla", "Cumilla"], zoneHints: [
    "Comilla Sadar", "Laksam", "Chauddagram", "Debidwar", "Muradnagar", "Brahmanpara",
    "Chandina", "Barura", "Burichang", "Homna", "Nangalkot", "Meghna", "Daudkandi", "Titas", "Comilla Sadar Dakshin"
  ]},
  // Rajshahi
  { cityHints: ["Rajshahi"], zoneHints: ["Rajshahi Sadar", "Paba", "Boalia", "Rajpara", "Shah Makhdum", "Puthia", "Godagari", "Tanore", "Bagmara", "Durgapur", "Charghat", "Mohanpur"] },
  // Bogura
  { cityHints: ["Bogra", "Bogura"], zoneHints: ["Bogra Sadar", "Bogura Sadar", "Shahjahanpur", "Kahalu", "Nandigram", "Adamdighi", "Dupchanchia", "Gabtali", "Sariakandi", "Shibganj", "Sonatola"] },
  // Sylhet
  { cityHints: ["Sylhet"], zoneHints: ["Sylhet Sadar", "Zakiganj", "Jaintiapur", "Golapganj", "Beanibazar", "Companiganj", "Kanaighat", "Fenchuganj", "Bishwanath", "Balaganj", "Osmani Nagar"] },
  // Rangpur
  { cityHints: ["Rangpur"], zoneHints: ["Rangpur Sadar", "Pirganj", "Pirgachha", "Mithapukur", "Badarganj", "Taraganj", "Gangachara", "Kaunia"] },
  // Khulna
  { cityHints: ["Khulna"], zoneHints: ["Khulna Sadar", "Sonadanga", "Boyra", "Daulatpur", "Khalishpur", "Dumuria", "Phultala", "Terokhada", "Paikgachha", "Koyra", "Dighalia", "Batiaghata", "Rupsa"] },
  // Barisal
  { cityHints: ["Barisal", "Barishal"], zoneHints: ["Barisal Sadar", "Bakerganj", "Babuganj", "Wazirpur", "Banaripara", "Gournadi", "Agailjhara", "Mehendiganj", "Muladi", "Hizla"] },
  // Mymensingh
  { cityHints: ["Mymensingh"], zoneHints: ["Mymensingh Sadar", "Trishal", "Bhaluka", "Fulpur", "Muktagachha", "Gafargaon", "Haluaghat", "Ishwarganj", "Nandail", "Gouripur", "Phulbaria", "Tarakanda", "Dhobaura"] },
  // Narsingdi
  { cityHints: ["Narsingdi"], zoneHints: ["Narsingdi Sadar", "Monohardi", "Belabo", "Raipura", "Shibpur", "Palash"] },
  // Noakhali
  { cityHints: ["Noakhali"], zoneHints: ["Noakhali Sadar", "Maijdi", "Subarnachar", "Companiganj", "Chatkhil", "Begumganj", "Hatiya", "Senbag"] },
  // Feni
  { cityHints: ["Feni"], zoneHints: ["Feni Sadar", "Daganbhuiyan", "Chhagalnaiya", "Sonagazi", "Fulgazi", "Parshuram"] },
  // Habiganj
  { cityHints: ["Habiganj"], zoneHints: ["Habiganj Sadar", "Lakhai", "Nabiganj", "Bahubal", "Madhabpur", "Chunarughat", "Ajmiriganj", "Baniachang"] },
  // Sunamganj
  { cityHints: ["Sunamganj"], zoneHints: ["Sunamganj Sadar", "Jagannathpur", "Tahirpur", "Dharmapasha", "Derai", "Sulla", "Jamalganj"] },
  // Moulvibazar
  { cityHints: ["Moulvibazar"], zoneHints: ["Moulvibazar Sadar", "Sreemangal", "Kamalganj", "Rajnagar", "Kulaura", "Juri", "Barlekha"] },
  // Dinajpur
  { cityHints: ["Dinajpur"], zoneHints: ["Dinajpur Sadar", "Birampur", "Birganj", "Bochaganj", "Chirirbandar", "Fulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Parbatipur"] },
  // Kishoreganj
  { cityHints: ["Kishoreganj"], zoneHints: ["Kishoreganj Sadar", "Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"] },
  // Manikganj
  { cityHints: ["Manikganj"], zoneHints: ["Manikganj Sadar", "Daulatpur", "Ghior", "Harirampur", "Saturia", "Shivalaya", "Singair"] },
  // Munshiganj
  { cityHints: ["Munshiganj"], zoneHints: ["Munshiganj Sadar", "Gazaria", "Lohajang", "Sirajdikhan", "Sreenagar", "Tongibari"] },
  // Faridpur
  { cityHints: ["Faridpur"], zoneHints: ["Faridpur Sadar", "Alfadanga", "Bhanga", "Boalmari", "Char Bhadrasan", "Madhukhali", "Nagarkanda", "Sadarpur"] },
  // Pabna
  { cityHints: ["Pabna"], zoneHints: ["Pabna Sadar", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Ishwardi", "Santhia", "Sujanagar"] },
  // Sirajganj
  { cityHints: ["Sirajganj"], zoneHints: ["Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Tarash", "Ullapara"] },
  // Nilphamari
  { cityHints: ["Nilphamari"], zoneHints: ["Nilphamari Sadar", "Saidpur", "Domar", "Dimla", "Jaldhaka"] },
  // Kurigram
  { cityHints: ["Kurigram"], zoneHints: ["Kurigram Sadar", "Nageshwari", "Bhurungamari", "Phulbari", "Rajarhat", "Ulipur", "Chilmari", "Rowmari"] },
  // Lalmonirhat
  { cityHints: ["Lalmonirhat"], zoneHints: ["Lalmonirhat Sadar", "Aditmari", "Hatibandha", "Patgram"] },
  // Gaibandha
  { cityHints: ["Gaibandha"], zoneHints: ["Gaibandha Sadar", "Gobindaganj", "Palashbari", "Sadullapur", "Sundarganj", "Saghata", "Fulchhari"] },
  // Thakurgaon
  { cityHints: ["Thakurgaon"], zoneHints: ["Thakurgaon Sadar", "Pirganj", "Ranisankail", "Baliadangi", "Haripur"] },
  // Panchagarh
  { cityHints: ["Panchagarh"], zoneHints: ["Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia"] },
  // Naogaon
  { cityHints: ["Naogaon"], zoneHints: ["Naogaon Sadar", "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mohadevpur", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"] },
  // Natore
  { cityHints: ["Natore"], zoneHints: ["Natore Sadar", "Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Singra"] },
  // Chapainawabganj
  { cityHints: ["Chapainawabganj"], zoneHints: ["Chapainawabganj Sadar", "Shibganj", "Gomastapur", "Nachole", "Bholahat"] },
  // Joypurhat
  { cityHints: ["Joypurhat"], zoneHints: ["Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi"] },
  // Satkhira
  { cityHints: ["Satkhira"], zoneHints: ["Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Shyamnagar", "Tala"] },
  // Kushtia
  { cityHints: ["Kushtia"], zoneHints: ["Kushtia Sadar", "Bheramara", "Daulatpur", "Khoksa", "Kumarkhali"] },
  // Lakshmipur
  { cityHints: ["Lakshmipur"], zoneHints: ["Lakshmipur Sadar", "Kamalnagar", "Raipur", "Ramganj", "Ramgati"] },
  // Chandpur
  { cityHints: ["Chandpur"], zoneHints: ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"] },
  // Shariatpur
  { cityHints: ["Shariatpur"], zoneHints: ["Shariatpur Sadar", "Bhedarganj", "Damudya", "Gosairhat", "Naria", "Zanjira"] },
  // Pirojpur
  { cityHints: ["Pirojpur"], zoneHints: ["Pirojpur Sadar", "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Indurkani"] },
  // Bhola
  { cityHints: ["Bhola"], zoneHints: ["Bhola Sadar", "Borhanuddin", "Charfashion", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"] },
  // Patuakhali
  { cityHints: ["Patuakhali"], zoneHints: ["Patuakhali Sadar", "Bauphal", "Dashmina", "Dumki", "Galachipa", "Kalapara", "Mirzaganj", "Rangabali"] },
  // Barguna
  { cityHints: ["Barguna"], zoneHints: ["Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali"] },
  // Brahmanbaria
  { cityHints: ["Brahmanbaria"], zoneHints: ["Brahmanbaria Sadar", "Nasirnagar", "Akhaura", "Ashuganj", "Bancharampur", "Bijoynagar", "Kasba", "Nabinagar", "Sarail"] },
  // Netrokona
  { cityHints: ["Netrokona"], zoneHints: ["Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Kendua", "Khaliajuri", "Madan", "Mohanganj", "Purbadhala"] },
  // Sherpur
  { cityHints: ["Sherpur"], zoneHints: ["Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"] },
  // Jamalpur
  { cityHints: ["Jamalpur"], zoneHints: ["Jamalpur Sadar", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari", "Bakshiganj"] },
  // Gopalganj
  { cityHints: ["Gopalganj"], zoneHints: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"] },
  // Madaripur
  { cityHints: ["Madaripur"], zoneHints: ["Madaripur Sadar", "Kalkini", "Rajoir", "Shibchar"] },
  // Rajbari
  { cityHints: ["Rajbari"], zoneHints: ["Rajbari Sadar", "Baliakandi", "Goalanda", "Pangsha", "Kalukhali"] },
  // Jhalokathi
  { cityHints: ["Jhalokathi", "Jhalokati"], zoneHints: ["Jhalokathi Sadar", "Kathalia", "Nalchity", "Rajapur"] },
  // Narail
  { cityHints: ["Narail"], zoneHints: ["Narail Sadar", "Kalia", "Lohagara"] },
  // Magura
  { cityHints: ["Magura"], zoneHints: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"] },
  // Meherpur
  { cityHints: ["Meherpur"], zoneHints: ["Meherpur Sadar", "Gangni", "Mujibnagar"] },
  // Chuadanga
  { cityHints: ["Chuadanga"], zoneHints: ["Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"] },
  // Jhenaidah
  { cityHints: ["Jhenaidah"], zoneHints: ["Jhenaidah Sadar", "Harinakunda", "Kotchandpur", "Maheshpur", "Shailkupa"] },
  // Hill districts
  { cityHints: ["Bandarban"], zoneHints: ["Bandarban Sadar", "Alikadam", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"] },
  { cityHints: ["Rangamati"], zoneHints: ["Rangamati Sadar", "Baghaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai", "Kaukhali", "Langadu", "Naniarchar", "Rajasthali"] },
  { cityHints: ["Khagrachari"], zoneHints: ["Khagrachari Sadar", "Dighinala", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"] },
];

// ═══════════════════════════════════════════════════════
// BANGLA LOCATION NAME MAP
// Maps Bangla district names directly to English
// ═══════════════════════════════════════════════════════
const BANGLA_DISTRICT_MAP: Record<string, string[]> = {
  "ঢাকা": ["Dhaka"], "চট্টগ্রাম": ["Chittagong", "Chattogram"], "রাজশাহী": ["Rajshahi"],
  "খুলনা": ["Khulna"], "বরিশাল": ["Barisal", "Barishal"], "সিলেট": ["Sylhet"],
  "রংপুর": ["Rangpur"], "ময়মনসিংহ": ["Mymensingh"], "কুমিল্লা": ["Comilla", "Cumilla"],
  "গাজীপুর": ["Gazipur"], "নারায়ণগঞ্জ": ["Narayanganj"], "বগুড়া": ["Bogra", "Bogura"],
  "কক্সবাজার": ["Cox's Bazar"], "ফেনী": ["Feni"], "টাঙ্গাইল": ["Tangail"],
  "যশোর": ["Jessore", "Jashore"], "ব্রাহ্মণবাড়িয়া": ["Brahmanbaria"],
  "নরসিংদী": ["Narsingdi"], "মানিকগঞ্জ": ["Manikganj"], "মুন্সীগঞ্জ": ["Munshiganj"], "মুন্সিগঞ্জ": ["Munshiganj"],
  "মাদারীপুর": ["Madaripur"], "গোপালগঞ্জ": ["Gopalganj"], "ফরিদপুর": ["Faridpur"],
  "শরীয়তপুর": ["Shariatpur"], "রাজবাড়ী": ["Rajbari"], "কিশোরগঞ্জ": ["Kishoreganj"],
  "নেত্রকোনা": ["Netrokona"], "শেরপুর": ["Sherpur"], "জামালপুর": ["Jamalpur"],
  "দিনাজপুর": ["Dinajpur"], "নীলফামারী": ["Nilphamari"], "কুড়িগ্রাম": ["Kurigram"],
  "লালমনিরহাট": ["Lalmonirhat"], "গাইবান্ধা": ["Gaibandha"], "ঠাকুরগাঁও": ["Thakurgaon"],
  "পঞ্চগড়": ["Panchagarh"], "চাঁপাইনবাবগঞ্জ": ["Chapainawabganj"],
  "নওগাঁ": ["Naogaon"], "নাটোর": ["Natore"], "পাবনা": ["Pabna"],
  "সিরাজগঞ্জ": ["Sirajganj"], "জয়পুরহাট": ["Joypurhat"], "হবিগঞ্জ": ["Habiganj"],
  "সুনামগঞ্জ": ["Sunamganj"], "মৌলভীবাজার": ["Moulvibazar"], "নোয়াখালী": ["Noakhali"],
  "লক্ষ্মীপুর": ["Lakshmipur"], "চাঁদপুর": ["Chandpur"], "পিরোজপুর": ["Pirojpur"],
  "ঝালকাঠি": ["Jhalokathi"], "ভোলা": ["Bhola"], "পটুয়াখালী": ["Patuakhali"],
  "বরগুনা": ["Barguna"], "সাতক্ষীরা": ["Satkhira"], "নড়াইল": ["Narail"],
  "মাগুরা": ["Magura"], "কুষ্টিয়া": ["Kushtia"], "মেহেরপুর": ["Meherpur"],
  "চুয়াডাঙ্গা": ["Chuadanga"], "ঝিনাইদহ": ["Jhenaidah"], "বান্দরবান": ["Bandarban"],
  "রাঙ্গামাটি": ["Rangamati"], "খাগড়াছড়ি": ["Khagrachari"],
};

// Bangla thana/upazila names
const BANGLA_THANA_MAP: Record<string, string[]> = {
  "মিরপুর": ["Mirpur"], "উত্তরা": ["Uttara"], "গুলশান": ["Gulshan"], "ধানমন্ডি": ["Dhanmondi"],
  "মোহাম্মদপুর": ["Mohammadpur"], "বাড্ডা": ["Badda"], "খিলগাঁও": ["Khilgaon"], "রামপুরা": ["Rampura"],
  "হাটহাজারী": ["Hathazari"], "ফটিকছড়ি": ["Fatikchhari"], "পাঁচলাইশ": ["Panchlaish"],
  "বাশখালী": ["Banshkhali"], "সীতাকুণ্ড": ["Sitakunda"], "মীরসরাই": ["Mirsharai"],
  "রাঙ্গুনিয়া": ["Rangunia"], "সাতকানিয়া": ["Satkania"], "পটিয়া": ["Patiya"],
  "বোয়ালখালী": ["Boalkhali"], "আনোয়ারা": ["Anwara"], "চন্দনাইশ": ["Chandanaish"],
  "রাউজান": ["Raozan"], "সন্দ্বীপ": ["Sandwip"], "কর্ণফুলী": ["Karnaphuli"],
  "পুঠিয়া": ["Puthia"], "কাহালু": ["Kahalu"], "সদর": ["Sadar"],
  "মনোহরদি": ["Monohardi"], "কেরানীগঞ্জ": ["Keraniganj"], "দোহার": ["Dohar"],
  "ধামরাই": ["Dhamrai"], "সাভার": ["Savar"], "ফতুল্লা": ["Fatullah"],
  "টঙ্গী": ["Tongi"], "জয়দেবপুর": ["Joydebpur"], "কালীগঞ্জ": ["Kaliganj"],
  "শাহজাদপুর": ["Shahjadpur"], "উল্লাপাড়া": ["Ullapara"], "বেলকুচি": ["Belkuchi"],
  "পাবনা": ["Pabna Sadar"], "ভান্ডারিয়া": ["Bhandaria"], "ভোলা": ["Bhola Sadar"],
  "লালমোহন": ["Lalmohan"], "চকরিয়া": ["Chakaria"], "বিরামপুর": ["Birampur"],
  "পীরগঞ্জ": ["Pirganj"], "লাখাই": ["Lakhai"], "মাধবপুর": ["Madhabpur"],
  "শ্রীমঙ্গল": ["Sreemangal"], "কানাইঘাট": ["Kanaighat"], "জগন্নাথপুর": ["Jagannathpur"],
  "ঘাটাইল": ["Ghatail"], "নোয়াখালী": ["Noakhali Sadar"], "সুবর্ণচর": ["Subarnachar"],
  "ভালুকা": ["Bhaluka"], "ফুলপুর": ["Fulpur"], "তারাকান্দা": ["Tarakanda"],
  "জাকিগঞ্জ": ["Zakiganj"], "নাসিরনগর": ["Nasirnagar"],
  "খিলখেত": ["Khilkhet"], "ভাষানটেক": ["Bhashantek"], "কলাবাগান": ["Kalabagan"],
  "লালমাটিয়া": ["Lalmatia"], "পোড়শা": ["Porsha"], "গুরুদাসপুর": ["Gurudaspur"],
  "গজারিয়া": ["Gazaria"], "কচুয়া": ["Kachua"],
};

const uniqueNormalizedStrings = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const transliterateBanglaText = (value: string) => {
  let output = "";
  for (let index = 0; index < value.length; index += 1) {
    const current = value[index];
    const next = value[index + 1];
    if (BANGLA_CONSONANTS.has(current)) {
      output += BANGLA_ROMAN_MAP[current] || "";
      if (next === "্" || BANGLA_VOWEL_SIGNS.has(next)) continue;
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
    .replace(/['']/g, "'")
    .replace(/[।,:;()[\]{}]/g, " ")
    .replace(/['`./\\-]/g, " ")
    .replace(/\+/g, " ");

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

  // Exact substring match
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

  // Context-aware matching (e.g., "district rajshahi", "thana mirpur")
  const contextPattern = candidateTokens
    .map((candidateToken) => `(?:${LOCATION_CONTEXT_KEYWORDS.join("|")})\\s+${escapeRegExp(candidateToken)}`)
    .join("|");

  if (contextPattern && new RegExp(`\\b(?:${contextPattern})\\b`).test(normalizedAddress)) {
    score = Math.max(score, 144 + normalizedCandidate.length);
  }

  // Also check reverse context: "rajshahi district"
  const reverseContextPattern = candidateTokens
    .map((candidateToken) => `${escapeRegExp(candidateToken)}\\s+(?:${LOCATION_CONTEXT_KEYWORDS.join("|")})`)
    .join("|");

  if (reverseContextPattern && new RegExp(`\\b(?:${reverseContextPattern})\\b`).test(normalizedAddress)) {
    score = Math.max(score, 144 + normalizedCandidate.length);
  }

  // Phonetic matching
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

  // First, check Bangla district names directly (before transliteration loses info)
  const banglaCityHints: string[] = [];
  const banglaZoneHints: string[] = [];

  for (const [bangla, english] of Object.entries(BANGLA_DISTRICT_MAP)) {
    if (address.includes(bangla)) {
      banglaCityHints.push(...english);
    }
  }

  for (const [bangla, english] of Object.entries(BANGLA_THANA_MAP)) {
    if (address.includes(bangla)) {
      banglaZoneHints.push(...english);
    }
  }

  // Then check normalized text
  const cityHints = PATHAO_DISTRICT_OPTIONS.filter((district) =>
    normalizedAddress.includes(normalizePathaoLocationName(district)),
  );

  const zoneHints = PATHAO_THANA_OPTIONS.filter((thana) => {
    const normalizedThana = normalizePathaoLocationName(thana);
    return !AMBIGUOUS_ZONE_HINTS.has(normalizedThana) && normalizedAddress.includes(normalizedThana);
  });

  // Infer city from thana
  const inferredCityHints = THANA_TO_CITY_HINTS.flatMap((entry) => {
    const matched = entry.zoneHints.some((zoneHint) =>
      normalizedAddress.includes(normalizePathaoLocationName(zoneHint)),
    );
    return matched ? entry.cityHints : [];
  });

  // Also infer from Bangla thana matches
  const inferredFromBangla = THANA_TO_CITY_HINTS.flatMap((entry) => {
    const matched = entry.zoneHints.some((zoneHint) =>
      banglaZoneHints.includes(zoneHint),
    );
    return matched ? entry.cityHints : [];
  });

  return {
    cityHints: uniqueNormalizedStrings([...banglaCityHints, ...cityHints, ...inferredCityHints, ...inferredFromBangla]),
    zoneHints: uniqueNormalizedStrings([...banglaZoneHints, ...zoneHints]),
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
