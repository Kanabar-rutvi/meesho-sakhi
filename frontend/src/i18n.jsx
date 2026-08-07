import React, { createContext, useContext, useState } from 'react';

// ─── Language strings ─────────────────────────────────────────────────────────
const STRINGS = {
  en: {
    appName: 'Meesho Sakhi',
    tagline: 'Your Autonomous Shopping Companion',
    askSakhi: 'Ask Sakhi',
    startShopping: '✨ Start Shopping',
    agentsPlanning: '⚙️ Agents Planning...',
    reset: 'Reset',
    suggestions: 'Suggestions',
    ctrlEnter: 'Press Ctrl+Enter to submit',
    readyToShop: 'Ready to plan your shopping',
    agentsWorking: 'Agents are working...',
    login: 'Login',
    signUp: 'Sign Up',
    home: 'Home',
    wishlist: 'Wishlist',
    history: 'History',
    profile: 'Profile',
    dashboard: 'Dashboard',
    trustScore: 'Trust Score',
    cartHealth: 'Cart Health',
    whySakhiPicked: 'Why Sakhi picked this',
    smartCart: '🛍️ Smart Cart',
    shareList: 'Share List',
    refineWithSakhi: 'Refine with Sakhi',
    askMeToChange: 'Ask me to change, swap, or add items',
    heroBadge: '8-Agent AI Pipeline · Built for Bharat',
    heroTitleP1: 'Shopping starts with',
    heroTitleP2: 'a goal, not a search.',
    heroSubtitle: 'Tell Sakhi what you\'re trying to accomplish. Our agentic AI understands your context, plans your budget, and curates the perfect cart — in real time.',
    startWithSakhi: 'Start with Sakhi',
    simpleProcess: 'Simple 3-Step Process',
    howSakhiWorks: 'How Sakhi works',
    step1Title: 'Tell us your goal',
    step1Desc: 'Share what you\'re setting up and your total budget. No need to browse — just describe.',
    step2Title: 'Agents plan & search',
    step2Desc: 'Our 8-agent pipeline filters, ranks, and selects the best items — live, in real time.',
    step3Title: 'Review & shop',
    step3Desc: 'Review your trust-scored cart, refine with chat, then shop directly on Meesho.',
    builtForBharat: 'Built for Bharat. Powered by AI. Delivered with ❤️',
    goodEvening: 'Good evening',
    dashTitle: 'Ready to shop smart today?',
    dashDesc: 'Tell Sakhi what you need. Our 8-agent AI will plan, rank, and curate the perfect budget-optimized cart — in real time.',
    startNewGoal: 'Start New Goal',
    plansCreated: 'Plans Created',
    itemsSaved: 'Items Saved',
    totalSaved: 'Total Saved',
    recentPlans: 'Recent Plans',
    viewAll: 'View all',
    quickActions: 'Quick Actions',
    sakhiTip: "Sakhi's Tip",
    sakhiTipText: "💡 Always check the Trust Score before buying. Items with 85%+ trust have verified reviews."
  },
  hi: {
    appName: 'मीशो सखी',
    tagline: 'आपकी स्वायत्त खरीदारी साथी',
    askSakhi: 'सखी से पूछें',
    startShopping: '✨ खरीदारी शुरू करें',
    agentsPlanning: '⚙️ एजेंट योजना बना रहे हैं...',
    reset: 'रीसेट',
    suggestions: 'सुझाव',
    ctrlEnter: 'सबमिट करने के लिए Ctrl+Enter दबाएं',
    readyToShop: 'खरीदारी की योजना बनाने के लिए तैयार',
    agentsWorking: 'एजेंट काम कर रहे हैं...',
    login: 'लॉग इन',
    signUp: 'साइन अप',
    home: 'होम',
    wishlist: 'विशलिस्ट',
    history: 'इतिहास',
    profile: 'प्रोफ़ाइल',
    dashboard: 'डैशबोर्ड',
    trustScore: 'विश्वास स्कोर',
    cartHealth: 'कार्ट स्वास्थ्य',
    whySakhiPicked: 'सखी ने यह क्यों चुना',
    smartCart: '🛍️ स्मार्ट कार्ट',
    shareList: 'सूची शेयर करें',
    refineWithSakhi: 'सखी के साथ परिष्कृत करें',
    askMeToChange: 'मुझसे बदलने, स्वैप करने या आइटम जोड़ने के लिए कहें',
    heroBadge: '8-एजेंट एआई पाइपलाइन · भारत के लिए निर्मित',
    heroTitleP1: 'खरीदारी शुरू होती है',
    heroTitleP2: 'एक लक्ष्य के साथ, खोज नहीं।',
    heroSubtitle: 'सखी को बताएं कि आप क्या हासिल करना चाहते हैं। हमारा एआई आपके संदर्भ को समझता है, बजट की योजना बनाता है, और सही कार्ट तैयार करता है।',
    startWithSakhi: 'सखी के साथ शुरू करें',
    simpleProcess: 'सरल 3-चरणीय प्रक्रिया',
    howSakhiWorks: 'सखी कैसे काम करती है',
    step1Title: 'अपना लक्ष्य बताएं',
    step1Desc: 'बताएं कि आप क्या सेट अप कर रहे हैं और आपका कुल बजट क्या है।',
    step2Title: 'एजेंट योजना और खोज',
    step2Desc: 'हमारा 8-एजेंट पाइपलाइन सबसे अच्छे आइटम को फ़िल्टर और रैंक करता है — वास्तविक समय में।',
    step3Title: 'समीक्षा करें और खरीदारी करें',
    step3Desc: 'अपने ट्रस्ट-स्कोर वाले कार्ट की समीक्षा करें, और मीशो पर सीधे खरीदारी करें।',
    builtForBharat: 'भारत के लिए निर्मित। एआई द्वारा संचालित। ❤️ के साथ वितरित',
    goodEvening: 'शुभ संध्या',
    dashTitle: 'क्या आज आप स्मार्ट खरीदारी के लिए तैयार हैं?',
    dashDesc: 'सखी को बताएं कि आपको क्या चाहिए। हमारी 8-एजेंट एआई योजना बनाएगी और सही बजट-अनुकूलित कार्ट तैयार करेगी।',
    startNewGoal: 'नया लक्ष्य शुरू करें',
    plansCreated: 'बनाई गई योजनाएं',
    itemsSaved: 'सहेजे गए आइटम',
    totalSaved: 'कुल बचत',
    recentPlans: 'हाल की योजनाएं',
    viewAll: 'सभी देखें',
    quickActions: 'त्वरित कार्रवाई',
    sakhiTip: "सखी की सलाह",
    sakhiTipText: "💡 खरीदने से पहले हमेशा ट्रस्ट स्कोर जांचें।"
  },
  ta: {
    appName: 'மீஷோ சகி',
    tagline: 'உங்கள் தன்னாட்சி கடை தோழர்',
    askSakhi: 'சகியிடம் கேளுங்கள்',
    startShopping: '✨ கடை தொடங்கு',
    agentsPlanning: '⚙️ முகவர்கள் திட்டமிடுகிறார்கள்...',
    reset: 'மீட்டமை',
    suggestions: 'பரிந்துரைகள்',
    ctrlEnter: 'சமர்ப்பிக்க Ctrl+Enter அழுத்தவும்',
    readyToShop: 'கடை திட்டமிட தயார்',
    agentsWorking: 'முகவர்கள் வேலை செய்கிறார்கள்...',
    login: 'உள்நுழை',
    signUp: 'பதிவு செய்',
    home: 'முகப்பு',
    wishlist: 'விரும்பியவை',
    history: 'வரலாறு',
    profile: 'சுயவிவரம்',
    dashboard: 'டாஷ்போர்டு',
    trustScore: 'நம்பிக்கை மதிப்பெண்',
    cartHealth: 'கார்ட் ஆரோக்கியம்',
    whySakhiPicked: 'சகி ஏன் இதை தேர்ந்தெடுத்தாள்',
    smartCart: '🛍️ ஸ்மார்ட் கார்ட்',
    shareList: 'பட்டியல் பகிர்',
    refineWithSakhi: 'சகியுடன் செம்மைப்படுத்து',
    askMeToChange: 'மாற்ற, மாற்றிட அல்லது பொருட்கள் சேர்க்க என்னிடம் கேளுங்கள்',
    heroBadge: '8-ஏஜென்ட் AI பைப்லைன் · பாரதத்திற்காக',
    heroTitleP1: 'ஷாப்பிங் தொடங்குகிறது',
    heroTitleP2: 'ஒரு இலக்குடன், தேடல் அல்ல.',
    heroSubtitle: 'நீங்கள் என்ன சாதிக்க விரும்புகிறீர்கள் என்று சகியிடம் சொல்லுங்கள். எங்கள் AI சரியான கார்ட்டை உருவாக்குகிறது.',
    startWithSakhi: 'சகியுடன் தொடங்குங்கள்',
    simpleProcess: 'எளிய 3-படி செயல்முறை',
    howSakhiWorks: 'சகி எப்படி வேலை செய்கிறாள்',
    step1Title: 'உங்கள் இலக்கை சொல்லுங்கள்',
    step1Desc: 'உங்கள் பட்ஜெட் மற்றும் தேவைகளை விவரிக்கவும்.',
    step2Title: 'முகவர்கள் தேடல்',
    step2Desc: 'சிறந்த தயாரிப்புகளை எங்கள் AI வடிகட்டி தேர்ந்தெடுக்கிறது.',
    step3Title: 'மதிப்பாய்வு செய்து வாங்கவும்',
    step3Desc: 'கார்ட்டை மதிப்பாய்வு செய்து, மீஷோவில் வாங்கவும்.',
    builtForBharat: 'பாரதத்திற்காக உருவாக்கப்பட்டது. AI ஆல் இயக்கப்படுகிறது. ❤️ உடன்',
    goodEvening: 'மாலை வணக்கம்',
    dashTitle: 'இன்று ஸ்மார்ட்டாக ஷாப்பிங் செய்ய தயாரா?',
    dashDesc: 'உங்களுக்கு என்ன தேவை என்பதை சகியிடம் சொல்லுங்கள். எங்கள் AI சரியான பட்ஜெட்டைத் திட்டமிடும்.',
    startNewGoal: 'புதிய இலக்கைத் தொடங்கு',
    plansCreated: 'உருவாக்கப்பட்ட திட்டங்கள்',
    itemsSaved: 'சேமிக்கப்பட்டவை',
    totalSaved: 'மொத்த சேமிப்பு',
    recentPlans: 'சமீபத்திய திட்டங்கள்',
    viewAll: 'அனைத்தையும் காண்க',
    quickActions: 'விரைவான செயல்கள்',
    sakhiTip: "சகியின் குறிப்பு",
    sakhiTipText: "💡 வாங்குவதற்கு முன் எப்போதும் நம்பிக்கை மதிப்பெண்ணைச் சரிபார்க்கவும்."
  },
  bn: {
    appName: 'মীশো সখী',
    tagline: 'আপনার স্বায়ত্তশাসিত কেনাকাটা সঙ্গী',
    askSakhi: 'সখীকে জিজ্ঞেস করুন',
    startShopping: '✨ কেনাকাটা শুরু করুন',
    agentsPlanning: '⚙️ এজেন্টরা পরিকল্পনা করছে...',
    reset: 'রিসেট',
    suggestions: 'পরামর্শ',
    ctrlEnter: 'জমা দিতে Ctrl+Enter চাপুন',
    readyToShop: 'কেনাকাটার পরিকল্পনার জন্য প্রস্তুত',
    agentsWorking: 'এজেন্টরা কাজ করছে...',
    login: 'লগইন',
    signUp: 'সাইন আপ',
    home: 'হোম',
    wishlist: 'উইশলিস্ট',
    history: 'ইতিহাস',
    profile: 'প্রোফাইল',
    dashboard: 'ড্যাশবোর্ড',
    trustScore: 'বিশ্বাস স্কোর',
    cartHealth: 'কার্ট স্বাস্থ্য',
    whySakhiPicked: 'সখী কেন এটি বেছে নিল',
    smartCart: '🛍️ স্মার্ট কার্ট',
    shareList: 'তালিকা শেয়ার করুন',
    refineWithSakhi: 'সখীর সাথে পরিমার্জন করুন',
    askMeToChange: 'পরিবর্তন, অদলবদল বা আইটেম যোগ করতে আমাকে বলুন',
    heroBadge: '৮-এজেন্ট এআই পাইপলাইন · ভারতের জন্য তৈরি',
    heroTitleP1: 'কেনাকাটা শুরু হয়',
    heroTitleP2: 'একটি লক্ষ্য দিয়ে, অনুসন্ধান নয়।',
    heroSubtitle: 'সখীকে বলুন আপনি কী অর্জন করতে চান। আমাদের এআই সঠিক কার্ট তৈরি করে।',
    startWithSakhi: 'সখীর সাথে শুরু করুন',
    simpleProcess: 'সহজ ৩-ধাপ প্রক্রিয়া',
    howSakhiWorks: 'সখী কীভাবে কাজ করে',
    step1Title: 'আপনার লক্ষ্য বলুন',
    step1Desc: 'আপনার বাজেট এবং প্রয়োজনীয়তা বর্ণনা করুন।',
    step2Title: 'এজেন্ট অনুসন্ধান',
    step2Desc: 'সেরা পণ্যগুলি আমাদের এআই ফিল্টার করে নির্বাচন করে।',
    step3Title: 'পর্যালোচনা করুন এবং কিনুন',
    step3Desc: 'কার্ট পর্যালোচনা করুন এবং মিশোতে কিনুন।',
    builtForBharat: 'ভারতের জন্য তৈরি। এআই দ্বারা চালিত। ❤️ দিয়ে',
    goodEvening: 'শুভ সন্ধ্যা',
    dashTitle: 'আজ স্মার্ট কেনাকাটা করতে প্রস্তুত?',
    dashDesc: 'সখীকে বলুন আপনার কী প্রয়োজন। আমাদের এআই নিখুঁত বাজেট-বান্ধব কার্ট তৈরি করবে।',
    startNewGoal: 'নতুন লক্ষ্য শুরু করুন',
    plansCreated: 'তৈরি পরিকল্পনা',
    itemsSaved: 'সংরক্ষিত আইটেম',
    totalSaved: 'মোট সঞ্চয়',
    recentPlans: 'সাম্প্রতিক পরিকল্পনা',
    viewAll: 'সব দেখুন',
    quickActions: 'দ্রুত পদক্ষেপ',
    sakhiTip: "সখীর টিপ",
    sakhiTipText: "💡 কেনার আগে সর্বদা ট্রাস্ট স্কোর পরীক্ষা করুন।"
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────
const LangContext = createContext({ lang: 'en', t: k => k, setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(
    localStorage.getItem('sakhi_lang') || 'en'
  );

  const t = (key) => STRINGS[lang]?.[key] ?? STRINGS['en']?.[key] ?? key;

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('sakhi_lang', newLang);
  };

  return (
    <LangContext.Provider value={{ lang, t, setLang: handleSetLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

// ─── Language Switcher Component ──────────────────────────────────────────────
const LANG_OPTIONS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা', flag: '🇮🇳' },
];

export function LanguageSwitcher({ style = {} }) {
  const { lang, setLang } = useLang();
  const current = LANG_OPTIONS.find(l => l.code === lang) || LANG_OPTIONS[0];

  return (
    <select
      value={lang}
      onChange={e => setLang(e.target.value)}
      style={{
        padding: '6px 12px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid rgba(255,255,255,0.3)',
        background: 'rgba(255,255,255,0.12)',
        color: 'white',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        outline: 'none',
        backdropFilter: 'blur(4px)',
        ...style
      }}
    >
      {LANG_OPTIONS.map(l => (
        <option key={l.code} value={l.code} style={{ background: '#1a0533', color: 'white' }}>
          {l.flag} {l.label}
        </option>
      ))}
    </select>
  );
}
