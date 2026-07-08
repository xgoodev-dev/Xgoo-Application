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
  getTemplateDefinition,
  isMaskedAccessToken,
  templateParamsFilled,
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
  const [testMessageType, setTestMessageType] = useState<"template" | "text">("text");
  const [testText, setTestText] = useState("Hello from XGoo! This is a test message.");
  const [testTemplateSource, setTestTemplateSource] = useState<"auto" | "manual">("auto");
  const [testManualTemplate, setTestManualTemplate] = useState("");
  const [testManualLanguage, setTestManualLanguage] = useState("en");
  const [testBodyParams, setTestBodyParams] = useState<string[]>([]);
  const [testHeaderParams, setTestHeaderParams] = useState<string[]>([]);
  const [testButtonParams, setTestButtonParams] = useState<string[]>([]);

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
        description: `${result.templates.length} template(s) loaded from Meta.${result.wabaId ? ` WABA ID: ${result.wabaId}` : ""}`,
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
        await queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      }
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

  const testSendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/whatsapp/messages/test", {
        to: testPhone,
        messageType: testMessageType,
        templateName: testMessageType === "template" ? effectiveTestTemplate : undefined,
        languageCode: effectiveTestLanguage,
        text: testMessageType === "text" ? testText : undefined,
        bodyParams: testMessageType === "template" ? testBodyParams : undefined,
        headerParams: testMessageType === "template" ? testHeaderParams : undefined,
        buttonParams: testMessageType === "template" ? testButtonParams : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Test message sent", description: "Check WhatsApp on the recipient phone." });
    },
    onError: (err: Error) => {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
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
    () => getTemplateDefinition(allTemplates, effectiveTestTemplate, effectiveTestLanguage),
    [allTemplates, effectiveTestTemplate, effectiveTestLanguage],
  );

  useEffect(() => {
    if (testMessageType !== "template") return;
    const meta = getTemplateDefinition(allTemplates, effectiveTestTemplate, effectiveTestLanguage);
    setTestBodyParams(Array(meta?.bodyParamCount ?? 0).fill(""));
    setTestHeaderParams(Array(meta?.headerParamCount ?? 0).fill(""));
    setTestButtonParams(Array(meta?.buttonParamCount ?? 0).fill(""));
  }, [effectiveTestTemplate, effectiveTestLanguage, allTemplates, testMessageType]);

  const paramCountsForValidation = useMemo(
    () => ({
      bodyParamCount:
        selectedTestTemplateMeta?.bodyParamCount ??
        (testBodyParams.length > 0 ? testBodyParams.length : 0),
      headerParamCount:
        selectedTestTemplateMeta?.headerParamCount ??
        (testHeaderParams.length > 0 ? testHeaderParams.length : 0),
      buttonParamCount:
        selectedTestTemplateMeta?.buttonParamCount ??
        (testButtonParams.length > 0 ? testButtonParams.length : 0),
    }),
    [selectedTestTemplateMeta, testBodyParams.length, testHeaderParams.length, testButtonParams.length],
  );

  const templateParamsOk =
    testMessageType !== "template" ||
    templateParamsFilled(paramCountsForValidation, {
      bodyParams: testBodyParams,
      headerParams: testHeaderParams,
      buttonParams: testButtonParams,
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
                  From Meta Business Suite → WhatsApp → API Setup. Use a permanent System User
                  access token with <code className="text-xs">whatsapp_business_messaging</code>{" "}
                  permission.
                </p>

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
                          Required. Also enter WABA ID from Meta API Setup.
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
                          ? `Token saved on server (ends with ${field.value.slice(-4)}). Enter a new value only when rotating.`
                          : "Paste your permanent System User access token, then save."}
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
                        Used when configuring Meta webhooks for delivery receipts and replies.
                      </FormDescription>
                    </FormItem>
                  )}
                />
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
                    placeholder="Recipient phone (with country code, e.g. 919876543210)"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    data-testid="input-test-whatsapp-phone"
                  />

                  <Tabs
                    value={testMessageType}
                    onValueChange={(v) => setTestMessageType(v as "template" | "text")}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="text">Custom text</TabsTrigger>
                      <TabsTrigger value="template">Template</TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="space-y-3 mt-3">
                      <Textarea
                        placeholder="Type your test message..."
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        rows={4}
                        data-testid="input-test-whatsapp-text"
                      />
                      <p className="text-xs text-muted-foreground">
                        Custom text only delivers if the recipient messaged your business number in
                        the last 24 hours, or during Meta&apos;s test/sandbox window. Otherwise use
                        a template.
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
                                ? `Synced template expects ${selectedTestTemplateMeta.headerParamCount} header, ${selectedTestTemplateMeta.bodyParamCount} body, ${selectedTestTemplateMeta.buttonParamCount} button parameter(s).`
                                : "Add parameter values matching your template placeholders ({{1}}, {{2}}, …). Re-sync templates to auto-detect counts."}
                            </p>
                          </div>
                          <TemplateParameterFields
                            label="Header"
                            params={testHeaderParams}
                            minCount={selectedTestTemplateMeta?.headerParamCount ?? 0}
                            onChange={setTestHeaderParams}
                          />
                          <TemplateParameterFields
                            label="Body"
                            params={testBodyParams}
                            minCount={selectedTestTemplateMeta?.bodyParamCount ?? 0}
                            onChange={setTestBodyParams}
                          />
                          <TemplateParameterFields
                            label="Button (URL)"
                            params={testButtonParams}
                            minCount={selectedTestTemplateMeta?.buttonParamCount ?? 0}
                            onChange={setTestButtonParams}
                          />
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
  onChange,
}: {
  label: string;
  params: string[];
  minCount: number;
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
            placeholder={`Value for {{${i + 1}}}`}
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
