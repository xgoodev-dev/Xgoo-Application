import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import type { ShipmentWithRelations, Office } from "@shared/schema";
import { XGOO_BRAND } from "@/components/marketing/site-info";

interface ParcelLabelProps {
  shipment: ShipmentWithRelations;
  office: Office;
  onBack?: () => void;
}

export function ParcelLabel({ shipment, office, onBack }: ParcelLabelProps) {
  const handlePrint = () => {
    window.print();
  };

  const qrData = JSON.stringify({
    bookingNumber: shipment.bookingNumber,
    awb: shipment.awbNumber || "",
    sender: shipment.senderName,
    receiver: shipment.receiverName,
    destination: `${shipment.receiverCity || ""}, ${shipment.receiverPincode || ""}`,
  });

  const serviceTypeLabel = shipment.serviceType === "air" ? "AIR" : "SURFACE";

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden p-4 flex items-center gap-4 border-b bg-card">
        {onBack && (
          <Button variant="ghost" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <Button onClick={handlePrint} data-testid="button-print">
          <Printer className="h-4 w-4 mr-2" />
          Print Label
        </Button>
      </div>

      <div className="flex justify-center p-4 print:p-0">
        <div className="label-container w-[4in] h-[6in] bg-white text-black border border-black print:border-0 flex flex-col">
          <div className="border-b-2 border-black p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-xs rounded">
                XG
              </div>
              <div>
                <div className="font-bold text-sm">XGoo</div>
                <div className="text-[10px] text-muted-foreground">{XGOO_BRAND.parentCompany}</div>
                <div className="text-xs">{office.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">{office.phone || ""}</div>
              <div className="text-xs text-gray-600">{office.city || ""}</div>
            </div>
          </div>

          <div className="flex border-b-2 border-black">
            <div className="p-2 border-r border-black flex-shrink-0">
              <QRCodeSVG value={qrData} size={80} level="M" />
            </div>
            <div className="p-2 flex-1 flex flex-col justify-center">
              <div className="text-xs text-gray-600">Booking Number</div>
              <div className="font-bold text-lg tracking-wide">{shipment.bookingNumber}</div>
              {shipment.awbNumber && (
                <>
                  <div className="text-xs text-gray-600 mt-1">AWB Number</div>
                  <div className="font-semibold text-sm">{shipment.awbNumber}</div>
                </>
              )}
            </div>
            <div className="p-2 border-l border-black flex items-center">
              <div className="bg-black text-white px-3 py-1 font-bold text-sm">
                {serviceTypeLabel}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex border-b border-black">
              <div className="flex-1 p-2 border-r border-black">
                <div className="text-xs font-bold text-gray-600 mb-1 uppercase">From (Sender)</div>
                <div className="text-sm font-bold">{shipment.senderName}</div>
                <div className="text-xs leading-snug mt-1">
                  {shipment.senderAddress}
                  {shipment.senderCity && <>, {shipment.senderCity}</>}
                  {shipment.senderState && <>, {shipment.senderState}</>}
                  {shipment.senderPincode && <> - {shipment.senderPincode}</>}
                </div>
                <div className="text-xs mt-1 font-medium">Ph: {shipment.senderPhone}</div>
              </div>
              <div className="w-16 flex items-center justify-center bg-gray-100">
                <div className="transform -rotate-90 text-xs font-bold text-gray-500 whitespace-nowrap">
                  ORIGIN
                </div>
              </div>
            </div>

            <div className="flex border-b-2 border-black flex-1">
              <div className="flex-1 p-2 border-r border-black">
                <div className="text-xs font-bold text-gray-600 mb-1 uppercase">To (Receiver)</div>
                <div className="text-sm font-bold">{shipment.receiverName}</div>
                <div className="text-xs leading-snug mt-1">
                  {shipment.receiverAddress}
                  {shipment.receiverCity && <>, {shipment.receiverCity}</>}
                  {shipment.receiverState && <>, {shipment.receiverState}</>}
                  {shipment.receiverPincode && <> - {shipment.receiverPincode}</>}
                </div>
                <div className="text-xs mt-1 font-medium">Ph: {shipment.receiverPhone}</div>
              </div>
              <div className="w-16 flex items-center justify-center bg-gray-200">
                <div className="transform -rotate-90 text-xs font-bold text-gray-600 whitespace-nowrap">
                  DESTINATION
                </div>
              </div>
            </div>

            <div className="border-b border-black">
              <div className="flex text-xs">
                <div className="flex-1 p-2 border-r border-black text-center">
                  <div className="text-gray-600">Weight</div>
                  <div className="font-bold text-base">{shipment.weight} kg</div>
                </div>
                <div className="flex-1 p-2 border-r border-black text-center">
                  <div className="text-gray-600">Pieces</div>
                  <div className="font-bold text-base">{shipment.numberOfPieces || 1}</div>
                </div>
                <div className="flex-1 p-2 text-center">
                  <div className="text-gray-600">Service</div>
                  <div className="font-bold text-base">{serviceTypeLabel}</div>
                </div>
              </div>
            </div>

            {shipment.contentDescription && (
              <div className="p-2 border-b border-black text-xs">
                <span className="text-gray-600">Contents: </span>
                <span className="font-medium">{shipment.contentDescription}</span>
              </div>
            )}
          </div>

          <div className="p-2 border-t-2 border-black">
            <div className="flex justify-center">
              <svg className="w-full h-10">
                <Barcode value={shipment.bookingNumber} />
              </svg>
            </div>
            <div className="text-center text-xs font-mono tracking-widest mt-1">
              {shipment.bookingNumber}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: 4in 6in;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .label-container {
            width: 4in !important;
            height: 6in !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Barcode({ value }: { value: string }) {
  const barWidth = 2;
  const height = 40;
  const chars = value.split("");
  let x = 10;
  const bars: { x: number; width: number; height: number }[] = [];

  bars.push({ x: x, width: barWidth, height });
  x += barWidth * 2;
  bars.push({ x: x, width: barWidth, height });
  x += barWidth * 2;

  chars.forEach((char) => {
    const code = char.charCodeAt(0);
    const pattern = [
      (code >> 6) & 1,
      (code >> 5) & 1,
      (code >> 4) & 1,
      (code >> 3) & 1,
      (code >> 2) & 1,
      (code >> 1) & 1,
      code & 1,
    ];
    pattern.forEach((bit) => {
      if (bit) {
        bars.push({ x, width: barWidth, height });
      }
      x += barWidth;
    });
    x += barWidth;
  });

  bars.push({ x: x, width: barWidth, height });
  x += barWidth * 2;
  bars.push({ x: x, width: barWidth, height });

  return (
    <>
      {bars.map((bar, i) => (
        <rect key={i} x={bar.x} y={0} width={bar.width} height={bar.height} fill="black" />
      ))}
    </>
  );
}

export default ParcelLabel;
