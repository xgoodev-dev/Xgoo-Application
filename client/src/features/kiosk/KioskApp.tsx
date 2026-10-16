import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings, X } from "lucide-react";
import { STAFF_TOKEN_KEY } from "@/hooks/use-auth";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import {
  detectKioskIntent,
  emptyKioskDraft,
  extractSpokenSlots,
  intentToScreen,
  missingFieldsForStep,
  nextSendStep,
  validateKioskDraft,
  type KioskLanguage,
  type KioskQuoteCard,
  type KioskScreen,
  type KioskShipmentDraft,
  type KioskSubmitResult,
  type KioskTrackResult,
  type RobotMood,
  type SendStep,
} from "@shared/kiosk";
import { XGOO_BRAND } from "@/components/marketing/site-info";
import {
  fetchKioskQuotes,
  loadKioskConfig,
  localKnowledge,
  submitKioskShipment,
  trackKioskParcel,
  type KioskStoreConfig,
} from "./api";
import { kioskCopy } from "./i18n";
import {
  isSpeechRecognitionSupported,
  listenOnce,
  speakText,
  stopSpeaking,
} from "./speech";
import { RobotFace } from "./RobotFace";
import { VoiceControls } from "./VoiceControls";
import { ServiceCards } from "./ServiceCards";
import { ShipmentWizard } from "./ShipmentWizard";
import {
  BusinessPanel,
  HelpPanel,
  RatesPanel,
  StaffHandover,
  TrackingPanel,
} from "./KioskPanels";

const PIN_KEY = "xgoo_kiosk_staff_pin";
const IDLE_MS = 90_000;
const LANG_TABS: Array<{ id: KioskLanguage; label: string }> = [
  { id: "en", label: "English" },
  { id: "te", label: "తెలుగు" },
  { id: "hi", label: "हिंदी" },
];

function KioskClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(now);
  return (
    <div className="hidden text-right leading-tight md:block">
      <p className="text-sm font-semibold text-white">{time}</p>
      <p className="text-[11px] text-zinc-400">{date}</p>
    </div>
  );
}

function KioskHeroLogo() {
  return (
    <div className="pointer-events-none hidden items-center justify-center lg:flex">
      <img
        src={xgooLogo}
        alt=""
        className="h-44 w-44 object-contain object-center lg:h-56 lg:w-56 xl:h-64 xl:w-64"
      />
    </div>
  );
}

export function kioskUrl(origin: string, slug: string, hubId?: string | null) {
  const root = origin.replace(/\/$/, "");
  const qs = hubId ? `?hub=${encodeURIComponent(hubId)}` : "";
  return `${root}/kiosk/${encodeURIComponent(slug)}${qs}`;
}

