import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const proCellClass =
  "h-9 w-full min-w-0 border-0 bg-transparent px-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400";

export const proMobileInputClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#FF4907]";

export function ProPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-5 text-zinc-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
    </div>
  );
}

export function ProField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

export function ProSurface({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function ProChip({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className={
        accent
          ? "inline-flex items-center rounded-full bg-[#FFF0EA] px-2 py-0.5 text-[11px] font-semibold text-[#FF4907]"
          : "inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
      }
    >
      {children}
    </span>
  );
}

export function ProTableFrame({
  minWidth = "960px",
  children,
}: {
  minWidth?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-none border border-zinc-200 bg-white">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function ProTableHead({ columns }: { columns: Array<{ label: string; width?: string }> }) {
  return (
    <thead className="sticky top-0 z-10 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
      <tr className="border-b border-zinc-200">
        {columns.map((column) => (
          <th
            key={column.label || "actions"}
            className="px-2 py-2.5 font-semibold"
            style={column.width ? { width: column.width } : undefined}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}
