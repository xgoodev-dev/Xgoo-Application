import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ImportPreviewItem } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: ImportPreviewItem[];
  summary: Record<string, number>;
  totalRows: number;
  onConfirm: () => void;
  confirming?: boolean;
};

const statusBadge = (status: ImportPreviewItem["status"]) => {
  const map = {
    new: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    updated: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    deleted: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    duplicate: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    unchanged: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };
  return <Badge className={map[status]}>{status}</Badge>;
};

export function ImportPreviewDialog({
  open,
  onOpenChange,
  preview,
  summary,
  totalRows,
  onConfirm,
  confirming,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import preview</DialogTitle>
          <DialogDescription>
            Review changes before importing {totalRows} rows. Nothing is saved until you confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">New: {summary.new ?? 0}</Badge>
          <Badge variant="outline">Updated: {summary.updated ?? 0}</Badge>
          <Badge variant="outline">Deleted: {summary.deleted ?? 0}</Badge>
          <Badge variant="outline">Duplicates: {summary.duplicate ?? 0}</Badge>
          <Badge variant="outline">Unchanged: {summary.unchanged ?? 0}</Badge>
        </div>
        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Old price</TableHead>
                <TableHead>New price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No preview rows
                  </TableCell>
                </TableRow>
              ) : (
                preview.map((p, i) => (
                  <TableRow key={`${p.fingerprint}-${i}`}>
                    <TableCell>{p.index || "—"}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell>{p.oldPrice != null ? `₹${p.oldPrice.toFixed(2)}` : "—"}</TableCell>
                    <TableCell>{p.newPrice != null ? `₹${p.newPrice.toFixed(2)}` : "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={confirming}>
            {confirming ? "Importing…" : "Confirm import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
