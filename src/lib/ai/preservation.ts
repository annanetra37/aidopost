// The preservation block — "the product is sacred" (spec §6). Every image prompt must contain it;
// the server inserts it verbatim and validates it is present before calling the image model.
export const PRESERVATION_MARKER = "Keep the product EXACTLY as it appears";

export function preservationBlock(productName: string): string {
  return (
    `Use the attached reference photos of the ${productName}. ` +
    "Keep the product EXACTLY as it appears: same shape, proportions, colours, materials, textures, logos, labels and text. " +
    "Do not redraw, restyle, recolour, resize or add anything to the product. " +
    "Only build the background, surface, props, lighting and composition around it. " +
    "No added text, watermarks or people's faces unless asked."
  );
}

export const STRONGER_PRESERVATION =
  "CRITICAL: a previous attempt altered the product. The product must be a faithful, pixel-accurate reproduction of the " +
  "reference photos — identical silhouette, colours, label text and logo placement. If in doubt, change the scene, never the product.";

export function hasPreservationBlock(prompt: string, productName: string): boolean {
  return prompt.includes(preservationBlock(productName));
}

/** Ensure a prompt carries the exact block (prepend if the model dropped or paraphrased it). */
export function withPreservationBlock(prompt: string, productName: string): string {
  return hasPreservationBlock(prompt, productName)
    ? prompt
    : `${preservationBlock(productName)}\n\n${prompt}`;
}
