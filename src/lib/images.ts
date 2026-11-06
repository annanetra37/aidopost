// Server-side image processing with sharp: normalise uploads, resize, crop, watermark.
import sharp, { type Metadata } from "sharp";
import heicConvert from "heic-convert";
import type { AspectRatio } from "./plans";

export const UPLOAD_RULES = {
  maxBytes: 15 * 1024 * 1024,
  minShortSide: 600,
  types: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
};

export class ImageValidationError extends Error {
  constructor(public code: "TOO_LARGE" | "BAD_TYPE" | "TOO_SMALL" | "UNREADABLE") {
    super(code);
  }
}

function looksLikeHeic(buf: Buffer) {
  const brand = buf.subarray(4, 12).toString("ascii");
  return (
    brand.startsWith("ftyp") &&
    /heic|heix|hevc|mif1|msf1|heif/.test(buf.subarray(8, 12).toString("ascii"))
  );
}

/** Validate an upload and convert it to a clean, EXIF-rotated JPEG (max 2048px long side). */
export async function normaliseUpload(
  input: Buffer,
): Promise<{ data: Buffer; width: number; height: number }> {
  if (input.byteLength > UPLOAD_RULES.maxBytes) throw new ImageValidationError("TOO_LARGE");
  let buf = input;
  if (looksLikeHeic(buf)) {
    try {
      buf = Buffer.from(
        await heicConvert({ buffer: new Uint8Array(buf), format: "JPEG", quality: 0.92 }),
      );
    } catch {
      throw new ImageValidationError("UNREADABLE");
    }
  }
  let meta: Metadata;
  try {
    meta = await sharp(buf).metadata();
  } catch {
    throw new ImageValidationError("BAD_TYPE");
  }
  if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format))
    throw new ImageValidationError("BAD_TYPE");
  const rotated = sharp(buf).rotate();
  const { width = 0, height = 0 } = await rotated
    .clone()
    .metadata()
    .then((m) =>
      m.orientation && m.orientation >= 5
        ? { width: m.height, height: m.width }
        : { width: m.width, height: m.height },
    );
  if (Math.min(width, height) < UPLOAD_RULES.minShortSide)
    throw new ImageValidationError("TOO_SMALL");
  const out = await rotated
    .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  return { data: out.data, width: out.info.width, height: out.info.height };
}

/** Downscale for AI analysis (1024px long side) to save tokens. */
export async function forAnalysis(buf: Buffer): Promise<Buffer> {
  return sharp(buf)
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

const RATIOS: Record<AspectRatio, number> = { "1:1": 1, "4:5": 4 / 5, "9:16": 9 / 16 };

/** Produce a download rendition: crop to ratio (smart attention crop), scale long side to `size`. */
export async function renderDownload(
  clean: Buffer,
  opts: { size: number; ratio?: AspectRatio; watermark: boolean },
): Promise<Buffer> {
  let img = sharp(clean);
  const meta = await img.metadata();
  const srcW = meta.width ?? opts.size;
  const srcH = meta.height ?? opts.size;
  let w = srcW;
  let h = srcH;
  if (opts.ratio) {
    const r = RATIOS[opts.ratio];
    if (Math.abs(srcW / srcH - r) > 0.01) {
      if (srcW / srcH > r) w = Math.round(srcH * r);
      else h = Math.round(srcW / r);
      img = sharp(
        await img
          .resize({ width: w, height: h, fit: "cover", position: sharp.strategy.attention })
          .toBuffer(),
      );
    }
  }
  const scale = opts.size / Math.max(w, h);
  const outW = Math.round(w * scale);
  const outH = Math.round(h * scale);
  img = img.resize({ width: outW, height: outH, kernel: "lanczos3" });
  if (opts.watermark) {
    const base = await img.toBuffer();
    return sharp(base)
      .composite([{ input: watermarkSvg(outW, outH), top: 0, left: 0 }])
      .jpeg({ quality: 78 })
      .toBuffer();
  }
  return img.jpeg({ quality: 93, mozjpeg: true }).toBuffer();
}

/** Corner ribbon + faint tiled mark, Renderforest-style. */
export function watermarkSvg(w: number, h: number): Buffer {
  const ribbon = Math.round(Math.min(w, h) * 0.34);
  const fs = Math.round(ribbon * 0.12);
  const tile = Math.round(Math.min(w, h) / 3.2);
  const tiles: string[] = [];
  for (let y = tile / 2; y < h; y += tile) {
    for (let x = tile / 2; x < w; x += tile) {
      tiles.push(
        `<text x="${x}" y="${y}" transform="rotate(-30 ${x} ${y})" font-size="${Math.round(tile / 7)}" text-anchor="middle" fill="white" fill-opacity="0.16" font-family="Helvetica, Arial, sans-serif" font-weight="700">AidoPost</text>`,
      );
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    ${tiles.join("")}
    <g transform="translate(${w - ribbon}, ${h - ribbon})">
      <polygon points="${ribbon},${ribbon * 0.25} ${ribbon},${ribbon * 0.62} ${ribbon * 0.62},${ribbon} ${ribbon * 0.25},${ribbon}" fill="#7c3aed" fill-opacity="0.92"/>
      <text x="${ribbon * 0.72}" y="${ribbon * 0.72}" transform="rotate(-45 ${ribbon * 0.72} ${ribbon * 0.72})" font-size="${fs}" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Helvetica, Arial, sans-serif" font-weight="800" letter-spacing="1">AidoPost</text>
    </g>
  </svg>`;
  return Buffer.from(svg);
}
