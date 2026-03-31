export type IngredientFormat = {
  decimals?: number;
  fractions?: boolean;
  countable?: boolean;
  singular?: string;
  plural?: string;
};

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  format?: IngredientFormat;
};

export type RecipeSource = {
  title: string;
  description: string;
  category: string;
  tags: string[];
  searchTags: string[];
  baseYield: number;
  yieldLabel: string;
  heroTitle: string;
  heroCopy: string;
  ingredientsHeading: string;
  methodHeading: string;
  notesHeading: string;
  photoAlt: string;
  primaryPhoto?: string;
  thumbnailPhoto?: string;
  fallbackPhoto?: string;
  photoCreditText?: string;
  photoCreditUrl?: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  notes: string[];
};

export type RuntimeStepPart =
  | { type: "text"; value: string }
  | {
      type: "ingredient";
      id: string;
      quantity?: number;
      displayName?: string;
      displayMode?: "full" | "amountOnly";
    };

export type RuntimeRecipe = Omit<RecipeSource, "steps"> & {
  slug: string;
  steps: RuntimeStepPart[][];
};

export type RuntimeRecipeSummary = Pick<
  RuntimeRecipe,
  "slug" | "title" | "description" | "category" | "tags" | "searchTags" | "baseYield" | "yieldLabel"
> & {
  media: ReturnType<typeof buildMedia>;
};

const FRACTIONS = [
  { value: 0.25, label: "1/4" },
  { value: 1 / 3, label: "1/3" },
  { value: 0.5, label: "1/2" },
  { value: 2 / 3, label: "2/3" },
  { value: 0.75, label: "3/4" },
];

const PHOTO_PLACEHOLDER = "/assets/placeholders/recipe-photo.svg";

export function buildRuntimeRecipe(source: RecipeSource, slug: string): RuntimeRecipe {
  return {
    slug,
    ...source,
    primaryPhoto: normalizePhotoPath(source.primaryPhoto),
    thumbnailPhoto: normalizePhotoPath(source.thumbnailPhoto),
    fallbackPhoto: normalizePhotoPath(source.fallbackPhoto),
    steps: source.steps.map((step) => parseAnnotatedStep(step, source.ingredients)),
  };
}

export function buildRecipeSummary(source: RecipeSource, slug: string): RuntimeRecipeSummary {
  const runtimeRecipe = buildRuntimeRecipe(source, slug);
  return {
    slug: runtimeRecipe.slug,
    title: runtimeRecipe.title,
    description: runtimeRecipe.description,
    category: runtimeRecipe.category,
    tags: runtimeRecipe.tags,
    searchTags: runtimeRecipe.searchTags,
    baseYield: runtimeRecipe.baseYield,
    yieldLabel: runtimeRecipe.yieldLabel,
    media: buildMedia(runtimeRecipe),
  };
}

export function buildMedia(recipe: Pick<
  RecipeSource,
  "photoAlt" | "primaryPhoto" | "thumbnailPhoto" | "fallbackPhoto" | "photoCreditText" | "photoCreditUrl"
>) {
  const primarySrc = normalizePhotoPath(recipe.primaryPhoto);
  const thumbnailSrc = normalizePhotoPath(recipe.thumbnailPhoto);
  const fallbackSrc = normalizePhotoPath(recipe.fallbackPhoto);

  return {
    alt: recipe.photoAlt || "Recipe photo",
    primaryPhoto: primarySrc ? { src: primarySrc } : null,
    thumbnailPhoto: thumbnailSrc ? { src: thumbnailSrc } : null,
    fallbackPhoto: fallbackSrc
      ? {
          src: fallbackSrc,
          creditText: recipe.photoCreditText ?? "",
          creditUrl: recipe.photoCreditUrl ?? "",
        }
      : null,
  };
}

export function pickRecipePhoto(summary: RuntimeRecipeSummary | RuntimeRecipe) {
  const media = "media" in summary ? summary.media : buildMedia(summary);
  const chosen = media.thumbnailPhoto?.src
    ? media.thumbnailPhoto
    : media.primaryPhoto?.src
      ? media.primaryPhoto
      : media.fallbackPhoto?.src
        ? media.fallbackPhoto
        : null;

  return {
    src: chosen?.src ?? PHOTO_PLACEHOLDER,
    alt: media.alt ?? `${summary.title} recipe photo`,
  };
}

