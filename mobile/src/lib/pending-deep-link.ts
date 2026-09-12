let pendingHref: string | null = null;

export function setPendingDeepLink(href: string) {
  pendingHref = href;
}

export function consumePendingDeepLink(): string | null {
  const href = pendingHref;
  pendingHref = null;
  return href;
}
