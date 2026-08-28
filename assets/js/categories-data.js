// Central category taxonomy for sitewide use
const categoryData = [
  {
    group: "Sportswear",
    slug: "sportswear",
    items: [
      { name: "Football (Soccer) Kits", slug: "football-soccer-kits" },
      { name: "Basketball Uniforms", slug: "basketball-uniforms" },
      { name: "Volleyball Uniforms", slug: "volleyball-uniforms" },
      { name: "American Football Uniforms", slug: "american-football-uniforms" },
      { name: "Baseball Uniforms", slug: "baseball-uniforms" },
      { name: "Duffel Bags", slug: "duffel-bags" }
    ]
  },
  {
    group: "Fashionwear",
    slug: "fashionwear",
    items: [
      { name: "T-Shirts", slug: "tshirts" },
      { name: "Polo Shirts", slug: "polo-shirts" },
      { name: "Sweatshirts", slug: "sweatshirts" },
      { name: "Hoodies", slug: "hoodies" },
      { name: "Jackets", slug: "jackets" },
      { name: "Windbreaker Suit", slug: "windbreaker-suits" },
      { name: "Shorts", slug: "shorts" },
      { name: "Tracksuits", slug: "tracksuits" }
    ]
  },
  {
    group: "Gymwear",
    slug: "gymwear",
    subGroups: [
      {
        subGroup: "Men's Gymwear",
        slug: "mens-gymwear",
        items: [
          { name: "Performance T-Shirts", slug: "performance-t-shirts" },
          { name: "Sleeveless Hoodies", slug: "sleeveless-hoodies" },
          { name: "Compression Shirts", slug: "compression-shirts" },
          { name: "Gym Shorts", slug: "gym-shorts" },
          { name: "Compression Shorts", slug: "compression-shorts-men" }
        ]
      },
      {
        subGroup: "Women's Gymwear",
        slug: "womens-gymwear",
        items: [
          { name: "Sports Bras", slug: "sports-bras" },
          { name: "Crop Tops", slug: "crop-tops" },
          { name: "Leggings", slug: "leggings" },
          { name: "Training Jackets", slug: "training-jackets" }
        ]
      }
    ]
  },
  {
    group: "Martial Arts",
    slug: "martial-arts",
    items: [
      { name: "Boxing Gloves", slug: "boxing-gloves" },
      { name: "MMA Gloves", slug: "mma-gloves" },
      { name: "Shin Guards", slug: "shin-guards" },
      { name: "Head Guards", slug: "head-guards" },
      { name: "Hand Wraps", slug: "hand-wraps" },
      { name: "Focus Mitts", slug: "focus-mitts" }
    ]
  },
  {
    group: "Boxing",
    slug: "boxing",
    items: [
      { name: "Boxing Shorts", slug: "boxing-shorts" }
    ]
  },
  {
    group: "Karate",
    slug: "karate",
    items: [
      { name: "Karate Uniform", slug: "karate-uniform" }
    ]
  }
];

// Expose for other modules (no module system, attach to window)
window.categoryData = categoryData;
