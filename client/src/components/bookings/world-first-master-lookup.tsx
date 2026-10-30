import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  searchWorldFirstMasters,
  worldFirstMasterName,
  type WorldFirstMasterRow,
} from "@shared/world-first-masters";

export function WorldFirstMasterLookup({
  title,
  value,
  codeValue,
  rows,
  vendorCode,
  nameHeader = "Name",
  codeHeader = "Code",
  showCode = false,
  onSelect,
  testId,
  className,
  disabled,
  disabledHint,
}: {
  title: string;
  value: string;
  codeValue?: string;
  rows: WorldFirstMasterRow[];
  vendorCode?: string;
  nameHeader?: string;
  codeHeader?: string;
  showCode?: boolean;
  onSelect: (row: WorldFirstMasterRow) => void;
  testId?: string;
  className?: string;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const options = useMemo(
    () => searchWorldFirstMasters(rows, query, vendorCode),
    [query, rows, vendorCode],
  );
  const label = worldFirstMasterName(rows, value) || value;
  const codeLabel = codeValue || "";

  return (
    <>
      <div className={cn("flex gap-1", className)}>
        <Input
          value={label}
          readOnly
          disabled={disabled}
          className="h-9 cursor-pointer"
          placeholder={disabled ? disabledHint || `Select ${title}` : `Select ${title}`}
          data-testid={testId}
          onClick={() => {
            if (!disabled) setOpen(true);
          }}
        />
        {showCode ? (
          <Input
            value={codeLabel}
            readOnly
            disabled={disabled}
            className="h-9 w-24 cursor-pointer font-mono"
            placeholder="Code"
            onClick={() => {
              if (!disabled) setOpen(true);
            }}
          />
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label={`Search ${title}`}
          disabled={disabled}
          onClick={() => {
            if (!disabled) setOpen(true);
          }}
        >
          <Search className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0 sm:rounded-lg [&>button]:top-2.5 [&>button]:text-white">
          <div className="flex items-center justify-between bg-slate-800 px-4 py-2.5 text-white">
            <DialogTitle className="text-base font-semibold text-white">{title}</DialogTitle>
          </div>
          <div className="flex justify-end px-4 py-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Search:</span>
              <Input
                value={query}
                autoFocus
                className="h-8 w-48"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          <div className="max-h-[28rem] overflow-auto px-4 pb-4">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-800 text-white">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold">{nameHeader}</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">{codeHeader}</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {options.map((row, index) => (
                  <tr key={`${row.code}-${row.name}-${index}`} className={index % 2 ? "bg-muted/40" : "bg-background"}>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {codeHeader === "Vendor Code" ? row.vendorCode || row.code : row.code}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline"
                        onClick={() => {
                          onSelect(row);
                          setOpen(false);
                          setQuery("");
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
                {options.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                      No matching {title.toLowerCase()}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
              Showing {options.length} of {searchWorldFirstMasters(rows, "", vendorCode).length} entries
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
