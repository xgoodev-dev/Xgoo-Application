/** XGoo brand patterns for auth panel */

const ORANGE = "#FF4907";
const ORANGE_DARK = "#9B320B";
const ORANGE_LIGHT = "#FF6B2C";

/** Pattern overlay for gradient panel */
export function XgooGradientPanelPatterns() {
  return (
    <>
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
