import type { CourierRoute, CourierRouteBenefit } from "./types";

const ORIGIN_CITY = "Hyderabad";
const ORIGIN_SLUG = "hyderabad";

function benefitsFor(countryName: string, destinationPhrase = countryName): CourierRouteBenefit[] {
  return [
    {
      title: "Door-to-door international courier",
      text: `Book a shipment from your Hyderabad address through to an address in ${destinationPhrase}.`,
    },
    {
      title: "Pickup from Hyderabad",
      text: "Share your pickup location and we arrange collection from Kondapur and the wider Hyderabad area.",
    },
    {
      title: "Documents and parcels",
      text: "Send papers, personal belongings, gifts, and other permitted packages — not only commercial freight.",
    },
    {
      title: "Tracking support",
      text: "Once a booking or AWB is issued, you can follow status updates online until delivery is complete.",
    },
    {
      title: "Packing guidance",
      text: "We help you describe and pack the shipment so it is suitable for international courier handling.",
    },
    {
      title: "Customer support",
      text: "Talk to the XGoo team on phone, email, or WhatsApp during office hours.",
    },
    {
      title: "Quote before you book",
      text: "Share weight and destination details and we will come back with rates for your shipment. Transit times and prices vary by destination and partner.",
    },
    {
      title: "International destinations",
      text: `${countryName} is among the international routes we coordinate from our Hyderabad courier service.`,
    },
  ];
}

const SHARED_SHIPMENT_TYPES = [
  "Documents",
  "Clothes",
  "Personal belongings",
  "Gifts",
  "Books",
  "Samples",
  "Business documents",
  "Other permitted parcels",
];

