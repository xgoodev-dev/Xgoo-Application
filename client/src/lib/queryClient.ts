import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { "Authorization": `Bearer ${session.access_token}` };
  }
  return {};
}

async function throwIfResNotOk(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new Error(
      "Server error (received HTML instead of JSON). Restart the dev server and run npm run db:push if you recently updated the app.",
    );
  }
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let detail = text;
    try {
      const j = JSON.parse(text) as {
        message?: string;
        hint?: string;
        parseErrors?: string[];
        partnerCodes?: string[];
        step?: string;
        details?: {
          type?: string;
          code?: number;
          error_subcode?: number;
          fbtrace_id?: string;
          requestPath?: string;
          wabaId?: string;
          phoneNumberId?: string;
        };
      };
      if (typeof j.message === "string" && j.message.trim()) {
        detail = j.message.trim();
        if (j.hint) detail += ` ${j.hint}`;
        if (Array.isArray(j.parseErrors) && j.parseErrors.length > 0) {
          detail += ` (${j.parseErrors.slice(0, 3).join("; ")})`;
        }
        if (Array.isArray(j.partnerCodes) && j.partnerCodes.length > 0 && detail.includes("Courier Partners")) {
          detail += ` Available: ${j.partnerCodes.join(", ")}.`;
        }
        const parts: string[] = [];
        if (j.step) parts.push(`step: ${j.step}`);
        if (j.details?.code != null) parts.push(`Meta #${j.details.code}`);
        if (j.details?.error_subcode != null) parts.push(`subcode ${j.details.error_subcode}`);
        if (j.details?.fbtrace_id) parts.push(`trace ${j.details.fbtrace_id}`);
        if (j.details?.wabaId) parts.push(`WABA ${j.details.wabaId}`);
        if (parts.length) detail += ` (${parts.join(", ")})`;
      }
    } catch {
      if (text.trimStart().startsWith("<")) {
        detail =
          "Server error (received HTML instead of JSON). Restart the dev server and run npm run db:push if you recently updated the app.";
      }
    }
    throw new Error(`${res.status}: ${detail}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const headers: Record<string, string> = { ...authHeaders };
  if (data) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/** Read a file as base64 for JSON tariff upload (avoids multipart parsing issues). */
export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    for (let j = 0; j < slice.length; j++) {
      binary += String.fromCharCode(slice[j]);
    }
  }
  return btoa(binary);
}

export type TariffUploadPayload = {
  label: string;
  fileName: string;
  fileData: string;
  courierPartnerId?: string;
  compareVersionId?: string;
  validFrom?: string;
  validTo?: string;
  activate?: "true" | "false";
};

/** JSON body for tariff preview / import (preferred over multipart). */
export async function buildTariffUploadPayload(
  file: File,
  meta: Omit<TariffUploadPayload, "fileName" | "fileData">,
): Promise<TariffUploadPayload> {
  return {
    ...meta,
    fileName: file.name,
    fileData: await fileToBase64(file),
  };
}

/** Multipart upload (e.g. CSV/Excel) — do not set Content-Type; browser adds boundary. */
export async function apiFormRequest(
  method: string,
  url: string,
  formData: FormData,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    method,
    headers: authHeaders,
    body: formData,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return res;
}

/** Authenticated fetch for downloads and custom requests. */
export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const extra = (init?.headers as Record<string, string> | undefined) ?? {};
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders, ...extra },
    credentials: "include",
  });
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(queryKey.join("/") as string, {
      headers: authHeaders,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
