import type { Office } from "@shared/schema";
import type { DocumentSettings, XgooDocumentData } from "@shared/document-template";
import { formatDocCurrency, formatDocDate, officeHeaderLines } from "@/lib/document-utils";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";

interface XgooShippingDocumentProps {
  office: Office;
  settings: DocumentSettings;
  document: XgooDocumentData;
}

function CheckCell({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="inline-flex h-4 w-4 items-center justify-center border border-black text-[10px] font-bold">
        {checked ? "✓" : ""}
      </span>
      {label}
    </span>
  );
}

export function XgooShippingDocument({ office, settings, document }: XgooShippingDocumentProps) {
  const headerLines = officeHeaderLines(office);
  const brand = settings.brandColor || "#FF4907";

  return (
    <div id="xgoo-printable-document" className="xgoo-doc w-full max-w-[210mm] bg-white text-black text-sm leading-snug mx-auto">
      <div className="border-2 border-black p-4 print:p-3">
        {/* Title row */}
        <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-3">
          <div className="flex items-center gap-3">
            {office.logoUrl ? (
              <img src={office.logoUrl} alt={office.name} className="h-12 w-12 object-contain" />
            ) : (
              <img src={xgooLogo} alt="XGoo" className="h-12 w-12 object-contain rounded" />
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: brand }}>
                {document.title}
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">{office.name}</p>
            </div>
          </div>
          <table className="text-sm border-collapse">
            <tbody>
              <tr>
                <td className="pr-3 font-semibold whitespace-nowrap">S No</td>
                <td className="font-mono font-bold">{document.serialNumber}</td>
                <td className="pl-6 pr-3 font-semibold whitespace-nowrap">Date</td>
                <td className="font-medium">{formatDocDate(document.date)}</td>
              </tr>
              <tr>
                <td className="pr-3 font-semibold pt-1">AWB No</td>
                <td colSpan={3} className="font-mono pt-1">{document.awbNumber || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Office header */}
        <div className="text-center border-b border-black pb-3 mb-3">
          <p className="font-bold text-base uppercase tracking-wide">{office.name}</p>
          {headerLines.map((line, i) => (
            <p key={i} className="text-xs text-gray-800">{line}</p>
          ))}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1 text-xs">
            {office.phone && <span>Ph:No: {office.phone}</span>}
            {office.gstNumber && <span>GST:No: {office.gstNumber}</span>}
          </div>
        </div>

        {/* Courier type */}
        <table className="w-full border border-black mb-3 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-r border-black p-2 text-left font-semibold w-1/2">Courier Type</th>
              <th className="p-2 text-left font-semibold w-1/2">Type</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-t border-black p-2 space-y-1">
                <CheckCell checked={document.courierScope === "international"} label="International" />
                <br />
                <CheckCell checked={document.courierScope === "domestic"} label="Domestic" />
              </td>
              <td className="border-t border-black p-2 space-y-1">
                <CheckCell checked={document.packageType === "dox"} label="DOX" />
                <br />
                <CheckCell checked={document.packageType === "non_dox"} label="NON DOX" />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Consigner / Consignee */}
        <table className="w-full border border-black mb-3 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-r border-black p-2 text-left font-semibold w-1/2">Consigner Details</th>
              <th className="p-2 text-left font-semibold w-1/2">Consignee Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-t border-black p-3 align-top">
                <p className="font-bold uppercase">{document.consigner.name}</p>
                {document.consigner.lines.map((line, i) => (
                  <p key={i} className="text-xs mt-1 uppercase">{line}</p>
                ))}
              </td>
              <td className="border-t border-black p-3 align-top">
                <p className="font-bold uppercase">{document.consignee.name}</p>
                {document.consignee.lines.map((line, i) => (
                  <p key={i} className="text-xs mt-1 uppercase">{line}</p>
                ))}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Package details */}
        <table className="w-full border border-black mb-3 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th colSpan={3} className="border-b border-black p-2 text-left font-semibold">Package Details</th>
            </tr>
            <tr>
              <th className="border-r border-black p-2 text-left font-medium w-1/4">No.of.Packages</th>
              <th className="border-r border-black p-2 text-left font-medium">Dimensions (CMS)/Quantity Amount</th>
              <th className="p-2 text-right font-medium w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-t border-black p-2 align-top">
                {document.packageLine.count} Parcel{document.packageLine.count > 1 ? "s" : ""}
              </td>
              <td className="border-r border-t border-black p-2 align-top text-xs">
                {document.packageLine.description}
              </td>
              <td className="border-t border-black p-2 text-right font-semibold align-top">
                {formatDocCurrency(document.packageLine.amount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Terms */}
        <div className="border border-black p-3 mb-3 text-xs text-gray-800">
          <p className="font-semibold mb-1">Terms &amp; Conditions:</p>
          <p>{settings.termsAndConditions}</p>
          <p className="mt-2 font-semibold">Contact Us:</p>
          <p>{settings.contactNotice}</p>
          {document.kind === "quotation" && document.validUntil && (
            <p className="mt-2 font-semibold">
              Valid until: {formatDocDate(document.validUntil)}
            </p>
          )}
          {document.notes && (
            <p className="mt-2"><span className="font-semibold">Notes:</span> {document.notes}</p>
          )}
        </div>

        {/* Totals */}
        <table className="w-full border border-black mb-3 text-sm max-w-xs ml-auto">
          <tbody>
            <tr>
              <td className="border-b border-black p-2 font-medium">Amount</td>
              <td className="border-b border-l border-black p-2 text-right font-semibold">
                {formatDocCurrency(document.subtotal)}
              </td>
            </tr>
            <tr>
              <td className="border-b border-black p-2 font-medium">GST{document.gstRate}%</td>
              <td className="border-b border-l border-black p-2 text-right font-semibold">
                {formatDocCurrency(document.gstAmount)}
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 font-bold">Total Amount</td>
              <td className="border-l border-black p-2 text-right font-bold text-base">
                {formatDocCurrency(document.totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        {settings.showSignatures && (
          <table className="w-full border border-black mb-3 text-sm">
            <tbody>
              <tr>
                <td className="border-r border-black p-2 w-1/2 h-16 align-bottom font-medium">Signature</td>
                <td className="p-2 w-1/2 h-16 align-bottom font-medium">Receiver Signature</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Footer */}
        <div className="flex justify-between text-xs border-t border-black pt-2 mt-2">
          <span>Email: {settings.contactEmail}</span>
          <span>Website: {settings.website}</span>
        </div>
        {settings.footerNote && (
          <p className="text-center text-xs text-gray-600 mt-2">{settings.footerNote}</p>
        )}
      </div>

      <style>{`
        @media print {
          .xgoo-doc {
            max-width: 100% !important;
            margin: 0 !important;
          }
          .xgoo-doc * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

export function DocumentPrintStyles() {
  return (
    <style>{`
      @media print {
        @page { size: A4; margin: 10mm; }
        body { margin: 0; padding: 0; background: white !important; }
        .print\\:hidden { display: none !important; }
      }
    `}</style>
  );
}
