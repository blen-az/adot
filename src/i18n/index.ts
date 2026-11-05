export const locales = ["en", "am"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

const en = {
  brand: "Adot Complex",
  skipToContent: "Skip to main content",
  nav: {
    cinema: "Cinema",
    gym: "Gym",
    directory: "Directory",
    spaces: "Available Spaces",
    visit: "Visit",
    about: "About",
    contact: "Contact",
    privacy: "Privacy",
  },
  languageName: "English",
  otherLanguage: "አማርኛ",
  home: {
    heading: "Cinema, fitness and business under one roof",
    intro: "Find a film, visit Adot Gym, discover the businesses here, or enquire about a commercial space.",
    featured: "Available now",
    viewAll: "View all spaces",
  },
  placeholder: {
    body: "This page is being prepared. Please check back soon.",
  },
  spaces: {
    heading: "Available Spaces",
    intro: "Commercial units currently available at Adot Complex.",
    floor: "Floor",
    category: "Category",
    minArea: "Minimum area (m²)",
    maxArea: "Maximum area (m²)",
    any: "Any",
    apply: "Apply filters",
    clear: "Clear filters",
    noUnitsHeading: "No units are available right now",
    noUnitsBody: "Tell us what you need and we will contact you when a suitable space becomes available.",
    noMatchHeading: "No units match these filters",
    noMatchBody: "Try different filters, or tell us what you need.",
    futureLink: "Register your interest",
    contactForPricing: "Contact for pricing",
    area: "Area",
    rent: "Rent",
    serviceCharge: "Service charge",
    availableFrom: "Available from",
    permittedUse: "Permitted use",
    features: "Features",
    reference: "Reference",
    status: "Status",
    enquire: "Enquire About This Unit",
    back: "Back to Available Spaces",
    unavailableHeading: "This unit is no longer available",
    unavailableBody: "Browse the spaces available now, or tell us what you are looking for.",
    browse: "Browse available spaces",
  },
  availability: { available: "Available", under_discussion: "Under discussion", leased: "Leased" },
  billing: { monthly: "per month", quarterly: "per quarter", annual: "per year" },
  form: {
    unitHeading: "Enquire about this unit",
    futureHeading: "Future availability request",
    futureIntro: "Tell us what you need and our leasing team will contact you.",
    enquiringAbout: "Enquiring about",
    name: "Full name",
    phone: "Phone number",
    phoneHint: "For example 0911 234 567 or +251 911 234 567",
    intendedUse: "Intended business type or use",
    message: "Your question or requirements",
    email: "Email",
    company: "Company name",
    desiredArea: "Approximate area needed",
    preferredDate: "Preferred viewing date",
    preferredDateHint: "This is a request only. Our team will confirm any viewing.",
    contactMethod: "Preferred contact method",
    noPreference: "No preference",
    methods: { phone: "Phone", email: "Email", whatsapp: "WhatsApp" },
    optional: "optional",
    notice: "We use your details only to respond to this enquiry.",
    privacyLink: "Read our privacy notice",
    marketing: "Send me news and offers from Adot Complex.",
    submit: "Send enquiry",
    sending: "Sending…",
    errorSummary: "Please check the highlighted fields.",
    errors: {
      name: "Enter your name.",
      phone: "Enter a valid phone number.",
      intendedUse: "Tell us your intended business type or use.",
      message: "Enter your question or requirements.",
      email: "Enter a valid email address.",
      preferredDate: "Enter a valid date.",
      company: "Company name is too long.",
      desiredArea: "Area description is too long.",
    },
    failed: "Your enquiry could not be sent. Your details are still here, so please try again.",
    rateLimited: "Too many enquiries were sent from this connection. Please try again later.",
    staleHeading: "This unit has just become unavailable",
    staleBody: "Your enquiry was not sent. You can send it as a general request, and your details will be kept.",
    staleSwitch: "Continue as a general request",
    successHeading: "Thank you. Your enquiry has been received.",
    successReference: "Your reference number",
    successUnit: "Unit",
    successNext:
      "Our leasing team will contact you. This enquiry does not reserve the unit or confirm a viewing.",
  },
  notFound: { heading: "Page not found", body: "This page does not exist.", home: "Go to the homepage" },
};

export type Dictionary = typeof en;

// Draft translation. Adot's Amharic reviewer must approve this before launch (FR-101, O-04).
const am: Dictionary = {
  brand: "አዶት ኮምፕሌክስ",
  skipToContent: "ወደ ዋናው ይዘት ይለፉ",
  nav: {
    cinema: "ሲኒማ",
    gym: "ጂም",
    directory: "ማውጫ",
    spaces: "ክፍት ቦታዎች",
    visit: "ይጎብኙን",
    about: "ስለ እኛ",
    contact: "ያግኙን",
    privacy: "ግላዊነት",
  },
  languageName: "አማርኛ",
  otherLanguage: "English",
  home: {
    heading: "ሲኒማ፣ ጂም እና ንግድ በአንድ ቦታ",
    intro: "ፊልም ይፈልጉ፣ አዶት ጂምን ይጎብኙ፣ እዚህ ያሉ ንግዶችን ያግኙ ወይም ስለ ንግድ ቦታ ይጠይቁ።",
    featured: "አሁን የሚገኙ",
    viewAll: "ሁሉንም ቦታዎች ይመልከቱ",
  },
  placeholder: {
    body: "ይህ ገጽ በመዘጋጀት ላይ ነው። እባክዎ በቅርቡ ተመልሰው ይመልከቱ።",
  },
  spaces: {
    heading: "ክፍት ቦታዎች",
    intro: "በአሁኑ ጊዜ በአዶት ኮምፕሌክስ የሚገኙ የንግድ ክፍሎች።",
    floor: "ፎቅ",
    category: "ምድብ",
    minArea: "ዝቅተኛ ስፋት (ካሬ ሜትር)",
    maxArea: "ከፍተኛ ስፋት (ካሬ ሜትር)",
    any: "ማንኛውም",
    apply: "ማጣሪያ ተግብር",
    clear: "ማጣሪያ አጽዳ",
    noUnitsHeading: "በአሁኑ ጊዜ ክፍት ቦታ የለም",
    noUnitsBody: "የሚፈልጉትን ይንገሩን፤ ተስማሚ ቦታ ሲገኝ እናገኝዎታለን።",
    noMatchHeading: "ከእነዚህ ማጣሪያዎች ጋር የሚዛመድ ቦታ የለም",
    noMatchBody: "ሌላ ማጣሪያ ይሞክሩ ወይም የሚፈልጉትን ይንገሩን።",
    futureLink: "ፍላጎትዎን ያስመዝግቡ",
    contactForPricing: "ለዋጋ ያግኙን",
    area: "ስፋት",
    rent: "ኪራይ",
    serviceCharge: "የአገልግሎት ክፍያ",
    availableFrom: "የሚገኝበት ቀን",
    permittedUse: "የተፈቀደ አገልግሎት",
    features: "ገጽታዎች",
    reference: "መለያ",
    status: "ሁኔታ",
    enquire: "ስለዚህ ክፍል ይጠይቁ",
    back: "ወደ ክፍት ቦታዎች ይመለሱ",
    unavailableHeading: "ይህ ክፍል ከአሁን በኋላ አይገኝም",
    unavailableBody: "አሁን የሚገኙ ቦታዎችን ይመልከቱ ወይም የሚፈልጉትን ይንገሩን።",
    browse: "ክፍት ቦታዎችን ይመልከቱ",
  },
  availability: { available: "ይገኛል", under_discussion: "በውይይት ላይ", leased: "ተከራይቷል" },
  billing: { monthly: "በወር", quarterly: "በሩብ ዓመት", annual: "በዓመት" },
  form: {
    unitHeading: "ስለዚህ ክፍል ይጠይቁ",
    futureHeading: "የወደፊት ቦታ ጥያቄ",
    futureIntro: "የሚፈልጉትን ይንገሩን፤ የኪራይ ቡድናችን ያገኝዎታል።",
    enquiringAbout: "የሚጠይቁት ስለ",
    name: "ሙሉ ስም",
    phone: "ስልክ ቁጥር",
    phoneHint: "ለምሳሌ 0911 234 567 ወይም +251 911 234 567",
    intendedUse: "የታሰበው የንግድ ዓይነት ወይም አገልግሎት",
    message: "ጥያቄዎ ወይም ፍላጎትዎ",
    email: "ኢሜይል",
    company: "የድርጅት ስም",
    desiredArea: "የሚፈለገው ግምታዊ ስፋት",
    preferredDate: "ለመጎብኘት የሚመርጡት ቀን",
    preferredDateHint: "ይህ ጥያቄ ብቻ ነው። ቡድናችን ጉብኝቱን ያረጋግጣል።",
    contactMethod: "የሚመርጡት የመገናኛ መንገድ",
    noPreference: "ምርጫ የለም",
    methods: { phone: "ስልክ", email: "ኢሜይል", whatsapp: "ዋትስአፕ" },
    optional: "አማራጭ",
    notice: "መረጃዎን የምንጠቀመው ለዚህ ጥያቄ ምላሽ ለመስጠት ብቻ ነው።",
    privacyLink: "የግላዊነት ማስታወቂያችንን ያንብቡ",
    marketing: "ከአዶት ኮምፕሌክስ ዜናዎችንና ቅናሾችን ላኩልኝ።",
    submit: "ጥያቄ ላክ",
    sending: "በመላክ ላይ…",
    errorSummary: "እባክዎ ምልክት የተደረገባቸውን መስኮች ያረጋግጡ።",
    errors: {
      name: "ስምዎን ያስገቡ።",
      phone: "ትክክለኛ ስልክ ቁጥር ያስገቡ።",
      intendedUse: "የታሰበውን የንግድ ዓይነት ወይም አገልግሎት ይንገሩን።",
      message: "ጥያቄዎን ወይም ፍላጎትዎን ያስገቡ።",
      email: "ትክክለኛ የኢሜይል አድራሻ ያስገቡ።",
      preferredDate: "ትክክለኛ ቀን ያስገቡ።",
      company: "የድርጅት ስም በጣም ረጅም ነው።",
      desiredArea: "የስፋት መግለጫው በጣም ረጅም ነው።",
    },
    failed: "ጥያቄዎ መላክ አልተቻለም። መረጃዎ አልጠፋም፤ እባክዎ እንደገና ይሞክሩ።",
    rateLimited: "ከዚህ ግንኙነት ብዙ ጥያቄዎች ተልከዋል። እባክዎ ቆይተው ይሞክሩ።",
    staleHeading: "ይህ ክፍል አሁን አይገኝም",
    staleBody: "ጥያቄዎ አልተላከም። እንደ አጠቃላይ ጥያቄ መላክ ይችላሉ፤ መረጃዎ ይቀመጣል።",
    staleSwitch: "እንደ አጠቃላይ ጥያቄ ይቀጥሉ",
    successHeading: "እናመሰግናለን። ጥያቄዎ ደርሶናል።",
    successReference: "የመለያ ቁጥርዎ",
    successUnit: "ክፍል",
    successNext: "የኪራይ ቡድናችን ያገኝዎታል። ይህ ጥያቄ ክፍሉን አያስይዝም፣ ጉብኝትንም አያረጋግጥም።",
  },
  notFound: { heading: "ገጹ አልተገኘም", body: "ይህ ገጽ የለም።", home: "ወደ መነሻ ገጽ ይሂዱ" },
};

const dictionaries: Record<Locale, Dictionary> = { en, am };

// Pages render alongside the layout's locale check, so they can briefly see an invalid locale before the 404.
export function dictionary(locale: Locale) {
  return dictionaries[locale] ?? en;
}

/** Prefers the Amharic value and falls back to English, tagging the language for screen readers. */
export function pick(locale: Locale, enValue: string, amValue: string) {
  if (locale === "am" && amValue) return { text: amValue, lang: "am" };
  return { text: enValue, lang: "en" };
}

export function formatNumber(locale: Locale, value: string | number) {
  return new Intl.NumberFormat(locale === "am" ? "am-ET" : "en-GB").format(Number(value));
}

export function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", {
    dateStyle: "long",
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date(`${value}T12:00:00+03:00`));
}
