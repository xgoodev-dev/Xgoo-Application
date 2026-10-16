import type { KioskLanguage } from "@shared/kiosk";

type Copy = {
  namaste: string;
  welcome: string;
  howHelp: string;
  listening: string;
  thinking: string;
  speaking: string;
  waiting: string;
  mic: string;
  tapToSpeak: string;
  imListening: string;
  stopSpeak: string;
  typeInstead: string;
  greetNamaste: string;
  greetWelcome: string;
  send: string;
  sendSub: string;
  track: string;
  trackSub: string;
  rates: string;
  ratesSub: string;
  business: string;
  businessSub: string;
  help: string;
  helpSub: string;
  language: string;
  staff: string;
  closeBot: string;
  demoBanner: string;
  tapToWake: string;
  domestic: string;
  international: string;
  continue: string;
  back: string;
  home: string;
  cancel: string;
  sender: string;
  receiver: string;
  parcel: string;
  review: string;
  name: string;
  phone: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  document: string;
  nonDocument: string;
  contents: string;
  weight: string;
  dimensions: string;
  declared: string;
  estimatesNote: string;
  noQuotes: string;
  confirmRequest: string;
  submitting: string;
  notBooked: string;
  another: string;
  trackingPlaceholder: string;
  lookup: string;
  originPin: string;
  destPin: string;
  getRates: string;
  staffTitle: string;
  staffBody: string;
  pinLabel: string;
  pinUnlock: string;
  handover: string;
  privacy: string;
  micDenied: string;
  micUnsupported: string;
  speakSend: string;
  speakMissing: string;
  speakConfirm: string;
  speakDone: string;
  speakConfused: string;
};

