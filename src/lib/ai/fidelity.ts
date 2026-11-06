// Fidelity check (behind FEATURE_FIDELITY_CHECK): does the generated image preserve the product?
import { z } from "zod";
import { env } from "../env";
import { imageBlock, structuredCall } from "./claude";
import { mockEnabled } from "./mock";

const schema = z.object({
  product_preserved: z.boolean(),
  differences: z.array(z.string()),
});

export async function checkFidelity(
  references: Buffer[],
  generated: Buffer,
  productName: string,
  generationId: string,
) {
  if (mockEnabled()) return { product_preserved: true, differences: [] as string[] };
  return structuredCall({
    callType: "fidelity",
    model: env.claudeFastModel,
    effort: "low",
    maxTokens: 1500,
    system: "You are a strict QA reviewer for product photography.",
    content: [
      ...references.map(imageBlock),
      imageBlock(generated),
      {
        type: "text",
        text:
          `The first ${references.length} images are reference photos of a ${productName}. The last image is an AI-staged photo. ` +
          "Is the product in the last image the same product, unaltered (shape, proportions, colours, materials, logos, label text)? " +
          "Ignore background, lighting and angle changes. List concrete differences if any.",
      },
    ],
    schema,
    generationId,
  });
}