export function pickRecipeHeroPhoto(recipe: RuntimeRecipe) {
  const media = buildMedia(recipe);
  const chosen = media.primaryPhoto?.src
    ? media.primaryPhoto
    : media.fallbackPhoto?.src
      ? media.fallbackPhoto
      : null;

  return {
    src: chosen?.src ?? PHOTO_PLACEHOLDER,
    alt: media.alt ?? `${recipe.title} recipe photo`,
    creditText: chosen?.creditText ?? "",
    creditUrl: chosen?.creditUrl ?? "",
  };
}

export function createScaledIngredientMap(recipe: RuntimeRecipe, scale: number) {
  return new Map(
    recipe.ingredients.map((ingredient) => [
      ingredient.id,
      {
        ...ingredient,
        scaledQuantity: getScaledQuantity(ingredient, scale),
      },
    ]),
  );
}

export function formatYield(recipe: RuntimeRecipe, scale: number) {
  return Math.max(1, Math.round(recipe.baseYield * scale));
}

export function renderStepPart(
  step: RuntimeStepPart[],
  index: number,
  scaledIngredients: Map<string, RecipeIngredient & { scaledQuantity: number }>,
  scale: number,
) {
  const part = step[index];
  if (!part || part.type === "text") {
    return part?.type === "text" ? part.value : "";
  }

  const ingredient = scaledIngredients.get(part.id);
  if (!ingredient) {
    return "";
  }

  const displayMode = resolveStepPartDisplayMode(step, index, part, ingredient);
  return formatIngredient(
    Object.prototype.hasOwnProperty.call(part, "quantity")
      ? {
          ...ingredient,
          scaledQuantity: getScaledPartQuantity(ingredient, part.quantity ?? ingredient.quantity, scale),
          displayName: part.displayName,
        }
      : {
          ...ingredient,
          displayName: part.displayName,
        },
    displayMode,
  );
}

export function formatIngredient(
  ingredient: RecipeIngredient & { scaledQuantity: number; displayName?: string },
  mode: "full" | "amountOnly" = "full",
) {
  const labelOverride = ingredient.displayName?.trim();

  if (hasFreeTextUnit(ingredient.unit)) {
    if (mode === "amountOnly") {
      return ingredient.unit;
    }

    return `${labelOverride ?? ingredient.name} ${ingredient.unit}`.trim();
  }

  const amount = formatQuantity(ingredient.scaledQuantity, ingredient);

  if (ingredient.unit === "count") {
    if (mode === "amountOnly") {
      return amount;
    }

    if (labelOverride) {
      return `${amount} ${labelOverride}`;
    }

    const label =
      ingredient.scaledQuantity === 1
        ? ingredient.format?.singular ?? ingredient.name
        : ingredient.format?.plural ?? ingredient.name;

    return `${amount} ${label}`;
  }

  if (mode === "amountOnly") {
    return amount;
  }

  return `${amount} ${labelOverride ?? ingredient.name}`;
}

function parseAnnotatedStep(stepText: string, ingredients: RecipeIngredient[]): RuntimeStepPart[] {
  const pattern = /\[\[([\s\S]+?)\]\]/g;
  const parts: RuntimeStepPart[] = [];
  let cursor = 0;
  let match = pattern.exec(stepText);

  while (match) {
    if (match.index > cursor) {
      parts.push({ type: "text", value: stepText.slice(cursor, match.index) });
    }

    parts.push(parseIngredientToken(match[1], ingredients));
    cursor = match.index + match[0].length;
    match = pattern.exec(stepText);
  }

  if (cursor < stepText.length) {
    parts.push({ type: "text", value: stepText.slice(cursor) });
  }

  return parts.length ? mergeAdjacentTextParts(parts) : [{ type: "text", value: stepText }];
}

