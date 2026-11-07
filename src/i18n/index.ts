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
    headingLead: "Cinema, fitness and business",
    headingAccent: "under one roof",
    intro: "Find a film, visit Adot Gym, discover the businesses here, or enquire about a commercial space.",
    featured: "Available now",
    viewAll: "View all spaces",
  },
  placeholder: {
    body: "This page is being prepared. Please check back soon.",
  },
  // Only facts the site can stand behind. Hours, address, phone numbers, showtimes and prices
  // stay out until Adot supplies them, because Ask Adot and visitors treat this copy as official.
  pages: {
    cinema: {
      lead: "Adot Cinema Theater is the entertainment heart of Adot Complex: an auditorium with rows of red seats, built for a night out at the films.",
      blocks: [
        {
          heading: "A night at the cinema",
          body: [
            "Come for a film after work, make an evening of it with friends and family, or pair a screening with a visit to the gym and the businesses in the building.",
            "Because the cinema sits inside Adot Complex, everything you need for an evening out is under one roof.",
          ],
        },
        {
          heading: "Showtimes and tickets",
          body: [
            "Showtimes and ticket prices aren't on this website yet. Until they are, please ask at the cinema or send us an enquiry and our team will reply.",
          ],
        },
      ],
      action: "Ask about the cinema",
    },
    gym: {
      lead: "Adot Gymnasium is a fitness club for all, right inside Adot Complex.",
      blocks: [
        {
          heading: "A fitness club for all",
          body: [
            "Whether you're just starting out or keeping up a long-standing routine, Adot Gymnasium welcomes every level of fitness.",
            "Training in the same building where you work, shop or watch a film makes it easier to fit exercise into your week and keep it there.",
          ],
        },
        {
          heading: "Memberships and hours",
          body: [
            "Membership options, classes and opening hours will be published here soon. To ask about joining now, send us an enquiry and our team will get back to you.",
          ],
        },
      ],
      action: "Ask about membership",
    },
    directory: {
      lead: "Adot Complex brings shops, services and offices together in one building.",
      blocks: [
        {
          heading: "Businesses at Adot",
          body: [
            "This directory will list the businesses operating at Adot Complex, with what each one offers and where to find it in the building. Tenant listings are being prepared.",
          ],
        },
        {
          heading: "Bring your business to Adot",
          body: [
            "Visitors come to the building for the cinema and the gym, so the businesses here have a ready audience.",
            "Browse the commercial units available now to compare floors, sizes and terms. If nothing fits yet, tell us what you need and we'll contact you when a suitable space opens up.",
          ],
        },
      ],
      action: "See available spaces",
    },
    visit: {
      lead: "Plan your visit to Adot Complex, home to Adot Cinema Theater, Adot Gymnasium and a range of local businesses.",
      blocks: [
        {
          heading: "Finding us",
          body: [
            "Adot Complex is in Addis Ababa. Look for the building's curved glass facade and the Adot Multiplex street entrance.",
            "A full address, map and directions will be added here soon.",
          ],
        },
        {
          heading: "Opening hours",
          body: [
            "The cinema, the gym and each business keep their own hours. These will be published here soon. In the meantime, our team can answer your questions.",
          ],
        },
        {
          heading: "Viewing a commercial space",
          body: [
            "If you're coming to see a unit, request a viewing through the enquiry form. Our leasing team will confirm the date and time with you before your visit.",
          ],
        },
      ],
      action: "Request a viewing",
    },
    about: {
      lead: "Adot Complex is a mixed-use building in Addis Ababa where cinema, fitness and business come together under one roof.",
      blocks: [
        {
          heading: "One building, many reasons to visit",
          body: [
            "Adot Cinema Theater hosts film screenings, Adot Gymnasium runs a fitness club for all, and the building's commercial spaces are home to shops, services and offices.",
            "Entertainment, wellbeing and everyday business in one place means visitors can do more in a single trip.",
          ],
        },
        {
          heading: "A place to grow a business",
          body: [
            "The cinema and the gym bring people into the building, and that gives the businesses here a natural audience.",
            "We lease commercial units directly and publish current availability on this website, so you can see what's open before you enquire.",
          ],
        },
        {
          heading: "In English and Amharic",
          body: ["This website and our team serve visitors in both English and Amharic."],
        },
      ],
      action: "Get in touch",
    },
    contact: {
      lead: "Questions about leasing, the cinema, the gym or anything else at Adot Complex? We're here to help.",
      blocks: [
        {
          heading: "Send us an enquiry",
          body: [
            "The quickest way to reach us is the enquiry form. Tell us what you need and how you'd like us to reply: by phone, email or WhatsApp.",
            "Every enquiry gets a reference number, and our team will contact you.",
          ],
        },
        {
          heading: "Ask Adot",
          body: [
            "For quick answers about the complex and the spaces available, try Ask Adot, the assistant on this website. If you'd like a call back, use \"Leave your details\" and your message goes straight to our staff.",
          ],
        },
      ],
      action: "Send an enquiry",
    },
    privacy: {
      lead: "This notice explains what information Adot Complex collects through this website and how we use it.",
      blocks: [
        {
          heading: "Enquiries",
          body: [
            "When you send an enquiry, we collect your name, phone number and message. If you choose to provide them, we also collect your email address, company name, the area you need, a preferred viewing date and how you'd like to be contacted.",
            "We use these details only to respond to your enquiry. They are seen by Adot staff in our internal system.",
          ],
        },
        {
          heading: "News and offers",
          body: [
            "We send news and offers only if you tick the box to agree. You can ask us to stop at any time.",
          ],
        },
        {
          heading: "Ask Adot",
          body: [
            "Conversations with Ask Adot are saved and can be read by Adot staff, which helps us improve our answers. The assistant is powered by Google, which processes what you type, so please don't share private details in the chat.",
            "Saved conversations are deleted automatically after a set period. Details you send through \"Leave your details\" go straight to our team and are not passed to the AI.",
          ],
        },
        {
          heading: "Your choices",
          body: [
            "To ask what information we hold about you, or to have it corrected or deleted, contact us through the enquiry form.",
          ],
        },
      ],
      action: "Contact us",
    },
  },
  assistant: {
    name: "Ask Adot",
    disclaimer:
      "AI assistant. It uses published site information and can be incomplete. Chats are saved, read by Adot staff and processed by Google, so please don't share private details here.",
    greeting: "Hello! Ask me about Adot Complex and the commercial spaces available.",
    placeholder: "Type your question",
    send: "Send",
    close: "Close Ask Adot",
    thinking: "Checking…",
    fallback: "Ask Adot is temporarily unavailable. The website and forms still work:",
    rateLimited: "That's a lot of questions at once. Please wait a few minutes and try again.",
    enquire: "Enquire",
    suggestions: ["What spaces are available?", "How do I enquire about a space?"],
    leadOpen: "Leave your details",
    leadIntro: "Adot staff will contact you. These details go straight to our team, not to the AI.",
    leadName: "Your name",
    leadPhone: "Phone number",
    leadNeed: "What are you looking for?",
    leadSend: "Send to Adot staff",
    leadCancel: "Back to chat",
    leadSaved: "Thank you. Adot staff will contact you. Your reference is",
    leadInvalid: "Please check your name, phone number and what you're looking for.",
    leadFailed: "That didn't send. Please try again, or use the enquiry form.",
  },
  images: {
    auditoriumFront: "Rows of red seats facing the stage in the Adot cinema auditorium",
    auditoriumAngled: "Red seats in the Adot cinema auditorium, seen from the side",
    gym: "Adot Gymnasium entrance with the gold logo on the wall",
    exterior: "Street entrance to the Adot Multiplex",
    facade: "The curved glass facade of the Adot building",
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
    headingLead: "ሲኒማ፣ ጂም እና ንግድ",
    headingAccent: "በአንድ ቦታ",
    intro: "ፊልም ይፈልጉ፣ አዶት ጂምን ይጎብኙ፣ እዚህ ያሉ ንግዶችን ያግኙ ወይም ስለ ንግድ ቦታ ይጠይቁ።",
    featured: "አሁን የሚገኙ",
    viewAll: "ሁሉንም ቦታዎች ይመልከቱ",
  },
  placeholder: {
    body: "ይህ ገጽ በመዘጋጀት ላይ ነው። እባክዎ በቅርቡ ተመልሰው ይመልከቱ።",
  },
  pages: {
    cinema: {
      lead: "አዶት ሲኒማ ቴአትር የአዶት ኮምፕሌክስ የመዝናኛ ማዕከል ነው፤ ቀይ መቀመጫዎች የተደረደሩበት፣ ለፊልም ምሽት የተዘጋጀ አዳራሽ።",
      blocks: [
        {
          heading: "የሲኒማ ምሽት",
          body: [
            "ከሥራ በኋላ ፊልም ለማየት ይምጡ፣ ከጓደኞችና ከቤተሰብ ጋር ምሽቱን ያሳልፉ፣ ወይም ፊልምን ከጂም እና በሕንፃው ካሉ ንግዶች ጉብኝት ጋር ያጣምሩ።",
            "ሲኒማው በአዶት ኮምፕሌክስ ውስጥ ስለሚገኝ ለምሽት መዝናኛ የሚያስፈልግዎ ሁሉ በአንድ ቦታ ያገኛሉ።",
          ],
        },
        {
          heading: "የፊልም ሰዓቶችና ትኬቶች",
          body: [
            "የፊልም ሰዓቶችና የትኬት ዋጋዎች ገና በዚህ ድረ-ገጽ ላይ አልወጡም። እስኪወጡ ድረስ እባክዎ በሲኒማው ይጠይቁ ወይም ጥያቄ ይላኩልን፤ ቡድናችን ምላሽ ይሰጣል።",
          ],
        },
      ],
      action: "ስለ ሲኒማው ይጠይቁ",
    },
    gym: {
      lead: "አዶት ጂምናዚየም በአዶት ኮምፕሌክስ ውስጥ የሚገኝ ለሁሉም የሆነ የአካል ብቃት ክለብ ነው።",
      blocks: [
        {
          heading: "ለሁሉም የሆነ የአካል ብቃት ክለብ",
          body: [
            "ገና እየጀመሩም ይሁን የቆየ ልምድዎን እያስቀጠሉ፣ አዶት ጂምናዚየም ሁሉንም የአካል ብቃት ደረጃዎች ይቀበላል።",
            "በሚሠሩበት፣ በሚገበዩበት ወይም ፊልም በሚያዩበት ሕንፃ ውስጥ ማሠልጠን የአካል እንቅስቃሴን በሳምንትዎ ውስጥ ለማካተትና ለማስቀጠል ይረዳል።",
          ],
        },
        {
          heading: "አባልነትና የሥራ ሰዓት",
          body: [
            "የአባልነት አማራጮች፣ ክፍለ ጊዜዎችና የሥራ ሰዓቶች በቅርቡ እዚህ ይወጣሉ። አሁን ለመመዝገብ ከፈለጉ ጥያቄ ይላኩልን፤ ቡድናችን ያገኝዎታል።",
          ],
        },
      ],
      action: "ስለ አባልነት ይጠይቁ",
    },
    directory: {
      lead: "አዶት ኮምፕሌክስ ሱቆችን፣ አገልግሎቶችንና ቢሮዎችን በአንድ ሕንፃ ያሰባስባል።",
      blocks: [
        {
          heading: "በአዶት ያሉ ንግዶች",
          body: [
            "ይህ ማውጫ በአዶት ኮምፕሌክስ የሚሠሩ ንግዶችን፣ እያንዳንዱ የሚሰጠውን አገልግሎትና በሕንፃው ውስጥ የሚገኝበትን ቦታ ይዘረዝራል። የተከራዮች ዝርዝር በመዘጋጀት ላይ ነው።",
          ],
        },
        {
          heading: "ንግድዎን ወደ አዶት ያምጡ",
          body: [
            "ጎብኚዎች ለሲኒማውና ለጂሙ ወደ ሕንፃው ስለሚመጡ፣ እዚህ ያሉ ንግዶች ዝግጁ ደንበኛ አላቸው።",
            "ፎቅን፣ ስፋትንና ውሎችን ለማነጻጸር አሁን የሚገኙ የንግድ ክፍሎችን ይመልከቱ። ተስማሚ ቦታ ከሌለ የሚፈልጉትን ይንገሩን፤ ቦታ ሲከፈት እናገኝዎታለን።",
          ],
        },
      ],
      action: "ክፍት ቦታዎችን ይመልከቱ",
    },
    visit: {
      lead: "የአዶት ሲኒማ ቴአትር፣ የአዶት ጂምናዚየምና የተለያዩ ንግዶች መገኛ የሆነውን አዶት ኮምፕሌክስን ለመጎብኘት ያቅዱ።",
      blocks: [
        {
          heading: "እኛን ለማግኘት",
          body: [
            "አዶት ኮምፕሌክስ በአዲስ አበባ ይገኛል። የሕንፃውን ጠመዝማዛ የመስታወት ገጽታና የአዶት መልቲፕሌክስ የመንገድ መግቢያን ይፈልጉ።",
            "ሙሉ አድራሻ፣ ካርታና አቅጣጫ በቅርቡ እዚህ ይጨመራሉ።",
          ],
        },
        {
          heading: "የሥራ ሰዓት",
          body: [
            "ሲኒማው፣ ጂሙና እያንዳንዱ ንግድ የራሳቸው የሥራ ሰዓት አላቸው። እነዚህ በቅርቡ እዚህ ይወጣሉ፤ እስከዚያው ቡድናችን ጥያቄዎን ይመልሳል።",
          ],
        },
        {
          heading: "የንግድ ቦታ ለመጎብኘት",
          body: [
            "ክፍል ለማየት የሚመጡ ከሆነ በመጠየቂያ ቅጹ ጉብኝት ይጠይቁ። የኪራይ ቡድናችን ከጉብኝትዎ በፊት ቀኑንና ሰዓቱን ያረጋግጥልዎታል።",
          ],
        },
      ],
      action: "ጉብኝት ይጠይቁ",
    },
    about: {
      lead: "አዶት ኮምፕሌክስ በአዲስ አበባ የሚገኝ፣ ሲኒማን፣ የአካል ብቃትንና ንግድን በአንድ ጣሪያ ሥር ያሰባሰበ ሁለገብ ሕንፃ ነው።",
      blocks: [
        {
          heading: "አንድ ሕንፃ፣ ብዙ የመጎብኛ ምክንያቶች",
          body: [
            "አዶት ሲኒማ ቴአትር ፊልሞችን ያሳያል፣ አዶት ጂምናዚየም ለሁሉም የሆነ የአካል ብቃት ክለብ ያካሂዳል፣ የሕንፃው የንግድ ቦታዎችም የሱቆች፣ የአገልግሎቶችና የቢሮዎች መገኛ ናቸው።",
            "መዝናኛ፣ ጤናና የዕለት ተዕለት ንግድ በአንድ ቦታ መኖራቸው ጎብኚዎች በአንድ ጉዞ ብዙ እንዲያከናውኑ ያስችላል።",
          ],
        },
        {
          heading: "ንግድ የሚያድግበት ቦታ",
          body: [
            "ሲኒማውና ጂሙ ሰዎችን ወደ ሕንፃው ያመጣሉ፤ ይህም እዚህ ላሉ ንግዶች ተፈጥሯዊ ደንበኛ ይፈጥራል።",
            "የንግድ ክፍሎችን በቀጥታ እናከራያለን፤ የአሁኑን ክፍት ቦታ በዚህ ድረ-ገጽ ስለምናወጣ ከመጠየቅዎ በፊት ምን እንደሚገኝ ማየት ይችላሉ።",
          ],
        },
        {
          heading: "በእንግሊዝኛና በአማርኛ",
          body: ["ይህ ድረ-ገጽና ቡድናችን ጎብኚዎችን በእንግሊዝኛና በአማርኛ ያገለግላሉ።"],
        },
      ],
      action: "ያግኙን",
    },
    contact: {
      lead: "ስለ ኪራይ፣ ስለ ሲኒማው፣ ስለ ጂሙ ወይም በአዶት ኮምፕሌክስ ስላለ ማንኛውም ነገር ጥያቄ አለዎት? ልንረዳዎ ዝግጁ ነን።",
      blocks: [
        {
          heading: "ጥያቄ ይላኩልን",
          body: [
            "እኛን ለማግኘት ፈጣኑ መንገድ የመጠየቂያ ቅጹ ነው። የሚፈልጉትንና እንዴት እንድናገኝዎ እንደሚፈልጉ ይንገሩን፤ በስልክ፣ በኢሜይል ወይም በዋትስአፕ።",
            "እያንዳንዱ ጥያቄ የመለያ ቁጥር ያገኛል፤ ቡድናችንም ያገኝዎታል።",
          ],
        },
        {
          heading: "Ask Adot",
          body: [
            "ስለ ኮምፕሌክሱና ስለሚገኙ ቦታዎች ፈጣን መልስ ለማግኘት በዚህ ድረ-ገጽ ያለውን Ask Adot ረዳት ይሞክሩ። እንድንደውልልዎ ከፈለጉ «መረጃዎን ይተዉ» የሚለውን ይጠቀሙ፤ መልእክትዎ በቀጥታ ወደ ሠራተኞቻችን ይሄዳል።",
          ],
        },
      ],
      action: "ጥያቄ ይላኩ",
    },
    privacy: {
      lead: "ይህ ማስታወቂያ አዶት ኮምፕሌክስ በዚህ ድረ-ገጽ በኩል ምን መረጃ እንደሚሰበስብና እንዴት እንደሚጠቀምበት ያብራራል።",
      blocks: [
        {
          heading: "ጥያቄዎች",
          body: [
            "ጥያቄ ሲልኩ ስምዎን፣ ስልክ ቁጥርዎንና መልእክትዎን እንሰበስባለን። ለማቅረብ ከመረጡ የኢሜይል አድራሻዎን፣ የድርጅትዎን ስም፣ የሚፈልጉትን ስፋት፣ ለመጎብኘት የሚመርጡትን ቀንና የሚመርጡትን የመገናኛ መንገድ እንሰበስባለን።",
            "እነዚህን መረጃዎች የምንጠቀመው ለጥያቄዎ ምላሽ ለመስጠት ብቻ ነው። በውስጣዊ ሥርዓታችን የአዶት ሠራተኞች ያዩዋቸዋል።",
          ],
        },
        {
          heading: "ዜናዎችና ቅናሾች",
          body: ["ዜናዎችንና ቅናሾችን የምንልከው ለመስማማት ሳጥኑን ምልክት ካደረጉ ብቻ ነው። በማንኛውም ጊዜ እንድናቆም መጠየቅ ይችላሉ።"],
        },
        {
          heading: "Ask Adot",
          body: [
            "ከAsk Adot ጋር የሚደረጉ ውይይቶች ይቀመጣሉ፤ መልሶቻችንን ለማሻሻል የአዶት ሠራተኞች ሊያነቧቸው ይችላሉ። ረዳቱ የሚሠራው በGoogle ሲሆን የሚጽፉትን ያስተናግዳል፤ ስለዚህ እባክዎ በውይይቱ ውስጥ የግል መረጃ አያጋሩ።",
            "የተቀመጡ ውይይቶች ከተወሰነ ጊዜ በኋላ በራሳቸው ይሰረዛሉ። በ«መረጃዎን ይተዉ» የሚልኩት መረጃ በቀጥታ ወደ ቡድናችን ይሄዳል እንጂ ወደ AI አይተላለፍም።",
          ],
        },
        {
          heading: "የእርስዎ ምርጫዎች",
          body: ["ስለእርስዎ ምን መረጃ እንደያዝን ለመጠየቅ ወይም እንዲስተካከል ወይም እንዲሰረዝ ለማድረግ በመጠየቂያ ቅጹ ያግኙን።"],
        },
      ],
      action: "ያግኙን",
    },
  },
  assistant: {
    name: "Ask Adot",
    disclaimer: "የAI ረዳት ነው። በድረ-ገጹ ላይ የታተመ መረጃን ይጠቀማል፤ ያልተሟላ ሊሆን ይችላል። ውይይቶች ይቀመጣሉ፣ የአዶት ሠራተኞች ያነቧቸዋል፣ በGoogle ይስተናገዳሉ፤ ስለዚህ እባክዎ እዚህ የግል መረጃ አያጋሩ።",
    greeting: "ሰላም! ስለ አዶት ኮምፕሌክስ እና ስለሚገኙ የንግድ ቦታዎች ይጠይቁኝ።",
    placeholder: "ጥያቄዎን ይጻፉ",
    send: "ላክ",
    close: "Ask Adot ዝጋ",
    thinking: "በማጣራት ላይ…",
    fallback: "Ask Adot ለጊዜው አይገኝም። ድረ-ገጹ እና ቅጾቹ እየሰሩ ናቸው፦",
    rateLimited: "በአንድ ጊዜ ብዙ ጥያቄዎች ቀርበዋል። እባክዎ ጥቂት ደቂቃዎች ቆይተው እንደገና ይሞክሩ።",
    enquire: "ይጠይቁ",
    suggestions: ["ምን ቦታዎች ይገኛሉ?", "ስለ ቦታ እንዴት መጠየቅ እችላለሁ?"],
    leadOpen: "መረጃዎን ይተዉ",
    leadIntro: "የአዶት ሠራተኞች ያነጋግሩዎታል። ይህ መረጃ በቀጥታ ወደ ቡድናችን ይሄዳል እንጂ ወደ AI አይሄድም።",
    leadName: "ስምዎ",
    leadPhone: "ስልክ ቁጥር",
    leadNeed: "ምን ይፈልጋሉ?",
    leadSend: "ለአዶት ሠራተኞች ላክ",
    leadCancel: "ወደ ውይይቱ ተመለስ",
    leadSaved: "እናመሰግናለን። የአዶት ሠራተኞች ያነጋግሩዎታል። የማጣቀሻ ቁጥርዎ፦",
    leadInvalid: "እባክዎ ስምዎን፣ ስልክ ቁጥርዎን እና የሚፈልጉትን ያረጋግጡ።",
    leadFailed: "አልተላከም። እባክዎ እንደገና ይሞክሩ ወይም የመጠየቂያ ቅጹን ይጠቀሙ።",
  },
  images: {
    auditoriumFront: "በአዶት ሲኒማ አዳራሽ ወደ መድረኩ የሚመለከቱ ቀይ መቀመጫዎች",
    auditoriumAngled: "ከጎን የሚታዩ የአዶት ሲኒማ አዳራሽ ቀይ መቀመጫዎች",
    gym: "በግድግዳው ላይ የወርቅ ቀለም አርማ ያለው የአዶት ጂምናዚየም መግቢያ",
    exterior: "የአዶት መልቲፕሌክስ የመንገድ መግቢያ",
    facade: "የአዶት ሕንፃ ጠመዝማዛ የመስታወት ገጽታ",
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
