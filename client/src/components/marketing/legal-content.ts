import { XGOO_BRAND, XGOO_CONTACT } from "./site-info";

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

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "terms",
    title: "Terms and Conditions",
    lastUpdated: "12 July 2026",
    summary:
      "These terms govern your use of XGoo courier booking services operated by NSGroup.",
    sections: [
      {
        heading: "1. Acceptance of terms",
        paragraphs: [
          `By accessing www.xgoo.in, booking a shipment, or using any XGoo service, you agree to these Terms and Conditions and our related policies. If you do not agree, please do not use the platform.`,
          `${XGOO_BRAND.productName} is a product of ${XGOO_BRAND.parentCompany}. References to “we”, “us”, or “XGoo” mean ${XGOO_BRAND.parentCompany} operating the XGoo platform.`,
        ],
      },
      {
        heading: "2. Services",
        paragraphs: [
          "XGoo provides online courier booking, quotation, tracking coordination, and related logistics support through partner courier networks.",
          "Service availability, transit times, and rates may vary by origin, destination, weight, dimensions, declared value, and the selected courier partner.",
        ],
      },
      {
        heading: "3. Customer responsibilities",
        paragraphs: [
          "You must provide accurate pickup and delivery details, contact numbers, package descriptions, and declared values.",
          "You must not book prohibited, illegal, hazardous, or restricted items. You are responsible for proper packing suitable for courier handling.",
          "Any delay, loss, or extra charge caused by incorrect information, incomplete documents, or inadequate packing is your responsibility.",
        ],
      },
      {
        heading: "4. Bookings, payments, and invoices",
        paragraphs: [
          "A booking request is confirmed only after we accept it and share a booking or AWB reference as applicable.",
          "Quoted prices may change if actual weight, volumetric weight, or service type differs from the details you provided.",
          "Applicable taxes, fuel surcharges, remote-area fees, and partner courier charges may apply and will be communicated where required.",
        ],
      },
      {
        heading: "5. Liability",
        paragraphs: [
          "XGoo acts as a technology and logistics facilitation platform and may use third-party courier partners for physical movement of shipments.",
          "Liability for loss or damage is limited to the extent permitted by applicable law and by the terms of the assigned courier partner. High-value shipments should be adequately declared and insured where available.",
          "We are not liable for indirect, incidental, or consequential losses, including business interruption or lost profits.",
        ],
      },
      {
        heading: "6. Account and acceptable use",
        paragraphs: [
          "Staff and partner accounts must be used only by authorised persons. You must keep login credentials confidential.",
          "You may not misuse the platform, attempt unauthorised access, scrape data, or interfere with service operations.",
        ],
      },
      {
        heading: "7. Changes",
        paragraphs: [
          "We may update these terms from time to time. Continued use of XGoo after changes means you accept the updated terms.",
        ],
      },
      {
        heading: "8. Contact",
        paragraphs: [
          `For questions about these terms, email ${XGOO_CONTACT.email} or call ${XGOO_CONTACT.phone}.`,
          `Registered service area contact: ${XGOO_CONTACT.address}.`,
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    lastUpdated: "12 July 2026",
    summary:
      "How XGoo collects, uses, stores, and protects personal information when you book or contact us.",
    sections: [
      {
        heading: "1. Information we collect",
        paragraphs: [
          "We may collect your name, phone number, email address, pickup and delivery addresses, shipment details, payment-related information, and communication history.",
          "When you use our website or WhatsApp booking flows, we may also collect technical data such as device type, browser, IP address, and usage events needed to operate and improve the service.",
        ],
      },
      {
        heading: "2. How we use your information",
        paragraphs: [
          "We use your information to process bookings, arrange pickup and delivery, provide tracking updates, issue invoices, respond to support requests, prevent fraud, and improve XGoo services.",
          "We may send transactional messages by SMS, email, phone, or WhatsApp related to your shipment or account.",
        ],
      },
      {
        heading: "3. Sharing of information",
        paragraphs: [
          "We share shipment and contact details with courier partners, payment processors, and service providers only as needed to fulfil your booking or operate the platform.",
          "We do not sell your personal information. We may disclose information if required by law, regulation, or lawful government request.",
        ],
      },
      {
        heading: "4. Data retention and security",
        paragraphs: [
          "We retain booking and customer records for as long as needed for operations, accounting, dispute resolution, and legal compliance.",
          "We apply reasonable technical and organisational safeguards to protect data. No method of transmission or storage is completely secure.",
        ],
      },
      {
        heading: "5. Your choices",
        paragraphs: [
          "You may request access, correction, or deletion of personal data where applicable by contacting us. Some records may need to be retained for legal or operational reasons.",
          "You can opt out of non-essential marketing communications while still receiving transactional shipment updates.",
        ],
      },
      {
        heading: "6. Contact",
        paragraphs: [
          `Privacy requests: ${XGOO_CONTACT.email}. Phone: ${XGOO_CONTACT.phone}.`,
        ],
      },
    ],
  },
  {
    slug: "return-policy",
    title: "Return Policy",
    lastUpdated: "12 July 2026",
    summary:
      "How undelivered, refused, or returned-to-origin (RTO) shipments are handled on XGoo.",
    sections: [
      {
        heading: "1. Scope",
        paragraphs: [
          "This Return Policy covers courier shipments booked through XGoo that cannot be delivered and are returned to the sender or origin warehouse.",
          "It does not replace product return policies of sellers or e-commerce merchants whose goods are being shipped.",
        ],
      },
      {
        heading: "2. When a shipment may be returned",
        paragraphs: [
          "Shipments may be returned if the recipient refuses delivery, is unavailable after standard delivery attempts, provides an incorrect address, or if delivery is otherwise unsuccessful under the partner courier’s rules.",
          "Attempt counts, hold periods, and RTO timelines follow the assigned courier partner’s operating procedures.",
        ],
      },
      {
        heading: "3. Charges",
        paragraphs: [
          "Return-to-origin and reattempt charges may apply and are payable by the booking customer unless otherwise agreed in writing.",
          "Forward freight already incurred is generally non-refundable once the shipment has moved in the courier network.",
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
    lastUpdated: "12 July 2026",
    summary:
      "Pickup, transit, delivery expectations, and packing guidelines for XGoo shipments.",
    sections: [
      {
        heading: "1. Service coverage",
        paragraphs: [
          "XGoo supports domestic and selected international courier options through partner networks. Coverage depends on pincode and partner availability.",
          "Estimated delivery dates shown at booking are indicative and not guaranteed unless expressly stated for a premium service.",
        ],
      },
      {
        heading: "2. Pickup and handover",
        paragraphs: [
          "Pickup slots depend on location, courier partner capacity, and cut-off times. Someone authorised should be available at the pickup address with the packed shipment and required documents.",
          "Volumetric weight may be used where dimensions produce a higher chargeable weight than actual weight.",
        ],
      },
      {
        heading: "3. Packaging",
        paragraphs: [
          "Customers must pack goods securely against shock, moisture, and handling during transit. Fragile items need adequate cushioning and clear labelling.",
          "XGoo or courier partners may refuse poorly packed shipments that risk damage to the goods or the network.",
        ],
      },
      {
        heading: "4. Tracking and delivery",
        paragraphs: [
          "Tracking updates are provided based on scans from the assigned courier partner. Delivery confirmation may include signature, OTP, or partner-app proof of delivery.",
          "Failed delivery attempts may lead to reattempts, hold at a local facility, or return to origin as per partner rules.",
        ],
      },
      {
        heading: "5. Restricted items",
        paragraphs: [
          "Prohibited and restricted goods (including hazardous materials, currency, illegal items, and other courier-banned categories) cannot be shipped. Booking such items may result in seizure, cancellation without refund of network costs, or legal consequences.",
        ],
      },
    ],
  },
  {
    slug: "cancellation-policy",
    title: "Cancellation Policy",
    lastUpdated: "12 July 2026",
    summary:
      "When you can cancel a booking and how refunds or credits are handled.",
    sections: [
      {
        heading: "1. Before pickup",
        paragraphs: [
          "You may request cancellation before the shipment is picked up or handed over to the courier partner. Contact support with your booking reference as early as possible.",
          "If no courier cost has been incurred, eligible booking fees may be refunded or credited as applicable.",
        ],
      },
      {
        heading: "2. After pickup",
        paragraphs: [
          "Once a shipment is in transit, cancellation is generally not possible. You may request delivery redirection or RTO where the courier partner allows it; extra charges may apply.",
        ],
      },
      {
        heading: "3. XGoo-initiated cancellations",
        paragraphs: [
          "We may cancel a booking for restricted items, incomplete documentation, payment issues, safety concerns, or partner non-availability. Where appropriate, we will inform you and discuss alternatives or refunds of unused charges.",
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
