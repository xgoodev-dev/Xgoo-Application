import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Smartphone, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getAuthHeaders } from "@/lib/queryClient";
import {
  listVideoInputDevices,
  pickPreferredCamera,
  releaseThenOpenVideoStream,
  stopMediaStream,
  type VideoInputDevice,
} from "@/lib/connected-cameras";

type PackagePhotoCaptureProps = {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
};

async function uploadImageFile(file: File): Promise<string> {
  const urlRes = await apiRequest("POST", "/api/uploads/request-url", {
    name: file.name,
    size: file.size,
    contentType: file.type || "image/jpeg",
  });
  const { uploadURL, objectPath } = (await urlRes.json()) as {
    uploadURL: string;
    objectPath: string;
  };
  const authHeaders = await getAuthHeaders();
  const putRes = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    credentials: "include",
    headers: { "Content-Type": file.type || "image/jpeg", ...authHeaders },
  });
  if (!putRes.ok) throw new Error("Failed to upload photo");
  const putData = (await putRes.json()) as { objectPath?: string };
  return putData.objectPath || objectPath;
}

function blobToFile(blob: Blob, name: string) {
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

export function PackagePhotoCapture({
  photos,
  onChange,
  maxPhotos = 3,
}: PackagePhotoCaptureProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [devices, setDevices] = useState<VideoInputDevice[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [startingCamera, setStartingCamera] = useState(false);
  const [cameraLink, setCameraLink] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photosRef = useRef(photos);
  const seenDraftPhotosRef = useRef(new Set<string>());
  photosRef.current = photos;

  const remaining = maxPhotos - photos.length;

  const mergePhotos = useCallback(
    (urls: string[]) => {
      const current = photosRef.current;
      const next = [...current];
      for (const url of urls) {
        if (!next.includes(url) && next.length < maxPhotos) next.push(url);
      }
      if (next.length !== current.length) onChange(next);
    },
    [maxPhotos, onChange],
  );

  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).slice(0, Math.max(0, maxPhotos - photosRef.current.length));
      if (files.length === 0) {
        toast({ title: "Limit reached", description: `Maximum ${maxPhotos} photos allowed.` });
        return;
      }
      setIsUploading(true);
      try {
        const urls: string[] = [];
        for (const file of files) {
          urls.push(await uploadImageFile(file));
        }
        mergePhotos(urls);
        toast({
          title: "Photos added",
          description: `${urls.length} package photo(s) attached to this booking.`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Could not upload photos.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (phoneInputRef.current) phoneInputRef.current.value = "";
      }
    },
    [maxPhotos, mergePhotos, toast],
  );

  useEffect(() => {
    let cancelled = false;
    let draftId = "";
    let token = "";
    const start = async () => {
      try {
        const res = await apiRequest("POST", "/api/booking-camera-drafts");
        const data = (await res.json()) as { id: string; token: string };
        if (cancelled) return;
        draftId = data.id;
        token = data.token;
        setCameraLink(`${window.location.origin}/bookings/camera/${data.id}?token=${encodeURIComponent(data.token)}`);
      } catch {
        return;
      }
    };
    void start();
    const timer = window.setInterval(async () => {
      if (!draftId || !token) return;
      try {
        const res = await fetch(
          `/api/public/booking-camera/${draftId}?token=${encodeURIComponent(token)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { photos?: string[] };
        if (!Array.isArray(data.photos)) return;
        const incoming = data.photos.filter((url) => {
          if (seenDraftPhotosRef.current.has(url)) return false;
          seenDraftPhotosRef.current.add(url);
          return true;
        });
        if (incoming.length) mergePhotos(incoming);
      } catch {
        /* keep polling while the booking is open */
      }
    }, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [mergePhotos]);

  const stopCamera = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const attachStream = useCallback(async (stream: MediaStream) => {
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play().catch(() => undefined);
  }, []);

  const startStream = useCallback(
    async (nextDeviceId?: string) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast({
          title: "Camera not available",
          description: "Use Open on staff phone, or upload photos from this computer.",
          variant: "destructive",
        });
        return;
      }
      setStartingCamera(true);
      try {
        const stream = await releaseThenOpenVideoStream(streamRef.current, nextDeviceId);
        streamRef.current = stream;
        await new Promise((resolve) => window.setTimeout(resolve, 50));
        await attachStream(stream);
        const listed = await listVideoInputDevices();
        setDevices(listed);
        const activeId = stream.getVideoTracks()[0]?.getSettings().deviceId || "";
        const preferred = pickPreferredCamera(listed);
        if (
          !nextDeviceId &&
          preferred &&
          activeId &&
          preferred.deviceId !== activeId &&
          preferred.score >= 100
        ) {
          const switched = await releaseThenOpenVideoStream(stream, preferred.deviceId);
          await attachStream(switched);
          setDeviceId(preferred.deviceId);
          return;
        }
        setDeviceId(activeId || preferred?.deviceId || nextDeviceId || "");
      } catch (error) {
        stopCamera();
        toast({
          title: "Could not open camera",
          description:
            error instanceof Error
              ? error.message
              : "Unplug and reconnect the phone, close other camera apps, then try Phone camera again.",
          variant: "destructive",
        });
      } finally {
        setStartingCamera(false);
      }
    },
    [attachStream, stopCamera, toast],
  );

  const startStreamRef = useRef(startStream);
  startStreamRef.current = startStream;

  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return;
    }
    void startStreamRef.current();
    const onDeviceChange = () => {
      void listVideoInputDevices().then((listed) => {
        setDevices(listed);
        const preferred = pickPreferredCamera(listed);
        const activeId = streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId;
        if (preferred && preferred.score >= 100 && activeId && preferred.deviceId !== activeId) {
          setDeviceId(preferred.deviceId);
          void startStreamRef.current(preferred.deviceId);
        }
      });
    };
    navigator.mediaDevices?.addEventListener?.("devicechange", onDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", onDeviceChange);
      stopCamera();
    };
  }, [cameraOpen, stopCamera]);

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return;
    await addFiles([blobToFile(blob, `package-${Date.now()}.jpg`)]);
    if (photosRef.current.length >= maxPhotos) setCameraOpen(false);
  };

  const copyPhoneLink = async () => {
    if (!cameraLink) return;
    try {
      await navigator.clipboard.writeText(cameraLink);
      toast({
        title: "Staff phone camera link copied",
        description: "Open this on the Hub phone to photograph the parcel. Photos appear on this booking.",
      });
    } catch {
      toast({ title: "Copy the camera link", description: cameraLink });
    }
  };

  return (
    <div className="border-t pt-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Package Photos</span>
        <span className="text-xs text-muted-foreground">
          ({photos.length}/{maxPhotos})
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Connect the staff phone with USB or Continuity Camera / Bluetooth, then tap Phone camera.
        Photos attach to this booking immediately.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {photos.map((url, index) => (
          <div key={url} className="relative group">
            <div className="flex h-20 w-20 items-center justify-center overflow-visible rounded-md border bg-muted">
              <img
                src={url}
                alt={`Package photo ${index + 1}`}
                className="h-full w-full rounded-md object-cover"
                data-testid={`img-package-photo-${index}`}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-5 w-5 rounded-full"
              onClick={() => onChange(photos.filter((_, i) => i !== index))}
              data-testid={`button-remove-photo-${index}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {remaining > 0 && (
          <>
            <input
              ref={phoneInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                if (event.target.files) void addFiles(event.target.files);
              }}
              data-testid="input-package-phone-camera"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) void addFiles(event.target.files);
              }}
              data-testid="input-photo-upload"
            />
            <Button
              type="button"
              variant="outline"
              className="h-20 w-28"
              disabled={isUploading}
              onClick={() => setCameraOpen(true)}
              data-testid="button-phone-camera"
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-[10px] leading-tight">Phone camera</span>
                </div>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-20 w-20"
              disabled={isUploading}
              onClick={() => phoneInputRef.current?.click()}
              data-testid="button-take-photo"
            >
              <div className="flex flex-col items-center gap-1">
                <Camera className="h-4 w-4" />
                <span className="text-[10px]">Take</span>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-20 w-20"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
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

      <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Photograph this booking</DialogTitle>
            <DialogDescription>
              Use the connected staff phone camera, or open the same camera page on the phone.
              Each snap is saved on this in-process booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {devices.length > 1 ? (
              <Select
                value={deviceId}
                onValueChange={(value) => {
                  setDeviceId(value);
                  void startStream(value);
                }}
              >
                <SelectTrigger data-testid="select-camera-device">
                  <SelectValue placeholder="Choose camera" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                      {device.score >= 100 ? " · phone / USB" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <div className="relative overflow-hidden rounded-md border bg-black">
              <video
                ref={(node) => {
                  videoRef.current = node;
                  if (node && streamRef.current && node.srcObject !== streamRef.current) {
                    node.srcObject = streamRef.current;
                    node.muted = true;
                    node.playsInline = true;
                    void node.play().catch(() => undefined);
                  }
                }}
                className="aspect-video w-full bg-black object-cover"
                playsInline
                muted
                autoPlay
              />
              {startingCamera ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening camera…
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void captureFrame()}
                disabled={isUploading || remaining <= 0}
                data-testid="button-capture-package-photo"
              >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                Snap photo
              </Button>
              <Button type="button" variant="outline" onClick={() => void copyPhoneLink()} disabled={!cameraLink}>
                Open on staff phone
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              If the phone is connected as a camera, pick it in the list above. Otherwise copy the staff
              phone link and open it on that handset — shots still land on this booking.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
