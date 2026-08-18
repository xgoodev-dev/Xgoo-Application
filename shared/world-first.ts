import { normalizePartnerCode } from "./partner-sync";

/** World First agent portal (Xpresion). Login is saved username/password or OTP — credentials are not stored in XGoo. */
export const WORLD_FIRST_XPRESION_URL = "https://xpresion.worldfirst.in/";
/** Public door-pickup form on worldfirst.in (not the agent Xpresion console). */
export const WORLD_FIRST_PUBLIC_BOOKING_URL = "https://www.worldfirst.in/bookingnew.html";
export const WORLD_FIRST_SITE_URL = "https://www.worldfirst.in/";

export function isWorldFirstPartner(code?: string | null, name?: string | null): boolean {
  const c = (code ?? "").trim().toUpperCase();
  if (c === "WF" || c === "WFC" || c === "WORLD FIRST" || c === "WORLDFIRST") return true;
  const n = (name ?? "").toLowerCase();
  return n.includes("world first") || n.includes("worldfirst");
}

export function worldFirstPortalUrl(partnerPortalUrl?: string | null): string {
  const configured = partnerPortalUrl?.trim();
  if (configured) return configured;
  return WORLD_FIRST_XPRESION_URL;
}

export const WORLD_FIRST_WORKFLOW = [
  { id: "open_portal", label: "Open World First Xpresion" },
  { id: "authenticate", label: "Log in (saved password or OTP)" },
  { id: "create_shipment", label: "Open shipment creation" },
  { id: "fill_sender", label: "Enter sender / shipper" },
  { id: "fill_receiver", label: "Enter consignee" },
  { id: "fill_package", label: "Enter package and weight" },
  { id: "fill_contents", label: "Enter contents and declared value" },
  { id: "review_submit", label: "Review and submit on World First" },
  { id: "capture_awb", label: "Capture AWB in XGoo" },
] as const;

export type WorldFirstWorkflowStepId = (typeof WORLD_FIRST_WORKFLOW)[number]["id"];
export type WorkflowStepStatus = "pending" | "done" | "waiting";

export type BookingWorkflowStep = {
  id: string;
  label: string;
  status: WorkflowStepStatus;
};

export function worldFirstWorkflowStatus(
  eventSteps: string[],
  jobStatus?: string | null,
): BookingWorkflowStep[] {
  const seen = new Set(eventSteps);
  const loginFinished = seen.has("resume") || jobStatus === "booked";
  return WORLD_FIRST_WORKFLOW.map((step) => {
    let status: WorkflowStepStatus = "pending";
    if (seen.has(step.id)) {
      status = step.id === "authenticate" && !loginFinished ? "waiting" : "done";
    }
    if (step.id === "authenticate") {
      if (loginFinished) status = "done";
      else if (seen.has("open_portal") || seen.has("authenticate")) status = "waiting";
    }
    if (step.id === "capture_awb" && jobStatus === "booked") status = "done";
    return { id: step.id, label: step.label, status };
  });
}

export function looksLikeWorldFirstHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host.includes("worldfirst") || host.includes("xpresion") || host.includes("xpression");
}

export function worldFirstCodes(): string[] {
  return ["WF", "WFC", "WORLDFIRST"];
}

export function matchesWorldFirstCode(code: string): boolean {
  const c = normalizePartnerCode(code);
  return c === "WF" || c === "WFC" || c === "WORLD FIRST" || c === "WORLDFIRST";
}
