import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Save,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  Columns3,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CourierFormulaBuilder } from "@/components/pricing/CourierFormulaBuilder";
import { TariffSheetTabs } from "@/components/pricing/TariffSheetTabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, authFetch, buildTariffUploadPayload } from "@/lib/queryClient";
import {
  downloadTariffPricingImages,
  downloadTariffPricingPdf,
} from "@/lib/tariff-pricing-pdf";
import type { CourierPartner, TariffVersion } from "@shared/schema";
import { TariffGrid, createEmptyRow } from "./TariffGrid";
import { TariffRowDrawer } from "./TariffRowDrawer";
import type { EnrichedTariffRow, TariffGridRow } from "./types";
import { gridRowToPatch, toGridRow, DEFAULT_COLUMN_FIELDS } from "./types";

type Props = {
  partners: CourierPartner[];
  tariffs: TariffVersion[];
  initialVersionId?: string;
};

type MarginRangeRule = {
  id: string;
  fromWeight: string;
  toWeight: string;
  fixedMargin: string;
  percentageMargin: string;
};

function createMarginRangeRule(): MarginRangeRule {
  return {
    id: `margin-rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fromWeight: "",
    toWeight: "",
    fixedMargin: "",
    percentageMargin: "",
  };
}

export function TariffTableTab({ partners, tariffs, initialVersionId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const activeVersion = tariffs.find((t) => t.status === "active") || tariffs[0];
  const [versionId, setVersionId] = useState<string>("");
  const [openSheetIds, setOpenSheetIds] = useState<string[]>([]);
  const [gridRows, setGridRows] = useState<TariffGridRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerRow, setDrawerRow] = useState<TariffGridRow | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [history, setHistory] = useState<TariffGridRow[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [creatingSheet, setCreatingSheet] = useState(false);
  const openSheetsHydrated = useRef(false);

  const [search, setSearch] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [shipmentFilter, setShipmentFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("");

  const [bulkFixedMargin, setBulkFixedMargin] = useState("");
  const [bulkPctMargin, setBulkPctMargin] = useState("");
  const [marginRangeRules, setMarginRangeRules] = useState<MarginRangeRule[]>(() => [
    createMarginRangeRule(),
  ]);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);

  useEffect(() => {
    if (initialVersionId) {
      setVersionId(initialVersionId);
    }
  }, [initialVersionId]);

  useEffect(() => {
    if (!versionId && !initialVersionId && activeVersion) {
      setVersionId(activeVersion.id);
    }
  }, [activeVersion, initialVersionId, versionId]);

  useEffect(() => {
    if (!tariffs.length) return;
    const validIds = new Set(tariffs.map((t) => t.id));
    if (!openSheetsHydrated.current) {
      openSheetsHydrated.current = true;
      try {
        const raw = localStorage.getItem("xgoo-open-tariff-sheets");
        const stored = raw ? (JSON.parse(raw) as string[]) : [];
        const restored = stored.filter((id) => validIds.has(id));
        const seed =
          restored.length > 0
            ? restored
            : tariffs
                .filter((t) => t.status !== "archived")
                .slice(0, 8)
                .map((t) => t.id);
        const withCurrent = initialVersionId && validIds.has(initialVersionId)
          ? Array.from(new Set([initialVersionId, ...seed]))
          : seed;
        setOpenSheetIds(withCurrent);
        if (!versionId && withCurrent[0]) setVersionId(withCurrent[0]);
      } catch {
        const fallback = tariffs
          .filter((t) => t.status !== "archived")
          .slice(0, 8)
          .map((t) => t.id);
        setOpenSheetIds(fallback);
      }
      return;
    }
    setOpenSheetIds((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [tariffs, initialVersionId, versionId]);

  useEffect(() => {
    if (!openSheetsHydrated.current) return;
    localStorage.setItem("xgoo-open-tariff-sheets", JSON.stringify(openSheetIds));
  }, [openSheetIds]);

  useEffect(() => {
    if (versionId && !openSheetIds.includes(versionId)) {
      setOpenSheetIds((prev) => [...prev, versionId]);
    }
  }, [versionId, openSheetIds]);

  const selectedVersion = tariffs.find((t) => t.id === versionId);

  const { data: rawRows, isLoading, refetch, isFetching } = useQuery<EnrichedTariffRow[]>({
    queryKey: ["/api/tariffs", versionId, "rows", "enriched"],
    queryFn: async () => {
      const res = await authFetch(`/api/tariffs/${versionId}/rows?enriched=true`);
      if (!res.ok) throw new Error("Failed to load rows");
      return res.json();
    },
    enabled: !!versionId,
  });

  useEffect(() => {
    if (rawRows) {
      const mapped = rawRows.map(toGridRow);
      setGridRows(mapped);
      setHistory([mapped]);
      setHistoryIndex(0);
      setDirty(false);
    }
  }, [rawRows]);

  const pushHistory = useCallback((rows: TariffGridRow[]) => {
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(rows);
      if (next.length > 50) next.shift();
      return next;
    });
    setHistoryIndex((i) => Math.min(i + 1, 49));
  }, [historyIndex]);

  const handleRowsChange = useCallback((rows: TariffGridRow[]) => {
    setGridRows(rows);
    setDirty(true);
    pushHistory(rows);
  }, [pushHistory]);

  const handleRowUpdate = useCallback((row: TariffGridRow) => {
    setGridRows((prev) => {
      const next = prev.map((r) => (r.id === row.id ? row : r));
      setDirty(true);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const applyMarginsToSelected = () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Select rows first",
        description: "Tick the rows you want to update, then apply margins.",
        variant: "destructive",
      });
      return;
    }
    const fixed = bulkFixedMargin.trim();
    const pct = bulkPctMargin.trim();
    if (!fixed && !pct) {
      toast({
        title: "Enter a margin",
        description: "Set fixed margin and/or % margin, then apply.",
        variant: "destructive",
      });
      return;
    }
    const next = gridRows.map((r) => {
      if (!selectedIds.includes(r.id)) return r;
      return toGridRow({
        ...r,
        ...(fixed ? { fixedMargin: fixed } : {}),
        ...(pct ? { percentageMargin: pct } : {}),
      } as EnrichedTariffRow);
    });
    handleRowsChange(next);
    toast({
      title: "Margins applied",
      description: `Updated ${selectedIds.length} row(s). Customer price recalculated.`,
    });
  };

  const rowMatchesMarginScope = (row: TariffGridRow) => {
    if (partnerFilter !== "all" && row.courierPartnerId !== partnerFilter) {
      return false;
    }
    if (
      countryFilter !== "all" &&
      row.destinationCountry !== countryFilter &&
      row.originCountry !== countryFilter
    ) {
      return false;
    }
    if (shipmentFilter !== "all" && row.shipmentType !== shipmentFilter) {
      return false;
    }
    if (serviceFilter !== "all" && row.serviceType !== serviceFilter) {
      return false;
    }
    return true;
  };

  const updateMarginRangeRule = (
    id: string,
    patch: Partial<Omit<MarginRangeRule, "id">>,
  ) => {
    setMarginRangeRules((rules) =>
      rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );
  };

  const addMarginRangeRule = () => {
    setMarginRangeRules((rules) => [...rules, createMarginRangeRule()]);
  };

  const removeMarginRangeRule = (id: string) => {
    setMarginRangeRules((rules) => {
      const next = rules.filter((rule) => rule.id !== id);
      return next.length > 0 ? next : [createMarginRangeRule()];
    });
  };

  const parsedMarginRangeRules = useMemo(
    () =>
      marginRangeRules.map((rule) => ({
        ...rule,
        from: parseFloat(rule.fromWeight),
        to: parseFloat(rule.toWeight),
        fixed: rule.fixedMargin.trim(),
        pct: rule.percentageMargin.trim(),
      })),
    [marginRangeRules],
  );

  const matchingRowsForRule = (rule: (typeof parsedMarginRangeRules)[number]) => {
    if (!Number.isFinite(rule.from) || !Number.isFinite(rule.to)) return 0;
    return gridRows.filter((row) => {
      if (!rowMatchesMarginScope(row)) return false;
      const slabWeight = parseFloat(row.weightMax || "0");
      return (
        Number.isFinite(slabWeight) &&
        slabWeight >= rule.from &&
        slabWeight <= rule.to
      );
    }).length;
  };

  const applyAllMarginRangeRules = () => {
    const invalidIndex = parsedMarginRangeRules.findIndex(
      (rule) =>
        !Number.isFinite(rule.from) ||
        !Number.isFinite(rule.to) ||
        rule.from < 0 ||
        rule.to < rule.from ||
        (!rule.fixed && !rule.pct),
    );
    if (invalidIndex >= 0) {
      toast({
        title: `Complete margin rule ${invalidIndex + 1}`,
        description:
          "Each rule needs a valid From/To weight and at least one fixed or percentage margin.",
        variant: "destructive",
      });
      return;
    }

    const sortedRules = [...parsedMarginRangeRules].sort((a, b) => a.from - b.from);
    for (let i = 1; i < sortedRules.length; i++) {
      if (sortedRules[i].from <= sortedRules[i - 1].to) {
        toast({
          title: "Weight ranges overlap",
          description:
            "Adjust the ranges so each Weight (kg) slab receives only one margin rule.",
          variant: "destructive",
        });
        return;
      }
    }

    const matchedIds = new Set<string>();
    const next = gridRows.map((row) => {
      if (!rowMatchesMarginScope(row)) return row;
      const slabWeight = parseFloat(row.weightMax || "0");
      if (!Number.isFinite(slabWeight)) return row;
      const rule = sortedRules.find(
        (candidate) =>
          slabWeight >= candidate.from && slabWeight <= candidate.to,
      );
      if (!rule) return row;
      matchedIds.add(row.id);
      return toGridRow({
        ...row,
        ...(rule.fixed ? { fixedMargin: rule.fixed } : {}),
        ...(rule.pct ? { percentageMargin: rule.pct } : {}),
      } as EnrichedTariffRow);
    });

    if (matchedIds.size === 0) {
      toast({
        title: "No matching tariff rows",
        description:
          "No Weight (kg) slabs match these rules and the current filters.",
        variant: "destructive",
      });
      return;
    }

    handleRowsChange(next);
    toast({
      title: "All margin rules applied",
      description: `${sortedRules.length} rule(s) updated ${matchedIds.size} row(s). Customer prices recalculated.`,
    });
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const w = parseFloat(weightFilter);
    return gridRows.filter((r) => {
      if (partnerFilter !== "all" && r.courierPartnerId !== partnerFilter) return false;
      if (countryFilter !== "all" && r.destinationCountry !== countryFilter && r.originCountry !== countryFilter) return false;
      if (shipmentFilter !== "all" && r.shipmentType !== shipmentFilter) return false;
      if (serviceFilter !== "all" && r.serviceType !== serviceFilter) return false;
      if (weightFilter && !Number.isNaN(w)) {
        const max = parseFloat(r.weightMax || "999");
        if (w > max) return false;
      }
      if (!q) return true;
      const hay = [
        r.courierPartner,
        r.service,
        r.shipmentType,
        r.originCountry,
        r.destinationCountry,
        r.notes,
        r.weight,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [gridRows, search, partnerFilter, countryFilter, shipmentFilter, serviceFilter, weightFilter]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rows = gridRows.map(gridRowToPatch);
      return apiRequest("POST", `/api/tariffs/${versionId}/rows/bulk`, { rows });
    },
    onSuccess: () => {
      setDirty(false);
      setAutosaveStatus("saved");
      toast({ title: "Rates saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/tariffs", versionId, "rows"] });
      refetch();
    },
    onError: (e: Error) => {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    },
  });

  const ensureSavedBeforeSwitch = async () => {
    if (!dirty || !versionId) return true;
    try {
      await saveMutation.mutateAsync();
      return true;
    } catch {
      toast({
        title: "Save before switching sheets",
        description: "Could not save the current sheet. Fix errors and try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const switchSheet = async (nextId: string) => {
    if (nextId === versionId) return;
    const ok = await ensureSavedBeforeSwitch();
    if (!ok) return;
    setSelectedIds([]);
    setDrawerRow(null);
    setVersionId(nextId);
    setOpenSheetIds((prev) => (prev.includes(nextId) ? prev : [...prev, nextId]));
  };

  const closeSheet = async (id: string) => {
    if (id === versionId && dirty) {
      const ok = await ensureSavedBeforeSwitch();
      if (!ok) return;
    }
    setOpenSheetIds((prev) => {
      const next = prev.filter((sheetId) => sheetId !== id);
      if (id === versionId) {
        const fallback = next[0] || "";
        setVersionId(fallback);
        setSelectedIds([]);
        setDrawerRow(null);
      }
      return next;
    });
  };

  const openSheet = async (id: string) => {
    await switchSheet(id);
  };

  const createSheet = async (label: string) => {
    const ok = await ensureSavedBeforeSwitch();
    if (!ok) return;
    setCreatingSheet(true);
    try {
      const res = await apiRequest("POST", "/api/tariffs", { label });
      const created = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/tariffs"] });
      setOpenSheetIds((prev) => [...prev, created.id]);
      setVersionId(created.id);
      setSelectedIds([]);
      setDrawerRow(null);
      toast({ title: "Sheet created", description: `"${label}" is ready to edit.` });
    } catch (error) {
      toast({
        title: "Could not create sheet",
        description: error instanceof Error ? error.message : "Create failed",
        variant: "destructive",
      });
      throw error;
    } finally {
      setCreatingSheet(false);
    }
  };

  const renameSheet = async (id: string, label: string) => {
    try {
      await apiRequest("PATCH", `/api/tariffs/${id}`, { label });
      await queryClient.invalidateQueries({ queryKey: ["/api/tariffs"] });
      toast({ title: "Sheet renamed", description: `Now named "${label}".` });
    } catch (error) {
      toast({
        title: "Rename failed",
        description: error instanceof Error ? error.message : "Could not rename sheet",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSheet = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/tariffs/${id}`);
      setOpenSheetIds((prev) => {
        const next = prev.filter((sheetId) => sheetId !== id);
        if (id === versionId) {
          setVersionId(next[0] || "");
          setSelectedIds([]);
          setDrawerRow(null);
        }
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/tariffs"] });
      toast({ title: "Sheet deleted" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not delete sheet",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (!dirty || !versionId) return;
    setAutosaveStatus("saving");
    const t = setTimeout(() => {
      saveMutation.mutate();
    }, 3000);
    return () => clearTimeout(t);
  }, [dirty, gridRows, versionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const realIds = ids.filter((id) => !id.startsWith("new-"));
      if (realIds.length) {
        await apiRequest("POST", `/api/tariffs/${versionId}/rows/delete`, { ids: realIds });
      }
      return ids;
    },
    onSuccess: (ids) => {
      setGridRows((prev) => prev.filter((r) => !ids.includes(r.id)));
      setSelectedIds([]);
      setDirty(true);
      toast({ title: "Rows deleted" });
      refetch();
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/tariffs/${versionId}/activate`, {}),
    onSuccess: () => {
      toast({ title: "Rates published", description: "This tariff cycle is now live." });
      queryClient.invalidateQueries({ queryKey: ["/api/tariffs"] });
    },
    onError: (e: Error) => toast({ title: "Publish failed", description: e.message, variant: "destructive" }),
  });

  const handleAddRow = () => {
    if (!versionId || !selectedVersion) return;
    const row = createEmptyRow(partners, versionId, selectedVersion.officeId);
    const next = [...gridRows, row];
    handleRowsChange(next);
  };

  const handleDuplicate = (ids: string[]) => {
    const copies = gridRows
      .filter((r) => ids.includes(r.id))
      .map((r) => ({
        ...r,
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }));
    handleRowsChange([...gridRows, ...copies]);
  };

  const applyBulk = (field: keyof TariffGridRow, value: string) => {
    const next = gridRows.map((r) => {
      if (!selectedIds.includes(r.id)) return r;
      if (field === "isActive") {
        return toGridRow({ ...r, isActive: value === "true" } as EnrichedTariffRow);
      }
      return toGridRow({ ...r, [field]: value } as EnrichedTariffRow);
    });
    handleRowsChange(next);
  };

  const handleExport = async () => {
    const res = await authFetch(`/api/tariffs/${versionId}/export`);
    if (!res.ok) {
      toast({ title: "Export failed", variant: "destructive" });
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedVersion?.label || "tariff"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportOptions = () => {
    if (!selectedVersion) return null;
    return {
      rows: gridRows,
      partners,
      version: selectedVersion,
      partnerId: partnerFilter === "all" ? undefined : partnerFilter,
    };
  };

  const handlePricingPdf = async () => {
    const options = exportOptions();
    if (!options) return;
    setIsPdfGenerating(true);
    try {
      await downloadTariffPricingPdf(options);
      toast({
        title: "Pricing PDF downloaded",
        description:
          partnerFilter === "all"
            ? "The PDF includes all courier partners in this tariff cycle."
            : "The PDF includes the selected courier partner.",
      });
    } catch (error) {
      toast({
        title: "PDF download failed",
        description:
          error instanceof Error ? error.message : "Could not generate pricing PDF",
        variant: "destructive",
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handlePricingImages = async () => {
    const options = exportOptions();
    if (!options) return;
    setIsImageGenerating(true);
    try {
      const result = await downloadTariffPricingImages(options);
      toast({
        title: result.archived
          ? "Pricing images archive downloaded"
          : "Pricing image downloaded",
        description: result.archived
          ? `${result.fileCount} page images packed into a ZIP archive (opens in WinRAR / 7-Zip).`
          : "Single-page PNG pricing sheet downloaded.",
      });
    } catch (error) {
      toast({
        title: "Image download failed",
        description:
          error instanceof Error ? error.message : "Could not generate pricing images",
        variant: "destructive",
      });
    } finally {
      setIsImageGenerating(false);
    }
  };

  const handleImportFile = async (file: File) => {
    if (!selectedVersion) return;
    try {
      const payload = await buildTariffUploadPayload(file, {
        label: selectedVersion.label,
        compareVersionId: versionId,
      });
      const res = await apiRequest("POST", "/api/tariffs/preview", payload);
      const data = await res.json();
      toast({
        title: "Import parsed",
        description: `${data.totalRows} rows — merge into table and save to apply.`,
      });
      if (Array.isArray(data.parsedRows)) {
        const imported = data.parsedRows.map((r: EnrichedTariffRow) =>
          toGridRow({ ...r, id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }),
        );
        handleRowsChange([...gridRows, ...imported]);
      }
    } catch (e) {
      toast({
        title: "Import failed",
        description: e instanceof Error ? e.message : "Could not parse file",
        variant: "destructive",
      });
    }
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    setGridRows(history[idx]);
    setDirty(true);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    setGridRows(history[idx]);
    setDirty(true);
  };

  const countries = useMemo(() => {
    const set = new Set<string>();
    gridRows.forEach((r) => {
      if (r.originCountry) set.add(r.originCountry);
      if (r.destinationCountry) set.add(r.destinationCountry);
    });
    return Array.from(set).sort();
  }, [gridRows]);

  const shipmentTypes = useMemo(() => {
    const set = new Set<string>();
    gridRows.forEach((row) => {
      if (row.shipmentType) set.add(row.shipmentType);
    });
    return Array.from(set).sort();
  }, [gridRows]);

  if (!versionId) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <p className="mb-3">No tariff sheet is open yet.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => void createSheet(`Sheet ${tariffs.length + 1}`)}>
              <Plus className="mr-1 h-4 w-4" /> New sheet
            </Button>
          </div>
        </div>
        <TariffSheetTabs
          sheets={tariffs}
          openSheetIds={openSheetIds}
          activeSheetId={versionId}
          dirty={dirty}
          creating={creatingSheet}
          onSelect={(id) => void switchSheet(id)}
          onClose={(id) => void closeSheet(id)}
          onOpen={(id) => void openSheet(id)}
          onCreate={createSheet}
          onRename={renameSheet}
          onDelete={deleteSheet}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Tariff table</h2>
            {dirty && <Badge variant="destructive">Unsaved</Badge>}
            {autosaveStatus === "saving" && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Autosaving…
              </Badge>
            )}
            {autosaveStatus === "saved" && !dirty && (
              <Badge variant="outline" className="text-green-600">Saved</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={undo} disabled={historyIndex <= 0}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleAddRow}>
              <Plus className="h-4 w-4 mr-1" /> Add row
            </Button>
            <Button size="sm" variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button size="sm" className="bg-[#FF4907] hover:bg-[#FF4907]/90" onClick={() => publishMutation.mutate()}>
              <Send className="h-4 w-4 mr-1" /> Publish rates
            </Button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={partnerFilter} onValueChange={setPartnerFilter}>
            <SelectTrigger><SelectValue placeholder="Partner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All partners</SelectItem>
              {partners.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={shipmentFilter} onValueChange={setShipmentFilter}>
            <SelectTrigger><SelectValue placeholder="Shipment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {shipmentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger><SelectValue placeholder="Service" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All services</SelectItem>
              <SelectItem value="surface">Surface</SelectItem>
              <SelectItem value="air">Air</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Weight ≤ slab (kg)" value={weightFilter} onChange={(e) => setWeightFilter(e.target.value)} type="number" step="0.1" />
        </div>

        <Accordion type="single" collapsible className="rounded-lg border bg-muted/30">
          <AccordionItem value="margin-rules" className="border-b-0">
            <AccordionTrigger className="px-3 py-3 hover:no-underline">
              <span className="flex items-center gap-2 text-sm">
                Margin rules
                <Badge variant="secondary">{marginRangeRules.length} range(s)</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3">
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium">Quick apply to selected rows</p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Tick rows in the table, enter a margin, then apply.
                  </p>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Fixed margin (₹)
                      </label>
                      <Input
                        className="h-8 w-32"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 50"
                        value={bulkFixedMargin}
                        onChange={(e) => setBulkFixedMargin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">% Margin</label>
                      <Input
                        className="h-8 w-28"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 10"
                        value={bulkPctMargin}
                        onChange={(e) => setBulkPctMargin(e.target.value)}
                      />
                    </div>
                    <Button size="sm" onClick={applyMarginsToSelected}>
                      Apply to {selectedIds.length || 0} selected
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">Weight-range margin sets</p>
                      <p className="text-xs text-muted-foreground">
                        Configure multiple non-overlapping ranges and apply all of them at once.
                        Current partner, country, shipment and service filters define the scope.
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={addMarginRangeRule}>
                      <Plus className="mr-1 h-4 w-4" /> Add range
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {marginRangeRules.map((rule, index) => {
                      const parsedRule = parsedMarginRangeRules[index];
                      const matchCount = matchingRowsForRule(parsedRule);
                      return (
                        <div
                          key={rule.id}
                          className="grid gap-2 rounded-lg border bg-background p-3 sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr_1fr_auto]"
                        >
                          <div className="flex items-center">
                            <Badge variant="outline">Rule {index + 1}</Badge>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">
                              From weight (kg)
                            </label>
                            <Input
                              className="h-8"
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="1"
                              value={rule.fromWeight}
                              onChange={(e) =>
                                updateMarginRangeRule(rule.id, {
                                  fromWeight: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">
                              To weight (kg)
                            </label>
                            <Input
                              className="h-8"
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="5"
                              value={rule.toWeight}
                              onChange={(e) =>
                                updateMarginRangeRule(rule.id, {
                                  toWeight: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">
                              Fixed margin (₹)
                            </label>
                            <Input
                              className="h-8"
                              type="number"
                              step="0.01"
                              placeholder="Optional"
                              value={rule.fixedMargin}
                              onChange={(e) =>
                                updateMarginRangeRule(rule.id, {
                                  fixedMargin: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">
                              Margin %
                            </label>
                            <Input
                              className="h-8"
                              type="number"
                              step="0.01"
                              placeholder="Optional"
                              value={rule.percentageMargin}
                              onChange={(e) =>
                                updateMarginRangeRule(rule.id, {
                                  percentageMargin: e.target.value,
                                })
                              }
                            />
                            <p className="text-[10px] text-muted-foreground">
                              {matchCount} row(s) match
                            </p>
                          </div>
                          <div className="flex items-center justify-end">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeMarginRangeRule(rule.id)}
                              aria-label={`Remove margin rule ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={applyAllMarginRangeRules}>
                      Apply all {marginRangeRules.length} margin rule(s)
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Customer prices recalculate immediately and autosave after 3 seconds.
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <CourierFormulaBuilder
                    rows={gridRows}
                    selectedIds={selectedIds}
                    rowMatchesScope={rowMatchesMarginScope}
                    onApply={(next, updatedCount) => {
                      handleRowsChange(next);
                      toast({
                        title: "Formula applied",
                        description: `Updated ${updatedCount} row(s). Customer price recalculated.`,
                      });
                    }}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
            e.target.value = "";
          }} />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Import Excel
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePricingPdf}
            disabled={isPdfGenerating || isImageGenerating}
          >
            {isPdfGenerating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Download pricing PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePricingImages}
            disabled={isPdfGenerating || isImageGenerating}
          >
            {isImageGenerating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Download pricing images
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Columns3 className="h-4 w-4 mr-1" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {DEFAULT_COLUMN_FIELDS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col}
                  checked={!hiddenColumns.includes(col)}
                  onCheckedChange={(checked) => {
                    setHiddenColumns((prev) =>
                      checked ? prev.filter((c) => c !== col) : [...prev, col],
                    );
                  }}
                >
                  {col}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedIds.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary">{selectedIds.length} selected</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDuplicate(selectedIds)}>
                  <Copy className="h-4 w-4 mr-2" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => applyBulk("fixedMargin", "10")}>Apply fixed margin ₹10</DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyBulk("percentageMargin", "5")}>Apply % margin 5</DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyBulk("affiliateMargin", "0")}>Clear affiliate margin</DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyBulk("offerDiscount", "0")}>Clear discount</DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyBulk("isActive" as keyof TariffGridRow, "true")}>Activate</DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyBulk("isActive" as keyof TariffGridRow, "false")}>Deactivate</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Rows: checkbox or Ctrl/Shift+click. Columns/cells: drag to select a range (Ctrl for extra ranges).
            {selectedIds.length > 0 ? (
              <span className="ml-1 font-medium text-foreground">
                {selectedIds.length} row(s) selected.
              </span>
            ) : null}
          </p>
          {selectedVersion ? (
            <Badge variant="outline" className="text-[10px]">
              Sheet: {selectedVersion.label}
            </Badge>
          ) : null}
        </div>
        <TariffGrid
          rows={filteredRows}
          partners={partners}
          hiddenColumns={hiddenColumns}
          onRowUpdate={handleRowUpdate}
          onRowClick={setDrawerRow}
          onSelectionChange={setSelectedIds}
          loading={isLoading}
        />
        <TariffSheetTabs
          sheets={tariffs}
          openSheetIds={openSheetIds}
          activeSheetId={versionId}
          dirty={dirty}
          creating={creatingSheet}
          onSelect={(id) => void switchSheet(id)}
          onClose={(id) => void closeSheet(id)}
          onOpen={(id) => void openSheet(id)}
          onCreate={createSheet}
          onRename={renameSheet}
          onDelete={deleteSheet}
        />
      </div>

      <TariffRowDrawer
        row={drawerRow}
        open={!!drawerRow}
        onOpenChange={(o) => !o && setDrawerRow(null)}
        versionLabel={selectedVersion?.label}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} rows?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone after save.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(selectedIds)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
