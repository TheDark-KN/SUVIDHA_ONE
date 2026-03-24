"use client";

/**
 * Internationalization (i18n) - SUVIDHA ONE
 * 
 * Supports 10 Indian languages as per spec
 */

export const SUPPORTED_LANGUAGES = [
  { code: "hi", name: "Hindi", native: "हिंदी", flag: "🇮🇳" },
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

// UI Text translations
export const translations: Record<LanguageCode, Record<string, string>> = {
  hi: {
    // Welcome Screen
    welcome_title: "सुविधा वन में आपका स्वागत है",
    welcome_subtitle: "एक कियोस्क, सभी सेवाएं",
    touch_to_start: "शुरू करने के लिए स्पर्श करें",
    
    // Language Selection
    select_language: "अपनी भाषा चुनें",
    
    // Authentication
    authenticate: "पहचान सत्यापित करें",
    how_to_verify: "आप कैसे सत्यापित करना चाहेंगे?",
    mobile_otp: "मोबाइल ओटीपी",
    aadhaar_biometric: "आधार बायोमेट्रिक",
    scan_qr: "क्यूआर कोड स्कैन करें",
    continue_guest: "अतिथि के रूप में जारी रखें",
    enter_mobile: "अपना मोबाइल नंबर दर्ज करें",
    send_otp: "ओटीपी भेजें",
    enter_otp: "6 अंकों का ओटीपी दर्ज करें",
    verify: "सत्यापित करें",
    resend_otp: "ओटीपी पुनः भेजें",
    didnt_receive: "प्राप्त नहीं हुआ?",
    
    // Dashboard
    welcome_user: "स्वागत है",
    pending_bills: "लंबित बिल",
    due_amount: "देय राशि",
    
    // Services
    electricity: "बिजली",
    water: "पानी",
    gas: "गैस",
    municipal: "नगरपालिका",
    certificates: "प्रमाण पत्र",
    bill_payment: "बिल भुगतान",
    grievance: "शिकायत",
    more_services: "अधिक सेवाएं",
    
    // Payment
    select_payment: "भुगतान का तरीका चुनें",
    total_amount: "कुल राशि",
    upi_qr: "यूपीआई / क्यूआर कोड",
    debit_credit: "डेबिट / क्रेडिट कार्ड",
    net_banking: "नेट बैंकिंग",
    cash: "नकद",
    processing: "प्रोसेसिंग...",
    please_wait: "कृपया प्रतीक्षा करें",
    payment_success: "भुगतान सफल!",
    transaction_id: "लेनदेन आईडी",
    print_receipt: "रसीद प्रिंट करें",
    send_sms: "एसएमएस भेजें",
    send_whatsapp: "व्हाट्सएप भेजें",
    done: "हो गया",
    return_home: "होम पर वापस जाएं",
    
    // Grievance
    file_complaint: "शिकायत दर्ज करें",
    my_complaints: "मेरी शिकायतें",
    select_category: "श्रेणी चुनें",
    subject: "विषय",
    description: "विवरण",
    attach_photo: "फोटो/वीडियो संलग्न करें",
    submit: "जमा करें",
    
    // Settings
    settings: "सेटिंग्स",
    voice_guidance: "वॉयस गाइडेंस",
    voice_guidance_desc: "ऑडियो निर्देशों को सक्षम करें",
    font_size: "फ़ॉन्ट आकार",
    font_size_desc: "टेक्स्ट का आकार समायोजित करें",
    high_contrast: "हाई कंट्रास्ट मोड",
    high_contrast_desc: "दृश्यता के लिए कंट्रास्ट बढ़ाएं",
    language: "भाषा",
    change: "बदलें",
    profile: "प्रोफ़ाइल",
    logout: "लॉगआउट",
    describe_issue: "अपनी समस्या का वर्णन करें",
    
    // Navigation
    home: "होम",
    history: "इतिहास",
    help: "मदद",
    back: "वापस",
    
    // Common
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    retry: "पुनः प्रयास करें",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
    select_all: "सभी चुनें",
    proceed_to_pay: "भुगतान करें",
  },
  
  en: {
    // Welcome Screen
    welcome_title: "Welcome to SUVIDHA ONE",
    welcome_subtitle: "One Kiosk, All Services",
    touch_to_start: "Touch to Start",
    
    // Language Selection
    select_language: "Select Your Language",
    
    // Authentication
    authenticate: "Authenticate",
    how_to_verify: "How would you like to verify?",
    mobile_otp: "Mobile OTP",
    aadhaar_biometric: "Aadhaar Biometric",
    scan_qr: "Scan QR Code",
    continue_guest: "Continue as Guest",
    enter_mobile: "Enter your mobile number",
    send_otp: "Send OTP",
    enter_otp: "Enter 6-digit OTP",
    verify: "Verify",
    resend_otp: "Resend OTP",
    didnt_receive: "Didn't receive?",
    
    // Dashboard
    welcome_user: "Welcome",
    pending_bills: "Pending Bills",
    due_amount: "Due Amount",
    
    // Services
    electricity: "Electricity",
    water: "Water Supply",
    gas: "Gas / LPG",
    municipal: "Municipal Services",
    certificates: "Certificates",
    bill_payment: "Bill Payment",
    grievance: "Grievance",
    more_services: "More Services",
    
    // Payment
    select_payment: "Select Payment Method",
    total_amount: "Total Amount",
    upi_qr: "UPI / QR Code",
    debit_credit: "Debit / Credit Card",
    net_banking: "Net Banking",
    cash: "Cash",
    processing: "Processing...",
    please_wait: "Please wait",
    payment_success: "Payment Successful!",
    transaction_id: "Transaction ID",
    print_receipt: "Print Receipt",
    send_sms: "Send SMS",
    send_whatsapp: "Send WhatsApp",
    done: "Done",
    return_home: "Return Home",
    
    // Grievance
    file_complaint: "File a Complaint",
    my_complaints: "My Complaints",
    select_category: "Select Category",
    subject: "Subject",
    description: "Description",
    attach_photo: "Attach Photo/Video",
    submit: "Submit",
    
    // Settings
    settings: "Settings",
    voice_guidance: "Voice Guidance",
    voice_guidance_desc: "Enable audio instructions",
    font_size: "Font Size",
    font_size_desc: "Adjust text size",
    high_contrast: "High Contrast Mode",
    high_contrast_desc: "Increase contrast for visibility",
    language: "Language",
    change: "Change",
    profile: "Profile",
    logout: "Logout",
    describe_issue: "Describe your issue",
    
    // Navigation
    home: "Home",
    history: "History",
    help: "Help",
    back: "Back",
    
    // Common
    loading: "Loading...",
    error: "Error",
    retry: "Retry",
    cancel: "Cancel",
    confirm: "Confirm",
    select_all: "Select All",
    proceed_to_pay: "Proceed to Pay",
  },
  
  // Simplified translations for other languages (key phrases only)
  ta: {
    welcome_title: "சுவிதா ஒன் உங்களை வரவேற்கிறது",
    touch_to_start: "தொடங்க தொடவும்",
    select_language: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    home: "முகப்பு",
    settings: "அமைப்புகள்",
  },
  bn: {
    welcome_title: "সুবিধা ওয়ান-এ স্বাগতম",
    touch_to_start: "শুরু করতে স্পর্শ করুন",
    select_language: "আপনার ভাষা নির্বাচন করুন",
    home: "হোম",
    settings: "সেটিংস",
  },
  mr: {
    welcome_title: "सुविधा वन मध्ये आपले स्वागत आहे",
    touch_to_start: "सुरू करण्यासाठी स्पर्श करा",
    select_language: "तुमची भाषा निवडा",
    home: "होम",
    settings: "सेटिंग्ज",
  },
  gu: {
    welcome_title: "સુવિધા વનમાં આપનું સ્વાગત છે",
    touch_to_start: "શરૂ કરવા માટે ટચ કરો",
    select_language: "તમારી ભાષા પસંદ કરો",
    home: "હોમ",
    settings: "સેટિંગ્સ",
  },
  kn: {
    welcome_title: "ಸುವಿಧಾ ಒನ್‌ಗೆ ಸ್ವಾಗತ",
    touch_to_start: "ಪ್ರಾರಂಭಿಸಲು ಟಚ್ ಮಾಡಿ",
    select_language: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    home: "ಹೋಮ್",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
  },
  ml: {
    welcome_title: "സുവിധ വണ്ണിലേക്ക് സ്വാഗതം",
    touch_to_start: "ആരംഭിക്കാൻ സ്പർശിക്കുക",
    select_language: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക",
    home: "ഹോം",
    settings: "ക്രമീകരണങ്ങൾ",
  },
  te: {
    welcome_title: "సువిధా వన్‌కు స్వాగతం",
    touch_to_start: "ప్రారంభించడానికి తాకండి",
    select_language: "మీ భాషను ఎంచుకోండి",
    home: "హోమ్",
    settings: "సెట్టింగ్‌లు",
  },
  pa: {
    welcome_title: "ਸੁਵਿਧਾ ਵਨ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ",
    touch_to_start: "ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਛੋਹਵੋ",
    select_language: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ",
    home: "ਹੋਮ",
    settings: "ਸੈਟਿੰਗਾਂ",
  },
};

/**
 * Get translation for a key
 */
export function t(key: string, lang: LanguageCode = "hi"): string {
  return translations[lang]?.[key] || translations.en?.[key] || key;
}

/**
 * Get bilingual text (primary + secondary language)
 */
export function tBilingual(key: string, primaryLang: LanguageCode = "hi", secondaryLang: LanguageCode = "en"): { primary: string; secondary: string } {
  return {
    primary: t(key, primaryLang),
    secondary: primaryLang !== secondaryLang ? t(key, secondaryLang) : "",
  };
}

export default translations;
