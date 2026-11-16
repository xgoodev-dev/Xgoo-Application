import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { QRCodeCanvas } from "qrcode.react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import { XGOO_BRAND, XGOO_CONTACT } from "@/components/marketing/site-info";
import { websiteTrackPath } from "@shared/track-links";

const ORANGE = "#FF4907";
const INK = "#18181b";

export type HubBookingLabelParty = {
  name: string;
  phone?: string;
  address?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

export type HubBookingLabelInput = {
  bookingNumber: string;
  trackUrl: string;
  courierName?: string;
  awbNumber?: string;
  serviceType?: string;
  officeName?: string;
  officePhone?: string;
  from: HubBookingLabelParty;
  to: HubBookingLabelParty;
  contents?: string;
  weight?: string;
  pieces?: string;
  declaredValue?: string;
  paymentLabel?: string;
  chargedAmount?: string;
  printedAt?: string;
};

export function hubBookingTrackUrl(bookingNumber: string): string {
  const origin = typeof window === "undefined" ? `https://${XGOO_CONTACT.website}` : window.location.origin;
  return `${origin}${websiteTrackPath(bookingNumber)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function partyAddress(party: HubBookingLabelParty) {
  return [
    party.address,
    party.addressLine2,
    [party.city, party.state].filter(Boolean).join(", "),
    party.pincode,
  ]
    .map((part) => (part || "").trim())
    .filter(Boolean);
}

function paymentLabel(mode?: string) {
  if (mode === "cash") return "Cash";
  if (mode === "upi") return "QR";
  if (mode === "bank_transfer") return "Online";
  if (mode === "credit") return "Credit";
  return "";
}

export function hubPaymentLabel(mode?: string) {
  return paymentLabel(mode);
}

let logoDataUrlPromise: Promise<string> | null = null;

function xgooLogoDataUrl() {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch(xgooLogo)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("Could not read XGoo logo"));
            reader.readAsDataURL(blob);
          }),
      )
      .catch(() => "");
  }
  return logoDataUrlPromise;
}

function qrPngDataUrl(value: string, size = 196): Promise<string> {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-9999px;top:0;width:0;height:0;overflow:hidden";
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(
      createElement(QRCodeCanvas, {
        value,
        size,
        level: "M",
        marginSize: 1,
        bgColor: "#ffffff",
        fgColor: INK,
      }),
    );
    const tryRead = (attempt = 0) => {
      const canvas = host.querySelector("canvas");
      if (canvas && canvas.width > 0) {
        const url = canvas.toDataURL("image/png");
        root.unmount();
        host.remove();
        resolve(url);
        return;
      }
      if (attempt > 24) {
        root.unmount();
        host.remove();
        resolve("");
        return;
      }
      window.setTimeout(() => tryRead(attempt + 1), 25);
    };
    window.setTimeout(() => tryRead(), 30);
  });
}

function fact(label: string, value?: string) {
  if (!(value || "").trim()) return "";
  return `<div class="fact"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value!.trim())}</strong></div>`;
}

function labelHtml(input: HubBookingLabelInput, logoUrl: string, qrUrl: string) {
  const fromLines = partyAddress(input.from);
  const toLines = partyAddress(input.to);
  const service = (input.serviceType || "").toLowerCase() === "air" ? "Air" : "Surface";
  const logo = logoUrl
    ? `<img class="mark" src="${logoUrl}" alt="${escapeHtml(XGOO_BRAND.productName)}" />`
    : `<div class="mark fallback">XG</div>`;
  const qr = qrUrl
    ? `<img class="qr" src="${qrUrl}" alt="Scan to view this booking" />`
    : "";
  const title = input.bookingNumber || XGOO_BRAND.productName;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { size: A5 portrait; margin: 0; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #fff;
        color: ${INK};
        font-family: "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .sheet { width: 148mm; min-height: 210mm; padding: 7mm; }
      .card {
        min-height: 196mm;
        border: 2.5px solid ${INK};
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .brand {
        background: ${ORANGE};
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 11px 14px;
      }
      .brand-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .mark {
        width: 40px;
        height: 40px;
        object-fit: contain;
        background: #fff;
        border-radius: 8px;
        flex-shrink: 0;
      }
      .mark.fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 900;
        color: ${ORANGE};
      }
      .wordmark { font-size: 28px; font-weight: 900; letter-spacing: 0.02em; line-height: 1; }
      .store { margin: 3px 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.95; }
      .service {
        border: 1.5px solid #fff;
        padding: 5px 10px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .id-row {
        display: grid;
        grid-template-columns: 1fr 92px;
        gap: 12px;
        align-items: center;
        padding: 12px 14px 10px;
        border-bottom: 2.5px solid ${INK};
      }
      .kicker {
        margin: 0;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: ${ORANGE};
      }
      .booking-id {
        margin: 4px 0 6px;
        font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
        font-size: 26px;
        font-weight: 800;
        letter-spacing: 0.06em;
        line-height: 1.1;
        word-break: break-all;
      }
      .scan-hint { margin: 0; font-size: 11px; color: #52525b; }
      .qr-wrap {
        width: 92px;
        height: 92px;
        padding: 4px;
        border: 1.5px solid ${INK};
        background: #fff;
      }
      .qr { width: 100%; height: 100%; display: block; }
      .meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        border-bottom: 2px solid ${INK};
      }
      .meta .cell {
        padding: 10px 14px;
        border-right: 2px solid ${INK};
      }
      .meta .cell:nth-child(2n) { border-right: 0; }
      .meta .cell:nth-child(n+3) { border-top: 2px solid ${INK}; }
      .meta strong { display: block; margin-top: 2px; font-size: 14px; font-weight: 800; }
      .parties { display: grid; grid-template-columns: 1fr 1fr; flex: 1; }
      .party { padding: 12px 14px; }
      .party.to { border-left: 8px solid ${ORANGE}; padding-left: 12px; }
      .party.from { border-right: 2px solid ${INK}; }
      .name { margin: 4px 0 8px; font-size: 18px; font-weight: 800; line-height: 1.15; }
      .to .name { font-size: 22px; }
      .lines { margin: 0; font-size: 13px; line-height: 1.45; color: #27272a; }
      .phone { display: block; margin-top: 8px; font-size: 13px; font-weight: 700; }
      .facts {
        display: grid;
        grid-template-columns: 1fr 1fr;
        border-top: 2px solid ${INK};
        border-bottom: 2px solid ${INK};
      }
      .fact { padding: 10px 14px; border-right: 2px solid ${INK}; border-bottom: 2px solid ${INK}; }
      .fact:nth-child(2n) { border-right: 0; }
      .fact:last-child:nth-child(odd) { grid-column: 1 / -1; border-right: 0; }
      .fact span {
        display: block;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #71717a;
      }
      .fact strong { display: block; margin-top: 2px; font-size: 14px; font-weight: 800; }
      .foot {
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 9px 14px;
        background: ${INK};
        color: #fff;
        font-size: 11px;
        font-weight: 700;
      }
      .foot .site { color: ${ORANGE}; }
      @media print {
        html, body { width: 148mm; height: 210mm; }
        .sheet { width: 100%; min-height: 210mm; padding: 6mm; }
        .card { min-height: calc(210mm - 12mm); }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <article class="card">
        <header class="brand">
          <div class="brand-left">
            ${logo}
            <div>
              <div class="wordmark">${escapeHtml(XGOO_BRAND.productName)}</div>
              <p class="store">${escapeHtml(input.officeName || XGOO_BRAND.productName)}</p>
            </div>
          </div>
          <div class="service">${escapeHtml(service)}</div>
        </header>
        <section class="id-row">
          <div>
            <p class="kicker">Booking</p>
            <p class="booking-id">${escapeHtml(input.bookingNumber)}</p>
            <p class="scan-hint">Scan the code to view this booking</p>
          </div>
          <div class="qr-wrap">${qr}</div>
        </section>
        <section class="meta">
          <div class="cell"><p class="kicker">Courier</p><strong>${escapeHtml(input.courierName || "—")}</strong></div>
          <div class="cell"><p class="kicker">Shipper no.</p><strong>${escapeHtml(input.awbNumber || "Pending")}</strong></div>
          <div class="cell"><p class="kicker">Date</p><strong>${escapeHtml(input.printedAt || "")}</strong></div>
          <div class="cell"><p class="kicker">Payment</p><strong>${escapeHtml(input.paymentLabel || "—")}</strong></div>
        </section>
        <div class="parties">
          <section class="party from">
            <p class="kicker">From</p>
            <p class="name">${escapeHtml(input.from.name || "—")}</p>
            <p class="lines">${fromLines.length ? fromLines.map((line) => escapeHtml(line)).join("<br />") : "—"}</p>
            ${input.from.phone ? `<span class="phone">${escapeHtml(input.from.phone)}</span>` : ""}
          </section>
          <section class="party to">
            <p class="kicker">To</p>
            <p class="name">${escapeHtml(input.to.name || "—")}</p>
            <p class="lines">${toLines.length ? toLines.map((line) => escapeHtml(line)).join("<br />") : "—"}</p>
            ${input.to.phone ? `<span class="phone">${escapeHtml(input.to.phone)}</span>` : ""}
          </section>
        </div>
        <section class="facts">
          ${fact("Contents", input.contents) || fact("Contents", "Parcel")}
          ${fact("Weight", input.weight ? `${input.weight} kg` : "")}
          ${fact("Pieces", input.pieces)}
          ${fact("Amount", input.chargedAmount ? `Rs. ${input.chargedAmount}` : "")}
          ${fact("Declared value", input.declaredValue ? `Rs. ${input.declaredValue}` : "")}
        </section>
        <footer class="foot">
          <span>${escapeHtml(input.officePhone || XGOO_CONTACT.phone)}</span>
          <span class="site">${escapeHtml(XGOO_CONTACT.website)}</span>
        </footer>
      </article>
    </div>
  </body>
</html>`;
}

function writeAndPrint(doc: Document, win: Window, html: string) {
  doc.open();
  doc.write(html);
  doc.close();

  let printed = false;
  const run = () => {
    if (printed) return;
    printed = true;
    win.focus();
    win.print();
    window.setTimeout(() => {
      const frame = win.frameElement;
      if (frame?.parentNode) frame.parentNode.removeChild(frame);
    }, 2500);
  };

  const images = Array.from(doc.images);
  const pending = images.filter((image) => !image.complete);
  if (pending.length === 0) {
    window.setTimeout(run, 250);
    return;
  }
  Promise.all(
    pending.map(
      (image) =>
        new Promise<void>((resolve) => {
          image.onload = () => resolve();
          image.onerror = () => resolve();
        }),
    ),
  ).then(() => window.setTimeout(run, 200));
}

export async function printHubBookingLabel(input: HubBookingLabelInput): Promise<boolean> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "148mm";
  iframe.style.height = "210mm";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document || iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    return false;
  }

  const [logoUrl, qrUrl] = await Promise.all([
    xgooLogoDataUrl(),
    qrPngDataUrl(input.trackUrl),
  ]);
  writeAndPrint(doc, win, labelHtml(input, logoUrl, qrUrl));
  return true;
}
