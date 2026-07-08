import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { "Authorization": `Bearer ${session.access_token}` };
  }
  return {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let detail = text;
    try {
      const j = JSON.parse(text) as {
        message?: string;
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
