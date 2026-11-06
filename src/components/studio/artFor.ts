import type { ArtProduct } from "../art/ProductScene";

/** Pick an illustration that resembles the user's product for the style cards. */
export function artFor(productType?: string | null, industryId?: string | null): ArtProduct {
  const p = (productType ?? "").toLowerCase();
  const table: [RegExp, ArtProduct][] = [
    [/perfume|fragrance|cologne|parfum/, "perfume"],
    [/serum|cream|lotion|skincare|bottle|oil|cosmetic|lipstick/, "serum"],
    [/ring|necklace|bracelet|earring|jewel/, "ring"],
    [/watch/, "watch"],
    [/mug|cup|plate|bowl|ceramic|vase/, "mug"],
    [/candle/, "candle"],
    [/shoe|sneaker|boot|trainer/, "sneaker"],
    [/headphone|earbud|speaker|phone|charger|gadget/, "headphones"],
    [/tea|coffee|food|chocolate|sweet|honey|jar|sauce|wine/, "tea"],
    [/toy|plush|teddy|doll|game/, "toy"],
  ];
  for (const [re, art] of table) if (re.test(p)) return art;
  const byIndustry: Record<string, ArtProduct> = {
    fashion_apparel: "sneaker",
    jewellery_accessories: "ring",
    beauty_cosmetics: "perfume",
    food_beverage: "tea",
    home_interior: "candle",
    electronics_gadgets: "headphones",
    health_wellness: "serum",
    arts_crafts_handmade: "mug",
    kids_toys: "toy",
    sports_outdoors: "sneaker",
  };
  return byIndustry[industryId ?? ""] ?? "perfume";
}
