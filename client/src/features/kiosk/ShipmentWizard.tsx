import type { KioskLanguage, KioskQuoteCard, KioskShipmentDraft, SendStep } from "@shared/kiosk";
import { kioskCopy } from "./i18n";

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "text" | "tel" | "numeric" | "decimal";
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base outline-none ring-[#FF4907] focus:ring-2"
      />
    </label>
  );
}

export function ShipmentWizard({
  language,
  step,
  draft,
  quotes,
  quoteMessage,
  quotesLive,
  errors,
  submitting,
  onChange,
  onNext,
  onBack,
  onSelectQuote,
}: {
  language: KioskLanguage;
  step: SendStep;
  draft: KioskShipmentDraft;
  quotes: KioskQuoteCard[];
  quoteMessage: string;
  quotesLive: boolean;
  errors: string[];
  submitting: boolean;
  onChange: (patch: Partial<KioskShipmentDraft>) => void;
  onNext: () => void;
  onBack: () => void;
  onSelectQuote: (key: string, serviceType: KioskShipmentDraft["serviceType"]) => void;
}) {
  const copy = kioskCopy(language);
  const title = (() => {
    switch (step) {
      case "intent":
        return copy.send;
      case "sender":
        return copy.sender;
      case "receiver":
        return copy.receiver;
      case "parcel":
        return copy.parcel;
      case "rates":
        return copy.rates;
      case "review":
      case "submitting":
        return copy.review;
      case "complete":
      case "failed":
        return copy.review;
      default: {
        const _never: never = step;
        return _never;
      }
    }
  })();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
      {errors.length > 0 ? (
        <ul className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : null}

      {step === "intent" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={`min-h-16 rounded-2xl border px-4 py-4 text-left font-semibold ${
              draft.shipmentType === "domestic"
                ? "border-[#FF4907] bg-[#FF4907]/10"
                : "border-zinc-200 bg-white"
            }`}
            onClick={() => onChange({ shipmentType: "domestic", destinationCountry: "India" })}
          >
            {copy.domestic}
          </button>
          <button
            type="button"
            className={`min-h-16 rounded-2xl border px-4 py-4 text-left font-semibold ${
              draft.shipmentType === "international"
                ? "border-[#FF4907] bg-[#FF4907]/10"
                : "border-zinc-200 bg-white"
            }`}
            onClick={() => onChange({ shipmentType: "international", destinationCountry: "" })}
          >
            {copy.international}
          </button>
        </div>
      ) : null}

      {step === "sender" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copy.name} value={draft.senderName} onChange={(senderName) => onChange({ senderName })} autoComplete="name" />
          <Field
            label={copy.phone}
            value={draft.senderPhone}
            onChange={(senderPhone) => onChange({ senderPhone })}
            inputMode="tel"
          />
          <div className="sm:col-span-2">
            <Field label={copy.address} value={draft.senderAddress} onChange={(senderAddress) => onChange({ senderAddress })} />
          </div>
          <Field label={copy.city} value={draft.senderCity} onChange={(senderCity) => onChange({ senderCity })} />
          <Field
            label={copy.pincode}
            value={draft.senderPincode}
            onChange={(senderPincode) => onChange({ senderPincode })}
            inputMode="numeric"
          />
        </div>
      ) : null}

      {step === "receiver" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copy.name} value={draft.receiverName} onChange={(receiverName) => onChange({ receiverName })} />
          <Field
            label={copy.phone}
            value={draft.receiverPhone}
            onChange={(receiverPhone) => onChange({ receiverPhone })}
            inputMode="tel"
          />
          <div className="sm:col-span-2">
            <Field
              label={copy.address}
              value={draft.receiverAddress}
              onChange={(receiverAddress) => onChange({ receiverAddress })}
            />
          </div>
          <Field label={copy.city} value={draft.receiverCity} onChange={(receiverCity) => onChange({ receiverCity })} />
          {draft.shipmentType === "international" ? (
            <Field
              label={copy.country}
              value={draft.destinationCountry}
              onChange={(destinationCountry) => onChange({ destinationCountry })}
            />
          ) : (
            <Field
              label={copy.pincode}
              value={draft.receiverPincode}
              onChange={(receiverPincode) => onChange({ receiverPincode })}
              inputMode="numeric"
            />
          )}
        </div>
      ) : null}

      {step === "parcel" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={`min-h-14 rounded-2xl border font-semibold ${
              draft.packageType === "document" ? "border-[#FF4907] bg-[#FF4907]/10" : "border-zinc-200 bg-white"
            }`}
            onClick={() => onChange({ packageType: "document" })}
          >
            {copy.document}
          </button>
          <button
            type="button"
            className={`min-h-14 rounded-2xl border font-semibold ${
              draft.packageType === "non_document" ? "border-[#FF4907] bg-[#FF4907]/10" : "border-zinc-200 bg-white"
            }`}
            onClick={() => onChange({ packageType: "non_document" })}
          >
            {copy.nonDocument}
          </button>
          <div className="sm:col-span-2">
            <Field
              label={copy.contents}
              value={draft.contentDescription}
              onChange={(contentDescription) => onChange({ contentDescription })}
            />
          </div>
          <Field
            label={copy.weight}
            value={draft.weight}
            onChange={(weight) => onChange({ weight })}
            inputMode="decimal"
          />
          <Field
            label={copy.declared}
            value={draft.declaredValue}
            onChange={(declaredValue) => onChange({ declaredValue })}
            inputMode="decimal"
          />
          <Field label="L (cm)" value={draft.length} onChange={(length) => onChange({ length })} inputMode="decimal" />
          <Field label="W (cm)" value={draft.width} onChange={(width) => onChange({ width })} inputMode="decimal" />
          <Field label="H (cm)" value={draft.height} onChange={(height) => onChange({ height })} inputMode="decimal" />
        </div>
      ) : null}

      {step === "rates" ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">{quoteMessage || copy.estimatesNote}</p>
          {!quotesLive ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{copy.demoBanner}</p>
          ) : null}
          {quotes.length === 0 ? (
            <p className="text-sm text-zinc-600">{copy.noQuotes}</p>
          ) : (
            quotes.map((quote) => (
              <button
                key={quote.key}
                type="button"
                onClick={() => onSelectQuote(quote.key, quote.serviceType)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left ${
                  draft.selectedQuoteKey === quote.key
                    ? "border-[#FF4907] bg-[#FF4907]/10"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <div>
                  <p className="font-semibold">{quote.partnerName}</p>
                  <p className="text-xs text-zinc-500">
                    {quote.serviceType === "air" ? "Air" : "Surface"}
                    {quote.transitDays != null ? ` · ~${quote.transitDays} days` : ""}
                    {quote.isLive ? "" : " · demo"}
                  </p>
                </div>
                <p className="text-lg font-bold">₹{Math.round(quote.sellPrice)}</p>
              </button>
            ))
          )}
        </div>
      ) : null}

      {step === "review" || step === "submitting" ? (
        <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
          <p>
            <strong>{copy.sender}:</strong> {draft.senderName}, {draft.senderPhone}
          </p>
          <p>{draft.senderAddress}</p>
          <p>
            <strong>{copy.receiver}:</strong> {draft.receiverName}, {draft.receiverPhone}
          </p>
          <p>{draft.receiverAddress}</p>
          <p>
            {draft.packageType === "document" ? copy.document : copy.nonDocument} ·{" "}
            {draft.contentDescription} · {draft.weight} kg
          </p>
          <p className="text-amber-800">{copy.notBooked}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        {step !== "intent" ? (
          <button
            type="button"
            onClick={onBack}
            className="min-h-12 rounded-xl border border-zinc-200 px-5 font-medium"
          >
            {copy.back}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onNext}
          disabled={submitting}
          data-testid="kiosk-send-next"
          className="min-h-12 rounded-xl bg-[#FF4907] px-6 font-semibold text-white disabled:opacity-60"
        >
          {step === "review" ? copy.confirmRequest : submitting ? copy.submitting : copy.continue}
        </button>
      </div>
    </div>
  );
}
