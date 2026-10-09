import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearch } from "wouter";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { stopMediaStream } from "@/lib/connected-cameras";

const MAX_PHOTOS = 3;

export default function BookingCameraPage() {
  const params = useParams<{ draftId?: string }>();
  const search = useSearch();
  const draftId = params.draftId || "";
  const token = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("token") || "";
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const remaining = MAX_PHOTOS - photos.length;

  const loadPhotos = useCallback(async () => {
    const res = await fetch(
      `/api/public/booking-camera/${encodeURIComponent(draftId)}?token=${encodeURIComponent(token)}`,
    );
    if (!res.ok) throw new Error("This camera session is not available. Open New Booking on the Hub computer.");
    const data = (await res.json()) as { photos?: string[] };
    setPhotos(Array.isArray(data.photos) ? data.photos : []);
  }, [draftId, token]);

  useEffect(() => {
    if (!draftId || !token) {
      setError("Open this camera page from the Hub New Booking screen.");
      return;
    }
    let cancelled = false;
    const start = async () => {
      try {
        await loadPhotos();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stopMediaStream(stream);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not open the phone camera.");
      }
    };
    void start();
    return () => {
      cancelled = true;
      stopMediaStream(streamRef.current);
    };
  }, [draftId, token, loadPhotos]);

  const snap = async () => {
    const video = videoRef.current;
    if (!video || remaining <= 0) return;
    setBusy(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not capture the photo.");
      context.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Could not capture the photo.");
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not read the photo."));
        reader.readAsDataURL(blob);
      });
      const res = await fetch(
        `/api/public/booking-camera/${encodeURIComponent(draftId)}/photos?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64 }),
        },
      );
      const data = (await res.json()) as { photos?: string[]; message?: string };
      if (!res.ok) throw new Error(data.message || "Could not save the photo to this booking.");
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the photo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white">
      <header className="px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-[#FF4907]">{XGOO_MODULES.hub.name}</p>
        <h1 className="text-lg font-semibold">Package camera</h1>
        <p className="text-xs text-white/70">{photos.length}/{MAX_PHOTOS} photos on this booking</p>
      </header>
      <div className="relative min-h-0 flex-1 bg-zinc-900">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
      </div>
      {error ? <p className="px-4 py-2 text-sm text-red-300">{error}</p> : null}
      <div className="flex items-center justify-center gap-4 px-4 py-5">
        {remaining <= 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Photos are on the Hub booking.
          </p>
        ) : (
          <Button
            type="button"
            className="h-16 w-16 rounded-full bg-[#FF4907] hover:bg-[#e03f06]"
            onClick={() => void snap()}
            disabled={busy}
            data-testid="button-phone-snap-package"
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
          </Button>
        )}
      </div>
    </div>
  );
}
