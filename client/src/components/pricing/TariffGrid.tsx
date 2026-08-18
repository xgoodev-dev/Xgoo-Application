import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type CellValueChangedEvent,
  type GridApi,
  type GridReadyEvent,
  type ValueFormatterParams,
  type ValueParserParams,
  themeQuartz,
} from "ag-grid-community";
import type { CourierPartner } from "@shared/schema";
import { calculateCustomerPrice } from "@shared/tariff-pricing";
import type { TariffGridRow } from "./types";
import { toGridRow } from "./types";

ModuleRegistry.registerModules([AllCommunityModule]);

type Props = {
  rows: TariffGridRow[];
  partners: CourierPartner[];
  hiddenColumns: string[];
  onRowUpdate: (row: TariffGridRow) => void;
  onRowClick: (row: TariffGridRow) => void;
  onSelectionChange: (ids: string[]) => void;
  loading?: boolean;
};

const NUM_FIELDS = new Set([
  "tariffAmount",
  "fixedMargin",
  "percentageMargin",
  "affiliateMargin",
  "offerDiscount",
  "fuelCharge",
  "handlingCharge",
  "insuranceCharge",
  "remoteAreaCharge",
  "gst",
  "transitDays",
  "weightMin",
  "weightMax",
]);

const PRICE_FIELDS = new Set([
  "tariffAmount",
  "fixedMargin",
  "percentageMargin",
  "affiliateMargin",
  "offerDiscount",
  "fuelCharge",
  "handlingCharge",
  "insuranceCharge",
  "remoteAreaCharge",
  "gst",
]);

