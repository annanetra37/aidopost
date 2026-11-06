"use client";
// Light client-side photo check: darkness (mean luminance) and blur (variance of Laplacian).
// It only produces a gentle warning — never blocks the upload.
export async function checkPhotoQuality(file: File): Promise<"dark" | "blurry" | null> {
  try {
    const bmp = await createImageBitmap(file);
    const size = 256;
    const scale = size / Math.max(bmp.width, bmp.height);
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bmp, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const lum = new Float32Array(w * h);
    let sum = 0;
    for (let i = 0; i < w * h; i++) {
      const v = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
      lum[i] = v;
      sum += v;
    }
    if (sum / (w * h) < 55) return "dark";
    let lapSum = 0;
    let lapSq = 0;
    let n = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const l = lum[i - w] + lum[i + w] + lum[i - 1] + lum[i + 1] - 4 * lum[i];
        lapSum += l;
        lapSq += l * l;
        n++;
      }
    }
    const variance = lapSq / n - (lapSum / n) ** 2;
    return variance < 40 ? "blurry" : null;
  } catch {
    return null; // e.g. HEIC in browsers that can't decode it
  }
}