export function KioskApp({
  slug,
  hubId,
  fromHub,
}: {
  slug?: string;
  hubId: string | null;
  fromHub: boolean;
}) {
  const [config, setConfig] = useState<KioskStoreConfig | null>(null);
  const [language, setLanguage] = useState<KioskLanguage>("en");
  const [screen, setScreen] = useState<KioskScreen>("home");
  const [mood, setMood] = useState<RobotMood>("greeting");
  const [draft, setDraft] = useState<KioskShipmentDraft>(emptyKioskDraft);
  const [sendStep, setSendStep] = useState<SendStep>("intent");
  const [errors, setErrors] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<KioskQuoteCard[]>([]);
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quotesLive, setQuotesLive] = useState(false);
  const [submitResult, setSubmitResult] = useState<KioskSubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResult, setTrackResult] = useState<KioskTrackResult | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [rateOrigin, setRateOrigin] = useState("");
  const [rateDest, setRateDest] = useState("");
  const [rateWeight, setRateWeight] = useState("1");
  const [helpQuery, setHelpQuery] = useState("");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [micDenied, setMicDenied] = useState(false);
  const [statusLine, setStatusLine] = useState("");
  const submitLock = useRef(false);
  const idleTimer = useRef<number | null>(null);
  const copy = kioskCopy(language);
  const speechOk = isSpeechRecognitionSupported();

  useEffect(() => {
    void loadKioskConfig(slug, hubId).then(setConfig);
  }, [slug, hubId]);

  useEffect(() => {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "/kiosk.webmanifest";
    document.head.appendChild(manifest);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/kiosk-sw.js").catch(() => undefined);
    }
    return () => {
      manifest.remove();
    };
  }, []);

  const resetIdle = useCallback(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      stopSpeaking();
      setMood("sleep");
      setScreen("home");
      setDraft(emptyKioskDraft());
      setSendStep("intent");
      setSubmitResult(null);
      setTrackResult(null);
      setQuotes([]);
    }, IDLE_MS);
  }, []);

  useEffect(() => {
    resetIdle();
    const bump = () => {
      if (mood === "sleep") setMood("greeting");
      resetIdle();
    };
    window.addEventListener("pointerdown", bump);
    window.addEventListener("keydown", bump);
    return () => {
      window.removeEventListener("pointerdown", bump);
      window.removeEventListener("keydown", bump);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [mood, resetIdle]);

  const speak = useCallback(
    async (text: string, next: RobotMood = "idle") => {
      setMood("speaking");
      setStatusLine(text);
      await speakText(text, language);
      setMood(next);
    },
    [language],
  );

  useEffect(() => {
    void speak(copy.namaste + " " + copy.howHelp, "idle");
    // greet once per language change on home
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const goHome = () => {
    stopSpeaking();
    setScreen("home");
    setMood("idle");
    setErrors([]);
    setSendStep("intent");
    setDraft(emptyKioskDraft());
    setSubmitResult(null);
    setSubmitting(false);
    submitLock.current = false;
  };

  const openScreen = (next: KioskScreen) => {
    setScreen(next);
    setMood(next === "send" ? "greeting" : "idle");
    if (next === "send") {
      void speak(copy.speakSend);
    }
  };

  const patchDraft = (patch: Partial<KioskShipmentDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const loadQuotesForDraft = async (current: KioskShipmentDraft) => {
    setMood("thinking");
    try {
      const result = await fetchKioskQuotes({
        slug,
        demoMode: config?.demoMode === true,
        draft: current,
        bothServices: true,
      });
      setQuotes(result.quotes);
      setQuoteMessage(result.message);
      setQuotesLive(result.isLive);
      setMood("idle");
    } catch (error) {
      setQuotes([]);
      setQuoteMessage(error instanceof Error ? error.message : copy.noQuotes);
      setQuotesLive(false);
      setMood("warning");
    }
  };

  const advanceSend = async () => {
    if (sendStep === "review") {
      if (submitLock.current || submitting) return;
      const check = validateKioskDraft(draft);
      if (!check.ok) {
        setErrors(check.errors);
        setMood("warning");
        await speak(copy.speakMissing, "warning");
        return;
      }
      submitLock.current = true;
      setSubmitting(true);
      setSendStep("submitting");
      setMood("thinking");
      const result = await submitKioskShipment({
        slug,
        demoMode: config?.demoMode === true,
        draft,
        hubId,
      });
      setSubmitResult(result);
      setSubmitting(false);
      if (result.success) {
        setSendStep("complete");
        setMood("success");
        await speak(copy.speakDone, "success");
      } else {
        setSendStep("failed");
        setMood("error");
        setScreen("handover");
      }
      return;
    }
    const missing = missingFieldsForStep(draft, sendStep).filter((field) => {
      if (sendStep === "rates" && field === "selectedQuoteKey" && quotes.length === 0) {
        return false;
      }
      return true;
    });
    if (missing.length) {
      setErrors([copy.speakMissing]);
      await speak(copy.speakMissing, "warning");
      return;
    }
    setErrors([]);
    const next = nextSendStep(sendStep);
    if (next === "rates") {
      await loadQuotesForDraft(draft);
    }
    setSendStep(next);
    if (next === "review") {
      void speak(copy.speakConfirm);
    }
  };

  const handleMic = async () => {
    if (mood === "speaking") {
      stopSpeaking();
      setMood("idle");
      return;
    }
    setMood("listening");
    const result = await listenOnce(language);
    if (!result.ok) {
      if (result.reason === "denied") setMicDenied(true);
      setMood(result.reason === "denied" ? "warning" : "idle");
      return;
    }
    setMood("thinking");
    const slots = extractSpokenSlots(result.transcript);
    if (Object.keys(slots).length) patchDraft(slots);
    if (screen === "home") {
      const intent = detectKioskIntent(result.transcript);
      const next = intentToScreen(intent);
      if (next) {
        openScreen(next);
        return;
      }
      await speak(copy.speakConfused);
      return;
    }
    if (screen === "track") {
      setTrackQuery(result.transcript.trim());
      setMood("idle");
      return;
    }
    if (screen === "send") {
      await speak(copy.speakMissing);
    }
    setMood("idle");
  };

  const runTrack = async () => {
    setMood("thinking");
    const result = await trackKioskParcel({
      slug,
      demoMode: config?.demoMode === true,
      query: trackQuery,
    });
    if ("error" in result) {
      setTrackError(result.error);
      setTrackResult(null);
      setMood("warning");
      return;
    }
    if ("notFound" in result) {
      setTrackError(result.message);
      setTrackResult(null);
      setMood("warning");
      return;
    }
    setTrackError(null);
    setTrackResult(result);
    setMood("success");
  };

  const runRates = async () => {
    await loadQuotesForDraft({
      ...emptyKioskDraft(),
      shipmentType: "domestic",
      senderPincode: rateOrigin,
      receiverPincode: rateDest,
      weight: rateWeight,
      packageType: "non_document",
    });
  };

  const leaveKiosk = () => {
    const staffToken = typeof window !== "undefined" ? localStorage.getItem(STAFF_TOKEN_KEY) : null;
    if (fromHub || staffToken) {
      window.location.href = "/bot-assistant";
      return;
    }
    if (config?.demoMode) {
      window.location.href = "/";
      return;
    }
    window.location.href = "/auth-page?module=hub";
  };

  const requestClose = () => {
    const staffToken = typeof window !== "undefined" ? localStorage.getItem(STAFF_TOKEN_KEY) : null;
    if (fromHub || staffToken || config?.demoMode) {
      leaveKiosk();
      return;
    }
    setScreen("staff");
  };

  const unlockStaff = () => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(PIN_KEY) : null;
    if (fromHub) {
      leaveKiosk();
      return;
    }
    if (stored && pin.trim() === stored) {
      leaveKiosk();
      return;
    }
    if (!stored && pin.trim() === "123456") {
      setPinError("Default device PIN accepted only until staff set a PIN in Hub settings.");
      leaveKiosk();
      return;
    }
    setPinError("Ask a staff member. This PIN does not match this tablet.");
  };

  const helpArticles = useMemo(() => localKnowledge(helpQuery), [helpQuery]);

  const handoverSummary = JSON.stringify(
    {
      store: config?.office.name,
      screen,
      sendStep,
      draft,
      submitResult,
      trackQuery,
    },
    null,
    2,
  );

  if (!config) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black text-zinc-400">
        Loading Bot Assistant…
      </div>
    );
  }

  if (config.unavailable) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-black px-6 text-center text-white">
        <img src={xgooLogo} alt="XGoo" className="h-12 object-contain" />
        <p className="text-lg font-semibold">This Hub store is not set up for Bot Assistant yet.</p>
        <p className="max-w-md text-sm text-zinc-400">
          Sign in to XGoo Hub and finish store setup, then open Bot Assistant from the Hub sidebar.
        </p>
      </div>
    );
  }

  if (mood === "sleep") {
    return (
      <button
        type="button"
        className="flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-black text-white"
        onClick={() => setMood("greeting")}
      >
        <img src={xgooLogo} alt="XGoo" className="h-12 object-contain" />
        <RobotFace mood="sleep" />
        <p className="text-lg">{copy.tapToWake}</p>
      </button>
    );
  }

  const flow = (
    <>
      {screen === "send" && sendStep !== "complete" && sendStep !== "failed" ? (
        <ShipmentWizard
          language={language}
          step={sendStep === "submitting" ? "review" : sendStep}
          draft={draft}
          quotes={quotes}
          quoteMessage={quoteMessage}
          quotesLive={quotesLive}
          errors={errors}
          submitting={submitting}
          onChange={patchDraft}
          onNext={() => void advanceSend()}
          onBack={() => {
            if (sendStep === "intent") goHome();
            else if (sendStep === "sender") setSendStep("intent");
            else if (sendStep === "receiver") setSendStep("sender");
            else if (sendStep === "parcel") setSendStep("receiver");
            else if (sendStep === "rates") setSendStep("parcel");
            else setSendStep("rates");
          }}
          onSelectQuote={(key, serviceType) => patchDraft({ selectedQuoteKey: key, serviceType })}
        />
      ) : null}

      {screen === "send" && sendStep === "complete" && submitResult ? (
        <div className="space-y-4" data-testid="kiosk-send-complete">
          <h2 className="text-xl font-semibold text-white">{copy.speakDone}</h2>
          <p className="text-sm text-amber-300">{submitResult.message}</p>
          {submitResult.requestNumber ? (
            <p className="text-2xl font-bold text-white">{submitResult.requestNumber}</p>
          ) : null}
          <p className="text-sm text-zinc-400">Booked: no · Paid: no · Label: no</p>
          <button type="button" onClick={goHome} className="h-12 bg-[#FF4907] px-6 font-semibold text-white">
            {copy.another}
          </button>
        </div>
      ) : null}

      {screen === "track" ? (
        <TrackingPanel
          language={language}
          query={trackQuery}
          result={trackResult}
          error={trackError}
          loading={mood === "thinking"}
          onQuery={setTrackQuery}
          onTrack={() => void runTrack()}
        />
      ) : null}

      {screen === "rates" ? (
        <RatesPanel
          language={language}
          origin={rateOrigin}
          dest={rateDest}
          weight={rateWeight}
          quotes={quotes}
          message={quoteMessage}
          live={quotesLive}
          loading={mood === "thinking"}
          onOrigin={setRateOrigin}
          onDest={setRateDest}
          onWeight={setRateWeight}
          onLookup={() => void runRates()}
        />
      ) : null}

      {screen === "business" ? <BusinessPanel language={language} /> : null}

      {screen === "help" ? (
        <HelpPanel
          language={language}
          articles={helpArticles}
          query={helpQuery}
          onQuery={setHelpQuery}
          store={config}
        />
      ) : null}

      {screen === "staff" || screen === "handover" ? (
        <StaffHandover
          language={language}
          summary={handoverSummary}
          pin={pin}
          pinError={pinError}
          onPin={setPin}
          onUnlock={unlockStaff}
          storePhone={config.office.phone}
        />
      ) : null}
    </>
  );

  return (
    <div className="kiosk-root relative flex min-h-dvh flex-col overflow-x-hidden bg-black text-white">
      {config.demoMode ? (
        <div className="bg-[#FF4907] px-4 py-1.5 text-center text-xs font-semibold text-white">
          {copy.demoBanner}
        </div>
      ) : null}

      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <img src={xgooLogo} alt="" className="h-9 w-9 object-contain sm:h-11 sm:w-11" />
          <span className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
            {XGOO_BRAND.productName}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex overflow-hidden bg-[#1a1a1a]">
            {LANG_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLanguage(tab.id)}
                className={`h-9 px-3 text-sm font-semibold sm:h-10 sm:px-4 ${
                  language === tab.id ? "bg-[#FF4907] text-white" : "text-zinc-300 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <KioskClock />
          <button
            type="button"
            aria-label={copy.staff}
            onClick={() => setScreen("staff")}
            className="flex h-10 w-10 items-center justify-center text-zinc-300 hover:text-white"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={copy.closeBot}
            onClick={requestClose}
            data-testid="kiosk-close"
            className="flex h-10 items-center gap-1.5 bg-zinc-800 px-3 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">{copy.closeBot}</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 pb-2 sm:px-6 lg:px-8">
        {screen === "home" ? (
          <>
            <section className="relative grid min-h-0 flex-1 grid-cols-1 items-center gap-2 py-1 lg:grid-cols-[minmax(0,1.05fr)_auto_minmax(0,0.9fr)]">
              <div className="max-w-xl">
                <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                  <span className="block">{copy.greetNamaste}</span>
                  <span className="block">
                    {copy.greetWelcome}{" "}
                    <span className="text-[#FF4907]">{XGOO_BRAND.productName}.</span>
                  </span>
                </h1>
                <p className="mt-3 text-lg italic text-zinc-400 sm:text-xl">{copy.howHelp}</p>
              </div>
              <div className="flex justify-center">
                <RobotFace mood={mood} />
              </div>
              <KioskHeroLogo />
            </section>
            <ServiceCards language={language} onSelect={openScreen} />
          </>
        ) : (
          <section className="kiosk-flow min-h-0 flex-1 overflow-auto py-3">
            <div className="mb-4 flex gap-2">
              <button type="button" onClick={goHome} className="h-11 bg-zinc-800 px-4 font-medium text-white">
                {copy.home}
              </button>
              <button
                type="button"
                onClick={() => setScreen("handover")}
                className="h-11 px-4 text-sm text-zinc-400"
              >
                {copy.handover}
              </button>
            </div>
            {flow}
          </section>
        )}

        <div className="mt-auto flex items-center justify-center gap-6 py-4 sm:py-5">
          <VoiceControls
            language={language}
            mood={mood}
            supported={speechOk}
            denied={micDenied}
            onMic={() => void handleMic()}
            onStop={() => {
              stopSpeaking();
              setMood("idle");
            }}
          />
        </div>
      </main>

      <div className="kiosk-stripes h-10 w-full shrink-0 sm:h-12" aria-hidden="true" />
    </div>
  );
}
