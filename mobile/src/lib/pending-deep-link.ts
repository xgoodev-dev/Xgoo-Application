import type { Href } from 'expo-router';

let pendingHref: Href | null = null;

export function setPendingDeepLink(href: string) {
  pendingHref = href as Href;
}

export function consumePendingDeepLink(): Href | null {
  const href = pendingHref;
  pendingHref = null;
  return href;
}
