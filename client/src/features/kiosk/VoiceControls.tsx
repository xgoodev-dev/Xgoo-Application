import { Mic, MicOff, Square } from "lucide-react";
import type { RobotMood } from "@shared/kiosk";
import { kioskCopy } from "./i18n";
import type { KioskLanguage } from "@shared/kiosk";

export function VoiceControls({
  language,
  mood,
  supported,
  denied,
  onMic,
  onStop,
}: {
  language: KioskLanguage;
  mood: RobotMood;
  supported: boolean;
  denied: boolean;
  onMic: () => void;
  onStop: () => void;
}) {
  const copy = kioskCopy(language);
  const listening = mood === "listening";
  const speaking = mood === "speaking";

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <button
        type="button"
        onClick={listening || speaking ? onStop : onMic}
        data-testid="kiosk-mic"
        className={`relative flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full text-white transition active:scale-95 sm:h-20 sm:w-20 ${
          listening ? "bg-[#FF4907] kiosk-pulse" : "bg-[#FF4907] hover:bg-[#e03d00]"
        }`}
        aria-label={listening || speaking ? copy.stopSpeak : copy.tapToSpeak}
      >
        <span className="pointer-events-none absolute -inset-3 border-2 border-dashed border-[#FF4907]/80 sm:-inset-4" />
        {speaking ? (
          <Square className="h-7 w-7 fill-white" />
        ) : denied || !supported ? (
          <MicOff className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </button>
      <div className="min-w-0 text-left">
        <p className="text-base font-semibold text-white sm:text-lg">
          {listening ? copy.tapToSpeak : speaking ? copy.speaking : copy.tapToSpeak}
        </p>
        <p className="text-sm text-zinc-400">
          {listening
            ? copy.imListening
            : denied
              ? copy.micDenied
              : !supported
                ? copy.micUnsupported
                : copy.imListening}
        </p>
      </div>
      <div className="hidden h-10 items-end gap-1 sm:flex" aria-hidden="true">
        {[6, 14, 22, 10, 18, 8, 16].map((h, i) => (
          <span
            key={i}
            className={`w-1 rounded-full bg-[#FF4907] ${listening ? "kiosk-wave" : ""}`}
            style={{ height: h, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
