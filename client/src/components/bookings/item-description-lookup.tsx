import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { mergeHsnItems, type HsnCatalogItem } from "@shared/hsn-catalog";
import { matchWorldFirstItem, searchWorldFirstItems } from "@shared/world-first-hsn";

type ItemDescriptionLookupProps = {
  value: string;
  onChange: (name: string) => void;
  onSelect: (item: { name: string; hsn: string }) => void;
  placeholder?: string;
  testId?: string;
  catalog?: "default" | "world-first";
};

export function ItemDescriptionLookup({
  value,
  onChange,
  onSelect,
  placeholder = "Type a description",
  testId,
  catalog = "default",
}: ItemDescriptionLookupProps) {
  const [open, setOpen] = useState(false);
  const catalogPath =
    catalog === "world-first" ? "/api/booking/item-catalog?source=world-first" : "/api/booking/item-catalog";
  const { data } = useQuery<{ items: HsnCatalogItem[] }>({
    queryKey: [catalogPath],
    staleTime: 60_000,
    enabled: catalog !== "world-first",
  });

  const items = useMemo(() => {
    if (catalog === "world-first") {
      return searchWorldFirstItems(value, [], 12);
    }
    return mergeHsnItems(data?.items || [], value, 12);
  }, [catalog, data?.items, value]);

  const pick = (item: HsnCatalogItem) => {
    onSelect({ name: item.name, hsn: item.hsn });
    setOpen(false);
  };

  return (
    <Popover open={open && items.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          value={value}
          autoComplete="off"
          placeholder={placeholder}
          data-testid={testId}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const next = event.target.value;
            onChange(next);
            const exact = catalog === "world-first" ? matchWorldFirstItem(next) : undefined;
            if (exact) onSelect(exact);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (event.key === "Enter" && open && items[0]) {
              event.preventDefault();
              pick(items[0]);
            }
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[min(28rem,var(--radix-popover-trigger-width))] p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <ul className="max-h-64 overflow-y-auto">
          {items.map((item, index) => (
            <li key={`${item.name}-${item.hsn}-${index}`}>
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(item);
                }}
              >
                <span>{item.name}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{item.hsn}</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
