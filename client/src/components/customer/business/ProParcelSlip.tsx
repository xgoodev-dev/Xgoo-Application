import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    [party.city, party.state, party.pincode].filter(Boolean).join(", "),
    party.phone ? `Phone ${party.phone}` : "",
  ].filter(Boolean);
}

function slipHtml(input: ProParcelSlipInput) {
  const details = [
    input.contents ? `Contents: ${input.contents}` : "",
    input.pieces ? `Pieces: ${input.pieces}` : "",
    input.weight ? `Weight: ${input.weight} kg` : "",
    input.channel ? `Via: ${input.channel}` : "",
  ].filter(Boolean);
  const fromLines = partyLines(input.from);
  const toLines = partyLines(input.to);
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>XGoo parcel label</title>
    <style>
      @page { size: A5 portrait; margin: 8mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; color: #18181b; font-family: Arial, Helvetica, sans-serif; }
      .slip {
        width: 148mm;
        min-height: 210mm;
        padding: 10mm;
        display: flex;
        flex-direction: column;
      }
      .brand { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #18181b; padding-bottom: 8px; }
      .logo { font-size: 28px; font-weight: 900; letter-spacing: 0.04em; }
      .accent { color: #FF4907; font-size: 12px; font-weight: 800; text-transform: uppercase; }
      .hint { font-size: 11px; color: #52525b; margin-top: 4px; }
      .block { border: 2px solid #18181b; padding: 10px 12px; margin-top: 12px; }
      .block.to { flex: 1; border-width: 3px; }
      .kicker { font-size: 12px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #FF4907; margin: 0 0 6px; }
      .name { font-size: 22px; font-weight: 900; margin: 0 0 8px; line-height: 1.15; }
      .to .name { font-size: 28px; }
      .meta { font-size: 14px; line-height: 1.45; margin: 0; }
      .to .meta { font-size: 16px; }
      .ref { margin-top: 12px; font-size: 12px; color: #3f3f46; }
      @media print {
        html, body { width: 148mm; height: 210mm; }
        .slip { width: 100%; min-height: auto; padding: 0; }
      }
    </style>
  </head>
  <body>
    <div class="slip">
      <div class="brand">
        <div>
          <div class="logo">XGoo</div>
          <div class="accent">Parcel label</div>
        </div>
        <div class="hint">Print on A5 · Stick on the parcel</div>
      </div>
      <section class="block">
        <p class="kicker">From</p>
        <p class="name">${escapeHtml(input.from.name || "Store")}</p>
        <p class="meta">${fromLines.length ? fromLines.map((line) => escapeHtml(line)).join("<br />") : "Add the store pickup address on Schedule"}</p>
      </section>
      <section class="block to">
        <p class="kicker">To</p>
        <p class="name">${escapeHtml(input.to.name || "Customer")}</p>
        <p class="meta">${toLines.length ? toLines.map((line) => escapeHtml(line)).join("<br />") : "Add the delivery address"}</p>
      </section>
      <div class="ref">
        ${input.bookingRef ? `<strong>${escapeHtml(input.bookingRef)}</strong><br />` : ""}
        ${details.map((line) => escapeHtml(line)).join("<br />")}
      </div>
    </div>
  </body>
</html>`;
}

export function printProParcelSlip(input: ProParcelSlipInput): boolean {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(slipHtml(input));
  doc.close();

  let printed = false;
  const run = () => {
    if (printed) return;
    printed = true;
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => iframe.remove(), 2000);
  };

  iframe.onload = run;
  window.setTimeout(run, 350);
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