export const KIOSK_COPY: Record<KioskLanguage, Copy> = {
  en: {
    namaste: "Namaste! Welcome to XGoo.",
    welcome: "Namaste! Welcome to XGoo.",
    howHelp: "How can I help you today?",
    listening: "Listening…",
    thinking: "Thinking…",
    speaking: "Speaking…",
    waiting: "Waiting",
    greetNamaste: "Namaste!",
    greetWelcome: "Welcome to",
    mic: "Speak",
    tapToSpeak: "Tap to Speak",
    imListening: "I'm listening...",
    stopSpeak: "Stop",
    typeInstead: "Type instead",
    send: "Send a Parcel",
    sendSub: "Domestic & International",
    track: "Track a Parcel",
    trackSub: "Check real-time status",
    rates: "Check Rates & Delivery Time",
    ratesSub: "",
    business: "Business & Bulk Shipping",
    businessSub: "Grow with XGoo",
    help: "Help & Information",
    helpSub: "Get your questions answered",
    language: "Language",
    staff: "Staff",
    closeBot: "Close",
    demoBanner: "Demo mode — not a live booking, payment, or tracking result.",
    tapToWake: "Tap to start",
    domestic: "Domestic (India)",
    international: "International",
    continue: "Continue",
    back: "Back",
    home: "Home",
    cancel: "Cancel",
    sender: "Sender",
    receiver: "Receiver",
    parcel: "Parcel",
    review: "Review",
    name: "Name",
    phone: "Mobile number",
    address: "Address",
    pincode: "PIN code",
    city: "City",
    state: "State",
    country: "Country",
    document: "Document",
    nonDocument: "Non-document",
    contents: "Contents",
    weight: "Weight (kg)",
    dimensions: "L × W × H (cm)",
    declared: "Declared value (₹)",
    estimatesNote: "Prices and days are estimates, not a delivery guarantee.",
    noQuotes: "No live rates are available. A staff member can quote this parcel.",
    confirmRequest: "Confirm and send to store",
    submitting: "Sending to this store…",
    notBooked: "This is a store request, not a booked shipment.",
    another: "Start another",
    trackingPlaceholder: "Request, booking, or AWB number",
    lookup: "Track",
    originPin: "Pickup PIN",
    destPin: "Destination PIN",
    getRates: "Get rates",
    staffTitle: "Staff assistance",
    staffBody: "A team member can continue from here. Customer session details stay on this tablet until reset.",
    pinLabel: "Staff PIN",
    pinUnlock: "Unlock",
    handover: "Need a person?",
    privacy: "We only keep what is needed for this visit. Microphone is used for the live conversation, not background recording.",
    micDenied: "Microphone permission was not granted. Use the buttons or type.",
    micUnsupported: "Voice is not available in this browser. Use touch or type.",
    speakSend: "Certainly! Where would you like to send your parcel?",
    speakMissing: "Could you please confirm the missing details on the screen?",
    speakConfirm: "Please review the details on the screen before I send this to the store.",
    speakDone: "Your request is with this store. Staff will complete weighing, payment, and booking.",
    speakConfused: "No problem. I can help you step by step.",
  },
  hi: {
    namaste: "नमस्ते! XGoo में आपका स्वागत है।",
    welcome: "नमस्ते! XGoo में आपका स्वागत है।",
    howHelp: "आज मैं आपकी कैसे मदद करूँ?",
    listening: "सुन रहा हूँ…",
    thinking: "सोच रहा हूँ…",
    speaking: "बोल रहा हूँ…",
    waiting: "प्रतीक्षा",
    greetNamaste: "नमस्ते!",
    greetWelcome: "स्वागत है",
    mic: "बोलें",
    tapToSpeak: "बोलने के लिए टैप करें",
    imListening: "मैं सुन रहा हूँ...",
    stopSpeak: "रोकें",
    typeInstead: "टाइप करें",
    send: "पार्सल भेजें",
    sendSub: "घरेलू और अंतरराष्ट्रीय",
    track: "पार्सल ट्रैक करें",
    trackSub: "लाइव स्थिति देखें",
    rates: "रेट और डिलीवरी समय",
    ratesSub: "",
    business: "बिज़नेस और बल्क शिपिंग",
    businessSub: "XGoo के साथ बढ़ें",
    help: "मदद और जानकारी",
    helpSub: "अपने सवाल पूछें",
    language: "भाषा",
    staff: "स्टाफ",
    closeBot: "बंद करें",
    demoBanner: "डेमो मोड — यह लाइव बुकिंग, पेमेंट या ट्रैकिंग नहीं है।",
    tapToWake: "शुरू करने के लिए टैप करें",
    domestic: "घरेलू (भारत)",
    international: "अंतरराष्ट्रीय",
    continue: "आगे",
    back: "वापस",
    home: "होम",
    cancel: "रद्द",
    sender: "प्रेषक",
    receiver: "प्राप्तकर्ता",
    parcel: "पार्सल",
    review: "जाँच",
    name: "नाम",
    phone: "मोबाइल नंबर",
    address: "पता",
    pincode: "पिन कोड",
    city: "शहर",
    state: "राज्य",
    country: "देश",
    document: "दस्तावेज़",
    nonDocument: "गैर-दस्तावेज़",
    contents: "सामग्री",
    weight: "वज़न (किग्रा)",
    dimensions: "लं × चौ × ऊँ (सेमी)",
    declared: "घोषित मूल्य (₹)",
    estimatesNote: "कीमत और दिन अनुमान हैं, गारंटी नहीं।",
    noQuotes: "लाइव रेट उपलब्ध नहीं। स्टाफ कोट दे सकते हैं।",
    confirmRequest: "स्टोर को भेजें",
    submitting: "इस स्टोर को भेज रहा हूँ…",
    notBooked: "यह स्टोर अनुरोध है, कन्फर्म बुकिंग नहीं।",
    another: "एक और शुरू करें",
    trackingPlaceholder: "अनुरोध, बुकिंग या AWB नंबर",
    lookup: "ट्रैक",
    originPin: "पिकअप पिन",
    destPin: "गंतव्य पिन",
    getRates: "रेट देखें",
    staffTitle: "स्टाफ सहायता",
    staffBody: "टीम सदस्य यहाँ से आगे बढ़ा सकते हैं।",
    pinLabel: "स्टाफ पिन",
    pinUnlock: "खोलें",
    handover: "व्यक्ति चाहिए?",
    privacy: "माइक्रोफ़ोन केवल इस बातचीत के लिए है, बैकग्राउंड रिकॉर्डिंग नहीं।",
    micDenied: "माइक की अनुमति नहीं मिली। बटन या टाइपिंग इस्तेमाल करें।",
    micUnsupported: "इस ब्राउज़र में आवाज़ उपलब्ध नहीं। टच इस्तेमाल करें।",
    speakSend: "ज़रूर! पार्सल कहाँ भेजना है?",
    speakMissing: "कृपया स्क्रीन पर बाकी जानकारी पूरी करें।",
    speakConfirm: "स्टोर को भेजने से पहले स्क्रीन पर विवरण जाँच लें।",
    speakDone: "आपका अनुरोध इस स्टोर के पास है। स्टाफ वज़न, भुगतान और बुकिंग पूरा करेंगे।",
    speakConfused: "कोई बात नहीं। मैं कदम-दर-कदम मदद करूँगा।",
  },
  te: {
    namaste: "నమస్తే! XGoo కు స్వాగతం.",
    welcome: "నమస్తే! XGoo కు స్వాగతం.",
    howHelp: "ఈరోజు నేను ఎలా సహాయం చేయగలను?",
    listening: "వింటున్నాను…",
    thinking: "ఆలోచిస్తున్నాను…",
    speaking: "మాట్లాడుతున్నాను…",
    waiting: "వేచి ఉన్నాను",
    greetNamaste: "నమస్తే!",
    greetWelcome: "స్వాగతం",
    mic: "మాట్లాడండి",
    tapToSpeak: "మాట్లాడటానికి ట్యాప్ చేయండి",
    imListening: "నేను వింటున్నాను...",
    stopSpeak: "ఆపండి",
    typeInstead: "టైప్ చేయండి",
    send: "పార్సెల్ పంపండి",
    sendSub: "దేశీయ & అంతర్జాతీయ",
    track: "పార్సెల్ ట్రాక్ చేయండి",
    trackSub: "లైవ్ స్టేటస్ చూడండి",
    rates: "రేట్లు & డెలివరీ సమయం",
    ratesSub: "",
    business: "బిజినెస్ & బల్క్ షిప్పింగ్",
    businessSub: "XGoo తో ఎదగండి",
    help: "సహాయం & సమాచారం",
    helpSub: "మీ ప్రశ్నలకు సమాధానాలు",
    language: "భాష",
    staff: "స్టాఫ్",
    closeBot: "మూసివేయండి",
    demoBanner: "డెమో మోడ్ — ఇది లైవ్ బుకింగ్, పేమెంట్ లేదా ట్రాకింగ్ కాదు.",
    tapToWake: "ప్రారంభించడానికి ట్యాప్ చేయండి",
    domestic: "దేశీయ (భారతదేశం)",
    international: "అంతర్జాతీయ",
    continue: "కొనసాగించు",
    back: "వెనక్కి",
    home: "హోమ్",
    cancel: "రద్దు",
    sender: "పంపేవారు",
    receiver: "స్వీకరించేవారు",
    parcel: "పార్సెల్",
    review: "సమీక్ష",
    name: "పేరు",
    phone: "మొబైల్ నంబర్",
    address: "చిరునామా",
    pincode: "పిన్ కోడ్",
    city: "నగరం",
    state: "రాష్ట్రం",
    country: "దేశం",
    document: "డాక్యుమెంట్",
    nonDocument: "నాన్-డాక్యుమెంట్",
    contents: "సరుకు",
    weight: "బరువు (కిలో)",
    dimensions: "L × W × H (cm)",
    declared: "డిక్లేర్డ్ విలువ (₹)",
    estimatesNote: "ధరలు మరియు రోజులు అంచనాలు, హామీ కాదు.",
    noQuotes: "లైవ్ రేట్లు లేవు. స్టాఫ్ కోట్ ఇవ్వగలరు.",
    confirmRequest: "స్టోర్‌కు పంపండి",
    submitting: "ఈ స్టోర్‌కు పంపుతున్నాను…",
    notBooked: "ఇది స్టోర్ అభ్యర్థన, కన్‌ఫర్మ్డ్ బుకింగ్ కాదు.",
    another: "మరొకటి ప్రారంభించండి",
    trackingPlaceholder: "అభ్యర్థన, బుకింగ్ లేదా AWB నంబర్",
    lookup: "ట్రాక్",
    originPin: "పికప్ పిన్",
    destPin: "గమ్యం పిన్",
    getRates: "రేట్లు చూడండి",
    staffTitle: "స్టాఫ్ సహాయం",
    staffBody: "టీమ్ మెంబర్ ఇక్కడ నుండి కొనసాగించవచ్చు.",
    pinLabel: "స్టాఫ్ పిన్",
    pinUnlock: "అన్‌లాక్",
    handover: "వ్యక్తి కావాలా?",
    privacy: "మైక్రోఫోన్ ఈ సంభాషణకు మాత్రమే. బ్యాక్‌గ్రౌండ్ రికార్డింగ్ లేదు.",
    micDenied: "మైక్ అనుమతి లేదు. బటన్లు లేదా టైపింగ్ వాడండి.",
    micUnsupported: "ఈ బ్రౌజర్‌లో వాయిస్ లేదు. టచ్ వాడండి.",
    speakSend: "ఖచ్చితంగా! పార్సెల్ ఎక్కడికి పంపాలి?",
    speakMissing: "దయచేసి స్క్రీన్‌పై మిగిలిన వివరాలు నిర్ధారించండి.",
    speakConfirm: "స్టోర్‌కు పంపే ముందు స్క్రీన్‌పై వివరాలు చూడండి.",
    speakDone: "మీ అభ్యర్థన ఈ స్టోర్ వద్ద ఉంది. స్టాఫ్ తూకం, చెల్లింపు, బుకింగ్ పూర్తి చేస్తారు.",
    speakConfused: "సమస్య లేదు. నేను అడుగులవారీగా సహాయం చేస్తాను.",
  },
};

export function kioskCopy(language: KioskLanguage): Copy {
  return KIOSK_COPY[language];
}
