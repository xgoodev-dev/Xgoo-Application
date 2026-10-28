import React, { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, LocateFixed, MapPin, Search, Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface GeocodeAddress {
  lat: number;
  lng: number;
  displayName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  placeId?: string;
}

export type SavedAddressSuggestion = {
  id: string;
  label: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  name?: string;
  phone?: string;
  isDefault?: boolean;
};

export interface GooglePlacesAutocompleteProps {
  value?: string;
  placeholder?: string;
  country?: string;
  onSelect: (item: GeocodeAddress) => void;
  onSelectSaved?: (item: SavedAddressSuggestion) => void;
  onQueryChange?: (value: string) => void;
  onLocateMe?: () => void;
  isLocating?: boolean;
  savedAddresses?: SavedAddressSuggestion[];
  showSearchButton?: boolean;
  className?: string;
  testIdPrefix?: string;
}

function matchesQuery(item: SavedAddressSuggestion, query: string) {
  if (!query.trim()) return true;
  const hay = [item.label, item.address, item.city, item.state, item.pincode]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(query.trim().toLowerCase());
}

export function GooglePlacesAutocomplete({
  value = "",
  placeholder = "Search address, area, or pincode…",
  onSelect,
  onSelectSaved,
  onQueryChange,
  onLocateMe,
  isLocating = false,
  savedAddresses = [],
  showSearchButton = true,
  className,
  testIdPrefix = "places",
}: GooglePlacesAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<GeocodeAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const savedMatches = savedAddresses.filter((item) => matchesQuery(item, query)).slice(0, 5);

  const executeSearch = useCallback(async (text: string) => {
    const q = text.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/maps/geocode?q=${encodeURIComponent(q)}&limit=6`);
      if (res.ok) {
        const data = (await res.json()) as GeocodeAddress[];
        setSuggestions(data);
      }
    } catch (err) {
      console.warn("Address search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (text: string) => {
    setQuery(text);
    onQueryChange?.(text);
    setIsOpen(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void executeSearch(text);
    }, 320);
  };

  const handleSelect = (item: GeocodeAddress) => {
    setQuery(item.displayName || item.address);
    setIsOpen(false);
    setSuggestions([]);
    onSelect(item);
  };

  const handleSaved = (item: SavedAddressSuggestion) => {
    setQuery(item.address);
    setIsOpen(false);
    setSuggestions([]);
    if (onSelectSaved) {
      onSelectSaved(item);
      return;
    }
    onSelect({
      lat: item.lat || 0,
      lng: item.lng || 0,
      displayName: item.address,
      address: item.address,
      city: item.city || "",
      state: item.state || "",
      pincode: item.pincode || "",
    });
  };

  const showMenu = isOpen && (savedMatches.length > 0 || suggestions.length > 0);

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="pr-8"
            autoComplete="off"
            data-testid={`input-${testIdPrefix}-search`}
          />
          {query ? (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setQuery("");
                onQueryChange?.("");
                setSuggestions([]);
                setIsOpen(true);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {showSearchButton ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void executeSearch(query)}
            disabled={loading}
            data-testid={`button-${testIdPrefix}-search`}
            title="Search location"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        ) : null}

        {onLocateMe && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onLocateMe}
            disabled={isLocating}
            data-testid={`button-${testIdPrefix}-locate`}
            title="Use current GPS location"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <LocateFixed className="h-4 w-4 text-primary" />
            )}
          </Button>
        )}
      </div>

      {showMenu ? (
        <ul
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto border bg-popover py-1 shadow-lg"
          data-testid={`list-${testIdPrefix}-suggestions`}
        >
          {savedMatches.length > 0 ? (
            <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Saved
            </li>
          ) : null}
          {savedMatches.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/70"
                onClick={() => handleSaved(item)}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF4907]" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <span className="truncate">{item.label || "Saved address"}</span>
                    {item.isDefault ? <Star className="h-3 w-3 fill-[#FF4907] text-[#FF4907]" /> : null}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {[item.address, item.city].filter(Boolean).join(", ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {suggestions.length > 0 ? (
            <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Places
            </li>
          ) : null}
          {suggestions.map((item, index) => (
            <li key={`${item.lat}-${item.lng}-${index}`}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/70"
                onClick={() => handleSelect(item)}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">
                    {item.address || item.displayName}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {item.displayName}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
