const CARD_W = 1080;
const CARD_H = 1080;
const ORANGE = "#FF4907";

function isSameOriginSrc(src: string) {
  if (src.startsWith("/") || src.startsWith("blob:") || src.startsWith("data:")) return true;
  try {
    return new URL(src, window.location.origin).origin === window.location.origin;
  } catch {
    return true;
  }
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    if (!isSameOriginSrc(src)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  size: number,
  fallback: string,
) {
  roundRect(ctx, x, y, size, size, 28);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  if (image) {
    ctx.save();
    roundRect(ctx, x + 10, y + 10, size - 20, size - 20, 18);
    ctx.clip();
    ctx.drawImage(image, x + 10, y + 10, size - 20, size - 20);
    ctx.restore();
    return;
  }
  ctx.fillStyle = ORANGE;
  ctx.font = "700 42px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(fallback, x + size / 2, y + size / 2 + 2);
}

export async function buildStoreShareCard(input: {
  storeName: string;
  storeLogoUrl?: string | null;
  xgooLogoUrl: string;
}): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const [storeLogo, xgooLogo] = await Promise.all([
    input.storeLogoUrl ? loadImage(input.storeLogoUrl) : Promise.resolve(null),
    loadImage(input.xgooLogoUrl),
  ]);

  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(0, 0, CARD_W, 18);

  const logoSize = 220;
  const gap = 36;
  const pairWidth = logoSize * 2 + gap;
  const startX = (CARD_W - pairWidth) / 2;
  const logoY = 250;
  drawLogo(ctx, storeLogo, startX, logoY, logoSize, input.storeName.slice(0, 2).toUpperCase());
  drawLogo(ctx, xgooLogo, startX + logoSize + gap, logoY, logoSize, "XG");

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.font = "800 54px Inter, system-ui, sans-serif";
  ctx.fillText(input.storeName.slice(0, 42), CARD_W / 2, 560);
  ctx.fillStyle = "#A1A1AA";
  ctx.font = "600 28px Inter, system-ui, sans-serif";
  ctx.fillText("Delivery with XGoo", CARD_W / 2, 610);
  ctx.fillStyle = ORANGE;
  ctx.font = "700 26px Inter, system-ui, sans-serif";
  ctx.fillText("Add your delivery address", CARD_W / 2, 820);

  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export async function shareProCustomerLink(input: {
  url: string;
  storeName: string;
  storeLogoUrl?: string | null;
  xgooLogoUrl: string;
  via?: string;
}): Promise<"shared" | "copied"> {
  const text = `Please add your delivery address for your order from ${input.storeName}.\n\n${input.url}`;
  const card = await buildStoreShareCard(input).catch(() => null);
  const file =
    card && typeof File !== "undefined"
      ? new File([card], `${input.storeName.replace(/[^\w]+/g, "-")}-xgoo.png`, { type: "image/png" })
      : null;

  if (file && typeof navigator.share === "function") {
    const payload: ShareData = { title: input.storeName, text, url: input.url };
    const withFile = { ...payload, files: [file] };
    try {
      if (typeof navigator.canShare === "function" && navigator.canShare(withFile)) {
        await navigator.share(withFile);
        return "shared";
      }
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") return "copied";
    }
  }

  if (file && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": file })]);
    } catch {
      /* text copy below still sends the link */
    }
  }
  await navigator.clipboard.writeText(input.url);
  if (input.via === "whatsapp") {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }
  return "copied";
}
