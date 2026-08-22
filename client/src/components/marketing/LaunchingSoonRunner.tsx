const launchingSoonMessage =
  "We're launching soon — online courier booking is coming to your city";

export function LaunchingSoonRunner() {
  const items = Array.from({ length: 6 }, () => launchingSoonMessage);

  return (
    <div
      className="bg-[#FF4907] text-white overflow-hidden py-2 text-xs font-medium tracking-wide sm:text-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-max animate-marquee">
        {[...items, ...items].map((text, i) => (
          <span key={i} className="mx-6 whitespace-nowrap">
            {text} <span className="opacity-70">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
