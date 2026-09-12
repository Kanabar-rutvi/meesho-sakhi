/**
 * Centralized Category Taxonomy
 * Defines the hierarchical structure and aliases for mapping user queries to standardized categories.
 */

export const TAXONOMY = {
  fashion: {
    subcategories: {
      footwear: {
        aliases: ["shoes", "sneakers", "sandals", "slippers", "boots", "loafers", "flip flops", "heels", "flats", "canvas"]
      },
      mens_clothing: {
        aliases: ["men shirt", "men t-shirt", "men jeans", "men trousers", "men jacket", "hoodie", "polo", "kurta men", "blazer"]
      },
      womens_clothing: {
        aliases: ["women dress", "dress", "saree", "kurta", "anarkali", "women top", "skirt", "lehenga", "women jeans", "trousers women", "frock"]
      },
      activewear: {
        aliases: ["gym", "workout", "track pants", "sports bra", "running shorts", "yoga pants", "leggings"]
      },
      winterwear: {
        aliases: ["jacket", "sweater", "cardigan", "sweatshirt", "coat", "thermals", "muffler"]
      }
    },
    aliases: ["clothing", "clothes", "apparel", "wear", "style", "outfit"]
  },
  electronics: {
    subcategories: {
      audio: {
        aliases: ["earphones", "headphones", "earbuds", "bluetooth", "speaker", "noise cancelling", "soundbar", "airpods"]
      },
      smartphones: {
        aliases: ["phone", "mobile", "smartphone", "5g phone", "android", "iphone", "cellphone"]
      },
      computers: {
        aliases: ["laptop", "pc", "computer", "notebook", "macbook", "desktop"]
      },
      peripherals: {
        aliases: ["mouse", "keyboard", "webcam", "monitor", "laptop stand", "cooling pad", "trackpad"]
      },
      wearables: {
        aliases: ["smartwatch", "fitness tracker", "fitness band", "smart watch", "smart band"]
      },
      accessories: {
        aliases: ["cable", "charger", "power bank", "hub", "stand", "plug", "extension", "usb", "adapter"]
      }
    },
    aliases: ["tech", "gadgets", "device", "electronic"]
  },
  home: {
    subcategories: {
      bedding: {
        aliases: ["bedsheet", "bed sheets", "mattress", "pillow", "blanket", "quilt", "dohar", "duvet", "bed cover"]
      },
      kitchen: {
        aliases: ["cooking", "cookware", "dining", "utensils", "appliances", "kettle", "induction", "fridge", "pan", "pot", "mug", "mixer", "blender", "water bottle"]
      },
      storage: {
        aliases: ["organizer", "rack", "wardrobe", "bag", "drawer", "hook", "storage box", "laundry basket", "shelf"]
      },
      furniture: {
        aliases: ["chair", "table", "desk", "sofa", "bed", "stool", "bean bag", "bookshelf"]
      },
      lighting: {
        aliases: ["lamp", "light", "bulb", "led", "desk lamp", "night light", "lantern"]
      },
      decor: {
        aliases: ["cushion", "curtain", "painting", "wall art", "planter", "pot", "vase", "clock", "carpet", "rug", "tapestry"]
      }
    },
    aliases: ["house", "decor", "home & living", "living", "homeware"]
  },
  beauty: {
    subcategories: {
      skincare: {
        aliases: ["face wash", "moisturizer", "sunscreen", "serum", "cleanser", "toner", "face cream", "aloe vera", "sheet mask"]
      },
      haircare: {
        aliases: ["shampoo", "conditioner", "hair oil", "hair mask", "hair serum", "anti-dandruff"]
      },
      makeup: {
        aliases: ["lipstick", "eyeliner", "mascara", "foundation", "compact", "eyeshadow", "blush", "nail polish", "makeup kit"]
      },
      personal_care: {
        aliases: ["body wash", "body lotion", "deodorant", "perfume", "fragrance", "sanitizer", "scrub"]
      }
    },
    aliases: ["cosmetics", "grooming", "skin", "care", "wellness"]
  },
  accessories: {
    subcategories: {
      watches: {
        aliases: ["watch", "analog watch", "digital watch", "wrist watch", "chronograph"]
      },
      bags: {
        aliases: ["backpack", "handbag", "tote bag", "sling bag", "laptop bag", "duffel bag", "travel bag", "college bag"]
      },
      wallets: {
        aliases: ["wallet", "purse", "card holder", "money clip", "clutch"]
      },
      eyewear: {
        aliases: ["sunglasses", "aviator", "shades", "goggles", "spectacles", "frames"]
      },
      jewellery: {
        aliases: ["necklace", "earrings", "ring", "pendant", "bracelet", "chain", "bangles", "jewel"]
      },
      travel_belts: {
        aliases: ["belt", "leather belt", "beanie", "hat", "cap", "scarf", "tie", "umbrella"]
      }
    },
    aliases: ["fashion accessories", "add-on"]
  },
  study: {
    subcategories: {
      furniture: {
        aliases: ["table", "chair", "desk", "study lamp"]
      },
      stationery: {
        aliases: ["notebook", "pen", "highlighter", "calculator", "notes", "board", "diary", "marker"]
      }
    },
    aliases: ["school", "college", "education", "learning"]
  },
  personal_care: {
    subcategories: {
      hygiene: {
        aliases: ["bucket", "towel", "soap", "bathroom", "washing", "detergent", "grooming", "brush", "toothpaste"]
      }
    },
    aliases: ["health", "care"]
  }
};

/**
 * Resolves a raw string to the standard category and subcategory.
 * E.g. "bedsheets" -> { category: "home", subcategory: "bedding" }
 */
export function resolveCategory(query) {
  if (!query) return null;
  const q = query.toLowerCase();

  for (const [catKey, catData] of Object.entries(TAXONOMY)) {
    // Check subcategories first for more specific matching
    if (catData.subcategories) {
      for (const [subKey, subData] of Object.entries(catData.subcategories)) {
        if (q === subKey || subData.aliases?.some(a => q.includes(a))) {
          return { category: catKey, subcategory: subKey };
        }
      }
    }
    
    // Check top level category and aliases
    if (q === catKey || catData.aliases?.some(a => q.includes(a))) {
      return { category: catKey, subcategory: null };
    }
  }

  // Fallback for legacy categories
  const legacyCategories = ["bedding", "study", "kitchen", "storage", "electronics", "hygiene"];
  if (legacyCategories.some(c => q.includes(c))) {
    if (q.includes("bedding")) return { category: "home", subcategory: "bedding" };
    if (q.includes("kitchen")) return { category: "home", subcategory: "kitchen" };
    if (q.includes("storage")) return { category: "home", subcategory: "storage" };
    if (q.includes("study")) return { category: "study", subcategory: null };
    if (q.includes("electronics")) return { category: "electronics", subcategory: null };
    if (q.includes("hygiene")) return { category: "personal_care", subcategory: "hygiene" };
  }

  return null;
}