export const COURIER_ROUTES: CourierRoute[] = [
  {
    slug: "usa",
    kind: "country",
    originCity: ORIGIN_CITY,
    originSlug: ORIGIN_SLUG,
    countryName: "USA",
    countryCode: "US",
    destinationPhrase: "the USA",
    seoTitle: "Courier from Hyderabad to USA | XGoo Courier Services",
    metaDescription:
      "Send parcels and documents from Hyderabad to the USA with XGoo Courier Services. Get a quote for international courier pickup and delivery.",
    h1: "Courier Service from Hyderabad to USA",
    heroSupport:
      "Send documents and parcels from Hyderabad to the USA with XGoo's international courier service. Pickup from Hyderabad, door-to-door delivery, and tracking once your booking is confirmed.",
    keywords: [
      "courier from Hyderabad to USA",
      "Hyderabad to USA courier service",
      "send parcel from Hyderabad to USA",
      "international courier Hyderabad to USA",
      "send documents from Hyderabad to USA",
      "door to door courier Hyderabad to USA",
    ],
    intro: [
      "Hyderabad has a large community with family, classmates, and colleagues across the United States. People here regularly send university papers, personal gifts, clothes, and small parcels to cities such as New York, Dallas, and the Bay Area.",
      "XGoo is a courier service in Hyderabad that helps you book an international shipment without guessing the next step. Tell us what you are sending and where it needs to go — we arrange pickup and work with partner networks for the US leg.",
      "Rates depend on weight, dimensions, contents, and the destination city. We do not publish a single USA price, because a set of documents to New Jersey is not the same shipment as a parcel to Los Angeles.",
    ],
    reasonsHeading: "Why people in Hyderabad send parcels to the USA",
    reasons: [
      "Students and graduates posting documents or personal items to US universities and apartments",
      "IT and healthcare professionals sending clothes, gifts, or papers to family already in the US",
      "Parents in Hyderabad shipping festival gifts, sweets-safe dry items (where permitted), and books",
      "Small businesses sending samples or signed commercial documents to US counterparts",
    ],
    destinationSections: [
      {
        heading: "Sending a parcel from Hyderabad to the USA",
        paragraphs: [
          "Start with the destination city, a contact number that works in the US, and an honest description of the contents. US deliveries often go to apartments, university mailrooms, or suburban homes — the more precise the address, the smoother the last mile.",
          "Door-to-door courier from Hyderabad means we collect from your pickup point here and the partner network attempts delivery at the US address you provide. You will get a booking or AWB reference for tracking once the shipment is accepted.",
        ],
      },
      {
        heading: "Documents versus parcels to the USA",
        paragraphs: [
          "Document shipments are typically lighter: offer letters, transcripts, contracts, or personal paperwork. Parcels include clothes, books, gifts, and other permitted goods. Declare the contents clearly so we can advise on packing and the right service type.",
          "Restricted and prohibited items depend on US customs rules and the courier partner. Hazardous goods, currency, and other banned categories cannot be booked. See our shipping policy if you are unsure.",
        ],
      },
    ],
    citiesHeading: "Popular destinations we serve in the USA",
    cities: [
      { name: "New York" },
      { name: "New Jersey" },
      { name: "Los Angeles" },
      { name: "Chicago" },
      { name: "Houston" },
      { name: "Dallas" },
      { name: "San Francisco" },
      { name: "Seattle" },
      { name: "Boston" },
      { name: "Atlanta" },
    ],
    shipmentTypes: SHARED_SHIPMENT_TYPES,
    benefits: benefitsFor("USA", "the USA"),
    faqs: [
      {
        q: "How can I send a parcel from Hyderabad to USA?",
        a: "Book a pickup on this page or book online with XGoo. Share pickup details in Hyderabad, the US delivery address, contents, and approximate weight. We arrange pickup and coordinate the international movement through partner courier networks.",
      },
      {
        q: "How much does it cost to send a parcel from Hyderabad to USA?",
        a: "Cost depends on actual and volumetric weight, destination city, contents, and the service available for that lane. There is no single USA rate. Book a pickup on this page and we will share a quote for your shipment.",
      },
      {
        q: "Can I send documents from Hyderabad to USA?",
        a: "Yes. Document courier from Hyderabad to the USA is a common request — university papers, contracts, and personal documents. Pack them flat and dry, and describe the contents accurately when you enquire.",
      },
      {
        q: "Do you provide door-to-door courier service from Hyderabad to USA?",
        a: "Yes. XGoo arranges pickup from your Hyderabad address and delivery is attempted at the US address you provide, through the assigned courier partner.",
      },
      {
        q: "How can I get a courier quote from Hyderabad to USA?",
        a: "Book a pickup on this page with your phone number, destination city, package type, and weight. You can also WhatsApp or call us. We respond with rates based on the details you share.",
      },
      {
        q: "What items can I send to USA from Hyderabad?",
        a: "Typical shipments include documents, clothes, books, gifts, samples, and other permitted personal or business parcels. Prohibited and restricted goods cannot be shipped. Destination-country and courier rules apply.",
      },
      {
        q: "How do I track my international shipment to the USA?",
        a: "After we accept the booking and an AWB or booking number is issued, track it on xgoo.in with that reference. Updates follow scans from the assigned courier partner.",
      },
    ],
    relatedSlugs: ["canada", "uk", "australia"],
    ctaQuote: "Get a USA Courier Quote",
    ctaBook: "Send Your Parcel to USA",
    analyticsRoute: "hyderabad_to_usa",
  },
  {
    slug: "australia",
    kind: "country",
    originCity: ORIGIN_CITY,
    originSlug: ORIGIN_SLUG,
    countryName: "Australia",
    countryCode: "AU",
    destinationPhrase: "Australia",
    seoTitle: "Courier from Hyderabad to Australia | XGoo Courier Services",
    metaDescription:
      "Book international courier from Hyderabad to Australia with XGoo. Send documents and parcels to Sydney, Melbourne, and other cities — get a pickup quote.",
    h1: "Courier Service from Hyderabad to Australia",
    heroSupport:
      "Send documents and parcels from Hyderabad to Australia with XGoo's international courier service. Pickup in Hyderabad, door-to-door delivery, and tracking after confirmation.",
    keywords: [
      "courier from Hyderabad to Australia",
      "Hyderabad to Australia courier service",
      "send parcel from Hyderabad to Australia",
      "international courier Hyderabad to Australia",
      "send documents from Hyderabad to Sydney",
      "door to door courier Hyderabad to Australia",
    ],
    intro: [
      "Many households in Hyderabad have someone studying or settling in Australia. The typical shipment is not a pallet — it is a bag of clothes for a new rental in Melbourne, a set of documents for a university in Sydney, or a parcel of books and gifts for family in Brisbane.",
      "XGoo's international courier service in Hyderabad is built for those everyday movements. You stay with one local team for pickup and questions; the physical journey uses trusted partner networks.",
      "Australian addresses often include a suburb and state (NSW, VIC, QLD, WA, SA). Include those details when you request a quote so we can price the lane correctly.",
    ],
    reasonsHeading: "Common reasons to ship from Hyderabad to Australia",
    reasons: [
      "Students starting a semester who need documents or a first box of clothes after they land",
      "Families sending gifts and personal items to relatives who have moved on skilled visas",
      "Professionals forwarding paperwork or samples to Australian offices",
      "Return of personal belongings after a visit home to Hyderabad",
    ],
    destinationSections: [
      {
        heading: "Hyderabad to Australia courier, without the guesswork",
        paragraphs: [
          "Australia is a long-haul destination. Weight and carton size matter more than they do on a domestic booking. Measure the packed box, note the suburb, and tell us if the contents are documents only or a mixed personal parcel.",
          "We collect from your Hyderabad pickup point. Delivery is attempted at the Australian address you give us. Transit estimates, when we share them, are indicative — they are not a guaranteed arrival date.",
        ],
      },
      {
        heading: "What usually travels on this route",
        paragraphs: [
          "Document envelopes for universities and employers are frequent. So are soft parcels of clothing and books. Biosecurity rules in Australia are strict for food, plants, and some organic items — if you are unsure, ask us before packing rather than assuming it will clear.",
          "We will not invent a customs outcome. Restricted items follow Australian and courier-partner rules, and we may decline a booking that is not permitted.",
        ],
      },
    ],
    citiesHeading: "Popular destinations we serve in Australia",
    cities: [
      { name: "Sydney" },
      { name: "Melbourne" },
      { name: "Brisbane" },
      { name: "Perth" },
      { name: "Adelaide" },
      { name: "Canberra" },
      { name: "Gold Coast" },
      { name: "Hobart" },
    ],
    shipmentTypes: SHARED_SHIPMENT_TYPES,
    benefits: benefitsFor("Australia"),
    faqs: [
      {
        q: "How do I send a parcel from Hyderabad to Australia?",
        a: "Book a pickup with your Hyderabad pickup area, the Australian suburb and city, package type, and approximate weight. We will confirm next steps and arrange collection once you are ready.",
      },
      {
        q: "Can I send documents to Sydney or Melbourne from Hyderabad?",
        a: "Yes. Document courier to Australian cities is a regular request from Hyderabad. Include the full postal address and a reachable phone number for the receiver.",
      },
      {
        q: "Do you pick up from Hyderabad for Australia shipments?",
        a: "Yes. Courier pickup from Hyderabad is part of the service. Share your locality — including Kondapur and other parts of the city — when you enquire.",
      },
      {
        q: "How are Australia courier rates calculated?",
        a: "Rates follow weight (actual and volumetric), destination, contents, and the available partner service. We quote after we see your details rather than advertising a flat Australia price.",
      },
      {
        q: "Can I send food or spices to Australia?",
        a: "Australia has strict biosecurity rules. Many food and plant items are restricted or prohibited. Ask us before packing; we cannot ship items that destination or courier rules do not allow.",
      },
      {
        q: "Is delivery door-to-door in Australia?",
        a: "We arrange door-to-door movement: pickup in Hyderabad and delivery attempt at the Australian address through the assigned partner. Apartment and campus mailrooms should be mentioned in the address.",
      },
      {
        q: "How do I track a shipment to Australia?",
        a: "Use the booking or AWB number on the XGoo tracking page. Scan updates come from the courier partner handling the international movement.",
      },
    ],
    relatedSlugs: ["usa", "uk", "canada", "uae"],
    ctaQuote: "Get an Australia Courier Quote",
    ctaBook: "Send Your Parcel to Australia",
    analyticsRoute: "hyderabad_to_australia",
  },
  {
    slug: "canada",
    kind: "country",
    originCity: ORIGIN_CITY,
    originSlug: ORIGIN_SLUG,
    countryName: "Canada",
    countryCode: "CA",
    destinationPhrase: "Canada",
    seoTitle: "Courier from Hyderabad to Canada | XGoo Courier Services",
    metaDescription:
      "Send parcels and documents from Hyderabad to Canada with XGoo Courier Services. Request a quote for pickup and door-to-door international delivery.",
    h1: "Courier Service from Hyderabad to Canada",
    heroSupport:
      "Send documents and parcels from Hyderabad to Canada with XGoo's international courier service. Pickup locally, delivery to Canadian addresses, and tracking after your booking is accepted.",
    keywords: [
      "courier from Hyderabad to Canada",
      "Hyderabad to Canada courier service",
      "send parcel from Hyderabad to Toronto",
      "international courier Hyderabad to Canada",
      "send documents from Hyderabad to Canada",
      "door to door courier Hyderabad to Canada",
    ],
    intro: [
      "The Hyderabad–Canada lane is shaped by students, new permanent residents, and families already living in the Greater Toronto Area, Vancouver, and Calgary. Shipments are often personal: winter clothing sent after someone lands, documents for a school or employer, or a box from home.",
      "Canadian addresses use a six-character postal code (for example M5V 2T6). Including the correct code and province (ON, BC, AB, QC) helps the partner network price and deliver the shipment.",
      "XGoo handles the Hyderabad side — enquiry, pickup, and booking — and coordinates the international movement. We will quote based on what you are actually sending, not a generic Canada flyer rate.",
    ],
    reasonsHeading: "Why Hyderabad senders book Canada courier",
    reasons: [
      "Students who need documents or a first parcel of clothes after arriving in Toronto, Waterloo, or Vancouver",
      "Families in Hyderabad sending gifts and personal items to relatives in Brampton, Mississauga, or Surrey",
      "Professionals forwarding paperwork to Canadian offices",
      "People who visited Hyderabad and need a follow-on box sent to their Canadian address",
    ],
    destinationSections: [
      {
        heading: "Sending from Hyderabad to Canada",
        paragraphs: [
          "Canada is not a single delivery zone. A document envelope to downtown Toronto is a different booking from a heavier parcel to a house in Edmonton. Tell us the city, postal code, and whether the receiver is in an apartment, basement suite, or campus residence.",
          "Pickup is from your Hyderabad location. We do not promise a fixed number of days to Canada — service availability and transit vary by partner and season.",
        ],
      },
      {
        heading: "Documents, clothes, and personal goods",
        paragraphs: [
          "Document courier remains common for study and work paperwork. Clothing and personal belongings are the other frequent parcel type, especially before a Canadian winter. Pack for handling, not only for the flight.",
          "Do not pack prohibited or restricted items. Canada and courier partners set those rules; we will decline bookings we cannot legally move.",
        ],
      },
    ],
    citiesHeading: "Popular destinations we serve in Canada",
    cities: [
      { name: "Toronto" },
      { name: "Vancouver" },
      { name: "Calgary" },
      { name: "Ottawa" },
      { name: "Montreal" },
      { name: "Edmonton" },
      { name: "Mississauga" },
      { name: "Brampton" },
      { name: "Winnipeg" },
      { name: "Surrey" },
    ],
    shipmentTypes: SHARED_SHIPMENT_TYPES,
    benefits: benefitsFor("Canada"),
    faqs: [
      {
        q: "How can I send a parcel from Hyderabad to Canada?",
        a: "Share your Hyderabad pickup details, the Canadian city and postal code, contents, and weight when you book a pickup. We will follow up with rates and booking steps. You can also book online or message us on WhatsApp.",
      },
      {
        q: "Do you deliver to Toronto, Brampton, and Mississauga?",
        a: "Those cities are among the most common Canada destinations we see from Hyderabad. Include the full address and postal code so we can quote the correct lane.",
      },
      {
        q: "Can I send winter clothes from Hyderabad to Canada?",
        a: "Personal clothing is a typical permitted parcel, provided it is packed securely and declared accurately. We will confirm if your contents fit what the partner can carry.",
      },
      {
        q: "How much is courier from Hyderabad to Canada?",
        a: "There is no single Canada price. Weight, dimensions, destination, and contents change the quote. Send your details and we will calculate from there.",
      },
      {
        q: "Is it door-to-door from Hyderabad?",
        a: "Yes. We arrange pickup in Hyderabad and the partner network attempts delivery at the Canadian address you provide.",
      },
      {
        q: "Can I send study or work documents to Canada?",
        a: "Document shipments are accepted when the contents are permitted. We move the physical papers — we do not process visas or immigration applications.",
      },
      {
        q: "How do I track a Canada shipment?",
        a: "Track with your XGoo booking or AWB number once it has been issued. Status updates follow partner scans.",
      },
    ],
    relatedSlugs: ["usa", "uk", "australia"],
    ctaQuote: "Get a Canada Courier Quote",
    ctaBook: "Send Your Parcel to Canada",
    analyticsRoute: "hyderabad_to_canada",
  },
  {
    slug: "uk",
    kind: "country",
    originCity: ORIGIN_CITY,
    originSlug: ORIGIN_SLUG,
    countryName: "UK",
    countryCode: "GB",
    destinationPhrase: "the UK",
    seoTitle: "Courier from Hyderabad to UK | XGoo Courier Services",
    metaDescription:
      "Send parcels and documents from Hyderabad to the UK with XGoo Courier Services. Get a quote for international pickup to London, Birmingham, Manchester, and more.",
    h1: "Courier Service from Hyderabad to UK",
    heroSupport:
      "Send documents and parcels from Hyderabad to the UK with XGoo's international courier service. Local pickup, door-to-door delivery, and tracking after confirmation.",
    keywords: [
      "courier from Hyderabad to UK",
      "Hyderabad to UK courier service",
      "send parcel from Hyderabad to London",
      "international courier Hyderabad to UK",
      "send documents from Hyderabad to UK",
      "door to door courier Hyderabad to UK",
    ],
    intro: [
      "Hyderabad’s links with the United Kingdom run through students, NHS and IT professionals, and families in London and the Midlands. A UK booking from here is often a document pack, a carton of clothes for a new flat, or a gift parcel timed around a visit or festival.",
      "UK addresses use a postcode (for example B1 1AA or E1 6AN). That postcode is as important as the city name when we quote and when the partner delivers.",
      "XGoo is your courier service in Hyderabad for the enquiry and pickup. We coordinate the international movement and share tracking once a booking or AWB exists.",
    ],
    reasonsHeading: "Typical Hyderabad to UK shipments",
    reasons: [
      "University documents and personal papers for students in London, Birmingham, Manchester, or Glasgow",
      "Clothes and household bits for someone who has just started a role in the UK",
      "Gifts and books sent by family remaining in Hyderabad",
      "Business documents and samples for UK counterparts",
    ],
    destinationSections: [
      {
        heading: "Booking courier from Hyderabad to the UK",
        paragraphs: [
          "Tell us whether you are sending documents only or a parcel, the UK postcode, and a phone number the receiver will answer. Many UK deliveries are to flats with concierge or to shared student houses — extra access notes help.",
          "We collect from Hyderabad. Delivery is attempted at the UK address through the assigned partner. We will not lock a calendar date on this page; times vary by service and destination.",
        ],
      },
      {
        heading: "What you can send to the UK",
        paragraphs: [
          "Documents, clothes, books, gifts, samples, and other permitted personal or commercial parcels are the usual contents. Do not include prohibited, hazardous, or restricted items.",
          "If a category is unclear, ask before you tape the box. Our shipping policy summarises restricted goods at a high level; destination and partner rules still apply.",
        ],
      },
    ],
    citiesHeading: "Popular destinations we serve in the UK",
    cities: [
      { name: "London" },
      { name: "Birmingham" },
      { name: "Manchester" },
      { name: "Leicester" },
      { name: "Leeds" },
      { name: "Glasgow" },
      { name: "Edinburgh" },
      { name: "Bristol" },
      { name: "Reading" },
      { name: "Milton Keynes" },
    ],
    shipmentTypes: SHARED_SHIPMENT_TYPES,
    benefits: benefitsFor("UK", "the UK"),
    faqs: [
      {
        q: "How do I send a parcel from Hyderabad to the UK?",
        a: "Book a pickup with your Hyderabad pickup location, the UK city and postcode, contents, and weight. We arrange collection and coordinate delivery through partner networks.",
      },
      {
        q: "Can I send documents from Hyderabad to London?",
        a: "Yes. Document courier to London and other UK cities is a standard request. Use a complete address with postcode and a working UK contact number.",
      },
      {
        q: "Do you offer door-to-door courier from Hyderabad to the UK?",
        a: "Yes. Pickup is from your Hyderabad address and delivery is attempted at the UK address you provide.",
      },
      {
        q: "How much does Hyderabad to UK courier cost?",
        a: "The quote depends on weight, size, contents, and destination postcode. Share those details on this page and we will respond with rates for your shipment.",
      },
      {
        q: "Can I send gifts to family in Birmingham or Leicester?",
        a: "Gifts and personal parcels are commonly booked on this route when the items are permitted. Describe the contents so we can advise on packing and service type.",
      },
      {
        q: "Where do you pick up in Hyderabad?",
        a: "We provide courier pickup from Hyderabad, including localities such as Kondapur. Add your area on the form so we can plan collection.",
      },
      {
        q: "How do I track a UK shipment?",
        a: "Once you have a booking or AWB number, track it on the XGoo website. Updates reflect partner scans in transit.",
      },
    ],
    relatedSlugs: ["uae", "usa", "canada"],
    ctaQuote: "Get a UK Courier Quote",
    ctaBook: "Send Your Parcel to the UK",
    analyticsRoute: "hyderabad_to_uk",
  },
  {
    slug: "uae",
    kind: "country",
    originCity: ORIGIN_CITY,
    originSlug: ORIGIN_SLUG,
    countryName: "UAE",
    countryCode: "AE",
    destinationPhrase: "the UAE",
    seoTitle: "Courier from Hyderabad to UAE | XGoo Courier Services",
    metaDescription:
      "Send parcels and documents from Hyderabad to the UAE with XGoo Courier Services. Get a quote for courier pickup to Dubai, Abu Dhabi, Sharjah, and more.",
    h1: "Courier Service from Hyderabad to UAE",
    heroSupport:
      "Send documents and parcels from Hyderabad to the UAE with XGoo's international courier service. Pickup from Hyderabad and door-to-door delivery to Dubai, Abu Dhabi, and other emirates.",
    keywords: [
      "courier from Hyderabad to UAE",
      "Hyderabad to Dubai courier service",
      "send parcel from Hyderabad to UAE",
      "international courier Hyderabad to Dubai",
      "send documents from Hyderabad to UAE",
      "door to door courier Hyderabad to UAE",
    ],
    intro: [
      "The Hyderabad–Gulf corridor is one of the most familiar international routes for families here. People send documents for new jobs in Dubai, clothes and personal items to apartments in Sharjah or Abu Dhabi, and regular parcels to relatives working across the emirates.",
      "UAE addresses often include an emirate, community, building name, and a mobile number that works on a UAE network. Those details matter more than a landmark-only description.",
      "As an international courier service in Hyderabad, XGoo takes the booking and pickup locally and coordinates the movement to the UAE. We quote from your actual weight and destination — not a one-line Dubai special that ignores what is in the box.",
    ],
    reasonsHeading: "Why this route is booked from Hyderabad",
    reasons: [
      "Professionals who have moved to Dubai or Abu Dhabi and need a follow-on box from home",
      "Families sending documents, clothes, and gifts to someone working in the UAE",
      "Business documents and samples for companies based in the emirates",
      "Students or short-stay visitors who left belongings in Hyderabad",
    ],
    destinationSections: [
      {
        heading: "Courier from Hyderabad to Dubai and the wider UAE",
        paragraphs: [
          "Dubai is the most requested city on this lane, but we also see regular bookings for Abu Dhabi, Sharjah, and Ajman. Say which emirate and whether the delivery is to a villa, apartment, or office so the partner can plan the last mile.",
          "Pickup is from your Hyderabad address. We will not advertise a guaranteed next-day UAE service on this page. Availability and transit depend on the partner service we assign after we see the shipment details.",
        ],
      },
      {
        heading: "Documents and personal parcels to the UAE",
        paragraphs: [
          "Employment papers, certificates, and personal documents are a large share of Hyderabad to UAE bookings. Personal parcels of clothes and gifts are the other. Pack for heat and handling, and list the contents honestly.",
          "Restricted items still apply. Do not send prohibited, hazardous, or courier-banned goods. If you are unsure about a category, ask us first.",
        ],
      },
    ],
    citiesHeading: "Popular destinations we serve in the UAE",
    cities: [
      { name: "Dubai" },
      { name: "Abu Dhabi" },
      { name: "Sharjah" },
      { name: "Ajman" },
      { name: "Ras Al Khaimah" },
      { name: "Fujairah" },
      { name: "Al Ain" },
    ],
    shipmentTypes: SHARED_SHIPMENT_TYPES,
    benefits: benefitsFor("UAE", "the UAE"),
    faqs: [
      {
        q: "How can I send a parcel from Hyderabad to Dubai?",
        a: "Book a pickup with your Hyderabad pickup area, the Dubai community or full address, contents, and weight. We arrange pickup and coordinate delivery through partner networks.",
      },
      {
        q: "Do you send courier from Hyderabad to Abu Dhabi and Sharjah as well?",
        a: "Yes. Dubai is common, but we also handle bookings to other emirates. Name the emirate and building details when you enquire.",
      },
      {
        q: "Can I send documents from Hyderabad to the UAE?",
        a: "Yes. Document courier is one of the most frequent Hyderabad to UAE requests. Pack papers flat and keep a copy of what you sent.",
      },
      {
        q: "How much does Hyderabad to UAE courier cost?",
        a: "Price depends on weight, size, contents, and the destination emirate. Share those details for a quote rather than relying on a generic UAE rate.",
      },
      {
        q: "Is pickup available from Hyderabad?",
        a: "Yes. We provide courier pickup from Hyderabad, including Kondapur and other localities. Add your area on the form.",
      },
      {
        q: "Do you offer door-to-door service to the UAE?",
        a: "Yes. We collect from your Hyderabad address and delivery is attempted at the UAE address you provide.",
      },
      {
        q: "How do I track my UAE shipment?",
        a: "Track with the booking or AWB number issued after we accept the shipment. Updates follow the partner’s scans.",
      },
    ],
    relatedSlugs: ["uk", "usa", "australia", "canada"],
    ctaQuote: "Get a UAE Courier Quote",
    ctaBook: "Send Your Parcel to the UAE",
    analyticsRoute: "hyderabad_to_uae",
  },
];
