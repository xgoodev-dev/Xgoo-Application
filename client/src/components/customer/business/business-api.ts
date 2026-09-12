async function parseJson(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { message?: string }).message || "Request failed");
  }
  return json;
}

export function businessApi(token: string) {
  const headers = {
    "Content-Type": "application/json",
    "x-customer-token": token,
  };

  return {
    profile: () =>
      fetch("/api/customer/business/profile", { headers }).then(parseJson),
    saveProfile: (body: Record<string, unknown>) =>
      fetch("/api/customer/business/profile", {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      }).then(parseJson),
    destinations: () =>
      fetch("/api/customer/business/destinations", { headers }).then(parseJson),
    createDestination: (body: Record<string, unknown>) =>
      fetch("/api/customer/business/destinations", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }).then(parseJson),
    updateDestination: (id: string, body: Record<string, unknown>) =>
      fetch(`/api/customer/business/destinations/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      }).then(parseJson),
    deleteDestination: (id: string) =>
      fetch(`/api/customer/business/destinations/${id}`, {
        method: "DELETE",
        headers,
      }).then(parseJson),
    today: (date: string) =>
      fetch(`/api/customer/business/today?date=${encodeURIComponent(date)}`, { headers }).then(
        parseJson,
      ),
    addTodayJob: (body: Record<string, unknown>) =>
      fetch("/api/customer/business/today/jobs", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }).then(parseJson),
    patchTodayJob: (id: string, body: Record<string, unknown>) =>
      fetch(`/api/customer/business/today/jobs/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      }).then(parseJson),
    confirmToday: (date: string) =>
      fetch("/api/customer/business/today/confirm", {
        method: "POST",
        headers,
        body: JSON.stringify({ date }),
      }).then(parseJson),
  };
}
