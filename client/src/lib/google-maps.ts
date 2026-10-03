/// <reference types="@types/google.maps" />

/**
 * Google Maps JavaScript API Singleton Loader
 *
 * Efficiently loads the Google Maps JavaScript API once and provides
 * reactive hooks and promise helpers across the React application.
 */

let loadPromise: Promise<typeof google.maps> | null = null;

export function getClientGoogleMapsApiKey(): string {
  return (
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string)?.trim() ||
    (import.meta.env.GOOGLE_MAPS_API_KEY as string)?.trim() ||
    ""
  );
}

export function isGoogleMapsKeyConfigured(): boolean {
  return Boolean(getClientGoogleMapsApiKey());
}

/**
 * Dynamically loads the Google Maps JavaScript API script.
 */
export function loadGoogleMapsScript(): Promise<typeof google.maps> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cannot load Google Maps in non-browser environment"));
  }

  const globalGoogle = (window as unknown as { google?: { maps?: typeof google.maps } }).google;

  // If already loaded on window, resolve immediately
  if (globalGoogle?.maps) {
    return Promise.resolve(globalGoogle.maps);
  }

  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = getClientGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  }

  loadPromise = new Promise<typeof google.maps>((resolve, reject) => {
    const existingScript = document.getElementById("google-maps-js-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        const winGoogle = (window as unknown as { google?: { maps?: typeof google.maps } }).google;
        if (winGoogle?.maps) resolve(winGoogle.maps);
        else reject(new Error("Google Maps loaded but window.google.maps is undefined"));
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load Google Maps script"));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js-sdk";
    script.type = "text/javascript";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,drawing&v=weekly&loading=async`;

    script.onload = () => {
      const winGoogle = (window as unknown as { google?: { maps?: typeof google.maps } }).google;
      if (winGoogle?.maps) {
        resolve(winGoogle.maps);
      } else {
        reject(new Error("Google Maps loaded but window.google.maps is undefined"));
      }
    };

    script.onerror = (event) => {
      loadPromise = null;
      reject(new Error(`Failed to load Google Maps JS SDK: ${event}`));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Creates custom SVG data URL marker icons for Google Maps markers.
 */
export function createGoogleMapPinSvg({
  color = "#FF4907",
  letter = "",
  size = 36,
}: {
  color?: string;
  letter?: string;
  size?: number;
}): google.maps.Icon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 36 36">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <circle cx="18" cy="18" r="16" fill="${color}" stroke="#FFFFFF" stroke-width="2.5" filter="url(#shadow)" />
      ${
        letter
          ? `<text x="18" y="23" font-size="14" font-family="system-ui, -apple-system, sans-serif" font-weight="700" fill="#FFFFFF" text-anchor="middle">${letter}</text>`
          : `<circle cx="18" cy="18" r="5" fill="#FFFFFF" />`
      }
    </svg>
  `.trim();

  const g = (window as unknown as { google?: typeof google }).google;
  const sizeObj = g?.maps ? new g.maps.Size(size, size) : undefined;
  const pointObj = g?.maps ? new g.maps.Point(size / 2, size / 2) : undefined;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: sizeObj,
    anchor: pointObj,
  };
}
