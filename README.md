# Favourite Recipes

Static recipe website for GitHub Pages with:

- a searchable home page
- one page per recipe
- ingredient quantities shown in both the ingredients list and the method
- a scaling slider on every recipe page

## What Exists So Far

The site currently has:

- a home page at `index.html`
- a shared stylesheet at `styles.css`
- a shared recipe dataset in `data.js`
- home page search/rendering logic in `home.js`
- shared recipe page rendering and scaling logic in `recipe-page.js`
- two recipe pages in `recipes/`

Current recipes:

- `recipes/pastel-de-nata.html`
- `recipes/lemon-drizzle-cake.html`

## How It Works

### Home page

`index.html` loads `home.js`, which imports all recipes from `data.js` and renders them as cards.

The search box filters recipes by:

- title
- description
- category
- tags

The home page also renders clickable tag filters from each recipe's `searchTags` field so visitors can browse by category without typing.

### Recipe pages

Each recipe page is a small HTML wrapper that sets a `data-recipe-slug` attribute on the `<body>`.

Example:

```html
<body data-recipe-slug="pastel-de-nata">
```

`recipe-page.js` reads that slug, finds the matching recipe in `data.js`, and renders:

- hero content
- ingredient list
- method steps
- notes
- scaled yield

### Scaling

Scaling is driven by the slider on each recipe page.

The renderer:

- scales every ingredient quantity
- updates ingredient amounts in the method steps
- rounds countable items like eggs to whole numbers
- formats small values as readable fractions where appropriate

This keeps the ingredient list and method aligned because both come from the same recipe data.

## File Overview

- `index.html`: searchable home page
- `home.js`: renders and filters recipe cards
- `data.js`: source of truth for all recipes
- `recipe-page.js`: shared logic for rendering one recipe and applying scaling
- `styles.css`: shared styling for home and recipe pages
- `recipes/*.html`: individual recipe page entrypoints

## Adding A New Recipe

Adding a new recipe requires two steps:

1. Add the recipe data to `data.js`
2. Add a matching HTML page in `recipes/`

### Step 1: Add the recipe object

In `data.js`, add a new object to the exported `recipes` array.

Use this structure:

```js
{
  slug: "your-recipe-slug",
  title: "Your Recipe Title",
  description: "Short description for the home page.",
  category: "Cake",
  tags: ["tag-one", "tag-two"],
  searchTags: ["Dessert", "Cake", "Easy"],
  baseYield: 8,
  yieldLabel: "slices",
  heroTitle: "Your Recipe Title",
  heroCopy: "Intro text for the recipe page hero.",
  ingredientsHeading: "For the cake",
  methodHeading: "Bake and serve",
  notesHeading: "Notes",
  ingredients: [
    {
      id: "flour",
      name: "plain flour",
      quantity: 200,
      unit: "g",
      format: { decimals: 0 }
    },
    {
      id: "eggs",
      name: "large eggs",
      quantity: 3,
      unit: "count",
      format: {
        countable: true,
        singular: "large egg",
        plural: "large eggs"
      }
    }
  ],
  steps: [
    [
      { type: "text", value: "Whisk together " },
      { type: "ingredient", id: "flour" },
      { type: "text", value: " and " },
      { type: "ingredient", id: "eggs" },
      { type: "text", value: "." }
    ]
  ],
  notes: [
    "Optional note."
  ]
}
```

### Ingredient fields

Each ingredient should have:

- `id`: unique within that recipe
- `name`: displayed ingredient name
- `quantity`: base quantity before scaling
- `unit`: for example `g`, `ml`, `tsp`, `tbsp`, or `count`
- `format`: controls how scaling is displayed

Common `format` options:

- `decimals`: maximum decimal precision before trimming trailing zeroes
- `fractions: true`: allows values like `1/2` or `1 1/2`
- `countable: true`: rounds to sensible whole numbers
- `singular` and `plural`: used when `unit` is `count`

### Search metadata

Each recipe should also include:

- `category`: a short label shown on the home page card
- `tags`: lowercase search terms for free-text search
- `searchTags`: human-friendly filter labels used for the clickable homepage filters

Recommended approach:

- keep `tags` broad and searchable, for example `["cake", "lemon", "dessert"]`
- keep `searchTags` clean and reusable across recipes, for example `["Dessert", "Cake", "Citrus"]`
- reuse existing `searchTags` where possible so the filter list stays tidy

### Method step structure

Each method step is an array of text fragments and ingredient references.

Example:

```js
[
  { type: "text", value: "Beat together " },
  { type: "ingredient", id: "butter" },
  { type: "text", value: " and " },
  { type: "ingredient", id: "sugar" },
  { type: "text", value: " until light." }
]
```

This is what lets the method update automatically when the scale changes.

### Partial ingredient quantities in the method

If a method step uses only part of an ingredient, add a `quantity` override on the step reference.

Example:

```js
{ type: "ingredient", id: "milk", quantity: 60, displayMode: "amountOnly" }
```

That means:

- use `60` as the base amount for that step
- scale it with the slider
- display only the amount, such as `120ml`, instead of `120ml milk`

### Display modes

Supported display modes currently used:

- `full`: amount plus ingredient name
- `amountOnly`: amount only

If `displayMode` is omitted, it defaults to `full`.

## Step 2: Add the HTML page

Create a new file in `recipes/` named after the slug.

Example:

- `recipes/banana-bread.html`

Use the same structure as the existing recipe pages and set the slug on `<body>`.

Example:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Favourite Recipes</title>
    <meta name="description" content="Recipe page" />
    <link rel="stylesheet" href="../styles.css" />
  </head>
  <body data-recipe-slug="banana-bread">
    ...
    <script type="module" src="../recipe-page.js"></script>
  </body>
</html>
```

The easiest approach is to copy one of the existing files in `recipes/` and change only:

- the filename
- the `data-recipe-slug`

Everything else can stay the same.

## Recommended Workflow For Future Recipes

1. Duplicate an existing recipe object in `data.js`
2. Update the text fields, ingredients, steps, and notes
3. Create a matching page in `recipes/`
4. Add sensible `tags` and `searchTags` so the recipe appears in the right homepage filters
5. Check that the `slug` matches the page filename and the `data-recipe-slug`
6. Run the site locally and test the slider at a few values like `0.5x`, `1x`, and `2x`
7. Check that awkward ingredients like eggs still read sensibly
8. Check that any split quantities in the method are correct

## Running Locally

If you want to preview the site locally:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/
```

## Good Rules To Follow When Adding Recipes

- Keep the ingredient list as the source of truth
- Reference ingredients from the method instead of hardcoding amounts in text
- Use `count` for things like eggs, lemons, or cinnamon sticks
- Use `countable: true` for ingredients that should round to whole values
- Use step-level `quantity` overrides for split-use ingredients
- Keep descriptions and tags useful so search works well
- Reuse existing `searchTags` before inventing new ones unless a new filter is genuinely useful

## Current Limitation

The site currently formats units sensibly, but it does not convert between unit systems. For example, it will scale `1.5 tsp` to `3 tsp`, but it will not automatically convert that to `1 tbsp`.

If you want that later, it can be added as a separate improvement in the shared scaling logic.
