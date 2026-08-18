import { useEffect, useMemo, useState } from "react";
import { FolderOpen, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TariffVersion } from "@shared/schema";

type SheetVersion = TariffVersion & { partnerName?: string | null };

type Props = {
  sheets: SheetVersion[];
  openSheetIds: string[];
  activeSheetId: string;
  dirty: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onOpen: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  creating?: boolean;
};

function statusTone(status: string) {
  if (status === "active") return "bg-emerald-500";
  if (status === "draft") return "bg-amber-500";
  if (status === "archived") return "bg-zinc-400";
  return "bg-sky-500";
}

export function TariffSheetTabs({
  sheets,
  openSheetIds,
  activeSheetId,
  dirty,
  onSelect,
  onClose,
  onOpen,
  onCreate,
  onRename,
  onDelete,
  creating,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const sheetById = useMemo(
    () => new Map(sheets.map((sheet) => [sheet.id, sheet])),
    [sheets],
  );

  const openSheets = openSheetIds
    .map((id) => sheetById.get(id))
    .filter((sheet): sheet is SheetVersion => !!sheet);

  const closedSheets = sheets.filter((sheet) => !openSheetIds.includes(sheet.id));

  const renameSheet = renameId ? sheetById.get(renameId) : null;
  const deleteSheet = deleteId ? sheetById.get(deleteId) : null;

  useEffect(() => {
    if (createOpen) {
      setName(`Sheet ${sheets.length + 1}`);
    }
  }, [createOpen, sheets.length]);

  useEffect(() => {
    if (renameSheet) setName(renameSheet.label);
  }, [renameSheet]);

  return (
    <>
      <div className="flex items-stretch gap-1 overflow-x-auto rounded-b-lg border border-t-0 bg-muted/40 px-1 py-1">
        <div className="flex min-w-0 flex-1 items-stretch gap-0.5">
          {openSheets.map((sheet) => {
            const active = sheet.id === activeSheetId;
            return (
              <div
                key={sheet.id}
                className={[
                  "group flex max-w-[220px] items-center gap-1 rounded-md border px-2 py-1.5 text-xs",
                  active
                    ? "border-[#FF4907]/40 bg-background shadow-sm"
                    : "border-transparent bg-transparent hover:bg-background/70",
                ].join(" ")}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  onClick={() => onSelect(sheet.id)}
                  onDoubleClick={() => setRenameId(sheet.id)}
                  title="Click to open · Double-click to rename"
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusTone(sheet.status)}`}
                  />
                  <span className="truncate font-medium">
                    {sheet.label}
                    {active && dirty ? " *" : ""}
                  </span>
                  <Badge variant="outline" className="hidden h-4 px-1 text-[9px] sm:inline-flex">
                    {sheet.status}
                  </Badge>
                </button>
                <button
                  type="button"
                  className="rounded p-0.5 text-muted-foreground opacity-60 hover:bg-muted hover:text-foreground group-hover:opacity-100"
                  aria-label={`Close ${sheet.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(sheet.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
          {openSheets.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              No open sheets. Create or open one to start editing.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 border-l pl-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => setCreateOpen(true)}
            disabled={creating}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            New
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="ghost" className="h-8 px-2">
                <FolderOpen className="mr-1 h-3.5 w-3.5" />
                Open
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Closed / available sheets</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {closedSheets.length === 0 ? (
                <DropdownMenuItem disabled>All sheets are already open</DropdownMenuItem>
              ) : (
                closedSheets.map((sheet) => (
                  <DropdownMenuItem
                    key={sheet.id}
                    onClick={() => onOpen(sheet.id)}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{sheet.label}</span>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {sheet.status}
                    </Badge>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {activeSheetId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" variant="ghost" className="h-8 px-2">
                  Sheet
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRenameId(activeSheetId)}>
                  Rename sheet
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteId(activeSheetId)}
                >
                  Delete sheet permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New tariff sheet</DialogTitle>
            <DialogDescription>
              Creates an empty draft sheet you can name, edit, save, and publish later.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sheet name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                void onCreate(name.trim()).then(() => setCreateOpen(false));
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!name.trim() || creating}
              onClick={() =>
                void onCreate(name.trim()).then(() => setCreateOpen(false))
              }
            >
              Create sheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameId} onOpenChange={(open) => !open && setRenameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename sheet</DialogTitle>
            <DialogDescription>Update the display name for this tariff sheet.</DialogDescription>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sheet name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameId && name.trim()) {
                void onRename(renameId, name.trim()).then(() => setRenameId(null));
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameId(null)}>
              Cancel
            </Button>
            <Button
              disabled={!name.trim()}
              onClick={() => {
                if (!renameId) return;
                void onRename(renameId, name.trim()).then(() => setRenameId(null));
              }}
            >
              Save name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete sheet permanently?</DialogTitle>
            <DialogDescription>
              {deleteSheet
                ? `"${deleteSheet.label}" and all of its rate rows will be removed. This cannot be undone.`
                : "This sheet and its rows will be removed."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteId) return;
                void onDelete(deleteId).then(() => setDeleteId(null));
              }}
            >
              Delete sheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