function parseIngredientToken(tokenText: string, ingredients: RecipeIngredient[]): RuntimeStepPart {
  const [id, ...attributes] = tokenText.split("|").map((part) => part.trim()).filter(Boolean);
  const ingredient = ingredients.find((candidate) => candidate.id === id);
  if (!ingredient) {
    return { type: "text", value: `[[${tokenText}]]` };
  }

  const token: RuntimeStepPart = {
    type: "ingredient",
    id,
  };

  attributes.forEach((attribute) => {
    const [key, rawValue] = attribute.split("=");
    const value = rawValue?.trim() ?? "";

    if (key === "quantity") {
      const quantity = Number(value);
      if (!Number.isNaN(quantity)) {
        token.quantity = quantity;
      }
      return;
    }

    if (key === "display" && value) {
      token.displayName = value;
      return;
    }

    if (key === "mode" && (value === "amountOnly" || value === "full")) {
      token.displayMode = value;
    }
  });

  return token;
}

function mergeAdjacentTextParts(parts: RuntimeStepPart[]) {
  return parts.reduce<RuntimeStepPart[]>((accumulator, part) => {
    const previous = accumulator[accumulator.length - 1];
    if (part.type === "text" && previous?.type === "text") {
      previous.value += part.value;
      return accumulator;
    }

    accumulator.push(part);
    return accumulator;
  }, []);
}

function resolveStepPartDisplayMode(
  step: RuntimeStepPart[],
  index: number,
  part: Exclude<RuntimeStepPart, { type: "text" }>,
  ingredient: RecipeIngredient & { scaledQuantity: number },
) {
  if (part.displayMode !== "amountOnly") {
    return part.displayMode ?? "full";
  }

  const context = `${step[index - 1]?.type === "text" ? step[index - 1].value : ""} ${
    step[index + 1]?.type === "text" ? step[index + 1].value : ""
  }`.toLowerCase();
  const labels = [ingredient.name, part.displayName]
    .filter(Boolean)
    .map((label) => String(label).toLowerCase().trim());

  return labels.some((label) => contextIncludesLabel(context, label)) ? "amountOnly" : "full";
}

function contextIncludesLabel(context: string, label: string) {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(label)}(?=[^a-z0-9]|$)`, "i");
  return pattern.test(context);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getScaledQuantity(ingredient: RecipeIngredient, scale: number) {
  return applyScalingRules(ingredient, ingredient.quantity * scale);
}

function getScaledPartQuantity(ingredient: RecipeIngredient, baseQuantity: number, scale: number) {
  return applyScalingRules(ingredient, baseQuantity * scale);
}

function applyScalingRules(ingredient: RecipeIngredient, rawQuantity: number) {
  const format = ingredient.format ?? {};
  if (format.countable) {
    return Math.max(1, Math.round(rawQuantity));
  }

  return rawQuantity;
}

function formatQuantity(quantity: number, ingredient: RecipeIngredient) {
  if (ingredient.unit === "count") {
    return String(quantity);
  }

  return `${formatNumber(quantity, ingredient.format ?? {})}${ingredient.unit}`;
}

function formatNumber(quantity: number, format: IngredientFormat) {
  if (format.fractions) {
    const fraction = toFractionString(quantity);
    if (fraction) {
      return fraction;
    }
  }

  const decimals = format.decimals ?? inferDecimals(quantity);
  return stripTrailingZeros(Number(quantity.toFixed(decimals)));
}

function inferDecimals(quantity: number) {
  if (Number.isInteger(quantity)) {
    return 0;
  }

  if (quantity < 5) {
    return 2;
  }

  return 1;
}

function stripTrailingZeros(value: number) {
  return value.toString().replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function toFractionString(quantity: number) {
  const whole = Math.floor(quantity);
  const fraction = quantity - whole;
  const tolerance = 0.08;
  const match = FRACTIONS.find((candidate) => Math.abs(fraction - candidate.value) <= tolerance);

  if (!match) {
    return null;
  }

  if (whole === 0) {
    return match.label;
  }

  return `${whole} ${match.label}`;
}

function hasFreeTextUnit(unit: string) {
  return typeof unit === "string" && /\s/.test(unit.trim()) && unit !== "count";
}

function normalizePhotoPath(path?: string) {
  if (!path) {
    return "";
  }

  if (path.startsWith("./")) {
    return path.slice(1);
  }

  return path;
}
