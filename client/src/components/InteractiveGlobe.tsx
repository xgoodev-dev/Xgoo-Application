import {
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  Component,
  type ReactNode,
} from "react";

// ── Error boundary ────────────────────────────────────────────────────────────
class GlobeErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <GlobeFallback />;
    return this.props.children;
  }
}

function GlobeFallback() {
  return (
    <div
      className="w-full flex items-center justify-center"
      style={{ height: 520 }}
    >
      <div
        className="rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center"
        style={{ width: 400, height: 400 }}
      >
        <p className="text-sm text-gray-400">Globe unavailable</p>
      </div>
    </div>
  );
}

// ── Lazy Globe import ─────────────────────────────────────────────────────────
const Globe = lazy(() =>
  import("react-globe.gl").catch(() => ({
    default: () => <GlobeFallback />,
  }))
);

// ── Static data ───────────────────────────────────────────────────────────────
const CITIES = [
  { name: "Mumbai",    lat: 19.076, lng: 72.877 },
  { name: "Delhi",     lat: 28.613, lng: 77.209 },
  { name: "Bangalore", lat: 12.971, lng: 77.594 },
  { name: "Chennai",   lat: 13.082, lng: 80.270 },
  { name: "Kolkata",   lat: 22.572, lng: 88.363 },
  { name: "Hyderabad", lat: 17.385, lng: 78.486 },
  { name: "Pune",      lat: 18.520, lng: 73.856 },
  { name: "Ahmedabad", lat: 23.022, lng: 72.571 },
];

const ARCS = [
  { startLat: 28.613, startLng: 77.209, endLat: 19.076, endLng: 72.877 },
  { startLat: 28.613, startLng: 77.209, endLat: 22.572, endLng: 88.363 },
  { startLat: 19.076, startLng: 72.877, endLat: 12.971, endLng: 77.594 },
  { startLat: 13.082, startLng: 80.270, endLat: 17.385, endLng: 78.486 },
  { startLat: 18.520, startLng: 73.856, endLat: 23.022, endLng: 72.571 },
  { startLat: 26.912, startLng: 75.787, endLat: 28.613, endLng: 77.209 },
].map((arc) => ({ ...arc, color: "#FF4907" }));

// ── Inner scene ───────────────────────────────────────────────────────────────
function GlobeScene({ size }: { size: number }) {
  const globeRef = useRef<any>(null);
  const [countries, setCountries] = useState<{ features: any[] }>({
    features: [],
  });

  // Fetch GeoJSON land data
  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson"
    )
      .then((r) => r.json())
      .then((data) => setCountries(data))
      .catch(() => {});
  }, []);

  // Camera + controls once globe is ready
  const handleReady = () => {
    const g = globeRef.current;
    if (!g) return;
    try {
      g.pointOfView({ lat: 20, lng: 78, altitude: 2.0 }, 900);
    } catch (_) {}
    try {
      const c = g.controls();
      c.autoRotate = true;
      c.autoRotateSpeed = 0.35;
      c.enableDamping = true;
      c.dampingFactor = 0.08;
      c.minDistance = 250; // prevent zoom-in clipping
      c.maxDistance = 500;
    } catch (_) {}
  };

  return (
    <Globe
      ref={globeRef}
      width={size}
      height={size}
      backgroundColor="rgba(0,0,0,0)"

      // ── KEY: no sphere, no atmosphere → pure floating dots ──
      showGlobe={false}
      showAtmosphere={false}

      onGlobeReady={handleReady}

      // ── Continent dots ───────────────────────────────────────
      // Use darker orange (#FF4907 based) tinted dots — stays on-brand
      // and looks clean on white without a sphere background
      hexPolygonsData={countries.features}
      hexPolygonResolution={3}
      hexPolygonMargin={0.38}
      hexPolygonUseDots={true}
      hexPolygonColor={() => "rgba(180, 80, 20, 0.55)"}
      hexPolygonAltitude={0.01}

      // ── City pins ────────────────────────────────────────────
      pointsData={CITIES}
      pointLat="lat"
      pointLng="lng"
      pointColor={() => "#FF4907"}
      pointRadius={0.55}
      pointAltitude={0.08}
      pointLabel={(d: any) =>
        `<div style="background:#FF4907;color:#fff;padding:3px 8px;border-radius:5px;font-size:11px;font-weight:600;white-space:nowrap">${d.name}</div>`
      }

      // ── Delivery arcs ────────────────────────────────────────
      arcsData={ARCS}
      arcColor="color"
      arcDashLength={0.4}
      arcDashGap={0.2}
      arcDashAnimateTime={1800}
      arcStroke={0.45}
      arcAltitudeAutoScale={0.28}
    />
  );
}

// ── Loading state ─────────────────────────────────────────────────────────────
function GlobeLoader({ size }: { size: number }) {
  const r = size * 0.76;
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="rounded-full border border-orange-100 animate-pulse"
        style={{ width: r, height: r, background: "radial-gradient(circle at 38% 38%, #fff7f5, #fef0eb)" }}
      />
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export function InteractiveGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(520);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize(Math.round(w));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full" style={{ height: size }}>
      <GlobeErrorBoundary>
        <Suspense fallback={<GlobeLoader size={size} />}>
          <GlobeScene size={size} />
        </Suspense>
      </GlobeErrorBoundary>
    </div>
  );
}
