// The fixed list of 10 industries (spec §6). Seeded into the `industries` table, which is the
// source of truth at runtime so the list can grow without code changes.
export interface IndustrySeed {
  id: string;
  typicalProducts: string;
  names: Record<string, string>;
}

export const INDUSTRIES: IndustrySeed[] = [
  {
    id: "fashion_apparel",
    typicalProducts: "T-shirts, dresses, shoes",
    names: {
      en: "Fashion and apparel",
      hy: "Նորաձևություն և հագուստ",
      ar: "الأزياء والملابس",
      de: "Mode und Bekleidung",
      tr: "Moda ve giyim",
      sv: "Mode och kläder",
      es: "Moda y ropa",
    },
  },
  {
    id: "jewellery_accessories",
    typicalProducts: "Rings, necklaces, watches, bags",
    names: {
      en: "Jewellery and accessories",
      hy: "Զարդեր և աքսեսուարներ",
      ar: "المجوهرات والإكسسوارات",
      de: "Schmuck und Accessoires",
      tr: "Takı ve aksesuar",
      sv: "Smycken och accessoarer",
      es: "Joyería y accesorios",
    },
  },
  {
    id: "beauty_cosmetics",
    typicalProducts: "Perfume, skincare, makeup",
    names: {
      en: "Beauty and cosmetics",
      hy: "Գեղեցկություն և կոսմետիկա",
      ar: "الجمال ومستحضرات التجميل",
      de: "Beauty und Kosmetik",
      tr: "Güzellik ve kozmetik",
      sv: "Skönhet och kosmetika",
      es: "Belleza y cosmética",
    },
  },
  {
    id: "food_beverage",
    typicalProducts: "Coffee, sweets, wine, sauces",
    names: {
      en: "Food and beverage",
      hy: "Սնունդ և ըմպելիքներ",
      ar: "الأطعمة والمشروبات",
      de: "Essen und Getränke",
      tr: "Yiyecek ve içecek",
      sv: "Mat och dryck",
      es: "Comida y bebida",
    },
  },
  {
    id: "home_interior",
    typicalProducts: "Candles, ceramics, textiles, furniture",
    names: {
      en: "Home and interior",
      hy: "Տուն և ինտերիեր",
      ar: "المنزل والديكور",
      de: "Wohnen und Interior",
      tr: "Ev ve iç mekan",
      sv: "Hem och inredning",
      es: "Hogar e interiorismo",
    },
  },
  {
    id: "electronics_gadgets",
    typicalProducts: "Headphones, phone cases, chargers",
    names: {
      en: "Electronics and gadgets",
      hy: "Էլեկտրոնիկա և գաջեթներ",
      ar: "الإلكترونيات والأجهزة",
      de: "Elektronik und Gadgets",
      tr: "Elektronik ve aksesuarlar",
      sv: "Elektronik och prylar",
      es: "Electrónica y gadgets",
    },
  },
  {
    id: "health_wellness",
    typicalProducts: "Supplements, yoga mats, herbal teas",
    names: {
      en: "Health and wellness",
      hy: "Առողջություն և բարեկեցություն",
      ar: "الصحة والعافية",
      de: "Gesundheit und Wellness",
      tr: "Sağlık ve wellness",
      sv: "Hälsa och välmående",
      es: "Salud y bienestar",
    },
  },
  {
    id: "arts_crafts_handmade",
    typicalProducts: "Prints, handmade gifts, stationery",
    names: {
      en: "Arts, crafts and handmade",
      hy: "Արվեստ, արհեստներ և ձեռագործ",
      ar: "الفنون والحرف اليدوية",
      de: "Kunst, Handwerk und Handgemachtes",
      tr: "Sanat, el sanatları ve el yapımı",
      sv: "Konst, hantverk och handgjort",
      es: "Arte, manualidades y hecho a mano",
    },
  },
  {
    id: "kids_toys",
    typicalProducts: "Toys, baby clothes, children's books",
    names: {
      en: "Kids and toys",
      hy: "Երեխաներ և խաղալիքներ",
      ar: "الأطفال والألعاب",
      de: "Kinder und Spielzeug",
      tr: "Çocuk ve oyuncak",
      sv: "Barn och leksaker",
      es: "Niños y juguetes",
    },
  },
  {
    id: "sports_outdoors",
    typicalProducts: "Bottles, gym wear, camping gear",
    names: {
      en: "Sports and outdoors",
      hy: "Սպորտ և բացօթյա",
      ar: "الرياضة والأنشطة الخارجية",
      de: "Sport und Outdoor",
      tr: "Spor ve outdoor",
      sv: "Sport och friluftsliv",
      es: "Deportes y aire libre",
    },
  },
];
