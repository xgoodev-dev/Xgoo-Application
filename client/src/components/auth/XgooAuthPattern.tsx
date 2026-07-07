/** XGoo brand patterns — chevrons, halftone, folded-X hero for auth panel */

const ORANGE = "#FF4907";
const ORANGE_DARK = "#9B320B";
const ORANGE_LIGHT = "#FF6B2C";

export function XgooHalftoneCorner({
  position = "top-right",
  light = false,
  className = "",
}: {
  position?: "top-right" | "bottom-left" | "center";
  light?: boolean;
  className?: string;
}) {
  const fill = light ? "white" : ORANGE;
  const posClass =
    position === "top-right"
      ? "right-0 top-0"
      : position === "bottom-left"
        ? "left-0 bottom-0"
        : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
  return (
    <svg
      className={`pointer-events-none absolute ${posClass} ${className}`}
      width="320"
      height="320"
      viewBox="0 0 280 280"
      xmlns="http://www.w3.org/2000/svg"
    >
      {Array.from({ length: 12 }).map((_, row) =>
        Array.from({ length: 12 }).map((_, col) => {
          const dist = Math.sqrt(
            Math.pow(position === "top-right" ? 11 - col : col, 2) +
              Math.pow(position === "bottom-left" ? 11 - row : row, 2),
          );
          if (dist > 11) return null;
          const r = Math.max(1.5, 5 - dist * 0.38);
          const opacity = Math.max(0.06, (light ? 0.5 : 0.85) - dist * 0.07);
          return (
            <circle
              key={`${row}-${col}`}
              cx={col * 22 + 11}
              cy={row * 22 + 11}
              r={r}
              fill={fill}
              opacity={opacity}
            />
          );
        }),
      )}
    </svg>
  );
}

/** Large hero graphic — replaces Jeton 3D coins with XGoo folded-X + chevrons */
export function XgooHeroGraphic({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 420 420"
        className="w-[min(85%,420px)] h-auto opacity-95"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hero-chev-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
          </linearGradient>
          <linearGradient id="hero-chev-2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,180,100,0.2)" />
          </linearGradient>
          <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#391305" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Back chevron shard */}
        <polygon
          points="60,80 60,340 200,210"
          fill="url(#hero-chev-2)"
          filter="url(#hero-shadow)"
          transform="rotate(-8 130 210)"
        />
        <polygon
          points="320,100 320,320 180,210"
          fill="url(#hero-chev-1)"
          filter="url(#hero-shadow)"
          transform="rotate(6 250 210)"
        />

        {/* Large folded X — logo centerpiece */}
        <g filter="url(#hero-shadow)" transform="translate(210,210)">
          <polygon points="-70,-10 -40,-40 -40,40" fill="rgba(255,255,255,0.25)" />
          <polygon points="-40,-40 0,-80 0,-20 -25,0 0,20 0,80 -40,40" fill="rgba(255,255,255,0.55)" />
          <polygon points="0,-80 40,-40 40,40 0,80 0,20 25,0 0,-20 0,-80" fill="rgba(255,255,255,0.75)" />
          <polygon points="40,-40 70,-10 70,30 40,40" fill="rgba(255,255,255,0.35)" />
          <polygon points="-85,0 -70,-15 -70,15" fill="rgba(255,210,150,0.6)" />
        </g>

        {/* Floating diamond accents */}
        <polygon points="340,60 352,72 340,84 328,72" fill="rgba(255,255,255,0.5)" />
        <polygon points="80,320 92,332 80,344 68,332" fill="rgba(255,255,255,0.4)" />
        <polygon points="360,280 370,290 360,300 350,290" fill="rgba(255,255,255,0.35)" />

        {/* Sharp parallelogram lanes */}
        <g opacity="0.3">
          <polygon points="280,40 360,40 345,70 265,70" fill="white" />
          <polygon points="295,70 375,70 360,100 280,100" fill="rgba(255,255,255,0.6)" />
        </g>
      </svg>
    </div>
  );
}

/** Pattern overlay for gradient panel */
export function XgooGradientPanelPatterns() {
  return (
    <>
      <XgooHalftoneCorner position="top-right" light />
      <XgooHalftoneCorner position="bottom-left" light className="opacity-70" />
      <XgooHeroGraphic />
      {/* Subtle diagonal stripe texture */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="auth-stripes" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="16" stroke="white" strokeWidth="6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-stripes)" />
      </svg>
    </>
  );
}

export function XgooBrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon points="8,28 14,22 14,34" fill={ORANGE_DARK} />
      <polygon points="14,22 28,8 28,20 20,28 28,36 28,48 14,34" fill={ORANGE} />
      <polygon points="28,8 42,22 42,34 28,48 28,36 36,28 28,20 28,8" fill={ORANGE_LIGHT} />
      <polygon points="42,22 48,28 42,34" fill={ORANGE_DARK} />
      <polygon points="4,28 8,24 8,32" fill={ORANGE} />
    </svg>
  );
}

export function XgooTagline({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`h-px flex-1 max-w-[40px] ${light ? "bg-white/40" : "bg-stone-300"}`} />
      <span
        className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${light ? "text-white/80" : "text-stone-500"}`}
      >
        Send it. Delivered.
      </span>
      <div className={`h-px flex-1 max-w-[40px] ${light ? "bg-white/40" : "bg-stone-300"}`} />
    </div>
  );
}
