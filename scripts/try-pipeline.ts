/**
 * Sprint 0 AI spike: run the full pipeline from the command line, no web app needed.
 *
 *   npm run pipeline:try -- --style premium --desc "Handmade silver rings from Yerevan" ring1.jpg ring2.jpg [ring3.jpg]
 *
 * Writes prompts.json and A/B/C images to ./pipeline-out for side-by-side review.
 */
import { promises as fs } from "fs";
import path from "path";
import { INDUSTRIES } from "../src/lib/industries";
import { forAnalysis, normaliseUpload } from "../src/lib/images";
import { classifyIndustry } from "../src/lib/ai/industry";
import { analyseProduct } from "../src/lib/ai/product";
import { writeScenePrompts } from "../src/lib/ai/prompts";
import { generateImage } from "../src/lib/ai/gemini";
import type { StyleId } from "../src/lib/styles";

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

async function main() {
  const desc = arg("desc");
  const style = arg("style", "minimalist") as StyleId;
  const ratio = arg("ratio", "1:1")!;
  const files = process.argv
    .slice(2)
    .filter((a, i, all) => !a.startsWith("--") && !all[i - 1]?.startsWith("--"));
  if (!desc || files.length < 2) {
    console.error(
      'Usage: npm run pipeline:try -- --desc "..." [--style minimalist|casual|premium] [--ratio 1:1] photo1.jpg photo2.jpg [photo3.jpg]',
    );
    process.exit(1);
  }
  const out = path.resolve("pipeline-out", new Date().toISOString().replace(/[:.]/g, "-"));
  await fs.mkdir(out, { recursive: true });
  const photos = await Promise.all(
    files.map(async (f) => (await normaliseUpload(await fs.readFile(f))).data),
  );
  const small = await Promise.all(photos.map(forAnalysis));

  console.time("analysis (parallel)");
  const [industry, product] = await Promise.all([
    classifyIndustry(
      desc,
      INDUSTRIES.map((i) => ({ id: i.id, name: i.names.en, typicalProducts: i.typicalProducts })),
    ),
    analyseProduct(small),
  ]);
  console.timeEnd("analysis (parallel)");
  console.log({ industry, product });
  if (!product.same_product) console.warn("⚠ Photos don't look like the same product");

  console.time("prompts");
  const prompts = await writeScenePrompts({
    industry: {
      id: industry.industryId,
      name: INDUSTRIES.find((i) => i.id === industry.industryId)!.names.en,
    },
    product,
    style,
    brandDescription: desc,
    aspectRatio: ratio,
  });
  console.timeEnd("prompts");
  await fs.writeFile(
    path.join(out, "prompts.json"),
    JSON.stringify({ industry, product, prompts }, null, 2),
  );

  for (const v of ["A", "B", "C"] as const) {
    console.time(`image ${v}`);
    const img = await generateImage({
      prompt: prompts[v],
      references: photos,
      aspectRatio: ratio,
      generationId: `cli-${v}`,
    });
    await fs.writeFile(path.join(out, `${v}.png`), img.image);
    console.timeEnd(`image ${v}`);
  }
  console.log(`Done → ${out}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
