import React, { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
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

export interface GooglePlacesAutocompleteProps {
  value?: string;
  placeholder?: string;
  country?: string;
  onSelect: (item: GeocodeAddress) => void;
  onLocateMe?: () => void;
  isLocating?: boolean;
  className?: string;
  testIdPrefix?: string;
}

export function GooglePlacesAutocomplete({
  value = "",
  placeholder = "Search address, area, or pincode…",
  country = "IN",
  onSelect,
  onLocateMe,
  isLocating = false,
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

  // Click outside to close suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const executeSearch = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (q.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/maps/geocode?q=${encodeURIComponent(q)}&limit=6`);
        if (res.ok) {
          const data = (await res.json()) as GeocodeAddress[];
          setSuggestions(data);
          setIsOpen(data.length > 0);
        }
      } catch (err) {
        console.warn("Address search error:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleInputChange = (text: string) => {
    setQuery(text);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(text);
    }, 350);
  };

  const handleSelect = (item: GeocodeAddress) => {
    setQuery(item.displayName);
    setIsOpen(false);
    setSuggestions([]);
    onSelect(item);
  };

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            className="pr-8"
            data-testid={`input-${testIdPrefix}-search`}
          />
          {query ? (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setIsOpen(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => executeSearch(query)}
          disabled={loading}
          data-testid={`button-${testIdPrefix}-search`}
          title="Search location"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>

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

      {isOpen && suggestions.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 shadow-lg backdrop-blur-md"
          data-testid={`list-${testIdPrefix}-suggestions`}
        >
          {suggestions.map((item, index) => (
            <li key={`${item.lat}-${item.lng}-${index}`}>
              <button
                type="button"
                className="flex w-full items-start gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-muted/70 transition-colors"
                onClick={() => handleSelect(item)}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{item.address || item.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.displayName}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
