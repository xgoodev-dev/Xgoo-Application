import { speechLocale, type KioskLanguage } from "@shared/kiosk";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type SpeechListenResult =
  | { ok: true; transcript: string }
  | { ok: false; reason: "unsupported" | "denied" | "unavailable" | "aborted" | "empty" };

export function isSpeechRecognitionSupported(): boolean {
  return recognitionCtor() != null;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function listenOnce(language: KioskLanguage): Promise<SpeechListenResult> {
  const Ctor = recognitionCtor();
  if (!Ctor) return Promise.resolve({ ok: false, reason: "unsupported" });

  return new Promise((resolve) => {
    let settled = false;
    const rec = new Ctor();
    rec.lang = speechLocale(language);
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    const finish = (result: SpeechListenResult) => {
      if (settled) return;
      settled = true;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      resolve(result);
    };
    rec.onresult = (event) => {
      const first = event.results[0];
      const text = first?.[0]?.transcript?.trim() || "";
      finish(text ? { ok: true, transcript: text } : { ok: false, reason: "empty" });
    };
    rec.onerror = (event) => {
      const err = event.error || "";
      if (err === "not-allowed" || err === "service-not-allowed") {
        finish({ ok: false, reason: "denied" });
        return;
      }
      if (err === "aborted" || err === "canceled") {
        finish({ ok: false, reason: "aborted" });
        return;
      }
      finish({ ok: false, reason: "unavailable" });
    };
    rec.onend = () => {
      finish({ ok: false, reason: "empty" });
    };
    try {
      rec.start();
    } catch {
      finish({ ok: false, reason: "unavailable" });
    }
  });
}

export function speakText(text: string, language: KioskLanguage): Promise<void> {
  if (!isSpeechSynthesisSupported() || !text.trim()) return Promise.resolve();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLocale(language);
  utterance.rate = 0.95;
  return new Promise((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
}
