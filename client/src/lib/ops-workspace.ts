export type OpsWorkspace = "hub" | "command";

const STORAGE_KEY = "xgoo-ops-workspace";
const CHANGE_EVENT = "xgoo-ops-workspace";

export function getOpsWorkspace(): OpsWorkspace {
  if (typeof window === "undefined") return "hub";
  return window.sessionStorage.getItem(STORAGE_KEY) === "command" ? "command" : "hub";
}

export function setOpsWorkspace(workspace: OpsWorkspace) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, workspace);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearOpsWorkspace() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeOpsWorkspace(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}
