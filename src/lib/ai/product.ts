// Call 2 — Product (varB). Claude Haiku 5.5 with vision over the 2–3 reference photos.
import { z } from "zod";
import { env } from "../env";
import { imageBlock, structuredCall } from "./claude";
import { mockEnabled, mockProduct } from "./mock";

export const ProductAnalysisSchema = z.object({
  product_type: z.string().describe('Short generic type, e.g. "ring", "perfume", "t-shirt"'),
  product_name: z
    .string()
    .describe('Specific descriptive name, e.g. "gold signet ring with red enamel"'),
  materials: z.array(z.string()),
  colours: z.array(z.string()),
  key_details: z
    .array(z.string())
    .describe("Engravings, logos, labels, printed text, distinctive features"),
  same_product: z.boolean().describe("True only if every photo shows the same single item"),
  photo_issues: z.array(
    z.enum(["blur", "dark", "cluttered_background", "low_resolution", "cropped"]),
  ),
});
export type ProductAnalysis = z.infer<typeof ProductAnalysisSchema>;

export async function analyseProduct(photos: Buffer[], sessionId?: string) {
  if (mockEnabled()) return mockProduct(photos.length);
  const content = [
    ...photos.map(imageBlock),
    {
      type: "text" as const,
      text:
        `These ${photos.length} photos were uploaded as different angles of ONE product to be staged for a social media post. ` +
        "Identify the product precisely, list every visible detail that must be preserved (logos, label text, engravings, " +
        "stitching, colours, materials), and decide whether all photos really show the same single item " +
        "(different colourways or different products → same_product=false). Write all fields in English.",
    },
  ];
  return structuredCall({
    callType: "product",
    model: env.claudeFastModel,
    effort: "low",
    maxTokens: 2000,
    system:
      "You are a meticulous product photographer's assistant who catalogues products from photos.",
    content,
    schema: ProductAnalysisSchema,
    sessionId,
  });
}
