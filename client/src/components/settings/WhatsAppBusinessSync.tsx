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
  enrichTemplateForSend,
  getTemplateDefinition,
  isMaskedAccessToken,
  KNOWN_IMAGE_HEADER_TEMPLATES,
  resolveTemplateParamValues,
  pickQuickTestTemplate,
  resolveTemplateLanguageForSend,
  templateParamsFilled,
  templateNeedsHeaderMedia,
  whatsAppSettingsSchema,
  type WhatsAppMessageTypeKey,
  type WhatsAppSettings,
} from "@shared/whatsapp";

const SETTINGS_QUERY_KEY = ["/api/whatsapp/settings"];

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
  const [testHeaderMediaUrl, setTestHeaderMediaUrl] = useState("");

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

  const effectiveHeaderMediaUrl =
    testHeaderMediaUrl.trim() || watched.defaultHeaderMediaUrl?.trim() || "";

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
        ["XGoo Customer", "BR-TEST-001"],
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
        ["xgoo"],
      ),
    );
    setTestHeaderMediaUrl(
      watched.defaultHeaderMediaUrl?.trim() ||
        meta?.headerMediaExampleUrl?.trim() ||
        "",
    );
  }, [
    effectiveTestTemplate,
    effectiveTestLanguage,
    allTemplates,
    testMessageType,
    watched.defaultHeaderMediaUrl,
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
        defaultHeaderMediaUrl: values.defaultHeaderMediaUrl?.trim() || undefined,
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
      };
    },
    onSuccess: (result) => {
      const fromLine = result.fromDisplayNumber
        ? ` Sent from ${result.fromDisplayNumber} (ID ${result.phoneNumberId || "?"}).`
        : result.phoneNumberId
          ? ` Phone Number ID: ${result.phoneNumberId}.`
          : "";
      const hints = result.deliveryHints?.length
        ? ` ${result.deliveryHints.join(" ")}`
        : "";
      toast({
        title: "Test message sent",
        description: `Meta status: ${result.messageStatus || "sent"}. Check WhatsApp on ${testPhone}.${fromLine}${hints}`,
        duration: hints || fromLine ? 15000 : 8000,
      });
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
        testHeaderMediaUrl.trim() ||
        values.defaultHeaderMediaUrl?.trim() ||
        meta?.headerMediaExampleUrl?.trim() ||
        "";
      const bodyParams = resolveTemplateParamValues(
        meta?.bodyParamCount ?? 0,
        testBodyParams.some((p) => p.trim()) ? testBodyParams : undefined,
        meta?.bodyParamExamples,
        ["XGoo Customer", "BR-TEST-001"],
      );
      if (
        (meta?.headerMediaRequired ||
          KNOWN_IMAGE_HEADER_TEMPLATES.has(quick.name.toLowerCase())) &&
        !headerMediaUrl
      ) {
        throw new Error(
          "Set Default header image URL above (public HTTPS logo link), then try Quick test again.",
        );
      }
      const res = await apiRequest("POST", "/api/whatsapp/messages/test", {
        to: testPhone,
        messageType: "template",
        templateName: quick.name,
        languageCode: quick.language,
        bodyParams,
        headerMediaUrl: headerMediaUrl || undefined,
        defaultHeaderMediaUrl: values.defaultHeaderMediaUrl?.trim() || undefined,
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
        templateName?: string;
        languageCode?: string;
      };
    },
    onSuccess: (result, _vars, _ctx) => {
      const quick = quickTestTemplate;
      const fromLine = result.fromDisplayNumber
        ? ` Sent from ${result.fromDisplayNumber} (ID ${result.phoneNumberId || "?"}).`
        : result.phoneNumberId
          ? ` Phone Number ID: ${result.phoneNumberId}.`
          : "";
      const hints = result.deliveryHints?.length
        ? ` ${result.deliveryHints.join(" ")}`
        : "";
      toast({
        title: "Quick test sent",
        description: `Template: ${quick?.name || "template"} (${quick?.language || "en"}). Meta status: ${result.messageStatus || "sent"}. Check WhatsApp on ${testPhone}.${fromLine}${hints}`,
        duration: 15000,
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="defaultHeaderMediaUrl"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Default header image URL (automation)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://www.xgoo.in/logo.png"
                            data-testid="input-whatsapp-header-media-default"
                          />
                        </FormControl>
                        <FormDescription>
                          Public HTTPS link used for all automated template sends with image
                          headers (e.g. welcome message). Set once — no manual entry per booking.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
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
                              <p className="text-xs font-medium text-muted-foreground">
                                Header image URL *
                              </p>
                              <Input
                                placeholder="https://www.xgoo.in/logo.png"
                                value={testHeaderMediaUrl}
                                onChange={(e) => setTestHeaderMediaUrl(e.target.value)}
                                data-testid="input-test-whatsapp-header-media"
                              />
                              <p className="text-xs text-muted-foreground">
                                Uses your saved default URL when this field is empty. Required for
                                templates with image headers (e.g. xgoo_welcome_message).
                              </p>
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
                              selectedTestTemplateMeta?.parameterFormat === "named"
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
                ? `Value for {{${paramNames[i]}}}`
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
        </div>
      )}
    </div>
  );
}
