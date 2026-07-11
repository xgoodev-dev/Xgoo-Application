import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  Loader2,
  RefreshCw,
  PlugZap,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  WHATSAPP_MESSAGE_TYPES,
  describeTemplateParameterRequirements,
  describeWhatsAppDeliveryStatus,
  enrichTemplateForSend,
  getTemplateDefinition,
  getWelcomeTemplateFieldLabels,
  isMaskedAccessToken,
  isWelcomeTemplateName,
  KNOWN_IMAGE_HEADER_TEMPLATES,
  resolvePublicObjectUrl,
  resolveTemplateParamValues,
  pickQuickTestTemplate,
  resolveTemplateLanguageForSend,
  templateParamsFilled,
  templateNeedsHeaderMedia,
  whatsAppSettingsSchema,
  type WhatsAppMessageTypeKey,
  type WhatsAppSettings,
  type WhatsAppDeliveryPreflightCheck,
} from "@shared/whatsapp";
import { WhatsAppHeaderImageUpload } from "@/components/settings/WhatsAppHeaderImageUpload";

const SETTINGS_QUERY_KEY = ["/api/whatsapp/settings"];

type WhatsAppWebhookDebugEvent = {
  at: string;
  level: "info" | "warn" | "error";
  event: string;
  detail?: string;
  phoneNumberId?: string;
  from?: string;
  messagePreview?: string;
};

type ConnectionTestResult = {
  phoneNumberId: string;
  wabaId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
};

