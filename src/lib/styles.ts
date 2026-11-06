// Style definitions (varC) — spec §6. Fed verbatim to the prompt-writer.
export type StyleId = "minimalist" | "casual" | "premium";

export const STYLES: Record<
  StyleId,
  { background: string; lighting: string; props: string; mood: string }
> = {
  minimalist: {
    background: "Solid or soft-gradient, neutral tones",
    lighting: "Soft, even, diffused",
    props: "None or one simple shape",
    mood: "Clean, calm, lots of negative space",
  },
  casual: {
    background: "Real-life setting (table, café, home, outdoors)",
    lighting: "Natural daylight",
    props: "Everyday items matching the industry",
    mood: "Warm, relatable, authentic",
  },
  premium: {
    background: "Rich materials (marble, velvet, dark wood, stone)",
    lighting: "Dramatic, directional, glossy highlights",
    props: "Few, luxurious, curated",
    mood: "Elegant, high-end, editorial",
  },
};

export const STYLE_IDS = Object.keys(STYLES) as StyleId[];
