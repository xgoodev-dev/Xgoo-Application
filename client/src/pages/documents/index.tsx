import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Files, Receipt, FileSpreadsheet, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentTemplateSettings } from "@/components/documents/DocumentTemplateSettings";
import { DocumentsInvoicesTab } from "@/pages/documents/invoices-tab";
import QuotationsPage from "@/pages/quotations";
import type { Office } from "@shared/schema";

const VALID_TABS = ["invoices", "quotations", "template"] as const;
type DocumentTab = (typeof VALID_TABS)[number];

function tabFromPath(path: string): DocumentTab {
  if (path === "/documents" || path === "/documents/invoices") return "invoices";
  const segment = path.replace(/^\/documents\/?/, "").split("/")[0];
  if (VALID_TABS.includes(segment as DocumentTab)) return segment as DocumentTab;
  return "invoices";
}

function pathForTab(tab: DocumentTab): string {
  return tab === "invoices" ? "/documents" : `/documents/${tab}`;
}

export default function DocumentsPage() {
  const [location, setLocation] = useLocation();
  const activeTab = tabFromPath(location);

  const { data: office, isLoading } = useQuery<Office>({
    queryKey: ["/api/office"],
  });

  const onTabChange = (value: string) => {
    setLocation(pathForTab(value as DocumentTab));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Files className="h-7 w-7" />
          Documents
        </h1>
        <p className="text-muted-foreground">
          Create invoices and quotations, and customize your printable templates.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="invoices" data-testid="tab-documents-invoices">
            <Receipt className="mr-2 h-4 w-4" />
            Invoices & Bills
          </TabsTrigger>
          <TabsTrigger value="quotations" data-testid="tab-documents-quotations">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Quotations
          </TabsTrigger>
          <TabsTrigger value="template" data-testid="tab-documents-template">
            <Palette className="mr-2 h-4 w-4" />
            Template
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <DocumentsInvoicesTab />
        </TabsContent>

        <TabsContent value="quotations" className="mt-6">
          <QuotationsPage embedded />
        </TabsContent>

        <TabsContent value="template" className="mt-6">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : office ? (
            <DocumentTemplateSettings office={office} />
          ) : (
            <p className="text-muted-foreground">
              Set up your office in Settings before customizing document templates.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
