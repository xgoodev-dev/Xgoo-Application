# XGoo Bot Assistant (Hub kiosk)

Walk-in receptionist for **XGoo Hub** stores. Not a separate product. A store that has finished Hub setup (office slug + branch) can open Bot Assistant on a counter tablet.

This is **not production-complete** for payments, AWB booking, or label printing.

## Run

- Hub staff: sign in to Hub → **Bot Assistant** (sidebar) or Hub settings → Open Bot Assistant.
- Direct kiosk URL: `/kiosk/{officeSlug}?hub={branchId}`
- Local demo (no store): `/kiosk/demo` — banner says demo; no live booking.

```bash
npm run test:kiosk
npm run dev
```

Open http://localhost:3005/kiosk/demo

## What is live vs demo

| Action | Live Hub store | Demo |
|---|---|---|
| Store name, phone, hours | `GET /api/public/office/:slug/kiosk` | Demo store |
| Rates | `POST /api/public/office/:slug/kiosk/quote` (this store’s tariffs / Delhivery) | Labeled demo numbers |
| Send parcel | `POST /api/public/office/:slug/booking-request` → **booking request**, not an AWB | Demo request id only |
| Track | `GET /api/public/office/:slug/track/:number` | Disabled |
| Payment / label / dispatch | Staff complete in Hub | Never claimed |

The Bot never says a shipment is booked, paid, or labeled unless Hub has actually done that. A request number is an enquiry for this store.

## Tools / APIs

- `getStoreConfiguration` → `/api/public/office/:slug/kiosk`
- `calculateShippingRate` → `/api/public/office/:slug/kiosk/quote`
- `createShipmentDraft` → public booking-request (kind: booking_request)
- `getShipmentStatus` → office-scoped public track
- `searchKnowledgeBase` → approved articles in `shared/kiosk.ts`
- `createShipment` / `initiatePayment` / `generateShippingLabel` — **not** exposed to the kiosk. Staff use Hub New Booking.

## Production remaining

1. Device pairing token (do not leave a long-lived Hub JWT in the kiosk UI).
2. Walk-in payment verification before Hub converts the request to a shipment.
3. Thermal label print bridge (browser cannot drive USB printers).
4. Store-specific hours, languages, and knowledge instead of platform defaults.
5. Server-side staff PIN (device localStorage PIN is not identity).
6. Optional OpenAI NLU on `/kiosk/intent` — today intent is deterministic keywords.
7. Camera / USB scanner and scale adapters.
8. OS-level kiosk lock on the OnePlus Pad 3 Pro (PWA fullscreen is not Android lock task mode).

## PWA

`client/public/kiosk.webmanifest` + `kiosk-sw.js` (installable; does not cache API responses).
