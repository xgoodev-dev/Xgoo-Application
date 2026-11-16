const STORAGE_KEY = "xgoo-command-store";
const CHANGE_EVENT = "xgoo-command-store";

export function getCommandStoreId(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(STORAGE_KEY);
}

export function setCommandStoreId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.sessionStorage.setItem(STORAGE_KEY, id);
  else window.sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearCommandStore() {
  setCommandStoreId(null);
}

export function subscribeCommandStore(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}
