import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calculator, FileSpreadsheet, History, Table2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CourierPartner, TariffVersion } from "@shared/schema";
import { TariffUploadsTab } from "@/components/pricing/TariffUploadsTab";
import { TariffTableTab } from "@/components/pricing/TariffTableTab";
import { PriceEstimatorTab } from "@/components/pricing/PriceEstimatorTab";
import { RateHistoryTab } from "@/components/pricing/RateHistoryTab";

type TariffVersionRow = TariffVersion & { partnerName?: string | null };

export default function PricingPage() {
  const [tab, setTab] = useState("tariffs");
  const [tableVersionId, setTableVersionId] = useState<string | undefined>();

  const { data: partners } = useQuery<CourierPartner[]>({
    queryKey: ["/api/partners"],
  });

  const { data: tariffs, isLoading: tariffsLoading } = useQuery<TariffVersionRow[]>({
    queryKey: ["/api/tariffs"],
  });

  const handleViewVersion = (id: string) => {
    setTableVersionId(id);
    setTab("table");
  };

  const handleTariffImported = (id: string) => {
    setTableVersionId(id);
    setTab("table");
  };

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h1 className="text-2xl font-bold">Shipping Price Estimator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage tariff cycles, edit rates in an Excel-like table, compare versions, and quote bookings from live data.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="tariffs">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Tariff Uploads
          </TabsTrigger>
          <TabsTrigger value="table">
            <Table2 className="h-4 w-4 mr-2" />
            Tariff Table
          </TabsTrigger>
          <TabsTrigger value="estimator">
            <Calculator className="h-4 w-4 mr-2" />
            Price Estimator
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Rate History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tariffs" className="mt-4">
          <TariffUploadsTab
            partners={partners || []}
            tariffs={tariffs || []}
            onImported={handleTariffImported}
          />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <TariffTableTab
            key={tableVersionId}
            partners={partners || []}
            tariffs={tariffs || []}
            initialVersionId={tableVersionId}
          />
        </TabsContent>

        <TabsContent value="estimator" className="mt-4">
          <PriceEstimatorTab partners={partners || []} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <RateHistoryTab
            tariffs={tariffs || []}
            loading={tariffsLoading}
            onViewVersion={handleViewVersion}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
