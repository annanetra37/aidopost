// AI_MOCK=true — deterministic stand-ins for Claude and Gemini so the full flow runs locally,
// in CI and in demos without API keys. Never enable in production.
import sharp from "sharp";
import { preservationBlock } from "./preservation";
import type { ProductAnalysis } from "./product";

export const mockEnabled = () => process.env.AI_MOCK === "true";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function mockIndustry(description: string, ids: string[]) {
  await wait(300);
  const d = description.toLowerCase();
  const guess: [RegExp, string][] = [
    [/perfume|skin|cosmetic|beauty|makeup/, "beauty_cosmetics"],
    [/ring|jewel|necklace|watch|silver|gold/, "jewellery_accessories"],
    [/ceramic|candle|home|interior|mug/, "home_interior"],
    [/coffee|tea|food|sweet|wine|bakery/, "food_beverage"],
    [/shirt|dress|fashion|shoe|apparel/, "fashion_apparel"],
  ];
  const id = guess.find(([re]) => re.test(d))?.[1] ?? ids[0];
  return { industry_id: ids.includes(id) ? id : ids[0], confidence: 0.82 };
}

export async function mockProduct(count: number): Promise<ProductAnalysis> {
  await wait(800);
  return {
    product_type: "product",
    product_name: "handmade product (mock analysis)",
    materials: ["ceramic"],
    colours: ["terracotta"],
    key_details: ["logo stamp"],
    same_product: count >= 2,
    photo_issues: [],
  };
}

export async function mockPrompts(productName: string) {
  await wait(600);
  const b = preservationBlock(productName);
  return {
    A: { concept: "Studio hero", prompt: `${b}\n\nStudio hero shot on a soft gradient sweep.` },
    B: { concept: "Lifestyle", prompt: `${b}\n\nLifestyle scene on a sunlit wooden table.` },
    C: { concept: "Editorial", prompt: `${b}\n\nEditorial flat-lay with curated props.` },
  };
}

export async function mockBrand(source: string, locale: string) {
  await wait(500);
  const title = /Title: (.+)/.exec(source)?.[1]?.trim() || "Your brand";
  return {
    enough_information: true,
    brand_name: title.slice(0, 60),
    description: `[${locale}] ${title} sells thoughtfully made products for people who care about quality and style. (Mock description — set ANTHROPIC_API_KEY for real output.)`,
  };
}

const PALETTES = [
  ["#f3e8ff", "#fce7f3"],
  ["#fef3c7", "#fde2e4"],
  ["#1f1b2e", "#3b2f4a"],
];

/** Composite the first reference photo onto a gradient "scene" — product pixels untouched. */
export async function mockImage(references: Buffer[], aspectRatio: string, variantSeed: number) {
  await wait(2500);
  const [w, h] =
    aspectRatio === "4:5" ? [1024, 1280] : aspectRatio === "9:16" ? [864, 1536] : [1024, 1024];
  const [c1, c2] = PALETTES[variantSeed % PALETTES.length];
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="g" cx=".5" cy=".35" r=".9"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><ellipse cx="${w / 2}" cy="${h * 0.8}" rx="${w * 0.32}" ry="${h * 0.035}" fill="#000" opacity=".18"/></svg>`,
  );
  const product = await sharp(references[0])
    .resize({ width: Math.round(w * 0.6), height: Math.round(h * 0.6), fit: "inside" })
    .png()
    .toBuffer();
  const meta = await sharp(product).metadata();
  return sharp(bg)
    .composite([
      {
        input: product,
        left: Math.round((w - (meta.width ?? 0)) / 2),
        top: Math.round(h * 0.78 - (meta.height ?? 0)),
      },
    ])
    .png()
    .toBuffer();
}
