import { XGOO_BRAND, XGOO_CONTACT, XGOO_MODULES } from "./site-info";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocument = {
  slug: string;
  title: string;
  lastUpdated: string;
  summary: string;
  sections: LegalSection[];
};

const LAST_UPDATED = "15 September 2026";

const GO = XGOO_MODULES.go.name;
const PRO = XGOO_MODULES.pro.name;
const HUB = XGOO_MODULES.hub.name;
const COMMAND = XGOO_MODULES.command.name;
const PICKUP = XGOO_MODULES.pickup.name;

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "terms",
    title: "Terms and Conditions",
    lastUpdated: LAST_UPDATED,
    summary: `These terms govern your use of ${XGOO_BRAND.productName} websites and apps operated by ${XGOO_BRAND.parentCompany}, including ${GO}, ${PRO}, ${HUB}, ${COMMAND}, and ${PICKUP}.`,
    sections: [
      {
        heading: "1. Acceptance of terms",
        paragraphs: [
          `By accessing www.xgoo.in, creating an account, booking a shipment, collecting a parcel, or using any XGoo app, you agree to these Terms and Conditions, our Privacy Policy, Shipping Policy, Return Policy, and Cancellation Policy. If you do not agree, do not use the platform.`,
          `${XGOO_BRAND.productName} is a product of ${XGOO_BRAND.parentCompany}. References to “we”, “us”, or “XGoo” mean ${XGOO_BRAND.parentCompany} operating the XGoo platform.`,
        ],
      },
      {
        heading: "2. The XGoo platform",
        paragraphs: [
          `${GO} is for people who need to send something and go. You book a doorstep pickup, receive a quotation, track the movement, and get updates on the website or the ${GO} Android app.`,
          `${PRO} is for stores that need standing or on-demand pickup. A store account must be verified by ${COMMAND} before it can place orders. Stores can keep customers, print From/To slips, accept quotations onto Bills, and settle XGoo by UPI, bank transfer, or cash.`,
          `${PICKUP} is for authorised partners who collect parcels at the door, inspect and weigh them, send quotations, pack, bring them to the assigned XGoo store, and then raise the shipment.`,
          `${HUB} is the store workspace for bookings, customers, enquiries, and staff. ${COMMAND} is Super Admin control of XGoo apps and stores. Hub walk-in bookings stay in Hub; ${PICKUP} only receives doorstep collection jobs.`,
          "Physical movement uses trusted courier partners. XGoo is a technology and logistics facilitation platform. Transit times and coverage depend on origin, destination, weight, dimensions, and partner availability.",
        ],
      },
      {
        heading: "3. Eligibility",
        paragraphs: [
          "You must be at least 18 years old and legally able to enter a contract in India to create an account or book a shipment.",
          `${GO} sign-in uses a mobile number and one-time password. ${PRO} sign-in uses Google, email, or phone. ${PICKUP} partners sign in with mobile OTP or password after their account is created. ${HUB} and ${COMMAND} accounts are issued only to authorised staff.`,
        ],
      },
      {
        heading: "4. Customer responsibilities",
        paragraphs: [
          "You must provide accurate sender and receiver names, phone numbers, Address 1, Address 2, city, pincode or postal code, country for international movement, package description, and declared value.",
          "You must not book prohibited, illegal, hazardous, or restricted items. You are responsible for packing that can withstand courier handling, unless XGoo packs the parcel after pickup under a quoted service.",
          "Any delay, extra charge, seizure, or loss caused by incorrect details, incomplete documents, undeclared contents, or inadequate packing is your responsibility.",
        ],
      },
      {
        heading: "5. Bookings, quotations, payments, and bills",
        paragraphs: [
          "A booking request is an enquiry until we accept it and share a booking or AWB reference as applicable. Doorstep jobs typically follow inspect → quote → customer accept → pack → arrive at the XGoo store → shipment / AWB.",
          "Quoted prices may change if actual weight, volumetric weight, contents, or service type differ from what you provided. Taxes, fuel surcharges, remote-area fees, and partner charges may apply.",
          `${GO} customers pay as communicated at booking or after quotation. ${PRO} stores may accept a quotation onto Bills immediately (credit / pending) and settle later on a daily, weekly, or monthly cycle by UPI, bank transfer, or cash.`,
          "A booking is not a guaranteed shipment until the assigned courier partner issues an AWB and accepts the parcel into its network.",
        ],
      },
      {
        heading: "6. XGoo Pro stores",
        paragraphs: [
          `When you apply for ${PRO}, you provide business name, store name, category, store address, and GSTIN where applicable. ${COMMAND} may approve, hold, or reject the store. Until the store is verified, booking and pickup features stay locked.`,
          "You choose standing pickup on agreed weekdays and times, or on-demand pickup only when you have orders. You are responsible for orders you enter from WhatsApp, calls, Instagram, or other channels, including receiver details and declared contents.",
          "Labels and From/To slips you print must match the booking. You must make packed parcels available at the store address for the assigned pickup partner.",
        ],
      },
      {
        heading: "7. XGoo Pickup partners",
        paragraphs: [
          `${PICKUP} partners collect only doorstep jobs assigned to their store. You must keep customer information confidential, visit only assigned addresses, inspect and quote honestly, and bring packed parcels to the XGoo store before a shipment is raised.`,
          "We may collect your name, mobile number, address, assigned store, and government ID (such as Aadhaar, PAN, driving licence, or voter ID) to verify you and operate dispatch. Misuse of customer data, missed pickups without cause, or unsafe conduct may lead to suspension or termination.",
          "Partners act as authorised collectors for XGoo. These terms do not create employment, partnership, or agency beyond what is needed to complete assigned pickups.",
        ],
      },
      {
        heading: "8. Staff accounts",
        paragraphs: [
          `${HUB} and ${COMMAND} accounts must be used only by authorised persons. Keep login credentials confidential. You may not scrape data, attempt unauthorised access, or interfere with operations.`,
        ],
      },
      {
        heading: "9. Liability",
        paragraphs: [
          "Liability for loss or damage is limited to the extent permitted by applicable law and by the terms of the assigned courier partner. High-value goods should be declared and insured where available.",
          "We are not liable for indirect, incidental, or consequential losses, including business interruption or lost profits. Indicative delivery dates are not guarantees unless a premium service expressly says so.",
        ],
      },
      {
        heading: "10. Communications",
        paragraphs: [
          "We send transactional updates by WhatsApp, SMS, email, phone, or in-app notification. After a shipment is raised, the sender (From) may receive booking, route, amount, and tracking. The receiver (To) may receive booking identity and tracking without the amount.",
        ],
      },
      {
        heading: "11. Intellectual property",
        paragraphs: [
          "XGoo names, logos, apps, and website content belong to NSGroup or its licensors. You may not copy, reverse engineer, or misuse them except as needed to use the service.",
        ],
      },
      {
        heading: "12. Suspension and changes",
        paragraphs: [
          "We may suspend an account for restricted items, unpaid bills, safety concerns, fraud, or policy breaches. We may update these terms from time to time. Continued use after the updated date means you accept the new terms.",
        ],
      },
      {
        heading: "13. Governing law",
        paragraphs: [
          "These terms are governed by the laws of India. Courts in Hyderabad, Telangana, have exclusive jurisdiction, subject to mandatory consumer protections that apply to you.",
        ],
      },
      {
        heading: "14. Contact",
        paragraphs: [
          `For questions about these terms, email ${XGOO_CONTACT.email} or call ${XGOO_CONTACT.phone}.`,
          `Service area contact: ${XGOO_CONTACT.address}. Hours: ${XGOO_CONTACT.hours}.`,
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    lastUpdated: LAST_UPDATED,
    summary: `How ${XGOO_BRAND.productName} collects, uses, stores, and shares personal information on www.xgoo.in, ${GO}, ${PRO}, ${HUB}, ${COMMAND}, and ${PICKUP}. This policy is the public privacy notice for our Google Play listings.`,
    sections: [
      {
        heading: "1. Who this policy covers",
        paragraphs: [
          `This Privacy Policy applies to ${XGOO_BRAND.productName}, a product of ${XGOO_BRAND.parentCompany}, including the website www.xgoo.in, the ${GO} Android app (package com.murthyenterprises.xgoo), and the ${PICKUP} Android app (package com.murthyenterprises.xgoopickup).`,
          `It also covers ${PRO} store accounts, ${HUB} store staff, and ${COMMAND} Super Admin users who sign in on the website.`,
          `Controller: ${XGOO_BRAND.parentCompany}, ${XGOO_CONTACT.address}. Contact: ${XGOO_CONTACT.email}, ${XGOO_CONTACT.phone}.`,
        ],
      },
      {
        heading: "2. Information we collect",
        paragraphs: [
          `${GO}: name, mobile number, optional email, saved addresses (Address 1, Address 2, city, pincode, coordinates when you choose them), shipment From/To details, parcel description, and booking or tracking history. Sign-in uses a one-time code sent to your mobile.`,
          `${PRO}: the same contact and shipment fields, plus business name, store name, category, GSTIN, store pickup address, pickup style (standing or on-demand), billing cycle, store orders, destination customers, and bill or settlement records.`,
          `${PICKUP} partners: name, mobile number, password or OTP, residential or operating address, assigned XGoo store, availability status, job history, inspection notes, and government identity type and number (Aadhaar, PAN, driving licence, or voter ID) used to verify the partner.`,
          `${HUB} and ${COMMAND}: staff name, login credentials, and operational records needed to run a store or the network.`,
          "Shipment parties: sender and receiver names, phones, and addresses that you enter so we can collect, quote, deliver, and send tracking. Receivers do not need an XGoo account.",
          "Technical data: device type, app version, browser, IP address, approximate network information, crash or diagnostic logs, and Expo push tokens when notifications are enabled.",
          `We do not ask apps to access your contacts, photos, camera, or microphone in the current ${GO} or ${PICKUP} releases.`,
        ],
      },
      {
        heading: "3. Location",
        paragraphs: [
          `${GO} (website and app) and ${PRO} / ${HUB} headers may use precise location only when you tap to fetch live location or to set a pickup point on the map. Permission is optional. If you decline, you can type the address.`,
          `${PICKUP} may use precise location when you tap Live in the header so you can confirm where you are while collecting. We do not request background location, and we do not continuously track you when the app is closed.`,
          "Coordinates may be sent to OpenStreetMap Nominatim to reverse-geocode an address label. Location is used to operate pickup and is not sold.",
        ],
      },
      {
        heading: "4. How we use information",
        paragraphs: [
          `We use information to create and secure accounts, process bookings, dispatch ${PICKUP} partners, inspect and quote, pack, raise shipments, print labels, track movement, issue bills, prevent fraud, and improve the service.`,
          "We send transactional messages by WhatsApp, SMS, email, phone, or push notification about OTP sign-in, quotations, pickup status, AWB, and delivery. After a shipment is raised, the sender may receive amount and tracking; the receiver receives tracking without the amount.",
          "We may use limited website analytics and advertising measurement (including Meta Pixel) on public marketing pages. Staff dashboards after login and the native apps do not load that marketing pixel.",
        ],
      },
      {
        heading: "5. Sharing of information",
        paragraphs: [
          "Courier partners receive the shipment and contact details needed to collect, move, and deliver the parcel.",
          `WhatsApp / Meta may process phone numbers and message content when we send OTP or shipment updates. Google may process identity when you sign in to ${PRO} with Google. OpenStreetMap Nominatim may receive coordinates or address search text for geocoding. Expo / Google (Firebase Cloud Messaging) may process push tokens to deliver notifications.`,
          "Payment records (cash, UPI, bank transfer, or credit) are stored to operate Bills and Hub accounting. We do not collect full card PAN inside the current apps.",
          `${HUB} and ${COMMAND} staff can access bookings and partner records for the stores they are authorised to operate. We do not sell personal information. We may disclose information if required by law or a lawful government request.`,
        ],
      },
      {
        heading: "6. Cookies and local storage",
        paragraphs: [
          "The website uses cookies or local storage for sign-in sessions, guest or module preferences, and essential UI (for example sidebar state). Native apps store session tokens in secure on-device storage (Expo SecureStore).",
          "Public website pages may set Meta Pixel cookies for ads measurement. You can block cookies in your browser; the site may then offer a more limited experience. Native apps do not use that advertising cookie.",
        ],
      },
      {
        heading: "7. Notifications",
        paragraphs: [
          `${GO} and ${PICKUP} may ask for notification permission so we can alert you about bookings, pickups, quotations, and job assignments. You can disable notifications in system settings. Push tokens are used only to deliver those alerts.`,
        ],
      },
      {
        heading: "8. Data retention and security",
        paragraphs: [
          "We retain account, booking, billing, and partner-verification records for as long as needed to operate the service, complete accounting, resolve disputes, and meet tax or legal duties in India.",
          `Government ID numbers for ${PICKUP} partners are used for identity verification and are accessible to authorised Hub and Command staff only.`,
          "We apply reasonable technical and organisational safeguards. No method of transmission or storage is completely secure.",
        ],
      },
      {
        heading: "9. Your choices and rights",
        paragraphs: [
          `You may access or correct profile and address details in ${GO} or ${PRO}. You may opt out of non-essential marketing while still receiving transactional shipment and OTP messages.`,
          "Under applicable Indian law, including the Digital Personal Data Protection Act, 2023, you may request access, correction, or erasure of personal data, subject to records we must keep for law, tax, or dispute resolution. Email ${XGOO_CONTACT.email} from your registered phone or email.",
        ],
      },
      {
        heading: "10. Account deletion (Google Play)",
        paragraphs: [
          `To delete an ${GO}, ${PRO}, or ${PICKUP} account, email ${XGOO_CONTACT.email} from the registered mobile number or email with the subject “Account deletion” and the app name. We will verify you and delete or anonymise personal data that is no longer required.`,
          "Shipment, invoice, and tax records that the law requires us to keep may be retained in a form that no longer lets the account sign in. Deletion removes access to the app account; it does not cancel parcels already in the courier network.",
        ],
      },
      {
        heading: "11. Children",
        paragraphs: [
          "XGoo services are for people 18 years or older and for businesses. We do not knowingly collect personal information from children. If you believe a child has created an account, contact us and we will delete it.",
        ],
      },
      {
        heading: "12. Changes",
        paragraphs: [
          "We may update this policy as the website and apps change. The “Last updated” date at the top will change. Continued use after that date means you accept the updated policy.",
        ],
      },
      {
        heading: "13. Contact",
        paragraphs: [
          `Privacy and deletion requests: ${XGOO_CONTACT.email}. Phone: ${XGOO_CONTACT.phone}. WhatsApp: ${XGOO_CONTACT.whatsappDisplay}.`,
          `Hours: ${XGOO_CONTACT.hours}. Address: ${XGOO_CONTACT.address}.`,
        ],
      },
    ],
  },
  {
    slug: "return-policy",
    title: "Return Policy",
    lastUpdated: LAST_UPDATED,
    summary: "How undelivered, refused, or returned-to-origin (RTO) shipments are handled on XGoo.",
    sections: [
      {
        heading: "1. Scope",
        paragraphs: [
          "This Return Policy covers courier shipments booked through XGoo Go or XGoo Pro that cannot be delivered and are returned to the sender or origin warehouse.",
          "It does not replace product return policies of sellers or stores whose goods are being shipped. XGoo moves parcels; we are not the merchant of the goods inside unless we say so in writing.",
        ],
      },
      {
        heading: "2. When a shipment may be returned",
        paragraphs: [
          "Shipments may be returned if the recipient refuses delivery, is unavailable after standard delivery attempts, provided an incorrect address, or if delivery is otherwise unsuccessful under the partner courier’s rules.",
          "Attempt counts, hold periods, and RTO timelines follow the assigned courier partner’s operating procedures.",
        ],
      },
      {
        heading: "3. Charges",
        paragraphs: [
          "Return-to-origin and reattempt charges may apply and are payable by the booking customer or Pro store unless otherwise agreed in writing.",
          "Forward freight already incurred is generally non-refundable once the shipment has moved in the courier network. Accepted Pro quotations already on Bills remain payable unless we reverse them in writing.",
        ],
      },
      {
        heading: "4. Claiming a return",
        paragraphs: [
          `Contact XGoo support with your booking or AWB number at ${XGOO_CONTACT.email} or ${XGOO_CONTACT.phone}. We will coordinate status updates with the courier partner.`,
          "Please allow processing time for RTO movement, warehouse receipt, and final confirmation before requesting any settlement.",
        ],
      },
      {
        heading: "5. Damaged or incomplete returns",
        paragraphs: [
          "Report visible damage or shortage immediately when a returned package is received, with photos and the AWB reference.",
          "Claims are assessed under the courier partner’s liability rules and applicable law.",
        ],
      },
    ],
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    lastUpdated: LAST_UPDATED,
    summary: "Pickup, inspection, quotation, packing, transit, and delivery for XGoo Go and XGoo Pro shipments.",
    sections: [
      {
        heading: "1. Service coverage",
        paragraphs: [
          "XGoo supports domestic and selected international courier options through partner networks. You choose Domestic or International at booking. Coverage depends on pincode or destination country and partner availability.",
          "Estimated delivery dates shown at booking or on a quotation are indicative and not guaranteed unless expressly stated for a premium service.",
        ],
      },
      {
        heading: "2. Pickup models",
        paragraphs: [
          "XGoo Go customers book a doorstep pickup. An XGoo Pickup partner collects at the From address.",
          "XGoo Pro stores use daily standing pickup on agreed weekdays and times, or on-demand pickup only when they have orders.",
          "Walk-in drop-offs at an XGoo store are handled in XGoo Hub and are not assigned to the Pickup app.",
        ],
      },
      {
        heading: "3. Inspection, quotation, packing, and AWB",
        paragraphs: [
          "At the door, the Pickup partner inspects and weighs the parcel, then sends a quotation. Movement continues after you accept the quote (Go) or accept it onto Bills (Pro).",
          "The partner packs as quoted, brings the parcel to the assigned XGoo store, and Hub raises the shipment. An AWB is created when the courier partner accepts the parcel. Tracking updates follow courier scans after that point.",
          "Volumetric weight may be used where dimensions produce a higher chargeable weight than actual weight.",
        ],
      },
      {
        heading: "4. Packaging and documents",
        paragraphs: [
          "If you pack the goods yourself, pack them securely against shock, moisture, and handling. Fragile items need adequate cushioning and clear labelling.",
          "International shipments may need invoices, KYC, or other documents. Incomplete papers can delay or stop export.",
          "XGoo or courier partners may refuse poorly packed or restricted shipments.",
        ],
      },
      {
        heading: "5. Tracking and delivery",
        paragraphs: [
          "Track with your request number, booking number, or AWB on www.xgoo.in/track or in XGoo Go.",
          "Delivery confirmation may include signature, OTP, or partner-app proof of delivery. Failed attempts may lead to reattempts, hold at a local facility, or return to origin as per partner rules.",
        ],
      },
      {
        heading: "6. Restricted items",
        paragraphs: [
          "Prohibited and restricted goods (including hazardous materials, currency, illegal items, and other courier-banned categories) cannot be shipped. Booking such items may result in seizure, cancellation without refund of network costs, or legal consequences.",
        ],
      },
    ],
  },
  {
    slug: "cancellation-policy",
    title: "Cancellation Policy",
    lastUpdated: LAST_UPDATED,
    summary: "When you can cancel an XGoo Go or XGoo Pro booking and how refunds, credits, or Bills are handled.",
    sections: [
      {
        heading: "1. Before pickup",
        paragraphs: [
          "You may request cancellation before the parcel is picked up or handed over to the courier partner. Contact support with your booking or order reference as early as possible, or cancel an unpicked Pro order in XGoo Pro where that action is still available.",
          "If no courier cost has been incurred, eligible booking fees may be refunded or credited as applicable.",
        ],
      },
      {
        heading: "2. After quotation acceptance",
        paragraphs: [
          "For XGoo Pro, accepting a quotation adds it to Bills even before the parcel reaches the XGoo store. Cancellation after accept may still leave inspection or visit charges payable unless we reverse them.",
          "Once a shipment is in the courier network with an AWB, cancellation is generally not possible. You may request redirection or RTO where the partner allows it; extra charges may apply.",
        ],
      },
      {
        heading: "3. XGoo-initiated cancellations",
        paragraphs: [
          "We may cancel a booking for restricted items, incomplete documentation, unpaid bills, safety concerns, unverified Pro stores, or partner non-availability. Where appropriate, we will inform you and discuss alternatives or refunds of unused charges.",
        ],
      },
      {
        heading: "4. Refund timeline",
        paragraphs: [
          "Approved refunds are processed to the original payment method or as account credit within a reasonable period after confirmation, subject to payment provider timelines.",
          `For cancellation help, email ${XGOO_CONTACT.email} or call ${XGOO_CONTACT.phone}.`,
        ],
      },
    ],
  },
];

export function getLegalDocument(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((doc) => doc.slug === slug);
}
