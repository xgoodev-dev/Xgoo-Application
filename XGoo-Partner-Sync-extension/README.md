# XGoo Partner Sync — Browser Extension

Chrome/Edge extension that autofill courier partner booking forms from XGoo shipments.

## Install (development)

1. Open **chrome://extensions** (or **edge://extensions**).
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `extension/`

## Usage

1. In XGoo, open a shipment → **Partner sync** → **Open in partner portal**.
2. Log in to the partner site if needed (Delhivery, ICL, ST Courier, etc.).
3. The extension shows a banner **Autofill** or fills fields automatically after ~1.5s.
4. Review the form and **submit manually** on the partner site.
5. Paste the partner AWB back into XGoo → **Save partner AWB**.

## Supported portals

| Partner | Host | Adapter |
|---------|------|---------|
| Delhivery | `*.delhivery.com` | Delhivery + generic |
| ICL, ST, Franch, DTDC, Blue Dart | respective domains | Generic keyword matcher |

Generic matching uses label text and field `name` / `id` / `placeholder` keywords. Partner UIs change often — if autofill misses fields, use **Copy payload** in XGoo or the extension popup **Autofill current tab**.

## Popup

Click the extension icon to:

- See pending booking from XGoo
- **Autofill current tab** manually
- **Clear pending** payload

## XGoo dev server

The extension listens on `http://localhost:3000` and `http://127.0.0.1:3000`. For production, add your domain to `manifest.json` under `content_scripts` and `host_permissions`.

## Message protocol

| Message | Direction |
|---------|-----------|
| `XGOO_PARTNER_SYNC_V1` | XGoo page → extension (via `postMessage`) |
| `XGOO_EXTENSION_PING` / `PONG` | XGoo page detects extension |
| `XGOO_EXTENSION_STORED` | Extension confirms payload stored |

Payload shape matches `shared/partner-sync.ts` → `PartnerSyncPayload`.

## Privacy

Payload is stored in **session storage** only (cleared when browser closes). No data is sent to third parties except the partner tab you open.
