import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";

type HubSearchHit = {
  kind: "shipment" | "request";
  id: string;
  label: string;
  detail: string;
  href: string;
};

export function HubHeaderSearch() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const enabled = debounced.length >= 2;
  const { data, isFetching, isError } = useQuery<HubSearchHit[]>({
    queryKey: ["/api/shipments/search", debounced],
    enabled,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/shipments/search?q=${encodeURIComponent(debounced)}`);
      return res.json();
    },
    staleTime: 15_000,
  });

  const results = Array.isArray(data) ? data : [];
  const show = open && enabled;

  const emptyText = useMemo(() => {
    if (isFetching) return "Searching…";
    if (isError) return "Search failed. Try again.";
    if (!enabled) return "Type at least 2 characters.";
    return "No booking or AWB matches.";
  }, [enabled, isError, isFetching]);

  return (
    <Popover open={show} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search booking ID or AWB"
            className="h-9 pl-8"
            data-testid="input-header-booking-search"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[min(28rem,calc(100vw-2rem))] p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {results.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="max-h-80 overflow-auto">
            {results.map((row) => (
              <li key={`${row.kind}-${row.id}`}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 rounded-sm px-3 py-2 text-left hover:bg-muted"
                  onClick={() => {
                    setOpen(false);
                    setQuery(row.label);
                    setLocation(row.href);
                  }}
                  data-testid={`result-header-booking-${row.id}`}
                >
                  <span className="font-mono text-sm font-semibold">{row.label}</span>
                  {row.detail ? (
                    <span className="text-xs text-muted-foreground">{row.detail}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
