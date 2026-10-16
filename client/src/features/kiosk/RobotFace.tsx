import type { RobotMood } from "@shared/kiosk";

function moodLabel(mood: RobotMood): string {
  switch (mood) {
    case "idle":
      return "Waiting";
    case "greeting":
      return "Greeting";
    case "listening":
      return "Listening";
    case "thinking":
      return "Thinking";
    case "speaking":
      return "Speaking";
    case "success":
      return "Success";
    case "warning":
      return "Needs attention";
    case "error":
      return "Let’s recover";
    case "sleep":
      return "Tap to start";
    default: {
      const _never: never = mood;
      return _never;
    }
  }
}

export function RobotFace({ mood, compact = false }: { mood: RobotMood; compact?: boolean }) {
  const size = compact
    ? "h-28 w-44 sm:h-32 sm:w-52"
    : "h-40 w-64 sm:h-52 sm:w-80 lg:h-56 lg:w-[22rem]";
  const listening = mood === "listening";
  const speaking = mood === "speaking";
  const thinking = mood === "thinking";
  const sleep = mood === "sleep";
  const happy = mood === "greeting" || mood === "success";
  const concern = mood === "warning" || mood === "error";

  return (
    <div className={`relative ${size} shrink-0`} data-testid="kiosk-robot-face" data-mood={mood}>
      {listening ? (
        <div className="absolute inset-x-8 inset-y-4 rounded-full bg-[#FF4907]/10 blur-2xl kiosk-pulse" />
      ) : (
        <div className="absolute inset-x-10 inset-y-6 rounded-full bg-white/5 blur-2xl" />
      )}
      <svg viewBox="0 0 320 200" className="relative h-full w-full" aria-hidden="true">
        <ellipse
          cx="108"
          cy={concern ? 96 : 92}
          rx={listening ? 48 : 46}
          ry={sleep ? 8 : 50}
          fill="#f8fafc"
          className={sleep ? "" : "kiosk-blink"}
        />
        <ellipse
          cx="212"
          cy={concern ? 96 : 92}
          rx={listening ? 48 : 46}
          ry={sleep ? 8 : 50}
          fill="#f8fafc"
          className={sleep ? "" : "kiosk-blink"}
        />
        {!sleep ? (
          <>
            <circle cx="118" cy="96" r="18" fill="#0a0a0a" />
            <circle cx="202" cy="96" r="18" fill="#0a0a0a" />
            <circle cx="124" cy="88" r="5" fill="white" />
            <circle cx="208" cy="88" r="5" fill="white" />
          </>
        ) : null}
        {thinking ? (
          <g fill="#FF4907">
            <circle cx="146" cy="168" r="5" className="kiosk-dot kiosk-dot-1" />
            <circle cx="160" cy="168" r="5" className="kiosk-dot kiosk-dot-2" />
            <circle cx="174" cy="168" r="5" className="kiosk-dot kiosk-dot-3" />
          </g>
        ) : (
          <path
            d={
              happy
                ? "M138 158 C148 176 172 176 182 158 C172 168 148 168 138 158"
                : concern
                  ? "M142 168 C160 154 178 154 196 168"
                  : speaking
                    ? "M144 156 C160 178 176 178 192 156 C176 170 160 170 144 156"
                    : "M142 160 C160 172 176 172 194 160 C176 168 160 168 142 160"
            }
            fill={speaking || happy ? "#E23B4A" : "#C42B3A"}
            className={speaking ? "kiosk-talk" : ""}
          />
        )}
      </svg>
      <p className="sr-only">{moodLabel(mood)}</p>
    </div>
  );
}
