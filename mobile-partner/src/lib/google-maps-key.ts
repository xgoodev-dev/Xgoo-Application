import { getApiUrl, PRODUCTION_API_URL } from '@/lib/server';

const MAPS_PAGE_ORIGIN = 'https://www.xgoo.in';

export function getMapsPageOrigin() {
  return MAPS_PAGE_ORIGIN;
}

export function getBundledGoogleMapsBrowserKey() {
  return (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
}

async function readKeyFromBase(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/public/maps-config`);
    if (!response.ok) return '';
    const data = (await response.json()) as { browserKey?: string };
    return typeof data.browserKey === 'string' ? data.browserKey.trim() : '';
  } catch {
    return '';
  }
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