export function WhatsAppBusinessSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectionResult, setConnectionResult] = useState<ConnectionTestResult | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testTemplate, setTestTemplate] = useState("");
  const [testLanguage, setTestLanguage] = useState("en");
  const [testMessageType, setTestMessageType] = useState<"template" | "text">("template");
  const [testText, setTestText] = useState("Hello from XGoo! This is a test message.");
  const [testTemplateSource, setTestTemplateSource] = useState<"auto" | "manual">("auto");
  const [testManualTemplate, setTestManualTemplate] = useState("");
  const [testManualLanguage, setTestManualLanguage] = useState("en");
  const [testBodyParams, setTestBodyParams] = useState<string[]>([]);
  const [testHeaderParams, setTestHeaderParams] = useState<string[]>([]);
  const [testButtonParams, setTestButtonParams] = useState<string[]>([]);
  const [testHeaderMediaPath, setTestHeaderMediaPath] = useState("");
  const [lastDeliveryChecklist, setLastDeliveryChecklist] = useState<string[] | null>(null);
  const [lastDeliveryPreflight, setLastDeliveryPreflight] = useState<
    WhatsAppDeliveryPreflightCheck[] | null
  >(null);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [webhookDeliveryDetail, setWebhookDeliveryDetail] = useState<string | null>(null);
  const [webhookDebugEvents, setWebhookDebugEvents] = useState<WhatsAppWebhookDebugEvent[]>([]);
  const [webhookDebugLoading, setWebhookDebugLoading] = useState(false);

  const showTestSendResult = (result: {
    messageId?: string;
    messageStatus?: string;
    phoneNumberId?: string;
    fromDisplayNumber?: string;
    deliveryHints?: string[];
    deliveryChecklist?: string[];
    deliveryPreflight?: WhatsAppDeliveryPreflightCheck[];
    webhookDeliveryStatus?: { status: string; errorMessage?: string; errorTitle?: string };
    templateLabel?: string;
  }) => {
    const status = result.messageStatus || "unknown";
    const queuedOnly = status.toLowerCase() === "accepted" || status.toLowerCase() === "unknown";
    const fromLine = result.fromDisplayNumber
      ? ` From ${result.fromDisplayNumber} (ID ${result.phoneNumberId || "?"}).`
      : "";
    const hints = result.deliveryHints?.length ? ` ${result.deliveryHints.join(" ")}` : "";

    if (result.deliveryChecklist?.length) {
      setLastDeliveryChecklist(result.deliveryChecklist);
    }
    if (result.deliveryPreflight?.length) {
      setLastDeliveryPreflight(result.deliveryPreflight);
    }
    if (result.messageId) {
      setLastMessageId(result.messageId);
      setWebhookDeliveryDetail(null);
    }
    if (result.webhookDeliveryStatus?.status) {
      setWebhookDeliveryDetail(
        describeWhatsAppDeliveryStatus(
          result.webhookDeliveryStatus.status,
          result.webhookDeliveryStatus.errorMessage || result.webhookDeliveryStatus.errorTitle,
        ),
      );
    }

    toast({
      title: queuedOnly
        ? "Accepted by Meta — delivery not confirmed yet"
        : "Test message sent",
      description: queuedOnly
        ? `${result.templateLabel ? `${result.templateLabel}. ` : ""}Meta queued your message (status: ${status}).${fromLine} Check the delivery checklist below if it doesn't arrive on WhatsApp within 1–2 minutes.`
        : `${result.templateLabel ? `${result.templateLabel}. ` : ""}Meta status: ${status}.${fromLine}${hints}`,
      duration: queuedOnly ? 12000 : 20000,
      variant: "default",
    });
  };

  const { data: settings, isLoading } = useQuery<WhatsAppSettings>({
    queryKey: SETTINGS_QUERY_KEY,
  });

  const form = useForm<WhatsAppSettings>({
    resolver: zodResolver(whatsAppSettingsSchema),
    defaultValues: whatsAppSettingsSchema.parse({}),
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  useEffect(() => {
    if (!lastMessageId) return;
    let attempts = 0;
    const maxAttempts = 20;
    const interval = setInterval(async () => {
      attempts += 1;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        return;
      }
      try {
        const res = await apiRequest(
          "GET",
          `/api/whatsapp/messages/${encodeURIComponent(lastMessageId)}/delivery-status`,
        );
        const data = (await res.json()) as {
          status?: string | null;
          detail?: string;
          errorMessage?: string;
          errorTitle?: string;
        };
        if (data.status) {
          setWebhookDeliveryDetail(
            data.detail ||
              describeWhatsAppDeliveryStatus(
                data.status,
                data.errorMessage || data.errorTitle,
              ),
          );
          if (["delivered", "read", "failed"].includes(data.status.toLowerCase())) {
            clearInterval(interval);
          }
        }
      } catch {
        // polling is best-effort
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [lastMessageId]);

  const fetchWebhookDebugEvents = async () => {
    setWebhookDebugLoading(true);
    try {
      const res = await apiRequest("GET", "/api/whatsapp/webhook/debug");
      const data = (await res.json()) as { events?: WhatsAppWebhookDebugEvent[] };
      setWebhookDebugEvents(data.events || []);
    } catch {
      // best-effort debug panel
    } finally {
      setWebhookDebugLoading(false);
    }
  };

  useEffect(() => {
    void fetchWebhookDebugEvents();
    const interval = setInterval(() => {
      void fetchWebhookDebugEvents();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (data: WhatsAppSettings) => {
      const res = await apiRequest("PATCH", "/api/whatsapp/settings", data);
      return res.json() as Promise<WhatsAppSettings>;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, saved);
      form.reset(saved);
      const tokenHint = saved.accessToken
        ? isMaskedAccessToken(saved.accessToken)
          ? ` Access token saved (ends with ${saved.accessToken.slice(-4)}).`
          : " Access token saved."
        : "";
      toast({
        title: "WhatsApp settings saved",
        description: `Your Meta WhatsApp Business API configuration has been updated.${tokenHint}`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      const res = await apiRequest("POST", "/api/whatsapp/templates/sync", {
        phoneNumberId: values.phoneNumberId,
        wabaId: values.wabaId,
        accessToken: values.accessToken,
      });
      return res.json() as Promise<{
        templates: WhatsAppSettings["templates"];
        wabaId?: string;
        lastSyncedAt: string;
      }>;
    },
    onSuccess: async (result) => {
      if (result.wabaId) {
        form.setValue("wabaId", result.wabaId, { shouldDirty: true });
      }
      await queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      toast({
        title: "Templates synced",
        description: `${result.templates.length} template(s) loaded from Meta with parameter examples.${result.wabaId ? ` WABA ID: ${result.wabaId}` : ""} Re-open test send to see auto-filled values.`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Sync failed",
        description: err.message,
        variant: "destructive",
        duration: 12000,
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      const res = await apiRequest("POST", "/api/whatsapp/connection/test", {
        phoneNumberId: values.phoneNumberId,
        wabaId: values.wabaId,
        accessToken: values.accessToken,
      });
      return res.json() as Promise<ConnectionTestResult>;
    },
    onSuccess: async (result) => {
      setConnectionResult(result);
      if (result.wabaId) {
        form.setValue("wabaId", result.wabaId, { shouldDirty: true });
      }
      if (result.displayPhoneNumber && !form.getValues("businessWhatsAppNumber")?.trim()) {
        const digits = result.displayPhoneNumber.replace(/\D/g, "");
        if (digits.length >= 10) {
          form.setValue("businessWhatsAppNumber", digits, { shouldDirty: true });
        }
      }
      await queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      toast({
        title: "Connection successful",
        description: result.displayPhoneNumber
          ? `Connected to ${result.displayPhoneNumber}${result.wabaId ? " · WABA ID detected" : ""}`
          : "Meta API credentials are valid.",
      });
    },
    onError: (err: Error) => {
      setConnectionResult(null);
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    },
  });

  const watched = form.watch();
  const approvedTemplates = useMemo(
    () => (watched.templates || []).filter((t) => t.status === "APPROVED"),
    [watched.templates],
  );

  const templateOptions = useMemo(() => {
    const names = new Set(approvedTemplates.map((t) => t.name));
    return Array.from(names).sort();
  }, [approvedTemplates]);

  const languagesForTemplate = (templateName: string) =>
    approvedTemplates
      .filter((t) => t.name === templateName)
      .map((t) => t.language)
      .sort();

  const allTemplates = watched.templates || [];

  const resolveTemplateForSend = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return "";
    const byId = allTemplates.find((t) => t.id === trimmed);
    if (byId) return byId.name;
    return trimmed;
  };

  const effectiveTestTemplate =
    testTemplateSource === "auto" ? testTemplate : resolveTemplateForSend(testManualTemplate);

  const effectiveTestLanguage =
    testTemplateSource === "auto" ? testLanguage : testManualLanguage;

  const selectedTestTemplateMeta = useMemo(
    () =>
      enrichTemplateForSend(
        getTemplateDefinition(allTemplates, effectiveTestTemplate, effectiveTestLanguage),
        effectiveTestTemplate,
        watched,
      ),
    [allTemplates, effectiveTestTemplate, effectiveTestLanguage, watched],
  );

  const showHeaderMediaField =
    templateNeedsHeaderMedia(selectedTestTemplateMeta) ||
    KNOWN_IMAGE_HEADER_TEMPLATES.has(effectiveTestTemplate.trim().toLowerCase());

  const publicAppBaseUrl =
    watched.publicAppBaseUrl?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const effectiveHeaderMediaUrl =
    watched.defaultHeaderMediaUrl?.trim() ||
    resolvePublicObjectUrl(
      testHeaderMediaPath || watched.defaultHeaderMediaPath,
      publicAppBaseUrl,
    ) ||
    "";

  const isWelcomeTemplate = isWelcomeTemplateName(effectiveTestTemplate);
  const welcomeFieldLabels = getWelcomeTemplateFieldLabels(selectedTestTemplateMeta);
  const welcomeTemplateMeta = useMemo(
    () => approvedTemplates.find((t) => t.name === "welcome_message"),
    [approvedTemplates],
  );

  useEffect(() => {
    if (testMessageType !== "template") return;
    const meta = enrichTemplateForSend(
      getTemplateDefinition(allTemplates, effectiveTestTemplate, effectiveTestLanguage),
      effectiveTestTemplate,
      watched,
    );
    setTestBodyParams(
      resolveTemplateParamValues(
        meta?.bodyParamCount ?? 0,
        undefined,
        meta?.bodyParamExamples,
        isWelcomeTemplateName(effectiveTestTemplate)
          ? ["XGoo Customer"]
          : ["XGoo Customer", "BR-TEST-001"],
      ),
    );
    setTestHeaderParams(
      meta?.headerMediaRequired
        ? []
        : resolveTemplateParamValues(
            meta?.headerParamCount ?? 0,
            undefined,
            meta?.headerParamExamples,
            ["XGoo"],
          ),
    );
    setTestButtonParams(
      resolveTemplateParamValues(
        meta?.buttonParamCount ?? 0,
        undefined,
        meta?.buttonParamExamples,
        isWelcomeTemplateName(effectiveTestTemplate)
          ? [watched.welcomeTemplateConfig?.trackShipmentSuffix?.trim() || "xgoo"]
          : ["xgoo"],
      ),
    );
    setTestHeaderMediaPath("");
  }, [
    effectiveTestTemplate,
    effectiveTestLanguage,
    allTemplates,
    testMessageType,
    watched.defaultHeaderMediaPath,
    watched.defaultHeaderMediaUrl,
    watched.publicAppBaseUrl,
    watched.welcomeTemplateConfig?.trackShipmentSuffix,
  ]);

  const paramCountsForValidation = useMemo(
    () => ({
      bodyParamCount:
        selectedTestTemplateMeta?.bodyParamCount ??
        (testBodyParams.length > 0 ? testBodyParams.length : 0),
      headerParamCount: templateNeedsHeaderMedia(selectedTestTemplateMeta)
        ? 0
        : selectedTestTemplateMeta?.headerParamCount ??
          (testHeaderParams.length > 0 ? testHeaderParams.length : 0),
      buttonParamCount:
        selectedTestTemplateMeta?.buttonParamCount ??
        (testButtonParams.length > 0 ? testButtonParams.length : 0),
      headerMediaRequired:
        templateNeedsHeaderMedia(selectedTestTemplateMeta) ||
        KNOWN_IMAGE_HEADER_TEMPLATES.has(effectiveTestTemplate.trim().toLowerCase()),
      headerFormat: selectedTestTemplateMeta?.headerFormat,
      templateName: effectiveTestTemplate.trim(),
    }),
    [
      selectedTestTemplateMeta,
      testBodyParams.length,
      testHeaderParams.length,
      testButtonParams.length,
    ],
  );

  const templateParamsOk =
    testMessageType !== "template" ||
    templateParamsFilled(paramCountsForValidation, {
      bodyParams: testBodyParams,
      headerParams: testHeaderParams,
      buttonParams: testButtonParams,
      headerMediaUrl: effectiveHeaderMediaUrl,
    });

  const isConfigured = Boolean(watched.phoneNumberId?.trim() && watched.accessToken?.trim());

  const canSendTest =
    isConfigured &&
    testPhone.trim() &&
    templateParamsOk &&
    (testMessageType === "text"
      ? testText.trim()
      : testTemplateSource === "auto"
        ? testTemplate.trim()
        : testManualTemplate.trim());

  const quickTestTemplate = useMemo(
    () => pickQuickTestTemplate(approvedTemplates),
    [approvedTemplates],
  );

  const testSendMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      const res = await apiRequest("POST", "/api/whatsapp/messages/test", {
        to: testPhone,
        messageType: testMessageType,
        templateName: testMessageType === "template" ? effectiveTestTemplate : undefined,
        languageCode: effectiveTestLanguage,
        text: testMessageType === "text" ? testText : undefined,
        bodyParams: testMessageType === "template" ? testBodyParams : undefined,
        headerParams: testMessageType === "template" ? testHeaderParams : undefined,
        buttonParams: testMessageType === "template" ? testButtonParams : undefined,
        headerMediaUrl:
          testMessageType === "template" && showHeaderMediaField
            ? effectiveHeaderMediaUrl || undefined
            : undefined,
        defaultHeaderMediaUrl: effectiveHeaderMediaUrl || undefined,
        defaultHeaderMediaPath: values.defaultHeaderMediaPath?.trim() || undefined,
        publicAppBaseUrl: publicAppBaseUrl || undefined,
        welcomeTemplateConfig: values.welcomeTemplateConfig,
        phoneNumberId: values.phoneNumberId,
        wabaId: values.wabaId,
        accessToken: values.accessToken,
        apiVersion: values.apiVersion,
      });
      return (await res.json()) as {
        messageId: string;
        messageStatus?: string;
        phoneNumberId?: string;
        fromDisplayNumber?: string;
        deliveryHints?: string[];
        deliveryChecklist?: string[];
        deliveryPreflight?: WhatsAppDeliveryPreflightCheck[];
        webhookDeliveryStatus?: { status: string; errorMessage?: string; errorTitle?: string };
      };
    },
    onSuccess: (result) => {
      showTestSendResult(result);
    },
    onError: (err: Error) => {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    },
  });

  const helloWorldTestMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      const templates = values.templates || [];
      const quick = pickQuickTestTemplate(
        templates.filter((t) => t.status === "APPROVED"),
      );
      if (!quick) {
        throw new Error("No approved templates found. Sync templates from Meta first.");
      }
      const meta = enrichTemplateForSend(
        getTemplateDefinition(templates, quick.name, quick.language),
        quick.name,
        values,
      );
      const headerMediaUrl =
        effectiveHeaderMediaUrl ||
        meta?.headerMediaExampleUrl?.trim() ||
        "";
      const bodyParams = resolveTemplateParamValues(
        meta?.bodyParamCount ?? 0,
        testBodyParams.some((p) => p.trim()) ? testBodyParams : undefined,
        meta?.bodyParamExamples,
        ["XGoo Customer", "BR-TEST-001"],
      );
      const buttonParams = resolveTemplateParamValues(
        meta?.buttonParamCount ?? 0,
        testButtonParams.some((p) => p.trim()) ? testButtonParams : undefined,
        meta?.buttonParamExamples,
        [values.welcomeTemplateConfig?.trackShipmentSuffix?.trim() || "xgoo"],
      );
      if (
        (meta?.headerMediaRequired ||
          KNOWN_IMAGE_HEADER_TEMPLATES.has(quick.name.toLowerCase())) &&
        !headerMediaUrl
      ) {
        throw new Error(
          "Upload a header image in Welcome template settings (and set Public app URL), then try Quick test again.",
        );
      }
      const res = await apiRequest("POST", "/api/whatsapp/messages/test", {
        to: testPhone,
        messageType: "template",
        templateName: quick.name,
        languageCode: quick.language,
        bodyParams,
        buttonParams: meta?.buttonParamCount ? buttonParams : undefined,
        headerMediaUrl: headerMediaUrl || undefined,
        defaultHeaderMediaUrl: effectiveHeaderMediaUrl || undefined,
        defaultHeaderMediaPath: values.defaultHeaderMediaPath?.trim() || undefined,
        publicAppBaseUrl: publicAppBaseUrl || undefined,
        welcomeTemplateConfig: values.welcomeTemplateConfig,
        phoneNumberId: values.phoneNumberId,
        wabaId: values.wabaId,
        accessToken: values.accessToken,
        apiVersion: values.apiVersion,
      });
      return (await res.json()) as {
        messageId: string;
        messageStatus?: string;
        phoneNumberId?: string;
        fromDisplayNumber?: string;
        deliveryHints?: string[];
        deliveryChecklist?: string[];
        deliveryPreflight?: WhatsAppDeliveryPreflightCheck[];
        webhookDeliveryStatus?: { status: string; errorMessage?: string; errorTitle?: string };
        templateName?: string;
        languageCode?: string;
      };
    },
    onSuccess: (result) => {
      const quick = quickTestTemplate;
      showTestSendResult({
        ...result,
        templateLabel: `Template: ${quick?.name || "template"} (${quick?.language || "en"})`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading WhatsApp settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                WhatsApp Business Sync
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-2xl">
                Connect your Meta WhatsApp Business API account to sync approved message templates
                and send automated customer updates for bookings, tracking, invoices, and more.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {watched.enabled ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Disabled
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}
              className="space-y-8"
            >
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enable WhatsApp automation</FormLabel>
                      <FormDescription>
                        Turn on automated template messages for your customers.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Meta API credentials</h3>
                <p className="text-sm text-muted-foreground">
                  From Meta Developer Console → WhatsApp → API Setup. Copy the{" "}
                  <strong>Phone Number ID</strong> from the same page where &quot;Send message&quot;
                  works — each +1 555 test line has its own ID. Use the access token from that page
                  too.
                </p>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  If Meta&apos;s &quot;Send a message from your test number&quot; works but XGoo
                  does not, your Phone Number ID here likely does not match API Setup. Compare the
                  ID in the cURL snippet on that page with the field below.
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phoneNumberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number ID *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Phone number ID"
                            data-testid="input-phone-number-id"
                          />
                        </FormControl>
                        <FormDescription>
                          From API Setup cURL URL: graph.facebook.com/v…/{"{this-id}"}/messages
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="wabaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Business Account ID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="From Meta API Setup (e.g. 2060196054723591)"
                            data-testid="input-waba-id"
                          />
                        </FormControl>
                        <FormDescription>
                          From Meta Developer Console → WhatsApp → API Setup. Required if auto-detect
                          fails.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="apiVersion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Graph API version</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="v25.0"
                          data-testid="input-whatsapp-api-version"
                        />
                      </FormControl>
                      <FormDescription>
                        Match Meta API Setup (e.g. v25.0). Defaults to v22.0 if empty.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accessToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Token</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Permanent access token"
                          autoComplete="off"
                          data-testid="input-whatsapp-token"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value && isMaskedAccessToken(field.value)
                          ? `Token saved on server (ends with ${field.value.slice(-4)}). Paste a new token from Meta API Setup if you see "Session has expired" (temporary tokens last ~1 hour).`
                          : "Paste your access token from Meta API Setup, then Save. Temporary tokens expire in ~1 hour; use a System User token for production."}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="webhookVerifyToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook Verify Token (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Custom verify token for webhooks" />
                      </FormControl>
                      <FormDescription>
                        Set the same token in Meta → Webhooks. Callback URL:{" "}
                        <code className="text-xs break-all">
                          {typeof window !== "undefined"
                            ? `${window.location.origin}/api/whatsapp/webhook`
                            : "/api/whatsapp/webhook"}
                        </code>
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <div className="space-y-3 rounded-lg border border-dashed p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold">Webhook activity (debug)</h3>
                      <p className="text-xs text-muted-foreground">
                        Live log from your server when Meta calls the webhook. Send Hi from WhatsApp,
                        then check for <code className="text-[10px]">inbound_text</code> and{" "}
                        <code className="text-[10px]">welcome_sent</code>. Empty here usually means
                        Meta is not hitting this server (wrong URL, not deployed, or messages field
                        not subscribed).
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={webhookDebugLoading}
                        onClick={() => void fetchWebhookDebugEvents()}
                      >
                        {webhookDebugLoading ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-3 w-3" />
                        )}
                        Refresh
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const phone = testPhone.trim();
                          if (!phone) {
                            toast({
                              title: "Enter test phone first",
                              description:
                                "Use the test phone field below to clear the 24h welcome cooldown for that number.",
                              variant: "destructive",
                            });
                            return;
                          }
                          await apiRequest("POST", "/api/whatsapp/webhook/clear-welcome-cooldown", {
                            phone,
                          });
                          toast({
                            title: "Welcome cooldown cleared",
                            description: `You can receive auto-welcome again on ${phone}.`,
                          });
                          void fetchWebhookDebugEvents();
                        }}
                      >
                        Clear welcome cooldown
                      </Button>
                    </div>
                  </div>
                  {webhookDebugEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No webhook events yet on this server instance. After Meta verification, subscribe
                      the <strong>messages</strong> field and message your business number from
                      WhatsApp.
                    </p>
                  ) : (
                    <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
                      {webhookDebugEvents.map((evt, index) => (
                        <li
                          key={`${evt.at}-${evt.event}-${index}`}
                          className="rounded border bg-muted/30 p-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                evt.level === "error"
                                  ? "destructive"
                                  : evt.level === "warn"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="text-[10px]"
                            >
                              {evt.event}
                            </Badge>
                            <span className="text-muted-foreground">
                              {new Date(evt.at).toLocaleString()}
                            </span>
                            {evt.from ? (
                              <span className="font-mono text-[10px]">from {evt.from}</span>
                            ) : null}
                          </div>
                          {evt.detail ? <p className="mt-1">{evt.detail}</p> : null}
                          {evt.messagePreview ? (
                            <p className="mt-1 text-muted-foreground">
                              Message: &quot;{evt.messagePreview}&quot;
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                  <div>
                    <h3 className="text-sm font-semibold">Welcome message template</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure your Meta <code className="text-xs">welcome_message</code> template:
                      header image, customer name variable {"{{1}}"}, and button links.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="publicAppBaseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public app URL (site domain only)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://www.xgoo.in"
                            data-testid="input-whatsapp-public-app-url"
                          />
                        </FormControl>
                        <FormDescription>
                          Your website domain only — not the image link. Example:{" "}
                          <code className="text-xs">https://www.xgoo.in</code>. Used when uploads
                          are stored on your server. Image links go in the field below.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultHeaderMediaUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Header image URL (recommended)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://www.xgoo.in/assets/your-banner.png"
                            data-testid="input-whatsapp-header-media-url"
                          />
                        </FormControl>
                        <FormDescription>
                          Public HTTPS image Meta can fetch. Paste your logo/banner URL here — this
                          is the most reliable option. Upload below only works when the app runs on
                          the same domain as Public app URL.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultHeaderMediaPath"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <WhatsAppHeaderImageUpload
                            objectPath={field.value || ""}
                            publicBaseUrl={publicAppBaseUrl}
                            onPathChange={(path) => {
                              field.onChange(path);
                              const resolved = resolvePublicObjectUrl(path, publicAppBaseUrl);
                              if (resolved?.startsWith("https://")) {
                                form.setValue("defaultHeaderMediaUrl", resolved, {
                                  shouldDirty: true,
                                });
                              }
                            }}
                            label="Or upload header image"
                            description="Upload works when XGoo is hosted on your Public app URL domain. For local dev, use Header image URL above instead."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                    <p className="font-medium">Auto welcome on Hi / Hello</p>
                    <p className="mt-1">
                      Enable <strong>Welcome Message → Auto-send</strong> below and configure Meta
                      webhook to{" "}
                      <code className="break-all">
                        {typeof window !== "undefined"
                          ? `${window.location.origin}/api/whatsapp/webhook`
                          : "https://YOUR-DOMAIN/api/whatsapp/webhook"}
                      </code>{" "}
                      (use your production HTTPS URL). When a customer messages from your website
                      wa.me link or types Hi/Hello, XGoo replies automatically (once per 24h per
                      number). Keep <strong>Instant text reply</strong> on for fast delivery; Meta
                      often queues MARKETING templates.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="welcomeTemplateConfig.bookParcelUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Book a Parcel button URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://www.xgoo.in/book"
                              data-testid="input-welcome-book-url"
                            />
                          </FormControl>
                          <FormDescription>
                            Static link for the &quot;Book a Parcel&quot; button (set the same URL
                            in Meta when creating the template).
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="welcomeTemplateConfig.supportPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Talk to XGoo Team — phone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="919876543210"
                              data-testid="input-welcome-support-phone"
                            />
                          </FormControl>
                          <FormDescription>
                            Phone number for the call button (country code, no +). Match Meta
                            template settings.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="welcomeTemplateConfig.trackShipmentSuffix"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Track Shipment — default URL suffix</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="track/AWB123 or booking ref for {{1}}"
                              data-testid="input-welcome-track-suffix"
                            />
                          </FormControl>
                          <FormDescription>
                            Dynamic part appended to your track URL (template button {"{{1}}"}).
                            Used as default when sending welcome messages; override per test send
                            below.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  {welcomeTemplateMeta?.buttons && welcomeTemplateMeta.buttons.length > 0 && (
                    <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">Synced buttons from Meta:</p>
                      {welcomeTemplateMeta.buttons.map((btn) => (
                        <p key={btn.index}>
                          {btn.text || btn.type} — {btn.type}
                          {btn.urlPattern ? ` (${btn.urlPattern})` : ""}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="businessWhatsAppNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business WhatsApp number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="919876543210"
                            data-testid="input-whatsapp-business-number"
                          />
                        </FormControl>
                        <FormDescription>
                          With country code, no +. Used for &quot;Return to WhatsApp&quot; links
                          after booking.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Test connection and sync use the values in this form (including a newly pasted
                token before save). Click Save to persist credentials for automated messages.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isConfigured || testConnectionMutation.isPending}
                  onClick={() => testConnectionMutation.mutate()}
                  data-testid="button-test-whatsapp-connection"
                >
                  {testConnectionMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlugZap className="mr-2 h-4 w-4" />
                  )}
                  Test connection
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isConfigured || syncMutation.isPending}
                  onClick={() => syncMutation.mutate()}
                  data-testid="button-sync-whatsapp-templates"
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync templates from Meta
                </Button>
              </div>

              {connectionResult && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950/30">
                  <p className="font-medium text-green-800 dark:text-green-200">Connected</p>
                  <p className="font-mono text-xs text-green-700 dark:text-green-300">
                    Phone Number ID: {connectionResult.phoneNumberId}
                  </p>
                  {connectionResult.verifiedName && (
                    <p className="text-green-700 dark:text-green-300">
                      Business: {connectionResult.verifiedName}
                    </p>
                  )}
                  {connectionResult.displayPhoneNumber && (
                    <p className="text-green-700 dark:text-green-300">
                      Number: {connectionResult.displayPhoneNumber}
                    </p>
                  )}
                  {connectionResult.wabaId && (
                    <p className="text-green-700 dark:text-green-300 font-mono text-xs">
                      WABA ID: {connectionResult.wabaId}
                    </p>
                  )}
                </div>
              )}

              {watched.lastSyncedAt && (
                <p className="text-xs text-muted-foreground">
                  Last template sync: {new Date(watched.lastSyncedAt).toLocaleString()} ·{" "}
                  {approvedTemplates.length} approved template(s)
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Automated message templates</h3>
                  <p className="text-sm text-muted-foreground">
                    Map each customer touchpoint to an approved WhatsApp template from your Meta
                    account.
                  </p>
                </div>

                <div className="space-y-3">
                  {WHATSAPP_MESSAGE_TYPES.map((messageType) => (
                    <AutomationRuleRow
                      key={messageType.key}
                      messageKey={messageType.key}
                      label={messageType.label}
                      description={messageType.description}
                      form={form}
                      templateOptions={templateOptions}
                      languagesForTemplate={languagesForTemplate}
                    />
                  ))}
                </div>
              </div>

              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Send test message</CardTitle>
                  <CardDescription>
                    Send a custom text or an approved template to verify your WhatsApp setup.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                    <p className="font-medium">If Meta says &quot;accepted&quot; but nothing arrives on WhatsApp:</p>
                    <ol className="mt-2 list-decimal list-inside space-y-1 text-xs">
                      <li>
                        From phone <strong>{testPhone || "919…"}</strong>, open WhatsApp and message{" "}
                        <strong>{connectionResult?.displayPhoneNumber || "+1 555 business line"}</strong>{" "}
                        first (e.g. &quot;Hi&quot;).
                      </li>
                      <li>
                        In Meta API Setup, add the recipient under &quot;To&quot; for the same Phone
                        Number ID saved here.
                      </li>
                      <li>
                        <strong>welcome_message</strong> is MARKETING — WhatsApp may block it without
                        opt-in. Use a UTILITY template for booking confirmations.
                      </li>
                    </ol>
                  </div>

                  <Input
                    placeholder="Recipient (country code + mobile, e.g. 916071125252)"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    data-testid="input-test-whatsapp-phone"
                  />

                  <Tabs
                    value={testMessageType}
                    onValueChange={(v) => setTestMessageType(v as "template" | "text")}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="template">Template</TabsTrigger>
                      <TabsTrigger value="text">Custom text</TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="space-y-3 mt-3">
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                        <strong>Custom text rarely delivers for outbound tests.</strong> WhatsApp only
                        allows free-form messages when the recipient messaged your business number in
                        the last 24 hours. For sandbox (+1 555) and new customers, always use a
                        template.
                      </div>
                      <Textarea
                        placeholder="Type your test message..."
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        rows={4}
                        data-testid="input-test-whatsapp-text"
                      />
                      <p className="text-xs text-muted-foreground">
                        Meta may return &quot;accepted&quot; even when custom text is not delivered.
                        Use the Template tab or &quot;hello_world&quot; quick test instead.
                      </p>
                    </TabsContent>

                    <TabsContent value="template" className="space-y-3 mt-3">
                      <Tabs
                        value={testTemplateSource}
                        onValueChange={(v) => setTestTemplateSource(v as "auto" | "manual")}
                      >
                        <TabsList className="grid w-full grid-cols-2 h-9">
                          <TabsTrigger value="auto" className="text-xs">
                            Auto (synced list)
                          </TabsTrigger>
                          <TabsTrigger value="manual" className="text-xs">
                            Manual (name / ID)
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="auto" className="space-y-3 mt-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Select value={testTemplate} onValueChange={setTestTemplate}>
                              <SelectTrigger data-testid="select-test-whatsapp-template">
                                <SelectValue placeholder="Select template" />
                              </SelectTrigger>
                              <SelectContent>
                                {templateOptions.length === 0 ? (
                                  <SelectItem value="__none" disabled>
                                    Sync templates first
                                  </SelectItem>
                                ) : (
                                  templateOptions.map((name) => (
                                    <SelectItem key={name} value={name}>
                                      {name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <Select value={testLanguage} onValueChange={setTestLanguage}>
                              <SelectTrigger>
                                <SelectValue placeholder="Language" />
                              </SelectTrigger>
                              <SelectContent>
                                {(testTemplate ? languagesForTemplate(testTemplate) : ["en"]).map((lang) => (
                                  <SelectItem key={lang} value={lang}>
                                    {lang}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TabsContent>

                        <TabsContent value="manual" className="space-y-3 mt-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                              placeholder="Template name or Meta template ID"
                              value={testManualTemplate}
                              onChange={(e) => setTestManualTemplate(e.target.value)}
                              data-testid="input-test-whatsapp-template-manual"
                            />
                            <Input
                              placeholder="Language code (e.g. en, en_US)"
                              value={testManualLanguage}
                              onChange={(e) => setTestManualLanguage(e.target.value)}
                              data-testid="input-test-whatsapp-language-manual"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Meta sends using the template <strong>name</strong> (e.g.{" "}
                            <code className="text-xs">hello_world</code>). If you paste a numeric
                            template ID, we resolve it from your synced templates when possible.
                          </p>
                          {testManualTemplate.trim() &&
                            resolveTemplateForSend(testManualTemplate) !==
                              testManualTemplate.trim() && (
                              <p className="text-xs text-green-700 dark:text-green-400">
                                Resolved to template name:{" "}
                                <code className="text-xs">
                                  {resolveTemplateForSend(testManualTemplate)}
                                </code>
                              </p>
                            )}
                        </TabsContent>
                      </Tabs>

                      {effectiveTestTemplate && (
                        <div className="space-y-3 rounded-lg border border-dashed p-3">
                          <div>
                            <p className="text-sm font-medium">Template parameters</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedTestTemplateMeta
                                ? describeTemplateParameterRequirements(selectedTestTemplateMeta)
                                : "Re-sync templates from Meta to detect required parameters."}{" "}
                              Values are auto-filled from Meta when you sync templates — edit only
                              if you want different test data.
                            </p>
                          </div>
                          {showHeaderMediaField && (
                            <div className="space-y-2">
                              <WhatsAppHeaderImageUpload
                                objectPath={
                                  testHeaderMediaPath ||
                                  watched.defaultHeaderMediaPath ||
                                  ""
                                }
                                publicBaseUrl={publicAppBaseUrl}
                                onPathChange={(path) => {
                                  setTestHeaderMediaPath(path);
                                  form.setValue("defaultHeaderMediaPath", path, {
                                    shouldDirty: true,
                                  });
                                }}
                                label="Header image for this send"
                                description={
                                  isWelcomeTemplate
                                    ? "Uses your saved welcome header image. Upload here to change it for automation and this test."
                                    : "Required for templates with image headers."
                                }
                                testId="input-test-whatsapp-header-media"
                              />
                              {effectiveHeaderMediaUrl && !effectiveHeaderMediaUrl.startsWith("http") && (
                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                  Set Public app URL above so Meta receives an HTTPS image link.
                                </p>
                              )}
                            </div>
                          )}
                          {!showHeaderMediaField && (
                            <TemplateParameterFields
                              label="Header"
                              params={testHeaderParams}
                              minCount={selectedTestTemplateMeta?.headerParamCount ?? 0}
                              paramNames={
                                selectedTestTemplateMeta?.parameterFormat === "named"
                                  ? selectedTestTemplateMeta.headerParamNames
                                  : undefined
                              }
                              onChange={setTestHeaderParams}
                            />
                          )}
                          <TemplateParameterFields
                            label="Body"
                            params={testBodyParams}
                            minCount={selectedTestTemplateMeta?.bodyParamCount ?? 0}
                            paramNames={
                              isWelcomeTemplate
                                ? welcomeFieldLabels.bodyLabels
                                : selectedTestTemplateMeta?.parameterFormat === "named"
                                  ? selectedTestTemplateMeta.bodyParamNames
                                  : undefined
                            }
                            onChange={setTestBodyParams}
                          />
                          {(selectedTestTemplateMeta?.buttonParamCount ?? 0) > 0 && (
                            <TemplateParameterFields
                              label="Button (URL)"
                              params={testButtonParams}
                              minCount={selectedTestTemplateMeta?.buttonParamCount ?? 0}
                              paramNames={
                                isWelcomeTemplate ? welcomeFieldLabels.buttonLabels : undefined
                              }
                              onChange={setTestButtonParams}
                            />
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!canSendTest || testSendMutation.isPending}
                    onClick={() => testSendMutation.mutate()}
                    data-testid="button-send-test-whatsapp"
                  >
                    {testSendMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send test
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      !testPhone.trim() || !isConfigured || helloWorldTestMutation.isPending
                    }
                    onClick={() => helloWorldTestMutation.mutate()}
                    data-testid="button-send-hello-world-test"
                  >
                    {helloWorldTestMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Quick test
                    {quickTestTemplate
                      ? ` (${quickTestTemplate.name}, ${quickTestTemplate.language})`
                      : ""}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Quick test uses your simplest synced template
                    {quickTestTemplate
                      ? ` — currently ${quickTestTemplate.name} (${quickTestTemplate.language})`
                      : " — sync templates first"}
                    . hello_world only exists on Meta&apos;s default API Setup; your account uses
                    welcome_message (en).
                  </p>
                  {lastDeliveryPreflight && lastDeliveryPreflight.length > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Delivery preflight (last test)
                      </p>
                      <ul className="mt-2 space-y-2 text-xs">
                        {lastDeliveryPreflight.map((check) => (
                          <li key={check.id} className="flex gap-2">
                            {check.passed ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                            )}
                            <div>
                              <p className="font-medium text-blue-900 dark:text-blue-100">
                                {check.label}
                              </p>
                              <p className="text-blue-900/80 dark:text-blue-100/80">
                                {check.detail}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lastMessageId && (
                    <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Webhook delivery status</p>
                      <p className="mt-1 font-mono break-all">Message ID: {lastMessageId}</p>
                      {webhookDeliveryDetail ? (
                        <p className="mt-1 text-foreground">{webhookDeliveryDetail}</p>
                      ) : (
                        <p className="mt-1">
                          Waiting for Meta webhook (sent → delivered / failed). Configure webhook
                          URL{" "}
                          <code className="text-[10px]">
                            {typeof window !== "undefined"
                              ? `${window.location.origin}/api/whatsapp/webhook`
                              : "/api/whatsapp/webhook"}
                          </code>{" "}
                          on a public HTTPS domain, or check WhatsApp Manager → Insights.
                        </p>
                      )}
                    </div>
                  )}
                  {lastDeliveryChecklist && lastDeliveryChecklist.length > 0 && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm dark:border-orange-900 dark:bg-orange-950/30">
                      <p className="font-medium text-orange-900 dark:text-orange-100">
                        Delivery checklist (last test)
                      </p>
                      <ol className="mt-2 list-decimal list-inside space-y-1 text-xs text-orange-900/90 dark:text-orange-100/90">
                        {lastDeliveryChecklist.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-whatsapp">
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save WhatsApp settings"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateParameterFields({
  label,
  params,
  minCount,
  paramNames,
  onChange,
}: {
  label: string;
  params: string[];
  minCount: number;
  paramNames?: string[];
  onChange: (next: string[]) => void;
}) {
  const setParam = (index: number, value: string) => {
    const next = [...params];
    next[index] = value;
    onChange(next);
  };

  const add = () => onChange([...params, ""]);

  const remove = (index: number) => {
    if (params.length <= minCount) return;
    onChange(params.filter((_, i) => i !== index));
  };

  if (params.length === 0 && minCount === 0) {
    return (
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="mr-1 h-3 w-3" />
          Add {label.toLowerCase()} parameter
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {params.map((value, i) => (
        <div key={`${label}-${i}`} className="flex gap-2">
          <Input
            placeholder={
              paramNames?.[i]
                ? paramNames[i].includes("{{")
                  ? paramNames[i]
                  : `Value for {{${paramNames[i]}}}`
                : `Value for {{${i + 1}}}`
            }
            value={value}
            onChange={(e) => setParam(i, e.target.value)}
          />
          {params.length > minCount && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => remove(i)}
              aria-label={`Remove ${label} parameter ${i + 1}`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1 h-3 w-3" />
        Add parameter
      </Button>
    </div>
  );
}

function AutomationRuleRow({
  messageKey,
  label,
  description,
  form,
  templateOptions,
  languagesForTemplate,
}: {
  messageKey: WhatsAppMessageTypeKey;
  label: string;
  description: string;
  form: ReturnType<typeof useForm<WhatsAppSettings>>;
  templateOptions: string[];
  languagesForTemplate: (name: string) => string[];
}) {
  const enabled = form.watch(`automation.${messageKey}.enabled`);
  const templateName = form.watch(`automation.${messageKey}.templateName`);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <FormField
          control={form.control}
          name={`automation.${messageKey}.enabled`}
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormLabel className="text-xs text-muted-foreground">Auto-send</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {enabled && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name={`automation.${messageKey}.templateName`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Template</FormLabel>
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {templateOptions.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        Sync templates first
                      </SelectItem>
                    ) : (
                      templateOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`automation.${messageKey}.languageCode`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Language</FormLabel>
                <Select
                  value={field.value || "en"}
                  onValueChange={field.onChange}
                  disabled={!templateName}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(templateName ? languagesForTemplate(templateName) : ["en"]).map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          {messageKey === "welcome" && (
            <FormField
              control={form.control}
              name="automation.welcome.preferFastTextOnGreeting"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 flex flex-row items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-xs">Instant text reply on Hi (recommended)</FormLabel>
                    <FormDescription className="text-xs">
                      Sends a plain WhatsApp message in seconds when customers say Hi. Marketing
                      templates like welcome_message are often delayed 30s–2min by Meta. Turn off to
                      always send the full template with image and buttons.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value !== false} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          {messageKey === "welcome" && (
            <FormField
              control={form.control}
              name="automation.welcome.replyOnInboundGreeting"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 flex flex-row items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-xs">Reply when customer sends Hi / Hello</FormLabel>
                    <FormDescription className="text-xs">
                      Requires Meta webhook on your public HTTPS domain. Sends welcome_message when
                      customers open WhatsApp from your site or greet your business line.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value !== false} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}
