# Favourite Recipes

Static recipe website for GitHub Pages with:

- a searchable home page
- one shared recipe template page
- photo support on recipe cards and recipe pages
- ingredient quantities shown in both the ingredients list and the method
- a scaling slider on every recipe page

## What Exists So Far

The site currently has:

- a home page at `index.html`
- a shared recipe template at `recipe.html`
- a shared stylesheet at `styles.css`
- a recipe manifest at `recipes/index.json`
- one JSON file per recipe in `recipes/`
- a recipe photo convention under `assets/recipes/<slug>/`
- a local authoring utility at `tools/recipe-builder/`
- home page search/rendering logic in `home.js`
- shared recipe page rendering and scaling logic in `recipe-page.js`
- recipe data files in `recipes/`

Current recipes:

- `recipes/pastel-de-nata.json`
- `recipes/lemon-drizzle-cake.json`

## How It Works

### Home page

`index.html` loads `home.js`, which fetches `recipes/index.json` and renders recipe cards from the manifest.

The search box filters recipes by:

- title
- description
- category
- tags

The home page also renders clickable tag filters from each recipe's `searchTags` field so visitors can browse by category without typing.

### Recipe pages

There is now one shared recipe page at `recipe.html`.

`recipe-page.js` reads the `slug` query parameter, fetches `recipes/<slug>.json`, and renders:

- hero content
- recipe photo
- ingredient list
- method steps
- notes
- scaled yield

### Photos

Each recipe can define:

- a personal photo path in `media.primaryPhoto`
- a card image path in `media.thumbnailPhoto`
- a stock fallback in `media.fallbackPhoto`
- alt text in `media.alt`
- optional credit text and URL for stock images

The home page prefers `thumbnailPhoto`, then `primaryPhoto`, then `fallbackPhoto`, then a shared placeholder.

The recipe page prefers your own image when present, then falls back to `fallbackPhoto`, then to the shared placeholder.

Repo-owned recipe photos should live in:

- `assets/recipes/<slug>/`

### Scaling

Scaling is driven by the slider on each recipe page.

The renderer:

- scales every ingredient quantity
- updates ingredient amounts in the method steps
- rounds countable items like eggs to whole numbers
- formats small values as readable fractions where appropriate

This keeps the ingredient list and method aligned because both come from the same recipe data.

## Why This Structure Is Better

This is more sustainable than the earlier setup because:

- recipe content is no longer stored in one large source file
- each recipe lives in its own data file, so additions stay small and isolated
- there is only one recipe page template instead of repeated near-identical HTML files
- the home page only needs a small manifest rather than every full recipe payload

For a static GitHub Pages site, this gives you a cleaner content model without introducing a build system.

## File Overview

- `index.html`: searchable home page
- `recipe.html`: shared recipe template page
- `home.js`: fetches the recipe manifest, then renders and filters recipe cards
- `recipe-page.js`: fetches one recipe JSON file, then renders scaling and method content
- `styles.css`: shared styling for home and recipe pages
- `assets/placeholders/recipe-photo.svg`: fallback image when no recipe photo is available
- `assets/recipes/<slug>/`: your own recipe photos
- `recipes/index.json`: lightweight list used by the home page
- `recipes/*.json`: one full recipe per file
- `tools/recipe-builder/`: local recipe creation tool

## Adding A New Recipe

Adding a new recipe requires two steps:

1. Add the recipe JSON file in `recipes/`
2. Add the recipe summary to `recipes/index.json`

The manifest is the array stored in:

- `recipes/index.json`

Each recipe contributes one object to that array. The homepage reads this file to build the recipe cards, thumbnails, search index, and filter tags.

### Step 1: Add the recipe JSON file

Create a new file such as `recipes/banana-bread.json`.

Use this structure:

