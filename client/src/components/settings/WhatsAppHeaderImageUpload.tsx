import { useRef } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpload } from "@/hooks/use-upload";
import { resolvePublicObjectUrl, normalizePublicAppBaseUrl } from "@shared/whatsapp";

type WhatsAppHeaderImageUploadProps = {
  objectPath: string;
  publicBaseUrl?: string;
  onPathChange: (path: string) => void;
  label?: string;
  description?: string;
  testId?: string;
};

export function WhatsAppHeaderImageUpload({
  objectPath,
  publicBaseUrl,
  onPathChange,
  label = "Header image",
  description,
  testId = "whatsapp-header-image-upload",
}: WhatsAppHeaderImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = resolvePublicObjectUrl(objectPath, publicBaseUrl);

  const { uploadFile, isUploading, error } = useUpload({
    onSuccess: (response) => {
      onPathChange(response.objectPath);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    await uploadFile(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3" data-testid={testId}>
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>

      {previewUrl ? (
        <div className="flex items-start gap-3 rounded-lg border p-3">
          <img
            src={previewUrl}
            alt="WhatsApp header preview"
            className="h-20 w-auto max-w-[200px] rounded border object-contain bg-muted"
          />
          <div className="flex flex-1 flex-col gap-2 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{objectPath}</p>
            {publicBaseUrl && previewUrl.startsWith("http") && (
              <p className="text-xs text-green-700 dark:text-green-400 truncate">
                Meta URL: {previewUrl}
              </p>
            )}
            {!publicBaseUrl && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Set Public app URL below so Meta can fetch this image over HTTPS.
              </p>
            )}
            {publicBaseUrl &&
              typeof window !== "undefined" &&
              window.location.origin !== normalizePublicAppBaseUrl(publicBaseUrl) && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Upload saves files on this server ({window.location.origin}), but Public app URL
                  is {publicBaseUrl}. Meta may not find the image — use Header image URL with a CDN
                  link instead.
                </p>
              )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="mr-1 h-3 w-3" />
                )}
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onPathChange("")}
              >
                <X className="mr-1 h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Upload a PNG or JPG for template image headers (e.g. welcome_message).
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload image
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
