const GENERIC_TRACK_REFS = new Set([
  'xgoo',
  'open',
  'track',
  'menu',
  'welcome',
  'hi',
  'hello',
  'help',
]);

export function isGenericTrackRef(ref?: string | null): boolean {
  const value = (ref || '').trim().toLowerCase();
  return !value || GENERIC_TRACK_REFS.has(value);
}

export function trackTabHref(ref?: string | null) {
  if (isGenericTrackRef(ref)) return '/(tabs)/track' as const;
  return `/(tabs)/track?q=${encodeURIComponent(ref!.trim())}` as const;
}