```json
{
  "slug": "your-recipe-slug",
  "title": "Your Recipe Title",
  "description": "Short description for the home page.",
  "category": "Cake",
  "tags": ["tag-one", "tag-two"],
  "searchTags": ["Dessert", "Cake", "Easy"],
  "media": {
    "alt": "Photo description for accessibility.",
    "primaryPhoto": {
      "src": "./assets/recipes/your-recipe-slug/hero.jpg"
    },
    "fallbackPhoto": {
      "src": "https://example.com/stock-photo.jpg",
      "creditText": "Photo by Name on Source",
      "creditUrl": "https://example.com/source-page"
    }
  },
  "baseYield": 8,
  "yieldLabel": "slices",
  "heroTitle": "Your Recipe Title",
  "heroCopy": "Intro text for the recipe page hero.",
  "ingredientsHeading": "For the cake",
  "methodHeading": "Bake and serve",
  "notesHeading": "Notes",
  "ingredients": [
    {
      "id": "flour",
      "name": "plain flour",
      "quantity": 200,
      "unit": "g",
      "format": { "decimals": 0 }
    },
    {
      "id": "eggs",
      "name": "large eggs",
      "quantity": 3,
      "unit": "count",
      "format": {
        "countable": true,
        "singular": "large egg",
        "plural": "large eggs"
      }
    }
  ],
  "steps": [
    [
      { "type": "text", "value": "Whisk together " },
      { "type": "ingredient", "id": "flour" },
      { "type": "text", "value": " and " },
      { "type": "ingredient", "id": "eggs" },
      { "type": "text", "value": "." }
    ]
  ],
  "notes": [
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

### Photo metadata

Each recipe can include:

- `media.alt`: alt text for the recipe image
- `media.primaryPhoto.src`: your own preferred image path
- `media.thumbnailPhoto.src`: the image used on the home page card
- `media.fallbackPhoto.src`: a stock image URL used only when no personal image is set
- `media.fallbackPhoto.creditText` and `media.fallbackPhoto.creditUrl`: attribution for stock images

Recommended approach:

- keep your own photo in `assets/recipes/<slug>/`
- point `primaryPhoto.src` at that local asset when available
- use the same local photo for `thumbnailPhoto.src` unless you have a separate crop
- if you do not yet have a real image, point both `thumbnailPhoto.src` and `fallbackPhoto.src` at `./assets/placeholders/recipe-photo.svg`
- do not borrow another recipe's image just to make the card render

### Builder photo output

The recipe builder now exports a complete safe `media` block even when you leave the image fields blank:

- `primaryPhoto` stays `null`
- `thumbnailPhoto` defaults to `./assets/placeholders/recipe-photo.svg`
- `fallbackPhoto` defaults to that same placeholder with empty credits

That means new recipes should still appear on the home page and recipe page without needing a copied media block from an older recipe.

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

### Step 2: Add the recipe to the manifest

Add a summary entry to `recipes/index.json` using the same:

- `slug`
- `title`
- `description`
- `category`
- `tags`
- `searchTags`
- `media`
- `baseYield`
- `yieldLabel`

The home page uses this file to build the recipe list and filters, so the summary should stay lightweight.

In practice:

- open `recipes/index.json`
- add a new object to the top-level array
- use the builder's `Manifest entry output` box as the exact object to paste in
- keep the JSON comma-separated correctly between entries

The builder does not automatically write into `recipes/index.json`; it gives you the exact manifest object to paste into that file.

## Recommended Workflow For Future Recipes

1. Copy an existing recipe JSON file in `recipes/`
2. Update the text fields, ingredients, steps, and notes
3. Add a lightweight summary entry to `recipes/index.json`
4. Add sensible `tags` and `searchTags` so the recipe appears in the right homepage filters
5. Check that the `slug` matches the recipe JSON filename
6. Open `recipe.html?slug=your-recipe-slug` locally
7. Test the slider at a few values like `0.5x`, `1x`, and `2x`
8. Check that awkward ingredients like eggs still read sensibly
9. Check that any split quantities in the method are correct
10. Add a personal photo path or a stock fallback in `media`

## Recipe Builder

The easiest way to add recipes now is to use the local builder:

- `tools/recipe-builder/index.html`

The builder helps with three input styles:

- pasted plain text
- a recipe website URL
- a photo of a recipe page

What it does:

- creates an editable draft instead of making you write raw JSON
- exports the full `recipes/<slug>.json`
- exports the matching manifest entry for `recipes/index.json`
- lets you fill in photo paths and stock fallbacks

### Builder workflow

1. Open `tools/recipe-builder/index.html` in the local site.
2. Paste recipe text, add a URL, or upload a recipe photo.
3. Optionally add an OpenAI API key for AI-assisted imports.
4. Review the generated draft fields.
5. Export the recipe JSON and manifest entry.
6. Save the recipe JSON as `recipes/<slug>.json`.
7. Paste the manifest output into the array in `recipes/index.json`.
8. Save any personal photo under `assets/recipes/<slug>/`.
9. Commit the updated JSON and image assets.

### Builder notes

- Plain text parsing works without an API key.
- URL imports use a readable-text fetch helper and may still need a pasted page extract if a site blocks access.
- Photo imports work best with an API key; otherwise add OCR text manually.
- Generated steps are tokenised automatically, but complex split quantities may still need manual cleanup.

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
- Keep `recipes/index.json` small by storing only summary data there
- Keep your own recipe photos in `assets/recipes/<slug>/`
- Always set useful `media.alt` text for accessibility

## Current Limitation

The site currently formats units sensibly, but it does not convert between unit systems. For example, it will scale `1.5 tsp` to `3 tsp`, but it will not automatically convert that to `1 tbsp`.

If you want that later, it can be added as a separate improvement in the shared scaling logic.
