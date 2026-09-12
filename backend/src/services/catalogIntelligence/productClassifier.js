/**
 * Product Classifier Service
 *
 * Infers normalized taxonomy, visual categories, and key attributes
 * from product titles, tags, and descriptions.
 */

export class ProductClassifier {
  static TAXONOMY_RULES = [
    {
      category: "Fashion",
      subcategories: {
        "Footwear": ["shoes", "sneakers", "trainers", "boots", "loafers", "sandals", "slippers", "slip-on"],
        "Men's Clothing": ["men", "mens", "shirt", "polo", "jeans", "t-shirt", "trousers", "jacket", "hoodie"],
        "Women's Clothing": ["women", "womens", "dress", "kurta", "saree", "top", "leggings", "skirt", "frock", "anarkali"],
        "Activewear": ["gym", "workout", "yoga", "running", "sports", "activewear"]
      }
    },
    {
      category: "Electronics",
      subcategories: {
        "Audio": ["headphones", "earbuds", "speaker", "earphones", "soundbar", "audio"],
        "Smartphones": ["smartphone", "phone", "mobile", "android", "iphone", "5g"],
        "Computers": ["laptop", "computer", "notebook", "pc", "macbook"],
        "Peripherals": ["keyboard", "mouse", "monitor", "webcam", "display"],
        "Wearables": ["smartwatch", "fitness tracker", "band"],
        "Accessories": ["power bank", "charger", "cable", "adapter"]
      }
    },
    {
      category: "Home & Living",
      subcategories: {
        "Furniture": ["chair", "table", "desk", "sofa", "bed", "wardrobe"],
        "Bedding": ["bedsheet", "mattress", "pillow", "blanket", "comforter", "quilt"],
        "Kitchen": ["cookware", "pan", "pot", "mug", "kettle", "utensil", "knife", "container"],
        "Lighting": ["lamp", "light", "led", "bulb", "chandelier"],
        "Decor": ["cushion", "curtain", "painting", "wall art", "planter", "pot", "vase"],
        "Storage": ["storage box", "organizer", "rack", "drawer", "basket"]
      }
    },
    {
      category: "Beauty",
      subcategories: {
        "Skincare": ["moisturizer", "serum", "face wash", "sunscreen", "cream", "cleanser", "lotion", "aloe vera"],
        "Haircare": ["shampoo", "conditioner", "hair oil", "hair mask"],
        "Makeup": ["lipstick", "eyeshadow", "mascara", "foundation", "compact", "kajal", "palette"],
        "Personal Care": ["soap", "body wash", "deodorant", "perfume", "scrub"]
      }
    },
    {
      category: "Accessories",
      subcategories: {
        "Watches": ["watch", "timepiece", "chronograph"],
        "Bags": ["backpack", "handbag", "tote", "sling", "wallet", "purse", "duffel"],
        "Eyewear": ["sunglasses", "glasses", "aviator", "frames"],
        "Jewellery": ["necklace", "earrings", "ring", "bracelet", "pendant", "chain"],
        "Travel & Belts": ["belt", "beanie", "hat", "cap", "scarf", "tie"]
      }
    },
    {
      category: "Study",
      subcategories: {
        "Stationery": ["notebook", "spiral", "pen", "pens", "pencil", "calculator", "casio", "study", "exam", "highlighter", "sharpener", "ruler", "geometry", "eraser", "fevistik", "glue", "scissors"]
      }
    },
    {
      category: "Hygiene",
      subcategories: {
        "Bathroom Essentials": ["soap", "towel", "drying pegs", "pegs", "bucket", "hanger", "sanitizer", "hygiene", "detergent", "toothbrush", "toothpaste"]
      }
    }
  ];

  /**
   * Classify a product into its best-matching category and subcategory
   * @param {object} product
   * @returns {{ category: string, subcategory: string, confidence: number }}
   */
  static classify(product) {
    const text = `${product.name || ''} ${product.category || ''} ${(product.tags || []).join(' ')} ${product.description || ''}`.toLowerCase();

    let bestCategory = product.category || 'Fashion';
    let bestSubcategory = product.subcategory || 'General';
    let maxMatches = 0;

    for (const rule of this.TAXONOMY_RULES) {
      for (const [subcat, keywords] of Object.entries(rule.subcategories)) {
        const matches = keywords.filter(kw => text.includes(kw)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          bestCategory = rule.category;
          bestSubcategory = subcat;
        }
      }
    }

    return {
      category: bestCategory,
      subcategory: bestSubcategory,
      confidence: maxMatches > 0 ? Math.min(0.7 + maxMatches * 0.1, 0.99) : 0.5
    };
  }
}
