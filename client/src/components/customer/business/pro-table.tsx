import type { ReactNode } from "react";

export const proCellClass =
  "h-9 w-full min-w-0 border-0 bg-transparent px-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400";

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
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {description ? <p className="text-sm text-zinc-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
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
