import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import { XGOO_BRAND, XGOO_CONTACT, XGOO_MODULES } from "@/components/marketing/site-info";

const ORANGE = "#FF4907";
const INK = "#18181b";

export type ProParcelSlipParty = {
  name: string;
  phone?: string | null;
  address: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
};

export type ProParcelSlipInput = {
  from: ProParcelSlipParty;
  to: ProParcelSlipParty;
  contents?: string | null;
  pieces?: number | null;
  weight?: string | number | null;
  bookingRef?: string | null;
  xgooOrderId?: string | null;
  channel?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function partyLines(party: ProParcelSlipParty) {
  return [
    party.address,
    [party.city, party.state].filter(Boolean).join(", "),
  ].filter(Boolean);
}

function barcodeSvg(value: string) {
  const pattern: number[] = [1, 1, 0, 1, 0];
  for (const char of value) {
    const code = char.charCodeAt(0);
    for (let bit = 6; bit >= 0; bit--) {
      const on = (code >> bit) & 1;
      pattern.push(on ? 1 : 0, 1, 0);
    }
  }
  pattern.push(1, 0, 1, 1);
  const barWidth = 1.25;
  const width = Math.max(180, pattern.length * barWidth);
  const height = 42;
  let x = 0;
  const rects: string[] = [];
  for (const bit of pattern) {
    if (bit) {
      rects.push(
        `<rect x="${x.toFixed(2)}" y="0" width="${barWidth}" height="${height}" fill="${INK}"/>`,
      );
    }
    x += barWidth;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" width="100%" height="${height}px" role="img" aria-label="${escapeHtml(value)}">${rects.join("")}</svg>`;
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

function slipHtml(input: ProParcelSlipInput, logoUrl: string) {
  const xgooId = input.xgooOrderId?.trim() || "";
  const fromLines = partyLines(input.from);
  const toLines = partyLines(input.to);
  const facts = [
    input.contents?.trim()
      ? `<div class="fact"><span>Contents</span><strong>${escapeHtml(input.contents.trim())}</strong></div>`
      : "",
    input.pieces
      ? `<div class="fact"><span>Pieces</span><strong>${escapeHtml(String(input.pieces))}</strong></div>`
      : "",
    input.weight
      ? `<div class="fact"><span>Weight</span><strong>${escapeHtml(String(input.weight))} kg</strong></div>`
      : "",
    input.channel
      ? `<div class="fact"><span>Via</span><strong>${escapeHtml(input.channel)}</strong></div>`
      : "",
  ].filter(Boolean);
  const logo = logoUrl
    ? `<img class="mark" src="${logoUrl}" alt="${escapeHtml(XGOO_BRAND.productName)}" />`
    : `<div class="mark fallback">XG</div>`;
  const title = xgooId || `${XGOO_BRAND.productName} parcel label`;

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
      .sheet {
        width: 148mm;
        min-height: 210mm;
        padding: 7mm;
      }
      .slip {
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
        padding: 10px 14px;
      }
      .brand-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .mark {
        width: 36px;
        height: 36px;
        object-fit: contain;
        background: #fff;
        border-radius: 8px;
        flex-shrink: 0;
      }
      .mark.fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 900;
        color: ${ORANGE};
      }
      .wordmark { font-size: 26px; font-weight: 900; letter-spacing: 0.02em; line-height: 1; }
      .module { margin: 3px 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.95; }
      .badge {
        border: 1.5px solid #fff;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .id-band {
        padding: 12px 14px 10px;
        border-bottom: 2.5px solid ${INK};
        background: #fff;
      }
      .id-kicker {
        margin: 0;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: ${ORANGE};
      }
      .id-code {
        margin: 4px 0 8px;
        font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 0.08em;
        line-height: 1.1;
        word-break: break-all;
      }
      .id-bar { display: block; }
      .block {
        padding: 12px 14px;
        border-bottom: 2px solid ${INK};
      }
      .block.to {
        flex: 1;
        border-left: 8px solid ${ORANGE};
        padding-left: 12px;
      }
      .kicker {
        margin: 0 0 6px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: ${ORANGE};
      }
      .name {
        margin: 0 0 8px;
        font-size: 22px;
        font-weight: 800;
        line-height: 1.15;
      }
      .to .name { font-size: 30px; }
      .meta { margin: 0; font-size: 14px; line-height: 1.45; color: #27272a; }
      .to .meta { font-size: 16px; }
      .pin-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin-top: 10px;
      }
      .pin {
        font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
        font-size: 26px;
        font-weight: 800;
        letter-spacing: 0.08em;
      }
      .phone { font-size: 15px; font-weight: 700; }
      .split {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
      }
      .split .from { border-right: 2px solid ${INK}; }
      .facts { display: grid; gap: 10px; }
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
        padding: 8px 14px;
        background: ${INK};
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
      }
      .foot .site { color: ${ORANGE}; }
      @media print {
        html, body { width: 148mm; height: 210mm; }
        .sheet { width: 100%; min-height: 210mm; padding: 6mm; }
        .slip { min-height: calc(210mm - 12mm); }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <article class="slip">
        <header class="brand">
          <div class="brand-left">
            ${logo}
            <div>
              <div class="wordmark">${escapeHtml(XGOO_BRAND.productName)}</div>
              <p class="module">${escapeHtml(XGOO_MODULES.pro.name)}</p>
            </div>
          </div>
          <div class="badge">Parcel label</div>
        </header>
        ${
          xgooId
            ? `<section class="id-band">
          <p class="id-kicker">XGoo ID</p>
          <p class="id-code">${escapeHtml(xgooId)}</p>
          <div class="id-bar">${barcodeSvg(xgooId)}</div>
        </section>`
            : ""
        }
        <section class="block to">
          <p class="kicker">To</p>
          <p class="name">${escapeHtml(input.to.name || "Customer")}</p>
          <p class="meta">${
            toLines.length
              ? toLines.map((line) => escapeHtml(line)).join("<br />")
              : "Add the delivery address"
          }</p>
          <div class="pin-row">
            <span class="pin">${escapeHtml(input.to.pincode || "")}</span>
            ${input.to.phone ? `<span class="phone">${escapeHtml(input.to.phone)}</span>` : ""}
          </div>
        </section>
        <div class="split">
          <section class="block from">
            <p class="kicker">From</p>
            <p class="name">${escapeHtml(input.from.name || "Store")}</p>
            <p class="meta">${
              fromLines.length
                ? fromLines.map((line) => escapeHtml(line)).join("<br />")
                : "Add the store pickup address on Schedule"
            }${input.from.pincode ? `<br />${escapeHtml(input.from.pincode)}` : ""}${
              input.from.phone ? `<br />${escapeHtml(input.from.phone)}` : ""
            }</p>
          </section>
          <section class="block">
            <p class="kicker">Parcel</p>
            <div class="facts">
              ${facts.join("") || `<div class="fact"><span>Contents</span><strong>Store order</strong></div>`}
            </div>
          </section>
        </div>
        <footer class="foot">
          <span>${escapeHtml(XGOO_BRAND.productName)}</span>
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

export function printProParcelSlip(input: ProParcelSlipInput): boolean {
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

  void xgooLogoDataUrl().then((logoUrl) => {
    writeAndPrint(doc, win, slipHtml(input, logoUrl));
  });
  return true;
}

export function PrintParcelSlipButton({
  input,
  label = "Print A5 label",
}: {
  input: ProParcelSlipInput;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-none"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        printProParcelSlip(input);
      }}
    >
      <Printer className="mr-1 h-4 w-4" />
      {label}
    </Button>
  );
}
