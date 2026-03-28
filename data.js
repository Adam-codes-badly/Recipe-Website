export const recipes = [
  {
    slug: "pastel-de-nata",
    title: "Pastel de Nata",
    description:
      "Portuguese custard tarts with crisp pastry, warm cinnamon custard, and caramelised tops.",
    category: "Pastry",
    tags: ["portuguese", "tart", "custard", "pastry", "dessert"],
    searchTags: ["Dessert", "Pastry", "Portuguese", "Custard", "Tart"],
    baseYield: 12,
    yieldLabel: "tarts",
    heroTitle: "Pastel de Nata",
    heroCopy:
      "Portuguese custard tarts with crisp pastry, a warm cinnamon custard, and a scale control that keeps the method and ingredient list aligned.",
    ingredientsHeading: "For the pastry and custard",
    methodHeading: "Bake until blistered and glossy",
    notesHeading: "Serving tips",
    ingredients: [
      {
        id: "puff-pastry",
        name: "ready-rolled puff pastry",
        quantity: 320,
        unit: "g",
        format: { decimals: 0 },
      },
      {
        id: "milk",
        name: "whole milk",
        quantity: 250,
        unit: "ml",
        format: { decimals: 0 },
      },
      {
        id: "double-cream",
        name: "double cream",
        quantity: 100,
        unit: "ml",
        format: { decimals: 0 },
      },
      {
        id: "sugar",
        name: "caster sugar",
        quantity: 150,
        unit: "g",
        format: { decimals: 0 },
      },
      {
        id: "flour",
        name: "plain flour",
        quantity: 30,
        unit: "g",
        format: { decimals: 0, fractions: true },
      },
      {
        id: "egg-yolks",
        name: "egg yolks",
        quantity: 6,
        unit: "count",
        format: { countable: true, plural: "egg yolks", singular: "egg yolk" },
      },
      {
        id: "vanilla",
        name: "vanilla extract",
        quantity: 1.5,
        unit: "tsp",
        format: { decimals: 2, fractions: true },
      },
      {
        id: "cinnamon-stick",
        name: "cinnamon stick",
        quantity: 1,
        unit: "count",
        format: {
          countable: true,
          plural: "cinnamon sticks",
          singular: "cinnamon stick",
        },
      },
      {
        id: "lemon-peel",
        name: "strip of lemon peel",
        quantity: 1,
        unit: "count",
        format: {
          countable: true,
          plural: "strips of lemon peel",
          singular: "strip of lemon peel",
        },
      },
      {
        id: "salt",
        name: "fine sea salt",
        quantity: 0.25,
        unit: "tsp",
        format: { decimals: 2, fractions: true },
      },
      {
        id: "butter",
        name: "soft butter for the tin",
        quantity: 15,
        unit: "g",
        format: { decimals: 0, fractions: true },
      },
    ],
    steps: [
      [
        {
          type: "text",
          value:
            "Heat the oven to 220°C / 200°C fan. Lightly grease a 12-hole muffin tin with ",
        },
        { type: "ingredient", id: "butter" },
        { type: "text", value: "." },
      ],
      [
        { type: "text", value: "Roll the " },
        { type: "ingredient", id: "puff-pastry" },
        {
          type: "text",
          value:
            " into a tight log, cut into even rounds, then press each round into the muffin tin so the pastry comes just above the rim. Chill the tray while you make the custard.",
        },
      ],
      [
        { type: "text", value: "Whisk " },
        { type: "ingredient", id: "flour" },
        { type: "text", value: " with " },
        { type: "ingredient", id: "milk", quantity: 60, displayMode: "amountOnly" },
        { type: "text", value: " of the whole milk until smooth." },
      ],
      [
        { type: "text", value: "Warm " },
        { type: "ingredient", id: "milk", quantity: 190, displayMode: "amountOnly" },
        { type: "text", value: ", the " },
        { type: "ingredient", id: "double-cream" },
        { type: "text", value: ", " },
        { type: "ingredient", id: "sugar" },
        { type: "text", value: ", " },
        { type: "ingredient", id: "cinnamon-stick" },
        { type: "text", value: ", " },
        { type: "ingredient", id: "lemon-peel" },
        { type: "text", value: ", " },
        { type: "ingredient", id: "vanilla" },
        { type: "text", value: ", and " },
        { type: "ingredient", id: "salt" },
        { type: "text", value: " in a saucepan until steaming. Remove from the heat." },
      ],
      [
        {
          type: "text",
          value: "Whisk the warm dairy into the flour paste, then whisk in ",
        },
        { type: "ingredient", id: "egg-yolks" },
        {
          type: "text",
          value:
            " until the custard is glossy. Strain out the cinnamon stick and lemon peel.",
        },
      ],
      [
        {
          type: "text",
          value:
            "Fill each pastry case almost to the top with the custard. Bake for 15 to 18 minutes, until the pastry is deep golden and the custard has dark blistered patches.",
        },
      ],
      [
        {
          type: "text",
          value:
            "Cool in the tin for 5 minutes, then transfer the tarts to a rack. Serve warm, ideally with a dusting of cinnamon.",
        },
      ],
    ],
    notes: [
      "The base recipe makes about 12 tarts. Yield is scaled and rounded to the nearest whole tart for display.",
      "If the slider rounds egg yolks up or down, the recipe stays practical for home baking rather than mathematically exact.",
      "For the classic finish, bake the tarts in the hottest part of the oven so the tops take on dark caramel spots.",
    ],
  },
  {
    slug: "lemon-drizzle-cake",
    title: "Lemon Drizzle Cake",
    description:
      "A tender loaf cake with fresh lemon zest, a sharp syrup soak, and a crisp icing shell.",
    category: "Cake",
    tags: ["lemon", "cake", "loaf", "bake", "dessert"],
    searchTags: ["Dessert", "Cake", "Lemon", "Loaf", "Citrus"],
    baseYield: 8,
    yieldLabel: "slices",
    heroTitle: "Lemon Drizzle Cake",
    heroCopy:
      "A bright, buttery loaf cake finished with lemon syrup and a simple icing glaze. The method scales with the ingredients so you can bake a smaller or larger cake confidently.",
    ingredientsHeading: "For the cake, syrup, and icing",
    methodHeading: "Bake, soak, and glaze",
    notesHeading: "Kitchen notes",
    ingredients: [
      {
        id: "butter",
        name: "unsalted butter, softened",
        quantity: 225,
        unit: "g",
        format: { decimals: 0 },
      },
      {
        id: "caster-sugar",
        name: "caster sugar",
        quantity: 225,
        unit: "g",
        format: { decimals: 0 },
      },
      {
        id: "drizzle-sugar",
        name: "caster sugar for the syrup",
        quantity: 85,
        unit: "g",
        format: { decimals: 0 },
      },
      {
        id: "eggs",
        name: "large eggs",
        quantity: 4,
        unit: "count",
        format: { countable: true, plural: "large eggs", singular: "large egg" },
      },
      {
        id: "flour",
        name: "self-raising flour",
        quantity: 225,
        unit: "g",
        format: { decimals: 0 },
      },
      {
        id: "baking-powder",
        name: "baking powder",
        quantity: 1,
        unit: "tsp",
        format: { decimals: 2, fractions: true },
      },
      {
        id: "milk",
        name: "whole milk",
        quantity: 3,
        unit: "tbsp",
        format: { decimals: 2, fractions: true },
      },
      {
        id: "lemon-zest",
        name: "zest of unwaxed lemons",
        quantity: 2,
        unit: "count",
        format: {
          countable: true,
          plural: "lemons",
          singular: "lemon",
        },
      },
      {
        id: "lemon-juice",
        name: "fresh lemon juice",
        quantity: 5,
        unit: "tbsp",
        format: { decimals: 2, fractions: true },
      },
      {
        id: "icing-sugar",
        name: "icing sugar",
        quantity: 85,
        unit: "g",
        format: { decimals: 0 },
      },
    ],
    steps: [
      [
        {
          type: "text",
          value:
            "Heat the oven to 180°C / 160°C fan. Line a loaf tin with baking paper and beat together ",
        },
        { type: "ingredient", id: "butter" },
        { type: "text", value: " and " },
        { type: "ingredient", id: "caster-sugar" },
        { type: "text", value: " until pale and fluffy." },
      ],
      [
        { type: "text", value: "Beat in " },
        { type: "ingredient", id: "eggs" },
        {
          type: "text",
          value:
            " one at a time, then fold in ",
        },
        { type: "ingredient", id: "flour" },
        { type: "text", value: ", " },
        { type: "ingredient", id: "baking-powder" },
        { type: "text", value: ", the zest of " },
        { type: "ingredient", id: "lemon-zest" },
        { type: "text", value: ", and " },
        { type: "ingredient", id: "milk" },
        { type: "text", value: "." },
      ],
      [
        {
          type: "text",
          value:
            "Spoon the batter into the loaf tin and bake for 45 to 55 minutes, until a skewer comes out clean.",
        },
      ],
      [
        { type: "text", value: "Mix " },
        { type: "ingredient", id: "lemon-juice", quantity: 3, displayMode: "amountOnly" },
        { type: "text", value: " of fresh lemon juice with " },
        { type: "ingredient", id: "drizzle-sugar" },
        {
          type: "text",
          value:
            ". Prick the hot cake all over and spoon the lemon syrup across the surface while it is still in the tin.",
        },
      ],
      [
        { type: "text", value: "When the cake is cool, stir " },
        { type: "ingredient", id: "icing-sugar" },
        { type: "text", value: " with " },
        { type: "ingredient", id: "lemon-juice", quantity: 2, displayMode: "amountOnly" },
        {
          type: "text",
          value:
            " to make a thick glaze, then spread it over the top and leave it to set.",
        },
      ],
    ],
    notes: [
      "The base recipe makes one loaf, roughly 8 slices, and the displayed yield rounds to the nearest whole slice.",
      "Whole eggs round to a sensible count as you scale, which keeps the cake batter practical for a home kitchen.",
      "If you scale well above 2x, split the batter between tins rather than overfilling one loaf pan.",
    ],
  },
];

export function getRecipeBySlug(slug) {
  return recipes.find((recipe) => recipe.slug === slug) ?? null;
}
