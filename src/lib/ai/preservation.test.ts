import { describe, expect, it } from "vitest";
import { hasPreservationBlock, preservationBlock, withPreservationBlock } from "./preservation";

describe("preservation block", () => {
  const name = "gold signet ring with red enamel";
  it("contains the product name and the required wording", () => {
    const b = preservationBlock(name);
    expect(b).toContain(name);
    expect(b).toContain("Keep the product EXACTLY as it appears");
    expect(b).toContain("Do not redraw, restyle, recolour, resize or add anything to the product.");
  });
  it("is inserted when a prompt lacks it, and not duplicated", () => {
    const fixed = withPreservationBlock("A marble table scene.", name);
    expect(hasPreservationBlock(fixed, name)).toBe(true);
    expect(withPreservationBlock(fixed, name)).toBe(fixed);
  });
});
