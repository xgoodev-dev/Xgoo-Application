import { XGOO_CONTACT, XGOO_MODULES, XGOO_TECH_PARTNER } from "@/components/marketing/site-info";
import type { KioskLanguage, KioskQuoteCard, KioskTrackResult, KnowledgeArticle } from "@shared/kiosk";
import { KIOSK_KNOWLEDGE } from "@shared/kiosk";
import { kioskCopy } from "./i18n";
import type { KioskStoreConfig } from "./api";

export function TrackingPanel({
  language,
  query,
  result,
  error,
  loading,
  onQuery,
  onTrack,
}: {
  language: KioskLanguage;
  query: string;
  result: KioskTrackResult | null;
  error: string | null;
  loading: boolean;
  onQuery: (value: string) => void;
  onTrack: () => void;
}) {
  const copy = kioskCopy(language);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{copy.track}</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={copy.trackingPlaceholder}
          className="h-12 min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 text-base outline-none ring-[#FF4907] focus:ring-2"
          data-testid="kiosk-track-input"
        />
        <button
          type="button"
          onClick={onTrack}
          disabled={loading}
          className="h-12 rounded-xl bg-[#FF4907] px-6 font-semibold text-white"
        >
          {copy.lookup}
        </button>
      </div>
      {error ? <p className="text-sm text-amber-800">{error}</p> : null}
      {result ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="font-semibold">{result.reference}</p>
          <p className="text-sm text-zinc-700">{result.statusPlain}</p>
          {result.awbNumber ? <p className="text-xs text-zinc-500">AWB {result.awbNumber}</p> : null}
          {result.message ? <p className="mt-2 text-sm text-zinc-600">{result.message}</p> : null}
          <p className="mt-2 text-xs text-zinc-500">
            {result.senderCity || "—"} → {result.receiverCity || "—"}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function RatesPanel({
  language,
  origin,
  dest,
  weight,
  quotes,
  message,
  live,
  loading,
  onOrigin,
  onDest,
  onWeight,
  onLookup,
}: {
  language: KioskLanguage;
  origin: string;
  dest: string;
  weight: string;
  quotes: KioskQuoteCard[];
  message: string;
  live: boolean;
  loading: boolean;
  onOrigin: (value: string) => void;
  onDest: (value: string) => void;
  onWeight: (value: string) => void;
  onLookup: () => void;
}) {
  const copy = kioskCopy(language);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{copy.rates}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          value={origin}
          onChange={(e) => onOrigin(e.target.value)}
          placeholder={copy.originPin}
          inputMode="numeric"
          className="h-12 rounded-xl border border-zinc-200 px-3"
        />
        <input
          value={dest}
          onChange={(e) => onDest(e.target.value)}
          placeholder={copy.destPin}
          inputMode="numeric"
          className="h-12 rounded-xl border border-zinc-200 px-3"
        />
        <input
          value={weight}
          onChange={(e) => onWeight(e.target.value)}
          placeholder={copy.weight}
          inputMode="decimal"
          className="h-12 rounded-xl border border-zinc-200 px-3"
        />
      </div>
      <button
        type="button"
        onClick={onLookup}
        disabled={loading}
        className="h-12 rounded-xl bg-[#FF4907] px-6 font-semibold text-white"
      >
        {copy.getRates}
      </button>
      <p className="text-sm text-zinc-600">{message || copy.estimatesNote}</p>
      {!live && quotes.length > 0 ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{copy.demoBanner}</p>
      ) : null}
      {quotes.map((quote) => (
        <div key={quote.key} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3">
          <div>
            <p className="font-semibold">{quote.partnerName}</p>
            <p className="text-xs text-zinc-500">
              {quote.serviceType}
              {quote.transitDays != null ? ` · ~${quote.transitDays} days` : ""}
            </p>
          </div>
          <p className="font-bold">₹{Math.round(quote.sellPrice)}</p>
        </div>
      ))}
    </div>
  );
}

export function BusinessPanel({ language }: { language: KioskLanguage }) {
  const copy = kioskCopy(language);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{copy.business}</h2>
      <p className="text-sm text-zinc-600">
        Regular business shipping, bulk booking, and standing pickup run through {XGOO_MODULES.pro.name}. Online
        stores can go live with {XGOO_TECH_PARTNER.shops.name}. This Bot does not create accounts or leads unless
        you open those pages yourself.
      </p>
      <a
        href={XGOO_MODULES.pro.path}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-14 items-center justify-center rounded-2xl bg-[#FF4907] px-4 font-semibold text-white"
      >
        Open {XGOO_MODULES.pro.name}
      </a>
      <a
        href={XGOO_TECH_PARTNER.shops.url}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-14 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 font-semibold"
      >
        {XGOO_TECH_PARTNER.shops.cta}
      </a>
    </div>
  );
}

export function HelpPanel({
  language,
  articles,
  query,
  onQuery,
  store,
}: {
  language: KioskLanguage;
  articles: KnowledgeArticle[];
  query: string;
  onQuery: (value: string) => void;
  store: KioskStoreConfig;
}) {
  const copy = kioskCopy(language);
  const list = articles.length ? articles : KIOSK_KNOWLEDGE;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{copy.help}</h2>
      <input
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={copy.help}
        className="h-12 w-full rounded-xl border border-zinc-200 px-3"
      />
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
        <p className="font-semibold">{store.office.name}</p>
        <p>
          {store.office.city}
          {store.office.state ? `, ${store.office.state}` : ""}
        </p>
        <p>{store.hours}</p>
        <p>{store.office.phone || XGOO_CONTACT.phone}</p>
      </div>
      {list.map((article) => (
        <article key={article.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h3 className="font-semibold">{article.title}</h3>
          <p className="mt-1 text-sm text-zinc-600">{article.body}</p>
        </article>
      ))}
    </div>
  );
}

export function StaffHandover({
  language,
  summary,
  pin,
  pinError,
  onPin,
  onUnlock,
  storePhone,
}: {
  language: KioskLanguage;
  summary: string;
  pin: string;
  pinError: string | null;
  onPin: (value: string) => void;
  onUnlock: () => void;
  storePhone: string | null;
}) {
  const copy = kioskCopy(language);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{copy.staffTitle}</h2>
      <p className="text-sm text-zinc-600">{copy.staffBody}</p>
      {storePhone ? (
        <a href={`tel:${storePhone.replace(/\s/g, "")}`} className="block font-semibold text-[#FF4907]">
          {storePhone}
        </a>
      ) : null}
      <pre className="overflow-auto rounded-2xl bg-zinc-950 p-4 text-xs text-zinc-100">{summary}</pre>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">{copy.pinLabel}</span>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => onPin(e.target.value)}
          className="h-12 w-full max-w-xs rounded-xl border border-zinc-200 px-3"
        />
      </label>
      {pinError ? <p className="text-sm text-amber-800">{pinError}</p> : null}
      <button
        type="button"
        onClick={onUnlock}
        className="h-12 bg-[#FF4907] px-6 font-semibold text-white"
      >
        {copy.closeBot}
      </button>
    </div>
  );
}
