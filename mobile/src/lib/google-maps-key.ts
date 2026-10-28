import { getApiUrl, PRODUCTION_API_URL } from '@/lib/server';

const MAPS_PAGE_ORIGIN = 'https://www.xgoo.in';

export function getMapsPageOrigin() {
  return MAPS_PAGE_ORIGIN;
}

export function getBundledGoogleMapsBrowserKey() {
  return (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
}

function extractKeyFromHtml(html: string) {
  const assigned = html.match(/window\.__APP_CONFIG__\s*=\s*(\{[\s\S]*?\});/);
  if (assigned?.[1]) {
    try {
      const parsed = JSON.parse(assigned[1]) as { VITE_GOOGLE_MAPS_API_KEY?: string };
      const fromConfig = parsed.VITE_GOOGLE_MAPS_API_KEY?.trim();
      if (fromConfig) return fromConfig;
    } catch {
      // Fall through to the field regex.
    }
  }
  const quoted = html.match(/"VITE_GOOGLE_MAPS_API_KEY"\s*:\s*"([^"]+)"/);
  return quoted?.[1]?.trim() || '';
}

async function readKeyFromBase(baseUrl: string) {
  try {
    const configResponse = await fetch(`${baseUrl}/api/public/maps-config`);
    if (configResponse.ok) {
      const data = (await configResponse.json()) as { browserKey?: string };
      const fromConfig = typeof data.browserKey === 'string' ? data.browserKey.trim() : '';
      if (fromConfig) return fromConfig;
    }
  } catch {
    // Homepage HTML still has the public browser key used by the website.
  }

  try {
    const homeResponse = await fetch(`${baseUrl}/`);
    if (!homeResponse.ok) return '';
    return extractKeyFromHtml(await homeResponse.text());
  } catch {
    return '';
  }
}

function uint8ToBase64(bytes: Uint8Array) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triplet = (a << 16) | (b << 8) | c;
    output += chars[(triplet >> 18) & 63];
    output += chars[(triplet >> 12) & 63];
    output += i + 1 < bytes.length ? chars[(triplet >> 6) & 63] : '=';
    output += i + 2 < bytes.length ? chars[triplet & 63] : '=';
  }
  return output;
}

export async function fetchGoogleStaticMapDataUri(input: {
  apiKey: string;
  lat: number;
  lng: number;
  zoom: number;
  markerLat?: number | null;
  markerLng?: number | null;
}) {
  const params = new URLSearchParams({
    center: `${input.lat},${input.lng}`,
    zoom: String(input.zoom),
    size: '640x400',
    scale: '2',
    maptype: 'roadmap',
    key: input.apiKey,
  });
  if (
    input.markerLat != null &&
    input.markerLng != null &&
    Number.isFinite(input.markerLat) &&
    Number.isFinite(input.markerLng)
  ) {
    params.set('markers', `color:0xFF4907|${input.markerLat},${input.markerLng}`);
  }

  const urls = [
    `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`,
    `${getApiUrl()}/api/maps/static?lat=${input.lat}&lng=${input.lng}&zoom=${input.zoom}&w=640&h=400${
      input.markerLat != null && input.markerLng != null
        ? `&m=${input.markerLat},${input.markerLng}`
        : ''
    }`,
  ];

  const headerSets = [
    { Accept: 'image/*', Referer: `${MAPS_PAGE_ORIGIN}/` },
    { Accept: 'image/*' },
  ];

  for (const url of urls) {
    for (const headers of headerSets) {
      try {
        const response = await fetch(url, { headers });
        if (!response.ok) continue;
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) continue;
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength < 2000) continue;
        return `data:${contentType.split(';')[0]};base64,${uint8ToBase64(new Uint8Array(buffer))}`;
      } catch {
        // Try the next source.
      }
    }
  }
  return '';
}

let pendingKey: Promise<string> | null = null;

export function resolveGoogleMapsBrowserKey() {
  const bundled = getBundledGoogleMapsBrowserKey();
  if (bundled) return Promise.resolve(bundled);
  if (!pendingKey) {
    pendingKey = (async () => {
      const bases = Array.from(new Set([getApiUrl(), PRODUCTION_API_URL, MAPS_PAGE_ORIGIN]));
      for (const base of bases) {
        const key = await readKeyFromBase(base);
        if (key) return key;
      }
      return '';
    })().catch(() => {
      pendingKey = null;
      return '';
    });
  }
  return pendingKey;
}
