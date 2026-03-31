import { defineCollection, z } from "astro:content";

const photoPathSchema = z.string().default("");

const ingredientFormatSchema = z.object({
  decimals: z.number().optional(),
  fractions: z.boolean().optional(),
  countable: z.boolean().optional(),
  singular: z.string().optional(),
  plural: z.string().optional(),
});

const ingredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  format: ingredientFormatSchema.default({}),
});

const recipes = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    searchTags: z.array(z.string()),
    baseYield: z.number(),
    yieldLabel: z.string(),
    heroTitle: z.string(),
    heroCopy: z.string(),
    ingredientsHeading: z.string(),
    methodHeading: z.string(),
    notesHeading: z.string(),
    photoAlt: z.string(),
    primaryPhoto: photoPathSchema,
    thumbnailPhoto: photoPathSchema,
    fallbackPhoto: photoPathSchema,
    photoCreditText: z.string().default(""),
    photoCreditUrl: z.string().default(""),
    ingredients: z.array(ingredientSchema),
    steps: z.array(z.string()),
    notes: z.array(z.string()),
  }),
});

export const collections = { recipes };
