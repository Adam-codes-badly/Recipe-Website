# Favourite Recipes

Astro-based static recipe site with:

- an Astro-generated homepage
- one static route per recipe under `src/pages/recipes/[slug].astro`
- recipe content stored in `src/content/recipes/`
- live client-side scaling on recipe pages
- a local builder that exports Astro recipe source files

## Structure

- `src/content/recipes/`: one recipe source file per recipe
- `src/content/config.ts`: content collection schema
- `src/pages/index.astro`: homepage
- `src/pages/recipes/[slug].astro`: recipe page route
- `src/lib/recipe-runtime.ts`: build-time parsing and runtime scaling helpers
- `src/styles/global.css`: shared site styles
- `public/assets/`: public images and placeholders
- `public/tools/recipe-builder/`: local recipe builder

## Recipe Source Format

Each recipe lives in a Markdown file in `src/content/recipes/`.

The frontmatter stores:

- metadata such as title, description, category, yield, tags, and media
- ingredients as structured objects with ids and formatting rules
- `steps` as readable strings
- `notes` as a string list

Method steps use explicit annotations when they need scaling-aware ingredient references:

- `[[ingredient-id]]`
- `[[ingredient-id|quantity=3]]`
- `[[ingredient-id|quantity=3|mode=amountOnly]]`
- `[[ingredient-id|display=cooked chickpeas]]`

These are parsed at build time into the compact runtime structure the slider uses in the browser.

## Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

For local builds in restricted environments, set `ASTRO_TELEMETRY_DISABLED=1`.

## Builder

The local builder lives at `/tools/recipe-builder/` when the Astro dev server is running.

It can:

- import recipe drafts from plain text, URLs, or recipe-book photos
- let you review metadata, ingredients, steps, and notes
- export a ready-to-commit recipe source file for `src/content/recipes/<slug>.md`

The builder is still heuristic. Review generated step annotations before committing complex recipes.