function parseNum(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = parseFloat(String(value ?? "").replace(/[,₹\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(p: ValueFormatterParams<TariffGridRow>) {
  if (p.value == null || p.value === "") return "0.00";
  return parseNum(p.value).toFixed(2);
}

function moneyParser(p: ValueParserParams<TariffGridRow>) {
  return String(parseNum(p.newValue));
}

function recalcRow(row: TariffGridRow): TariffGridRow {
  const customerPriceCalc = calculateCustomerPrice({
    tariffAmount: row.tariffAmount,
    fixedMargin: row.fixedMargin,
    percentageMargin: row.percentageMargin,
    affiliateMargin: row.affiliateMargin,
    offerDiscount: row.offerDiscount,
    fuelCharge: row.fuelCharge,
    handlingCharge: row.handlingCharge,
    insuranceCharge: row.insuranceCharge,
    remoteAreaCharge: row.remoteAreaCharge,
    gst: row.gst,
  });
  return {
    ...row,
    weightMin: "0",
    weight: String(parseNum(row.weightMax)),
    customerPriceCalc,
    customerPrice: String(customerPriceCalc),
  };
}

function numberCol(
  field: keyof TariffGridRow & string,
  headerName: string,
  width = 110,
): ColDef<TariffGridRow> {
  return {
    field,
    headerName,
    editable: true,
    width,
    cellDataType: "text",
    cellEditor: "agTextCellEditor",
    valueFormatter: formatMoney,
    valueParser: moneyParser,
    cellClass: "tabular-nums",
  };
}

export function TariffGrid({
  rows,
  partners,
  hiddenColumns,
  onRowUpdate,
  onRowClick,
  onSelectionChange,
  loading,
}: Props) {
  const gridRef = useRef<AgGridReact<TariffGridRow>>(null);
  const [gridApi, setGridApi] = useState<GridApi<TariffGridRow> | null>(null);
  const syncingRef = useRef(false);

  const columnDefs = useMemo<ColDef<TariffGridRow>[]>(() => {
    const defs: ColDef<TariffGridRow>[] = [
      {
        field: "weightMax",
        headerName: "Weight (kg)",
        pinned: "left",
        width: 120,
        editable: true,
        cellEditor: "agTextCellEditor",
        valueFormatter: formatMoney,
        valueParser: moneyParser,
        checkboxSelection: false,
      },
      { field: "shipmentType", headerName: "Shipment Type", editable: true, width: 130 },
      { field: "originCountry", headerName: "Origin", editable: true, width: 90 },
      { field: "destinationCountry", headerName: "Destination", editable: true, width: 110 },
      {
        field: "courierPartner",
        headerName: "Courier Partner",
        editable: true,
        width: 140,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: partners.map((p) => p.name) },
      },
      {
        field: "service",
        headerName: "Service",
        editable: true,
        width: 100,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["surface", "air"] },
      },
      numberCol("tariffAmount", "Partner Rate", 120),
      numberCol("fixedMargin", "Fixed Margin", 120),
      numberCol("percentageMargin", "% Margin", 100),
      numberCol("affiliateMargin", "Affiliate Margin", 130),
      numberCol("offerDiscount", "Offer Discount", 120),
      numberCol("fuelCharge", "Fuel Charge", 110),
      numberCol("handlingCharge", "Handling Charge", 130),
      numberCol("insuranceCharge", "Insurance Charge", 130),
      numberCol("remoteAreaCharge", "Remote Area", 120),
      numberCol("gst", "GST %", 90),
      {
        field: "customerPriceCalc",
        headerName: "Customer Price",
        editable: false,
        width: 140,
        valueFormatter: (p) =>
          p.value != null ? `₹${Number(p.value).toFixed(2)}` : "₹0.00",
        cellClass: "font-semibold text-primary tabular-nums",
      },
      {
        field: "transitDays",
        headerName: "Transit Days",
        editable: true,
        width: 110,
        cellEditor: "agTextCellEditor",
        valueParser: (p) => {
          const n = parseInt(String(p.newValue ?? ""), 10);
          return Number.isFinite(n) ? n : null;
        },
      },
      {
        field: "isActive",
        headerName: "Active",
        editable: true,
        width: 90,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["Yes", "No"] },
        valueGetter: (p) => (p.data?.isActive === false ? "No" : "Yes"),
        valueSetter: (p) => {
          if (!p.data) return false;
          p.data.isActive = String(p.newValue).toLowerCase() !== "no";
          return true;
        },
      },
      { field: "notes", headerName: "Notes", editable: true, flex: 1, minWidth: 160 },
      {
        colId: "details",
        headerName: "",
        width: 88,
        editable: false,
        sortable: false,
        filter: false,
        pinned: "right",
        cellRenderer: () => (
          <button
            type="button"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            data-action="details"
          >
            Details
          </button>
        ),
        onCellClicked: (e) => {
          if (e.data) onRowClick(e.data);
        },
      },
    ];
    return defs.filter((d) => {
      if (!d.field) return true;
      return !hiddenColumns.includes(d.field as string);
    });
  }, [partners, hiddenColumns, onRowClick]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      editable: true,
      minWidth: 80,
      singleClickEdit: true,
    }),
    [],
  );

  const onGridReady = useCallback((e: GridReadyEvent<TariffGridRow>) => {
    setGridApi(e.api);
  }, []);

  const onCellValueChanged = useCallback(
    (e: CellValueChangedEvent<TariffGridRow>) => {
      if (!e.data || syncingRef.current) return;
      let updated = { ...e.data };
      const field = e.colDef.field;

      if (field === "courierPartner") {
        const partner = partners.find((p) => p.name === e.newValue);
        if (partner) {
          updated.courierPartnerId = partner.id;
          updated.courierPartner = partner.name;
          updated.partnerName = partner.name;
          updated.partnerCode = partner.code;
        }
      }
      if (field === "service") {
        updated.serviceType = String(e.newValue);
        updated.service = String(e.newValue);
      }
      if (field && NUM_FIELDS.has(field)) {
        (updated as Record<string, unknown>)[field] = String(parseNum(e.newValue));
      }
      if (field === "weightMax") {
        updated.weightMin = "0";
      }

      if (!field || PRICE_FIELDS.has(field) || field === "weightMax") {
        updated = recalcRow(updated);
      }

      syncingRef.current = true;
      e.node.setData(updated);
      onRowUpdate(updated);
      queueMicrotask(() => {
        syncingRef.current = false;
      });
    },
    [onRowUpdate, partners],
  );

  const onSelectionChanged = useCallback(() => {
    if (!gridApi) return;
    const ids = gridApi.getSelectedRows().map((r) => r.id);
    onSelectionChange(ids);
  }, [gridApi, onSelectionChange]);

  useEffect(() => {
    if (!gridApi || syncingRef.current) return;
    gridApi.setGridOption("rowData", rows);
  }, [rows, gridApi]);

  return (
    <div className="ag-theme-quartz h-[min(70vh,720px)] w-full overflow-hidden rounded-t-lg border border-b-0 [&_.ag-root-wrapper]:rounded-t-lg">
      <AgGridReact<TariffGridRow>
        ref={gridRef}
        theme={themeQuartz.withParams({
          accentColor: "#FF4907",
          borderRadius: 8,
        })}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowSelection={{
          mode: "multiRow",
          checkboxes: true,
          headerCheckbox: true,
          enableClickSelection: true,
          enableSelectionWithoutKeys: false,
          selectAll: "filtered",
        }}
        cellSelection={{
          suppressMultiRanges: false,
        }}
        selectionColumnDef={{
          pinned: "left",
          width: 44,
          maxWidth: 44,
          suppressHeaderMenuButton: true,
        }}
        animateRows
        pagination
        paginationPageSize={50}
        paginationPageSizeSelector={[25, 50, 100, 200]}
        singleClickEdit
        stopEditingWhenCellsLoseFocus
        undoRedoCellEditing
        undoRedoCellEditingLimit={20}
        onGridReady={onGridReady}
        onCellValueChanged={onCellValueChanged}
        onSelectionChanged={onSelectionChanged}
        loading={loading}
        getRowId={(p) => p.data.id}
        suppressClickEdit={false}
        suppressCellFocus={false}
      />
    </div>
  );
}

export function createEmptyRow(partners: CourierPartner[], versionId: string, officeId: string): TariffGridRow {
  const partner = partners[0];
  return toGridRow({
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tariffVersionId: versionId,
    officeId,
    courierPartnerId: partner?.id || "",
    serviceType: "surface",
    shipmentType: "domestic",
    originCountry: "IN",
    destinationCountry: null,
    originPincode: null,
    destinationPincode: null,
    originZone: null,
    destinationZone: null,
    weightMin: "0",
    weightMax: "0.5",
    tariffAmount: "0",
    fixedMargin: "0",
    percentageMargin: "0",
    affiliateMargin: "0",
    offerDiscount: "0",
    fuelCharge: "0",
    handlingCharge: "0",
    insuranceCharge: "0",
    remoteAreaCharge: "0",
    gst: "0",
    customerPrice: "0",
    transitDays: null,
    isActive: true,
    notes: null,
    customFields: {},
    updatedAt: new Date(),
    updatedBy: null,
    createdAt: new Date(),
    partnerName: partner?.name,
    partnerCode: partner?.code,
  });
}
