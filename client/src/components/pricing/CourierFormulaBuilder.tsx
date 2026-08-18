import { useMemo, useState } from "react";
import { Calculator, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COURIER_FORMULA_TARGETS,
  COURIER_FORMULA_TEMPLATES,
  COURIER_FORMULA_VARIABLES,
  applyFormulaResultToRow,
  buildCourierFormulaContext,
  evaluateCourierFormula,
  validateCourierFormula,
  type CourierFormulaTarget,
} from "@shared/courier-formula";
import type { EnrichedTariffRow, TariffGridRow } from "./types";
import { toGridRow } from "./types";

type Props = {
  rows: TariffGridRow[];
  selectedIds: string[];
  onApply: (rows: TariffGridRow[], updatedCount: number) => void;
  rowMatchesScope: (row: TariffGridRow) => boolean;
};

export function CourierFormulaBuilder({
  rows,
  selectedIds,
  onApply,
  rowMatchesScope,
}: Props) {
  const [formula, setFormula] = useState("=partner_rate * 0.10");
  const [target, setTarget] = useState<CourierFormulaTarget>("fixedMargin");
  const [scope, setScope] = useState<"selected" | "filtered">("filtered");
  const [applyError, setApplyError] = useState<string | null>(null);

  const sampleRow = useMemo(
    () => rows.find((row) => rowMatchesScope(row)) || rows[0],
    [rows, rowMatchesScope],
  );

  const preview = useMemo(() => {
    if (!sampleRow) {
      return { value: null as number | null, error: null as string | null };
    }
    try {
      const value = evaluateCourierFormula(
        formula,
        buildCourierFormulaContext(sampleRow),
      );
      return { value, error: null };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Invalid formula",
      };
    }
  }, [formula, sampleRow]);

  const insertToken = (token: string) => {
    setFormula((current) => {
      const base = current.trim() ? current : "=";
      const needsSpace = /[A-Za-z0-9_)]$/.test(base.trim());
      return `${base}${needsSpace ? " " : ""}${token}`;
    });
  };

  const applyFormula = () => {
    setApplyError(null);
    const validation = validateCourierFormula(formula);
    if (!validation.ok) {
      setApplyError(validation.error);
      return;
    }

    let updatedCount = 0;
    const next = rows.map((row) => {
      const inScope =
        scope === "selected"
          ? selectedIds.includes(row.id)
          : rowMatchesScope(row);
      if (!inScope) return row;
      try {
        const result = evaluateCourierFormula(
          formula,
          buildCourierFormulaContext(row),
        );
        updatedCount++;
        return toGridRow(
          applyFormulaResultToRow(row, target, result) as EnrichedTariffRow,
        );
      } catch {
        return row;
      }
    });

    if (updatedCount === 0) {
      setApplyError(
        scope === "selected"
          ? "Select rows in the table first, or switch scope to filtered rows."
          : "No rows match the current partner/country/service filters.",
      );
      return;
    }

    onApply(next, updatedCount);
  };

  const displayError = applyError || preview.error;

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Calculator className="h-4 w-4" />
            Courier formula
          </p>
          <p className="text-xs text-muted-foreground">
            Excel-style formula bar with courier variables. Example:{" "}
            <code className="text-[11px]">IF(weight &lt;= 5, 12, 8)</code>
          </p>
        </div>
        <Badge variant="outline">fx</Badge>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Formula</Label>
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2">
          <span className="text-sm font-semibold text-[#FF4907]">fx</span>
          <Input
            className="h-9 border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0"
            value={formula}
            onChange={(e) => {
              setApplyError(null);
              setFormula(e.target.value);
            }}
            placeholder="=partner_rate * 0.10"
            spellCheck={false}
          />
        </div>
        {displayError ? (
          <p className="text-xs text-destructive">{displayError}</p>
        ) : preview.value != null ? (
          <p className="text-xs text-muted-foreground">
            Preview on sample row: <strong>{preview.value}</strong>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {COURIER_FORMULA_VARIABLES.slice(0, 10).map((variable) => (
          <button
            key={variable.key}
            type="button"
            title={variable.description}
            className="rounded-full border bg-muted/50 px-2.5 py-1 text-[11px] hover:bg-muted"
            onClick={() => insertToken(variable.key)}
          >
            {variable.label}
          </button>
        ))}
        {["ROUND(", "IF(", "MIN(", "MAX(", "CEIL("].map((fn) => (
          <button
            key={fn}
            type="button"
            className="rounded-full border border-dashed px-2.5 py-1 text-[11px] hover:bg-muted"
            onClick={() => insertToken(fn)}
          >
            {fn.replace("(", "")}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Write result to</Label>
          <Select
            value={target}
            onValueChange={(value) => setTarget(value as CourierFormulaTarget)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COURIER_FORMULA_TARGETS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Apply to</Label>
          <Select
            value={scope}
            onValueChange={(value) => setScope(value as "selected" | "filtered")}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="filtered">Filtered rows (current filters)</SelectItem>
              <SelectItem value="selected">
                Selected rows ({selectedIds.length})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Courier templates</Label>
        <div className="flex flex-wrap gap-2">
          {COURIER_FORMULA_TEMPLATES.map((template) => (
            <Button
              key={template.id}
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              title={template.description}
              onClick={() => {
                setApplyError(null);
                setFormula(`=${template.formula}`);
                setTarget(template.target);
              }}
            >
              <Plus className="mr-1 h-3 w-3" />
              {template.name}
            </Button>
          ))}
        </div>
      </div>

      <Button size="sm" onClick={applyFormula}>
        Apply formula
      </Button>
    </div>
  );
}
