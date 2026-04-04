import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Scale,
  CreditCard,
  Truck,
  Loader2,
  Sparkles,
  Camera,
  Upload,
  Wand2,
  Bot,
  X,
  Mic,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Customer, CourierPartner } from "@shared/schema";

const bookingSchema = z.object({
  customerId: z.string().optional(),
  courierPartnerId: z.string().min(1, "Please select a courier partner"),
  awbNumber: z.string().optional(),
  senderName: z.string().min(1, "Sender name is required"),
  senderPhone: z.string().min(10, "Valid phone number required"),
  senderAddress: z.string().min(1, "Sender address is required"),
  senderCity: z.string().optional(),
  senderState: z.string().optional(),
  senderPincode: z.string().optional(),
  receiverName: z.string().min(1, "Receiver name is required"),
  receiverPhone: z.string().min(10, "Valid phone number required"),
  receiverAddress: z.string().min(1, "Receiver address is required"),
  receiverCity: z.string().optional(),
  receiverState: z.string().optional(),
  receiverPincode: z.string().optional(),
  weight: z.string().min(1, "Weight is required"),
  length: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
  numberOfPieces: z.string().default("1"),
  contentDescription: z.string().optional(),
  declaredValue: z.string().optional(),
  serviceType: z.enum(["air", "surface"]),
  paymentMode: z.enum(["cash", "upi", "bank_transfer", "credit"]),
  manualAmount: z.string().optional(),
  packagePhotoUrls: z.array(z.string()).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function NewBookingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);

  const [smartFillText, setSmartFillText] = useState("");
  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [sectionAiText, setSectionAiText] = useState<Record<string, string>>({ sender: "", receiver: "", package: "", service: "" });
  const [sectionAiLoading, setSectionAiLoading] = useState<Record<string, boolean>>({ sender: false, receiver: false, package: false, service: false });
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [isScanningPhotos, setIsScanningPhotos] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    recommendedPartnerId: string;
    reason: string;
    estimatedCost?: string;
    alternativePartnerId?: string;
    alternativeReason?: string;
  } | null>(null);
  const [packagePhotos, setPackagePhotos] = useState<string[]>([]);

  const [recordingSection, setRecordingSection] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<HTMLInputElement>(null);
  const scanPhotosInputRef = useRef<HTMLInputElement>(null);

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: partners } = useQuery<CourierPartner[]>({
    queryKey: ["/api/partners"],
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceType: "surface",
      paymentMode: "cash",
      numberOfPieces: "1",
      weight: "",
      packagePhotoUrls: [],
    },
  });

  const selectedPartnerId = form.watch("courierPartnerId");
  const serviceType = form.watch("serviceType");
  const weight = form.watch("weight");

  const selectedPartner = partners?.find((p) => p.id === selectedPartnerId);

  const calculatePrice = () => {
    if (!selectedPartner || !weight) return 0;
    const weightNum = parseFloat(weight) || 0;
    const baseRate =
      serviceType === "air"
        ? parseFloat(selectedPartner.baseRateAir || "0")
        : parseFloat(selectedPartner.baseRateSurface || "0");
    const ratePerKg =
      serviceType === "air"
        ? parseFloat(selectedPartner.ratePerKgAir || "0")
        : parseFloat(selectedPartner.ratePerKgSurface || "0");
    return baseRate + weightNum * ratePerKg;
  };

  const updateCalculatedAmount = () => {
    const amount = calculatePrice();
    setCalculatedAmount(amount);
  };

  const handleSmartFill = async () => {
    if (!smartFillText.trim()) return;
    setIsSmartFilling(true);
    try {
      const res = await apiRequest("POST", "/api/ai/smart-fill", {
        description: smartFillText,
        customers: customers || [],
        partners: partners || [],
      });
      const data = await res.json();
      const fieldKeys: (keyof BookingFormData)[] = [
        "customerId", "courierPartnerId", "awbNumber",
        "senderName", "senderPhone", "senderAddress", "senderCity", "senderState", "senderPincode",
        "receiverName", "receiverPhone", "receiverAddress", "receiverCity", "receiverState", "receiverPincode",
        "weight", "length", "width", "height", "numberOfPieces",
        "contentDescription", "declaredValue", "serviceType", "paymentMode",
      ];
      for (const key of fieldKeys) {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
          form.setValue(key, data[key] as any, { shouldValidate: true });
        }
      }
      setTimeout(updateCalculatedAmount, 100);
      toast({ title: "Smart Fill Complete", description: "Form fields have been auto-filled by AI." });
    } catch (error: any) {
      toast({ title: "Smart Fill Failed", description: error.message || "Could not parse the description.", variant: "destructive" });
    } finally {
      setIsSmartFilling(false);
    }
  };

  const handlePackagePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const arr = Array.from(files).slice(0, 5);
    setIsScanningPhotos(true);
    try {
      const images: string[] = [];
      for (const f of arr) {
        images.push(await compressImageFileToDataUrl(f));
      }
      const res = await apiRequest("POST", "/api/ai/scan-package-photos", {
        images,
        customers: customers || [],
        partners: partners || [],
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const raw = await res.text();
        throw new Error(
          raw.trimStart().startsWith("<!DOCTYPE") || raw.trimStart().toLowerCase().startsWith("<html")
            ? "Server returned a web page instead of JSON. Restart the dev server (npm run dev) and try again with smaller photos."
            : raw.slice(0, 240) || "Not a JSON response"
        );
      }
      const data = await res.json();
      const fieldKeys: (keyof BookingFormData)[] = [
        "customerId",
        "courierPartnerId",
        "awbNumber",
        "senderName",
        "senderPhone",
        "senderAddress",
        "senderCity",
        "senderState",
        "senderPincode",
        "receiverName",
        "receiverPhone",
        "receiverAddress",
        "receiverCity",
        "receiverState",
        "receiverPincode",
        "weight",
        "length",
        "width",
        "height",
        "numberOfPieces",
        "contentDescription",
        "declaredValue",
        "serviceType",
        "paymentMode",
      ];
      for (const key of fieldKeys) {
        if (data[key] !== undefined && data[key] !== null && String(data[key]).trim() !== "") {
          form.setValue(key, data[key] as never, { shouldValidate: true });
        }
      }
      if (data.customerId) {
        handleCustomerSelect(String(data.customerId));
      }
      setTimeout(updateCalculatedAmount, 100);
      const note = typeof data.scanNotes === "string" && data.scanNotes.trim() ? data.scanNotes.trim() : "Review and submit when ready.";
      toast({
        title: "Photo scan complete",
        description: note,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not read photos.";
      toast({ title: "Photo scan failed", description: message, variant: "destructive" });
    } finally {
      setIsScanningPhotos(false);
      if (scanPhotosInputRef.current) scanPhotosInputRef.current.value = "";
    }
  };

  const handleSectionAiFill = async (section: string) => {
    const text = sectionAiText[section];
    if (!text?.trim()) return;
    setSectionAiLoading(prev => ({ ...prev, [section]: true }));
    try {
      const body: any = { section, description: text };
      if (section === "sender") body.customers = customers || [];
      if (section === "service") body.partners = partners || [];

      const res = await apiRequest("POST", "/api/ai/section-fill", body);
      const data = await res.json();

      const sectionFields: Record<string, string[]> = {
        sender: ["senderName", "senderPhone", "senderAddress", "senderCity", "senderState", "senderPincode", "customerId"],
        receiver: ["receiverName", "receiverPhone", "receiverAddress", "receiverCity", "receiverState", "receiverPincode"],
        package: ["weight", "length", "width", "height", "numberOfPieces", "contentDescription", "declaredValue"],
        service: ["serviceType", "courierPartnerId", "paymentMode", "awbNumber"],
      };

      let filled = 0;
      for (const key of sectionFields[section] || []) {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
          form.setValue(key as any, String(data[key]), { shouldValidate: true });
          filled++;
        }
      }

      if (section === "sender" && data.customerId) {
        handleCustomerSelect(data.customerId);
      }
      if (section === "package" || section === "service") {
        setTimeout(updateCalculatedAmount, 100);
      }

      toast({ title: "AI Filled", description: `${filled} field(s) auto-filled.` });
      setSectionAiText(prev => ({ ...prev, [section]: "" }));
    } catch (error: any) {
      toast({ title: "AI Error", description: error.message || "Could not process", variant: "destructive" });
    } finally {
      setSectionAiLoading(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleVoiceRecord = async (section: string) => {
    if (recordingSection === section) {
      mediaRecorderRef.current?.stop();
      setRecordingSection(null);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await apiRequest("POST", "/api/ai/transcribe", { audio: base64 });
            const data = await res.json();
            if (data.text) {
              setSectionAiText(prev => ({ ...prev, [section]: data.text }));
              toast({ title: "Voice captured", description: "Your speech has been transcribed. Press the fill button to apply." });
            }
          } catch (err: any) {
            toast({ title: "Transcription failed", description: err.message || "Could not transcribe audio", variant: "destructive" });
          }
        };
        reader.readAsDataURL(blob);
      };

      setRecordingSection(section);
      mediaRecorder.start();

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setRecordingSection(null);
        }
      }, 15000);
    } catch (err) {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to use voice input", variant: "destructive" });
    }
  };

  const handleSmartFillVoice = async () => {
    if (recordingSection === "smartfill") {
      mediaRecorderRef.current?.stop();
      setRecordingSection(null);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await apiRequest("POST", "/api/ai/transcribe", { audio: base64 });
            const data = await res.json();
            if (data.text) {
              setSmartFillText(data.text);
              toast({ title: "Voice captured", description: "Your speech has been transcribed. Press the fill button to apply." });
            }
          } catch (err: any) {
            toast({ title: "Transcription failed", description: err.message || "Could not transcribe audio", variant: "destructive" });
          }
        };
        reader.readAsDataURL(blob);
      };
      setRecordingSection("smartfill");
      mediaRecorder.start();
      setTimeout(() => { if (mediaRecorder.state === 'recording') { mediaRecorder.stop(); setRecordingSection(null); } }, 15000);
    } catch (err) {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to use voice input", variant: "destructive" });
    }
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsMeasuring(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await apiRequest("POST", "/api/ai/measure-package", { imageBase64: base64 });
      const data = await res.json();
      if (data.length) form.setValue("length", String(data.length), { shouldValidate: true });
      if (data.width) form.setValue("width", String(data.width), { shouldValidate: true });
      if (data.height) form.setValue("height", String(data.height), { shouldValidate: true });
      if (data.estimatedWeight) form.setValue("weight", String(data.estimatedWeight), { shouldValidate: true });
      if (data.contentDescription) form.setValue("contentDescription", data.contentDescription, { shouldValidate: true });
      setTimeout(updateCalculatedAmount, 100);
      const confidenceText = data.confidence ? ` (${Math.round(data.confidence * 100)}% confidence)` : "";
      toast({ title: "Package Measured", description: `Dimensions auto-filled from photo.${confidenceText}` });
    } catch (error: any) {
      toast({ title: "Measurement Failed", description: error.message || "Could not measure package from photo.", variant: "destructive" });
    } finally {
      setIsMeasuring(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = 3 - packagePhotos.length;
    if (remaining <= 0) {
      toast({ title: "Limit Reached", description: "Maximum 3 photos allowed.", variant: "destructive" });
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remaining);
    setIsUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of filesToUpload) {
        const urlRes = await apiRequest("POST", "/api/uploads/request-url", {
          name: file.name,
          size: file.size,
          contentType: file.type,
        });
        const { uploadURL, objectPath } = await urlRes.json();
        await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        newUrls.push(objectPath);
      }
      const updated = [...packagePhotos, ...newUrls];
      setPackagePhotos(updated);
      form.setValue("packagePhotoUrls", updated);
      toast({ title: "Photos Uploaded", description: `${newUrls.length} photo(s) uploaded successfully.` });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message || "Could not upload photos.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (photoUploadRef.current) photoUploadRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    const updated = packagePhotos.filter((_, i) => i !== index);
    setPackagePhotos(updated);
    form.setValue("packagePhotoUrls", updated);
  };

  const handleAiRecommend = async () => {
    const senderCity = form.getValues("senderCity");
    const receiverCity = form.getValues("receiverCity");
    const currentWeight = form.getValues("weight");
    const currentServiceType = form.getValues("serviceType");
    const contentDescription = form.getValues("contentDescription");

    if (!partners || partners.length === 0) {
      toast({ title: "No Partners", description: "Add courier partners first.", variant: "destructive" });
      return;
    }

    setIsRecommending(true);
    setRecommendation(null);
    try {
      const res = await apiRequest("POST", "/api/ai/recommend-courier", {
        senderCity: senderCity || "",
        receiverCity: receiverCity || "",
        weight: currentWeight || "0",
        serviceType: currentServiceType,
        contentDescription: contentDescription || "",
        partners: partners,
      });
      const data = await res.json();
      setRecommendation(data);
    } catch (error: any) {
      toast({ title: "Recommendation Failed", description: error.message || "Could not get AI recommendation.", variant: "destructive" });
    } finally {
      setIsRecommending(false);
    }
  };

  const acceptRecommendation = (partnerId: string) => {
    form.setValue("courierPartnerId", partnerId, { shouldValidate: true });
    setTimeout(updateCalculatedAmount, 100);
    setRecommendation(null);
    toast({ title: "Partner Selected", description: "Courier partner updated from AI recommendation." });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /** Resize + JPEG compress to stay under JSON limits and speed up vision API. */
  async function compressImageFileToDataUrl(file: File, maxWidth = 1600, quality = 0.82): Promise<string> {
    const bitmap = await createImageBitmap(file);
    try {
      let w = bitmap.width;
      let h = bitmap.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");
      ctx.drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL("image/jpeg", quality);
    } finally {
      bitmap.close();
    }
  }

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const amount = data.manualAmount ? parseFloat(data.manualAmount) : calculatePrice();
      const payload = {
        ...data,
        weight: data.weight,
        length: data.length || null,
        width: data.width || null,
        height: data.height || null,
        numberOfPieces: parseInt(data.numberOfPieces) || 1,
        declaredValue: data.declaredValue || null,
        totalAmount: amount.toString(),
        baseAmount: amount.toString(),
        packagePhotoUrls: data.packagePhotoUrls || [],
      };
      return apiRequest("POST", "/api/shipments", payload);
    },
    onSuccess: () => {
      toast({
        title: "Booking Created",
        description: "Shipment has been booked successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setLocation("/shipments");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    createBookingMutation.mutate(data);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers?.find((c) => c.id === customerId);
    if (customer) {
      form.setValue("senderName", customer.name);
      form.setValue("senderPhone", customer.phone);
      form.setValue("senderAddress", customer.address || "");
      form.setValue("senderCity", customer.city || "");
      form.setValue("senderState", customer.state || "");
      form.setValue("senderPincode", customer.pincode || "");
      if (customer.paymentType === "credit") {
        form.setValue("paymentMode", "credit");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/shipments")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Booking</h1>
          <p className="text-muted-foreground">Create a new shipment</p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Smart Fill</span>
            <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">AI</Badge>
          </div>
          <div className="flex gap-2">
            <Input
              value={smartFillText}
              onChange={(e) => setSmartFillText(e.target.value)}
              placeholder='e.g. "Send 5kg parcel from Raj Kumar 9876543210 to Amit Sharma 9123456789 in Delhi by air via DTDC"'
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSmartFill(); } }}
              data-testid="input-smart-fill"
            />
            <Button type="button" size="icon" variant="ghost" onClick={handleSmartFillVoice} data-testid="button-mic-smartfill" className={recordingSection === "smartfill" ? "text-red-500" : ""}>
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={handleSmartFill}
              disabled={isSmartFilling || !smartFillText.trim()}
              data-testid="button-smart-fill"
            >
              {isSmartFilling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed border-primary/30 bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Scan package photos (AI)</span>
                <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">
                  Vision
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground max-w-xl">
                Photograph the parcel, shipping label, or handwritten From / To addresses. AI reads the images and fills
                sender, receiver, package, and service fields—then review before submitting.
              </p>
            </div>
            <div className="shrink-0 flex gap-2">
              <input
                ref={scanPhotosInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePackagePhotoScan}
                data-testid="input-scan-package-photos"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={isScanningPhotos}
                onClick={() => scanPhotosInputRef.current?.click()}
                data-testid="button-scan-package-photos"
              >
                {isScanningPhotos ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning…
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Choose photos
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Sender Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4 pb-3 border-b border-dashed">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <Input
                    value={sectionAiText.sender}
                    onChange={(e) => setSectionAiText(prev => ({ ...prev, sender: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSectionAiFill("sender"); } }}
                    placeholder='e.g. Raj Kumar, 9876543210, MG Road Bangalore (any language)'
                    className="text-sm"
                    disabled={sectionAiLoading.sender}
                    data-testid="input-ai-sender"
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleVoiceRecord("sender")} data-testid="button-mic-sender" className={recordingSection === "sender" ? "text-red-500" : ""}>
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSectionAiFill("sender")}
                    disabled={sectionAiLoading.sender || !sectionAiText.sender?.trim()}
                    data-testid="button-ai-sender"
                  >
                    {sectionAiLoading.sender ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Customer (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleCustomerSelect(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Walk-in Customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Sender name" data-testid="input-sender-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="10-digit phone" data-testid="input-sender-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="senderAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Full address" className="resize-none" data-testid="input-sender-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="senderCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City" data-testid="input-sender-city" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="State" data-testid="input-sender-state" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderPincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Pincode" data-testid="input-sender-pincode" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Receiver Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4 pb-3 border-b border-dashed">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <Input
                    value={sectionAiText.receiver}
                    onChange={(e) => setSectionAiText(prev => ({ ...prev, receiver: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSectionAiFill("receiver"); } }}
                    placeholder='e.g. Amit Sharma ko Delhi 110001 bhejo (any language)'
                    className="text-sm"
                    disabled={sectionAiLoading.receiver}
                    data-testid="input-ai-receiver"
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleVoiceRecord("receiver")} data-testid="button-mic-receiver" className={recordingSection === "receiver" ? "text-red-500" : ""}>
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSectionAiFill("receiver")}
                    disabled={sectionAiLoading.receiver || !sectionAiText.receiver?.trim()}
                    data-testid="button-ai-receiver"
                  >
                    {sectionAiLoading.receiver ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="receiverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Receiver name" data-testid="input-receiver-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiverPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="10-digit phone" data-testid="input-receiver-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="receiverAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Full address" className="resize-none" data-testid="input-receiver-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="receiverCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City" data-testid="input-receiver-city" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiverState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="State" data-testid="input-receiver-state" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiverPincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Pincode" data-testid="input-receiver-pincode" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="h-4 w-4" />
                  Package Details
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">AI</Badge>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraCapture}
                    data-testid="input-camera-capture"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isMeasuring}
                    data-testid="button-scan-package"
                  >
                    {isMeasuring ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Camera className="mr-1 h-3 w-3" />
                    )}
                    Scan Package
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4 pb-3 border-b border-dashed">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <Input
                    value={sectionAiText.package}
                    onChange={(e) => setSectionAiText(prev => ({ ...prev, package: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSectionAiFill("package"); } }}
                    placeholder='e.g. 5 kilo electronics, value 10000 (any language)'
                    className="text-sm"
                    disabled={sectionAiLoading.package}
                    data-testid="input-ai-package"
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleVoiceRecord("package")} data-testid="button-mic-package" className={recordingSection === "package" ? "text-red-500" : ""}>
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSectionAiFill("package")}
                    disabled={sectionAiLoading.package || !sectionAiText.package?.trim()}
                    data-testid="button-ai-package"
                  >
                    {sectionAiLoading.package ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg) *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.1"
                            placeholder="0.5"
                            onChange={(e) => {
                              field.onChange(e);
                              setTimeout(updateCalculatedAmount, 100);
                            }}
                            data-testid="input-weight"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numberOfPieces"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. of Pieces</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" data-testid="input-pieces" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Length (cm)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="L" data-testid="input-length" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Width (cm)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="W" data-testid="input-width" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="H" data-testid="input-height" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="contentDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Documents, Electronics" data-testid="input-content" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="declaredValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Declared Value (Rs.)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0" data-testid="input-declared-value" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Package Photos</span>
                    <span className="text-xs text-muted-foreground">({packagePhotos.length}/3)</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {packagePhotos.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="w-20 h-20 rounded-md border overflow-visible bg-muted flex items-center justify-center">
                          <img
                            src={url}
                            alt={`Package photo ${index + 1}`}
                            className="w-full h-full object-cover rounded-md"
                            data-testid={`img-package-photo-${index}`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                          onClick={() => removePhoto(index)}
                          data-testid={`button-remove-photo-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {packagePhotos.length < 3 && (
                      <>
                        <input
                          ref={photoUploadRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handlePhotoUpload}
                          data-testid="input-photo-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-20 h-20"
                          onClick={() => photoUploadRef.current?.click()}
                          disabled={isUploading}
                          data-testid="button-upload-photo"
                        >
                          {isUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <Upload className="h-4 w-4" />
                              <span className="text-[10px]">Add</span>
                            </div>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" />
                  Service & Partner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4 pb-3 border-b border-dashed">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <Input
                    value={sectionAiText.service}
                    onChange={(e) => setSectionAiText(prev => ({ ...prev, service: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSectionAiFill("service"); } }}
                    placeholder='e.g. DTDC se air express, UPI payment (any language)'
                    className="text-sm"
                    disabled={sectionAiLoading.service}
                    data-testid="input-ai-service"
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleVoiceRecord("service")} data-testid="button-mic-service" className={recordingSection === "service" ? "text-red-500" : ""}>
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSectionAiFill("service")}
                    disabled={sectionAiLoading.service || !sectionAiText.service?.trim()}
                    data-testid="button-ai-service"
                  >
                    {sectionAiLoading.service ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name="courierPartnerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Courier Partner *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setTimeout(updateCalculatedAmount, 100);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-partner">
                            <SelectValue placeholder="Select partner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {partners?.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.name} ({partner.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setTimeout(updateCalculatedAmount, 100);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-service-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="surface">Surface (Standard)</SelectItem>
                          <SelectItem value="air">Air (Express)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="awbNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AWB Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Auto-generated or manual entry" data-testid="input-awb" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">AI Courier Recommendation</span>
                    <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">AI</Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAiRecommend}
                    disabled={isRecommending}
                    data-testid="button-ai-recommend"
                  >
                    {isRecommending ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1 h-3 w-3" />
                        Get AI Recommendation
                      </>
                    )}
                  </Button>
                  {recommendation && (
                    <div className="mt-3 space-y-2">
                      {(() => {
                        const recommended = partners?.find((p) => p.id === recommendation.recommendedPartnerId);
                        return recommended ? (
                          <div className="rounded-md border p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{recommended.name}</span>
                                <Badge variant="default" className="text-[10px]">Recommended</Badge>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => acceptRecommendation(recommendation.recommendedPartnerId)}
                                data-testid="button-accept-recommendation"
                              >
                                Accept
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{recommendation.reason}</p>
                            {recommendation.estimatedCost && (
                              <p className="text-xs text-muted-foreground">Est. cost: Rs. {recommendation.estimatedCost}</p>
                            )}
                          </div>
                        ) : null;
                      })()}
                      {(() => {
                        const alt = recommendation.alternativePartnerId
                          ? partners?.find((p) => p.id === recommendation.alternativePartnerId)
                          : null;
                        return alt ? (
                          <div className="rounded-md border border-dashed p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{alt.name}</span>
                                <Badge variant="outline" className="text-[10px]">Alternative</Badge>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => acceptRecommendation(recommendation.alternativePartnerId!)}
                                data-testid="button-accept-alternative"
                              >
                                Use Instead
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{recommendation.alternativeReason}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-mode">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel>Calculated Amount</FormLabel>
                  <div className="mt-2 text-2xl font-bold text-primary">
                    Rs. {calculatePrice().toFixed(2)}
                  </div>
                  {selectedPartner && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Base: Rs. {serviceType === "air" ? selectedPartner.baseRateAir : selectedPartner.baseRateSurface} +
                      Rs. {serviceType === "air" ? selectedPartner.ratePerKgAir : selectedPartner.ratePerKgSurface}/kg
                    </p>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="manualAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Override Amount (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="Leave blank to use calculated" data-testid="input-manual-amount" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/shipments")} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" disabled={createBookingMutation.isPending} data-testid="button-create-booking">
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Create Booking
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
