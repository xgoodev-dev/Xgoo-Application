import { fileToBase64, type TariffUploadPayload } from "@/lib/queryClient";

export const TARIFF_UPLOAD_ACCEPT =
  ".csv,.xlsx,.xls,.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif";

export function isTariffImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif|tiff?)$/i.test(file.name);
}

async function compressTariffImage(file: File, maxWidth = 2400, quality = 0.88): Promise<File> {
  if (!isTariffImageFile(file)) return file;
  try {
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
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (!blob) return file;
      const base = file.name.replace(/\.[^.]+$/, "") || "tariff-photo";
      return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}

export function fileFromBase64(fileName: string, base64: string, mime = "text/csv"): File {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mime });
}

export async function buildTariffUploadPayloadFromFiles(
  files: File[],
  meta: Omit<TariffUploadPayload, "fileName" | "fileData" | "extraFiles">,
): Promise<TariffUploadPayload> {
  const prepared = await Promise.all(files.slice(0, 4).map((file) => compressTariffImage(file)));
  const [first, ...rest] = prepared;
  if (!first) {
    throw new Error("Choose a CSV, Excel, or photo of the rate card.");
  }
  const extraFiles = rest.length
    ? await Promise.all(
        rest.map(async (file) => ({
          fileName: file.name,
          fileData: await fileToBase64(file),
        })),
      )
    : undefined;
  return {
    ...meta,
    fileName: first.name,
    fileData: await fileToBase64(first),
    extraFiles,
  };
}
