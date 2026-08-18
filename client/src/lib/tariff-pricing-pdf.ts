import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import type { CourierPartner, TariffVersion } from "@shared/schema";
import { calculateCustomerPrice } from "@shared/tariff-pricing";
import type { TariffGridRow } from "@/components/pricing/types";
import { XGOO_BRAND, XGOO_CONTACT } from "@/components/marketing/site-info";

type PricingExportOptions = {
  rows: TariffGridRow[];
  partners: CourierPartner[];
  version: TariffVersion;
  partnerId?: string;
};

type PricingTableRow = {
  courier?: string;
  destination: string;
  shipment: string;
  service: string;
  weight: string;
  price: string;
  transit: string;
};

type PreparedPricingSheet = {
  partnerLabel: string;
  partnerSlug: string;
  cycleSlug: string;
  routeLabel: string;
  includePartner: boolean;
  head: string[];
  body: string[][];
  tableRows: PricingTableRow[];
  validLabel: string;
};

const IMAGE_ROWS_PER_PAGE = 22;

function money(value: string | number | null | undefined): string {
  const amount = typeof value === "number" ? value : parseFloat(String(value ?? "0"));
  return `INR ${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
}

function date(value: Date | string | null | undefined): string {
  if (!value) return "Not specified";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Not specified"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

async function imageDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function safeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function countryName(value: string | null | undefined): string {
  const code = String(value || "").trim();
  if (!code) return "Any destination";
  const commonNames: Record<string, string> = {
    US: "USA",
    USA: "USA",
    CA: "Canada",
    CAN: "Canada",
    GB: "United Kingdom",
    UK: "United Kingdom",
    AE: "United Arab Emirates",
    AU: "Australia",
    NZ: "New Zealand",
    SG: "Singapore",
  };
  if (commonNames[code.toUpperCase()]) return commonNames[code.toUpperCase()];
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

function uniqueLabels(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

async function fadedImageDataUrl(
  source: string,
  opacity = 0.06,
): Promise<string | null> {
  return await new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(null);
        return;
      }
      context.globalAlpha = opacity;
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function preparePricingSheet({
  rows,
  partners,
  version,
  partnerId,
}: PricingExportOptions): PreparedPricingSheet {
  const selectedPartner = partnerId
    ? partners.find((partner) => partner.id === partnerId)
    : undefined;
  const pricingRows = rows
    .filter((row) => row.isActive !== false)
    .filter((row) => !partnerId || row.courierPartnerId === partnerId)
    .sort((a, b) => {
      const partner = (a.partnerName || "").localeCompare(b.partnerName || "");
      if (partner !== 0) return partner;
      const destination = (a.destinationCountry || "").localeCompare(
        b.destinationCountry || "",
      );
      if (destination !== 0) return destination;
      return parseFloat(a.weightMax || "0") - parseFloat(b.weightMax || "0");
    });

  if (pricingRows.length === 0) {
    throw new Error("No active pricing rows found for the selected courier partner.");
  }

  const includePartner = !selectedPartner;
  const partnerNames = uniqueLabels(
    pricingRows.map(
      (row) => row.partnerName || row.partnerCode || row.courierPartner,
    ),
  );
  const destinations = uniqueLabels(
    pricingRows.map((row) => countryName(row.destinationCountry)),
  );
  const partnerLabel =
    selectedPartner?.name || partnerNames.join(", ") || "Courier partners";
  const routeLabel = `Hyderabad, IN to ${destinations.join(", ")}`;
  const head = [
    ...(includePartner ? ["Courier"] : []),
    "Destination",
    "Shipment",
    "Service",
    "Weight slab",
    "Customer price",
    "Transit",
  ];

  const tableRows: PricingTableRow[] = pricingRows.map((row) => {
    const price = calculateCustomerPrice({
      tariffAmount: row.tariffAmount,
      fixedMargin: row.fixedMargin,
      percentageMargin: row.percentageMargin,
      affiliateMargin: row.affiliateMargin,
      offerDiscount: row.offerDiscount,
      fuelCharge: row.fuelCharge,
      handlingCharge: row.handlingCharge,
      insuranceCharge: row.insuranceCharge,
      remoteAreaCharge: row.remoteAreaCharge,
      gst: row.gst,
    });
    const perKg = /(?:^|[;\s])rate_type=per_kg(?:$|[;\s])/i.test(row.notes || "");
    return {
      courier: includePartner
        ? row.partnerName || row.partnerCode || row.courierPartner
        : undefined,
      destination: row.destinationCountry || "Any",
      shipment: row.shipmentType || "Package",
      service: row.serviceType === "air" ? "Air" : "Surface",
      weight: `${row.weightMax} kg${perKg ? " (per kg)" : ""}`,
      price: `${money(price)}${perKg ? " / kg" : ""}`,
      transit: row.transitDays != null ? `${row.transitDays} days` : "-",
    };
  });

  const body = tableRows.map((row) => [
    ...(includePartner ? [row.courier || ""] : []),
    row.destination,
    row.shipment,
    row.service,
    row.weight,
    row.price,
    row.transit,
  ]);

  return {
    partnerLabel,
    partnerSlug: safeFilename(selectedPartner?.name || "all-partners"),
    cycleSlug: safeFilename(version.label || "pricing"),
    routeLabel,
    includePartner,
    head,
    body,
    tableRows,
    validLabel: `Valid: ${date(version.validFrom)} to ${date(version.validTo)}`,
  };
}

function chunkRows<T>(rows: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    pages.push(rows.slice(i, i + size));
  }
  return pages.length ? pages : [[]];
}

async function buildPricingPdf(options: PricingExportOptions) {
  const prepared = preparePricingSheet(options);
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const logo = await imageDataUrl(xgooLogo);
  const watermark = await fadedImageDataUrl(xgooLogo);

  const drawPageHeader = () => {
    if (logo) pdf.addImage(logo, "PNG", 14, 7, 19, 19);

    pdf.setTextColor(255, 73, 7);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("XGoo Pricing Sheet", logo ? 38 : 14, 13);

    pdf.setTextColor(45, 45, 45);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(XGOO_BRAND.attributionShort, logo ? 38 : 14, 18);
    pdf.text(
      `${XGOO_CONTACT.website}  |  ${XGOO_CONTACT.email}  |  ${XGOO_CONTACT.phone}`,
      logo ? 38 : 14,
      22.5,
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(prepared.routeLabel, 14, 33);
    pdf.setFontSize(9);
    pdf.text(`Courier partners: ${prepared.partnerLabel}`, 14, 39);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      `Tariff cycle: ${options.version.label}    ${prepared.validLabel}    Generated: ${date(new Date())}`,
      14,
      45,
    );
    pdf.setDrawColor(255, 73, 7);
    pdf.setLineWidth(0.7);
    pdf.line(14, 49, pageWidth - 14, 49);
  };

  autoTable(pdf, {
    startY: 54,
    head: [prepared.head],
    body: prepared.body,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [35, 35, 35],
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [255, 73, 7],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    willDrawPage: drawPageHeader,
    didDrawPage: ({ pageNumber }) => {
      if (watermark) {
        const watermarkSize = 70;
        pdf.addImage(
          watermark,
          "PNG",
          (pageWidth - watermarkSize) / 2,
          (pageHeight - watermarkSize) / 2,
          watermarkSize,
          watermarkSize,
        );
      }
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        "Prices are subject to serviceability, chargeable weight, applicable surcharges and XGoo terms.",
        14,
        pageHeight - 8,
      );
      pdf.text(`Page ${pageNumber}`, pageWidth - 14, pageHeight - 8, {
        align: "right",
      });
    },
    margin: { top: 54, left: 14, right: 14, bottom: 14 },
  });

  return { pdf, prepared };
}

function createPricingSheetPageElement(args: {
  prepared: PreparedPricingSheet;
  versionLabel: string;
  logoUrl: string;
  pageRows: PricingTableRow[];
  pageNumber: number;
  totalPages: number;
}): HTMLDivElement {
  const { prepared, versionLabel, logoUrl, pageRows, pageNumber, totalPages } = args;
  const root = document.createElement("div");
  root.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "width:1400px",
    "background:#ffffff",
    "color:#2d2d2d",
    "font-family:Arial,Helvetica,sans-serif",
    "padding:36px 40px 28px",
    "box-sizing:border-box",
    "overflow:hidden",
  ].join(";");

  const watermark = document.createElement("img");
  watermark.src = logoUrl;
  watermark.alt = "";
  watermark.style.cssText = [
    "position:absolute",
    "left:50%",
    "top:52%",
    "width:390px",
    "height:390px",
    "object-fit:contain",
    "transform:translate(-50%,-50%)",
    "opacity:0.055",
    "pointer-events:none",
    "z-index:2",
  ].join(";");
  root.appendChild(watermark);

  const header = document.createElement("div");
  header.style.cssText =
    "position:relative;z-index:1;display:flex;align-items:flex-start;gap:18px;margin-bottom:18px;";
  header.innerHTML = `
    <img src="${logoUrl}" alt="XGoo" style="width:72px;height:72px;object-fit:contain;" />
    <div style="flex:1;">
      <div style="color:#FF4907;font-size:34px;font-weight:700;line-height:1.1;">XGoo Pricing Sheet</div>
      <div style="margin-top:6px;font-size:14px;">${XGOO_BRAND.attributionShort}</div>
      <div style="margin-top:4px;font-size:13px;color:#555;">
        ${XGOO_CONTACT.website} &nbsp;|&nbsp; ${XGOO_CONTACT.email} &nbsp;|&nbsp; ${XGOO_CONTACT.phone}
      </div>
    </div>
  `;
  root.appendChild(header);

  const meta = document.createElement("div");
  meta.style.cssText =
    "position:relative;z-index:1;border-top:3px solid #FF4907;padding-top:12px;margin-bottom:16px;font-size:14px;line-height:1.5;";
  meta.innerHTML = `
    <div style="font-weight:700;font-size:18px;">${prepared.routeLabel}</div>
    <div style="font-weight:700;font-size:15px;">Courier partners: ${prepared.partnerLabel}</div>
    <div>Tariff cycle: ${versionLabel} &nbsp;&nbsp; ${prepared.validLabel} &nbsp;&nbsp; Generated: ${date(new Date())}</div>
    <div style="color:#666;">Page ${pageNumber} of ${totalPages}</div>
  `;
  root.appendChild(meta);

  const table = document.createElement("table");
  table.style.cssText =
    "position:relative;z-index:1;width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of prepared.head) {
    const th = document.createElement("th");
    th.textContent = label;
    th.style.cssText =
      "background:#FF4907;color:#fff;text-align:left;padding:10px 8px;border:1px solid #e8e8e8;font-weight:700;";
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  pageRows.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.style.background = index % 2 === 0 ? "#ffffff" : "#fafafa";
    const values = [
      ...(prepared.includePartner ? [row.courier || ""] : []),
      row.destination,
      row.shipment,
      row.service,
      row.weight,
      row.price,
      row.transit,
    ];
    for (const value of values) {
      const td = document.createElement("td");
      td.textContent = value;
      td.style.cssText = "padding:9px 8px;border:1px solid #e8e8e8;vertical-align:top;";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  root.appendChild(table);

  const footer = document.createElement("div");
  footer.style.cssText =
    "position:relative;z-index:1;margin-top:16px;font-size:12px;color:#777;";
  footer.textContent =
    "Prices are subject to serviceability, chargeable weight, applicable surcharges and XGoo terms.";
  root.appendChild(footer);

  return root;
}

async function renderPricingSheetImages(options: PricingExportOptions): Promise<{
  prepared: PreparedPricingSheet;
  images: Array<{ filename: string; blob: Blob }>;
}> {
  const prepared = preparePricingSheet(options);
  const pages = chunkRows(prepared.tableRows, IMAGE_ROWS_PER_PAGE);
  const [{ default: html2canvas }] = await Promise.all([import("html2canvas")]);
  const images: Array<{ filename: string; blob: Blob }> = [];

  for (let i = 0; i < pages.length; i++) {
    const pageNumber = i + 1;
    const element = createPricingSheetPageElement({
      prepared,
      versionLabel: options.version.label,
      logoUrl: xgooLogo,
      pageRows: pages[i],
      pageNumber,
      totalPages: pages.length,
    });
    document.body.appendChild(element);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 1400,
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error("Could not create image"))),
          "image/png",
        );
      });
      images.push({
        filename: `xgoo-pricing-${prepared.partnerSlug}-${prepared.cycleSlug}-page-${pageNumber}.png`,
        blob,
      });
    } finally {
      element.remove();
    }
  }

  return { prepared, images };
}

export async function downloadTariffPricingPdf(options: PricingExportOptions): Promise<void> {
  const { pdf, prepared } = await buildPricingPdf(options);
  pdf.save(`xgoo-pricing-${prepared.partnerSlug}-${prepared.cycleSlug}.pdf`);
}

/**
 * Downloads pricing sheet as PNG.
 * Single page → one PNG. Multiple pages → ZIP archive of PNGs (opens in WinRAR / 7-Zip).
 */
export async function downloadTariffPricingImages(options: PricingExportOptions): Promise<{
  fileCount: number;
  archived: boolean;
}> {
  const { prepared, images } = await renderPricingSheetImages(options);

  if (images.length === 1) {
    triggerDownload(images[0].blob, images[0].filename);
    return { fileCount: 1, archived: false };
  }

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const image of images) {
    zip.file(image.filename, image.blob);
  }
  const archive = await zip.generateAsync({ type: "blob" });
  triggerDownload(
    archive,
    `xgoo-pricing-${prepared.partnerSlug}-${prepared.cycleSlug}-images.zip`,
  );
  return { fileCount: images.length, archived: true };
}
