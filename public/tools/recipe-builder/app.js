const STORAGE_KEY = "recipe-builder-openai-key";
const MODEL_KEY = "recipe-builder-openai-model";
const DEFAULT_MODEL = "gpt-5-mini";
const PHOTO_PLACEHOLDER = "/assets/placeholders/recipe-photo.svg";
const IMPORT_FALLBACK_ASPECT_RATIO = 16 / 6;
const IMPORT_FALLBACK_MAX_WIDTH = 1600;
const EXISTING_CATEGORIES = ["Breakfast", "Dessert", "Dip", "Main", "Side", "Recipe"];
const EXISTING_INGREDIENT_TAGS = ["broccoli", "butter", "chickpeas", "custard", "lemon"];
const CATEGORY_SYNONYMS = {
  cake: "Dessert",
  dessert: "Dessert",
  pastry: "Dessert",
  pudding: "Dessert",
  tart: "Dessert",
  baking: "Dessert",
  breakfast: "Breakfast",
  brunch: "Breakfast",
  dip: "Dip",
  spread: "Dip",
  mezze: "Dip",
  main: "Main",
  dinner: "Main",
  lunch: "Main",
  side: "Side",
  salad: "Side",
  starter: "Side",
};
const GENERIC_ALIAS_WORDS = new Set([
  "oil",
  "sugar",
  "salt",
  "water",
  "milk",
  "flour",
  "juice",
  "dressing",
  "sauce",
  "powder",
]);

const appState = {
  mode: "plain",
  uploadedPhotoDataUrl: "",
  uploadedFallbackPhotoDataUrl: "",
  urlFallbackPhotoSrc: "",
  draft: createEmptyDraft(),
};

const refs = {
  apiKey: document.querySelector("#api-key"),
  apiModel: document.querySelector("#api-model"),
  importStatus: document.querySelector("#import-status"),
  plainText: document.querySelector("#plain-text"),
  recipeUrl: document.querySelector("#recipe-url"),
  urlText: document.querySelector("#url-text"),
  photoInput: document.querySelector("#recipe-photo-input"),
  photoPreview: document.querySelector("#photo-preview"),
  modeTabs: [...document.querySelectorAll(".mode-tab")],
  modePanels: [...document.querySelectorAll(".mode-panel")],
  generateDraft: document.querySelector("#generate-draft"),
  fetchUrl: document.querySelector("#fetch-url"),
  resetDraft: document.querySelector("#reset-draft"),
  title: document.querySelector("#field-title"),
  slug: document.querySelector("#field-slug"),
  category: document.querySelector("#field-category"),
  yieldLabel: document.querySelector("#field-yield-label"),
  baseYield: document.querySelector("#field-base-yield"),
  heroTitle: document.querySelector("#field-hero-title"),
  description: document.querySelector("#field-description"),
  heroCopy: document.querySelector("#field-hero-copy"),
  ingredientsHeading: document.querySelector("#field-ingredients-heading"),
  methodHeading: document.querySelector("#field-method-heading"),
  notesHeading: document.querySelector("#field-notes-heading"),
  tags: document.querySelector("#field-tags"),
  searchTags: document.querySelector("#field-search-tags"),
  photoAlt: document.querySelector("#field-photo-alt"),
  primaryPhoto: document.querySelector("#field-primary-photo"),
  fallbackPhoto: document.querySelector("#field-fallback-photo"),
  photoCreditText: document.querySelector("#field-photo-credit-text"),
  photoCreditUrl: document.querySelector("#field-photo-credit-url"),
  ingredientsEditor: document.querySelector("#ingredients-editor"),
  stepsEditor: document.querySelector("#steps-editor"),
  notesEditor: document.querySelector("#notes-editor"),
  addIngredient: document.querySelector("#add-ingredient"),
  addStep: document.querySelector("#add-step"),
  addNote: document.querySelector("#add-note"),
  recipeOutput: document.querySelector("#recipe-json-output"),
  manifestOutput: document.querySelector("#manifest-json-output"),
  copyRecipe: document.querySelector("#copy-recipe-json"),
  copyManifest: document.querySelector("#copy-manifest-json"),
  downloadRecipe: document.querySelector("#download-recipe-json"),
  photoText: document.querySelector("#photo-text"),
};

bootstrap();

function bootstrap() {
  refs.apiKey.value = localStorage.getItem(STORAGE_KEY) ?? "";
  refs.apiModel.value = localStorage.getItem(MODEL_KEY) ?? DEFAULT_MODEL;

  refs.apiKey.addEventListener("change", () => {
    localStorage.setItem(STORAGE_KEY, refs.apiKey.value.trim());
  });

  refs.apiModel.addEventListener("change", () => {
    localStorage.setItem(MODEL_KEY, refs.apiModel.value.trim() || DEFAULT_MODEL);
  });

  refs.modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  });

  refs.photoInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    appState.uploadedPhotoDataUrl = file ? await fileToDataUrl(file) : "";
    appState.uploadedFallbackPhotoDataUrl = appState.uploadedPhotoDataUrl
      ? await cropImageToAspect(appState.uploadedPhotoDataUrl, IMPORT_FALLBACK_ASPECT_RATIO)
      : "";
    refs.photoPreview.src = appState.uploadedFallbackPhotoDataUrl || appState.uploadedPhotoDataUrl;
  });

  refs.fetchUrl.addEventListener("click", fetchReadableUrl);
  refs.generateDraft.addEventListener("click", generateDraft);
  refs.resetDraft.addEventListener("click", resetDraft);
  refs.addIngredient.addEventListener("click", () => {
    appState.draft.ingredients.push(createIngredientDraft());
    syncFormFromDraft();
  });
  refs.addStep.addEventListener("click", () => {
    appState.draft.stepsText.push("");
    syncFormFromDraft();
  });
  refs.addNote.addEventListener("click", () => {
    appState.draft.notes.push("");
    syncFormFromDraft();
  });

  bindTopLevelFields();
  bindCopyButtons();
  syncFormFromDraft();
}

function bindTopLevelFields() {
  const bindings = [
    [refs.title, "title"],
    [refs.slug, "slug"],
    [refs.category, "category"],
    [refs.yieldLabel, "yieldLabel"],
    [refs.baseYield, "baseYield"],
    [refs.heroTitle, "heroTitle"],
    [refs.description, "description"],
    [refs.heroCopy, "heroCopy"],
    [refs.ingredientsHeading, "ingredientsHeading"],
    [refs.methodHeading, "methodHeading"],
    [refs.notesHeading, "notesHeading"],
    [refs.photoAlt, "photoAlt"],
    [refs.primaryPhoto, "primaryPhoto"],
    [refs.fallbackPhoto, "fallbackPhoto"],
    [refs.photoCreditText, "photoCreditText"],
    [refs.photoCreditUrl, "photoCreditUrl"],
  ];

  bindings.forEach(([element, key]) => {
    element.addEventListener("input", () => {
      appState.draft[key] = key === "baseYield" ? Number(element.value || 1) : element.value;
      if (key === "title" && !refs.slug.dataset.manuallyEdited) {
        appState.draft.slug = slugify(element.value);
      }
      if (key === "title" && !appState.draft.heroTitle) {
        appState.draft.heroTitle = element.value;
      }
      syncFormFromDraft();
    });
  });

  refs.slug.addEventListener("input", () => {
    refs.slug.dataset.manuallyEdited = "true";
  });

  refs.tags.addEventListener("input", () => {
    appState.draft.tags = splitCommaList(refs.tags.value);
    refreshOutputs();
  });

  refs.searchTags.addEventListener("input", () => {
    appState.draft.searchTags = splitCommaList(refs.searchTags.value);
    refreshOutputs();
  });
}

function bindCopyButtons() {
  refs.copyRecipe.addEventListener("click", () => copyText(refs.recipeOutput.value, "Recipe source copied."));
  refs.copyManifest.addEventListener("click", () => copyText(refs.manifestOutput.value, "Card preview copied."));
  refs.downloadRecipe.addEventListener("click", downloadRecipeSource);
}

function setMode(mode) {
  appState.mode = mode;
  refs.modeTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === mode));
  refs.modePanels.forEach((panel) => panel.classList.toggle("is-active", panel.id === `mode-${mode}`));
}

async function fetchReadableUrl() {
  const url = refs.recipeUrl.value.trim();
  if (!url) {
    setStatus("Add a recipe URL first.");
    return;
  }

  setStatus("Fetching readable page text...");

  try {
    const readableUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`;
    const response = await fetch(readableUrl);
    if (!response.ok) {
      throw new Error("URL fetch failed");
    }
    refs.urlText.value = await response.text();
    appState.urlFallbackPhotoSrc = await buildUrlFallbackPhoto(url, refs.urlText.value);
    setStatus(
      appState.urlFallbackPhotoSrc
        ? "Readable page text and fallback image fetched. Generate the draft when ready."
        : "Readable page text fetched. Generate the draft when ready.",
    );
  } catch (error) {
    setStatus("Direct URL fetch failed. Paste page text or HTML into the URL text box and try again.");
  }
}

async function generateDraft() {
  setStatus("Generating recipe draft...");

  try {
    const draft = await buildDraftFromCurrentMode();
    const enrichedDraft = await applyImportedFallbackMedia(draft);
    appState.draft = normalizeDraft(enrichedDraft);
    refs.slug.dataset.manuallyEdited = "";
    syncFormFromDraft();
    setStatus("Draft generated. Review the fields below before exporting.");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Draft generation failed.");
  }
}

async function buildDraftFromCurrentMode() {
  const apiKey = refs.apiKey.value.trim();
  const mode = appState.mode;

  if (apiKey) {
    return generateWithOpenAI(mode, apiKey, refs.apiModel.value.trim() || DEFAULT_MODEL);
  }

  if (mode === "plain") {
    return heuristicDraftFromText(refs.plainText.value);
  }

  if (mode === "url") {
    return heuristicDraftFromText(refs.urlText.value);
  }

  if (mode === "photo" && refs.photoText.value.trim()) {
    return heuristicDraftFromText(refs.photoText.value);
  }

  throw new Error("Photo and URL imports work best with an API key. Without one, add extracted text and try again.");
}

async function generateWithOpenAI(mode, apiKey, model) {
  const content = [
    {
      type: "input_text",
      text: buildPrompt(mode),
    },
  ];

  if (mode === "plain") {
    content.push({ type: "input_text", text: refs.plainText.value.trim() });
  }

  if (mode === "url") {
    const sourceText = refs.urlText.value.trim() || refs.recipeUrl.value.trim();
    content.push({ type: "input_text", text: sourceText });
  }

  if (mode === "photo") {
    if (!appState.uploadedPhotoDataUrl && !refs.photoText.value.trim()) {
      throw new Error("Upload a photo or paste OCR text before generating.");
    }

    if (appState.uploadedPhotoDataUrl) {
      content.push({
        type: "input_image",
        image_url: appState.uploadedPhotoDataUrl,
      });
    }

    if (refs.photoText.value.trim()) {
      content.push({ type: "input_text", text: refs.photoText.value.trim() });
    }
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "recipe_builder_draft",
          strict: true,
          schema: builderSchema(),
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${errorBody}`);
  }

  const payload = await response.json();
  const outputText = payload.output_text ?? extractOutputText(payload.output);

  if (!outputText) {
    throw new Error("No JSON draft was returned.");
  }

  return JSON.parse(outputText);
}

function buildPrompt(mode) {
  return [
    "Turn the provided recipe source into a draft for an Astro-based static recipe website.",
    "Return only JSON matching the schema.",
    "Use concise but useful title, description, hero copy, and headings.",
    "Prefer sensible UK kitchen units.",
    `Prefer the existing category set: ${EXISTING_CATEGORIES.join(", ")}.`,
    `Prefer reusing existing ingredient tags: ${EXISTING_INGREDIENT_TAGS.join(", ")}.`,
    "Keep taxonomy tight: use one category and no more than one ingredient tag unless an existing tag clearly does not fit.",
    "Only introduce a brand-new ingredient tag if none of the existing ingredient tags fit the recipe at all.",
    "searchTags should mirror the chosen category plus ingredient tag in title case.",
    "Set photoAlt based on the dish.",
    "Leave primaryPhoto empty.",
    "Never invent or borrow another recipe's image.",
    "The app may populate fallbackPhoto from the source page image or uploaded photo after generation.",
    "Only set fallbackPhoto or photo credit fields yourself when the source explicitly provides a better image and attribution.",
    "If no source image is available, empty photo fields should mean the site uses a shared placeholder image until a real photo is added.",
    "Method steps should be plain text steps. Do not tokenise them.",
    "If the recipe is split into multiple parts, components, sub-recipes, or staged sections, include all of them in one draft. Do not stop after the first part.",
    "For multipart recipes, merge all ingredient sections into one ingredients array and preserve the full method in order across every section.",
    "If the source has subsection headings such as 'for the chickpeas', 'for the hummus', 'for the dressing', or 'to serve', keep those distinctions clear in the plain-text steps.",
    "When reading from a photo or OCR text, capture the entire visible recipe, including continuation text, side columns, lower-page sections, and any second-stage method that appears after the first preparation block.",
    "Do not collapse later sections into notes or summary text. Every actionable instruction belongs in stepsText, in the original cooking order.",
    "Write steps so they still read naturally after ingredient references are converted into structured annotations.",
    "Never leave a quantity hanging without the ingredient name nearby. Write '2 tbsp lemon juice', not just '2 tbsp'.",
    "On the first practical use of an ingredient, write the measurement and ingredient name together so it can be highlighted as the initial fetch-and-measure mention.",
    "After the first practical use, later references may use the ingredient name normally without repeating the full measurement unless the source recipe does so for a real cooking reason.",
    "If an ingredient changes state later in the recipe, explicitly name that new state in the step text, for example 'cooked chickpeas' or 'garlic oil'.",
    `Source mode: ${mode}.`,
  ].join(" ");
}

function builderSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "title",
      "slug",
      "description",
      "category",
      "tags",
      "searchTags",
      "baseYield",
      "yieldLabel",
      "heroTitle",
      "heroCopy",
      "ingredientsHeading",
      "methodHeading",
      "notesHeading",
      "photoAlt",
      "primaryPhoto",
      "fallbackPhoto",
      "photoCreditText",
      "photoCreditUrl",
      "ingredients",
      "stepsText",
      "notes",
    ],
    properties: {
      title: { type: "string" },
      slug: { type: "string" },
      description: { type: "string" },
      category: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      searchTags: { type: "array", items: { type: "string" } },
      baseYield: { type: "number" },
      yieldLabel: { type: "string" },
      heroTitle: { type: "string" },
      heroCopy: { type: "string" },
      ingredientsHeading: { type: "string" },
      methodHeading: { type: "string" },
      notesHeading: { type: "string" },
      photoAlt: { type: "string" },
      primaryPhoto: { type: "string" },
      fallbackPhoto: { type: "string" },
      photoCreditText: { type: "string" },
      photoCreditUrl: { type: "string" },
      ingredients: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "quantity", "unit", "countable", "fractions", "singular", "plural"],
          properties: {
            name: { type: "string" },
            quantity: { type: "number" },
            unit: { type: "string" },
            countable: { type: "boolean" },
            fractions: { type: "boolean" },
            singular: { type: "string" },
            plural: { type: "string" },
          },
        },
      },
      stepsText: { type: "array", items: { type: "string" } },
      notes: { type: "array", items: { type: "string" } },
    },
  };
}

function extractOutputText(output) {
  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => item.content ?? [])
    .map((item) => item.text ?? "")
    .join("");
}

function heuristicDraftFromText(rawText) {
  const text = rawText.trim();
  if (!text) {
    throw new Error("Add some recipe text first.");
  }

  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const title = lines[0] ?? "Untitled Recipe";
  const sections = splitSections(text);
  const ingredientLines = sections.ingredients.length ? sections.ingredients : lines.filter((line) => looksLikeIngredient(line));
  const stepLines = sections.method.length ? splitSteps(sections.method.join("\n")) : splitSteps(text);
  const ingredients = ingredientLines.map(parseIngredientLine).filter(Boolean);
  const description = sections.description[0] ?? `A draft recipe for ${title}.`;
  const category = inferCategory(title, description);
  const yieldMatch = text.match(/(?:makes|serves)\s+(\d+)\s+([a-z ]+)/i);
  const baseYield = yieldMatch ? Number(yieldMatch[1]) : 4;
  const yieldLabel = yieldMatch ? yieldMatch[2].trim() : "servings";
  const tags = inferTags(title, description, category);

  return normalizeDraft({
    title,
    slug: slugify(title),
    description,
    category,
    tags,
    searchTags: inferSearchTags(category, tags),
    baseYield,
    yieldLabel,
    heroTitle: title,
    heroCopy: description,
    ingredientsHeading: "Ingredients",
    methodHeading: "Method",
    notesHeading: "Notes",
    photoAlt: `${title} recipe photo`,
    primaryPhoto: "",
    fallbackPhoto: "",
    photoCreditText: "",
    photoCreditUrl: "",
    ingredients,
    stepsText: stepLines,
    notes: sections.notes.length ? sections.notes : [],
  });
}

function splitSections(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const sections = { description: [], ingredients: [], method: [], notes: [] };
  let current = "description";

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    if (/^ingredients?$/i.test(trimmed)) {
      current = "ingredients";
      return;
    }

    if (/^(method|instructions?|directions?)$/i.test(trimmed)) {
      current = "method";
      return;
    }

    if (/^notes?$/i.test(trimmed)) {
      current = "notes";
      return;
    }

    sections[current].push(trimmed.replace(/^[-*]\s*/, ""));
  });

  return sections;
}

function splitSteps(text) {
  const numbered = text
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+[.)]\s*/, ""));

  if (numbered.length > 1) {
    return numbered;
  }

  return text
    .split(/\.(?=\s+[A-Z]|\s*$)/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.endsWith(".") ? line : `${line}.`));
}

function looksLikeIngredient(line) {
  return /^\d|^½|^¼|^¾|^one\b|^two\b|^three\b/i.test(line);
}

function parseIngredientLine(line) {
  const normalized = normalizeFractions(line.replace(/^[-*]\s*/, "").trim());
  const match = normalized.match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)?\s*([A-Za-z]+)?\s*(.+)$/);

  if (!match) {
    return createIngredientDraft({ name: normalized });
  }

  const quantity = parseQuantity(match[1] || "1");
  const unitCandidate = (match[2] || "").toLowerCase();
  const unit = normalizeUnit(unitCandidate, match[3]);
  const name = match[3].replace(/^of\s+/i, "").trim();
  const countable = unit === "count";

  return createIngredientDraft({
    name,
    quantity,
    unit,
    countable,
    fractions: !countable && (quantity % 1 !== 0 || ["tsp", "tbsp"].includes(unit)),
    singular: countable ? singularize(name) : "",
    plural: countable ? pluralize(name) : "",
  });
}

function normalizeFractions(text) {
  return text
    .replace(/½/g, "1/2")
    .replace(/¼/g, "1/4")
    .replace(/¾/g, "3/4")
    .replace(/⅓/g, "1/3")
    .replace(/⅔/g, "2/3");
}

function parseQuantity(input) {
  const parts = input.trim().split(/\s+/);

  if (parts.length === 2 && parts[1].includes("/")) {
    return Number(parts[0]) + parseFraction(parts[1]);
  }

  if (input.includes("/")) {
    return parseFraction(input);
  }

  return Number(input) || 1;
}

function parseFraction(input) {
  const [numerator, denominator] = input.split("/").map(Number);
  if (!numerator || !denominator) {
    return 0;
  }
  return numerator / denominator;
}

function normalizeUnit(unit, name) {
  const unitMap = {
    g: "g",
    kg: "kg",
    ml: "ml",
    l: "l",
    tsp: "tsp",
    tsps: "tsp",
    tbsp: "tbsp",
    tbsps: "tbsp",
    cup: "cup",
    cups: "cup",
  };

  if (unitMap[unit]) {
    return unitMap[unit];
  }

  if (/(egg|lemon|lime|clove|stick|onion|apple|pear)/i.test(name)) {
    return "count";
  }

  return unit || "count";
}

function inferCategory(title, description) {
  const haystack = `${title} ${description}`.toLowerCase();

  if (/cake|loaf|traybake/.test(haystack)) {
    return "Dessert";
  }
  if (/hummus|dip|spread/.test(haystack)) {
    return "Dip";
  }
  if (/croissant|bun|toast|granola|breakfast/.test(haystack)) {
    return "Breakfast";
  }
  if (/salad|side|slaw/.test(haystack)) {
    return "Side";
  }
  if (/tart|pastry|nata|pudding|custard|dessert/.test(haystack)) {
    return "Dessert";
  }
  if (/pasta|soup|stew|curry|roast|main/.test(haystack)) {
    return "Main";
  }
  return "Recipe";
}

function inferTags(title, description, category) {
  const haystack = `${title} ${description}`.toLowerCase();
  const tags = [];

  const ingredientTags = [
    "chickpeas",
    "broccoli",
    "lemon",
    "custard",
    "butter",
    "chocolate",
    "tomato",
    "chicken",
    "salmon",
    "mushroom",
    "potato",
  ];

  const mainIngredient = ingredientTags.find((tag) => haystack.includes(tag));
  if (mainIngredient) {
    tags.push(mainIngredient);
  }

  const categoryTag = category.toLowerCase();
  if (categoryTag !== "recipe") {
    tags.push(categoryTag);
  }

  return [...new Set(tags)];
}

function inferSearchTags(category, tags) {
  return [...new Set([category, ...tags.map((tag) => titleCase(tag))])];
}

async function applyImportedFallbackMedia(draft) {
  const nextDraft = { ...draft };

  if (appState.mode === "photo" && appState.uploadedFallbackPhotoDataUrl) {
    nextDraft.fallbackPhoto = appState.uploadedFallbackPhotoDataUrl;
  }

  if (appState.mode === "url") {
    if (!appState.urlFallbackPhotoSrc && refs.recipeUrl.value.trim()) {
      appState.urlFallbackPhotoSrc = await buildUrlFallbackPhoto(
        refs.recipeUrl.value.trim(),
        refs.urlText.value.trim(),
      );
    }

    if (appState.urlFallbackPhotoSrc) {
      nextDraft.fallbackPhoto = appState.urlFallbackPhotoSrc;
      nextDraft.photoCreditUrl = nextDraft.photoCreditUrl || refs.recipeUrl.value.trim();
    }
  }

  return nextDraft;
}

async function buildUrlFallbackPhoto(pageUrl, readableText = "") {
  const candidates = [];

  try {
    const response = await fetch(pageUrl);
    if (response.ok) {
      const html = await response.text();
      candidates.push(...extractImageUrlsFromHtml(html, pageUrl));
    }
  } catch (error) {
    // Some recipe sites block direct browser fetches. In that case we fall back to readable text only.
  }

  candidates.push(...extractImageUrlsFromText(readableText, pageUrl));

  const uniqueCandidates = [...new Set(candidates)].filter(Boolean);
  for (const candidate of uniqueCandidates) {
    const cropped = await tryCropRemoteImage(candidate);
    if (cropped) {
      return cropped;
    }

    if (looksLikeImageUrl(candidate)) {
      return candidate;
    }
  }

  return "";
}

function extractImageUrlsFromHtml(html, baseUrl) {
  if (!html.trim()) {
    return [];
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const selectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[property="twitter:image"]',
    'meta[itemprop="image"]',
    'link[rel="image_src"]',
    "img[src]",
  ];

  return selectors.flatMap((selector) =>
    [...doc.querySelectorAll(selector)]
      .map((node) => node.getAttribute("content") || node.getAttribute("href") || node.getAttribute("src") || "")
      .map((value) => resolveUrl(value, baseUrl))
      .filter(looksLikeImageUrl),
  );
}

function extractImageUrlsFromText(text, baseUrl) {
  const patterns = [
    /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi,
    /(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|avif))/gi,
  ];

  return patterns.flatMap((pattern) => {
    const urls = [];
    let match = pattern.exec(text);
    while (match) {
      urls.push(resolveUrl(match[1], baseUrl));
      match = pattern.exec(text);
    }
    return urls.filter(looksLikeImageUrl);
  });
}

function resolveUrl(value, baseUrl) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, baseUrl).href;
  } catch (error) {
    return "";
  }
}

function looksLikeImageUrl(url) {
  return /^https?:\/\//i.test(url) && /\.(jpg|jpeg|png|webp|avif)(?:[?#].*)?$/i.test(url);
}

async function tryCropRemoteImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return "";
    }

    const blob = await response.blob();
    const dataUrl = await fileToDataUrl(blob);
    return cropImageToAspect(dataUrl, IMPORT_FALLBACK_ASPECT_RATIO);
  } catch (error) {
    return "";
  }
}

async function cropImageToAspect(source, aspectRatio) {
  const image = await loadImage(source);
  const sourceAspectRatio = image.width / image.height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (sourceAspectRatio > aspectRatio) {
    sourceWidth = image.height * aspectRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / aspectRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  const targetWidth = Math.min(IMPORT_FALLBACK_MAX_WIDTH, Math.round(sourceWidth));
  const targetHeight = Math.round(targetWidth / aspectRatio);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return source;
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function normalizeCategory(category, title = "", description = "") {
  const raw = String(category || "").trim();
  if (!raw) {
    return inferCategory(title, description);
  }

  const canonical = CATEGORY_SYNONYMS[raw.toLowerCase()];
  if (canonical) {
    return canonical;
  }

  const titleCased = titleCase(raw);
  if (EXISTING_CATEGORIES.includes(titleCased)) {
    return titleCased;
  }

  return inferCategory(title, description);
}

function normalizeTags(tags, category, title = "", description = "") {
  const haystack = `${title} ${description}`.toLowerCase();
  const incoming = Array.isArray(tags) ? tags : [];
  const normalized = [];

  const existingIngredient = EXISTING_INGREDIENT_TAGS.find((tag) => haystack.includes(tag));
  if (existingIngredient) {
    normalized.push(existingIngredient);
  } else {
    const firstNovelIngredient = incoming
      .map((tag) => String(tag || "").trim().toLowerCase())
      .find((tag) => tag && tag !== category.toLowerCase() && !CATEGORY_SYNONYMS[tag]);

    if (firstNovelIngredient) {
      normalized.push(firstNovelIngredient);
    }
  }

  const categoryTag = category.toLowerCase();
  if (categoryTag !== "recipe") {
    normalized.push(categoryTag);
  }

  return [...new Set(normalized)].slice(0, 2);
}

function syncFormFromDraft() {
  refs.title.value = appState.draft.title;
  refs.slug.value = appState.draft.slug;
  refs.category.value = appState.draft.category;
  refs.yieldLabel.value = appState.draft.yieldLabel;
  refs.baseYield.value = String(appState.draft.baseYield);
  refs.heroTitle.value = appState.draft.heroTitle;
  refs.description.value = appState.draft.description;
  refs.heroCopy.value = appState.draft.heroCopy;
  refs.ingredientsHeading.value = appState.draft.ingredientsHeading;
  refs.methodHeading.value = appState.draft.methodHeading;
  refs.notesHeading.value = appState.draft.notesHeading;
  refs.tags.value = appState.draft.tags.join(", ");
  refs.searchTags.value = appState.draft.searchTags.join(", ");
  refs.photoAlt.value = appState.draft.photoAlt;
  refs.primaryPhoto.value = appState.draft.primaryPhoto;
  refs.fallbackPhoto.value = appState.draft.fallbackPhoto;
  refs.photoCreditText.value = appState.draft.photoCreditText;
  refs.photoCreditUrl.value = appState.draft.photoCreditUrl;

  renderIngredientsEditor();
  renderStepsEditor();
  renderNotesEditor();
  refreshOutputs();
}

function renderIngredientsEditor() {
  refs.ingredientsEditor.replaceChildren(
    ...appState.draft.ingredients.map((ingredient, index) => {
      const card = document.createElement("div");
      card.className = "collection-card";

      const header = document.createElement("div");
      header.className = "collection-card-header";
      header.innerHTML = `<strong>Ingredient ${index + 1}</strong>`;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", () => {
        appState.draft.ingredients.splice(index, 1);
        syncFormFromDraft();
      });
      header.append(removeButton);

      const grid = document.createElement("div");
      grid.className = "inline-grid";
      grid.append(
        inputField("Name", ingredient.name, (value) => updateIngredient(index, "name", value)),
        inputField("Quantity", String(ingredient.quantity), (value) => updateIngredient(index, "quantity", Number(value || 1)), "number"),
        inputField("Unit", ingredient.unit, (value) => updateIngredient(index, "unit", value)),
        inputField("Singular", ingredient.singular, (value) => updateIngredient(index, "singular", value)),
        inputField("Plural", ingredient.plural, (value) => updateIngredient(index, "plural", value)),
      );

      const toggles = document.createElement("div");
      toggles.className = "inline-grid";
      toggles.append(
        checkboxField("Countable", ingredient.countable, (value) => updateIngredient(index, "countable", value)),
        checkboxField("Allow fractions", ingredient.fractions, (value) => updateIngredient(index, "fractions", value)),
      );

      card.append(header, grid, toggles);
      return card;
    }),
  );
}

function renderStepsEditor() {
  refs.stepsEditor.replaceChildren(
    ...appState.draft.stepsText.map((step, index) => collectionTextareaCard({
      title: `Step ${index + 1}`,
      value: step,
      onChange: (value) => {
        appState.draft.stepsText[index] = value;
        refreshOutputs();
      },
      onRemove: () => {
        appState.draft.stepsText.splice(index, 1);
        syncFormFromDraft();
      },
    })),
  );
}

function renderNotesEditor() {
  refs.notesEditor.replaceChildren(
    ...appState.draft.notes.map((note, index) => collectionTextareaCard({
      title: `Note ${index + 1}`,
      value: note,
      onChange: (value) => {
        appState.draft.notes[index] = value;
        refreshOutputs();
      },
      onRemove: () => {
        appState.draft.notes.splice(index, 1);
        syncFormFromDraft();
      },
    })),
  );
}

function collectionTextareaCard({ title, value, onChange, onRemove }) {
  const card = document.createElement("div");
  card.className = "collection-card";

  const header = document.createElement("div");
  header.className = "collection-card-header";
  header.innerHTML = `<strong>${title}</strong>`;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", onRemove);
  header.append(removeButton);

  const field = document.createElement("textarea");
  field.rows = 4;
  field.value = value;
  field.addEventListener("input", () => onChange(field.value));

  card.append(header, field);
  return card;
}

function inputField(labelText, value, onInput, type = "text") {
  const label = document.createElement("label");
  const span = document.createElement("span");
  const input = document.createElement("input");
  span.textContent = labelText;
  input.type = type;
  input.value = value;
  input.addEventListener("input", () => onInput(input.value));
  label.append(span, input);
  return label;
}

function checkboxField(labelText, checked, onInput) {
  const label = document.createElement("label");
  const span = document.createElement("span");
  const input = document.createElement("input");
  span.textContent = labelText;
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => onInput(input.checked));
  label.append(span, input);
  return label;
}

function updateIngredient(index, key, value) {
  appState.draft.ingredients[index][key] = value;
  if (key === "name" && !appState.draft.ingredients[index].singular && appState.draft.ingredients[index].countable) {
    appState.draft.ingredients[index].singular = singularize(value);
    appState.draft.ingredients[index].plural = pluralize(value);
  }
  refreshOutputs();
}

function refreshOutputs() {
  const compiled = compileDraft(appState.draft);
  refs.recipeOutput.value = compiled.recipeSource;
  refs.manifestOutput.value = JSON.stringify(compiled.cardPreview, null, 2);
}

function compileDraft(draft) {
  const primaryPhotoSrc = draft.primaryPhoto.trim();
  const fallbackPhotoSrc = draft.fallbackPhoto.trim();
  const thumbnailSrc = primaryPhotoSrc || fallbackPhotoSrc || PHOTO_PLACEHOLDER;
  const fallbackSrc = fallbackPhotoSrc || PHOTO_PLACEHOLDER;
  const normalizedIngredients = draft.ingredients.map((ingredient) => {
    const unit = ingredient.countable ? "count" : ingredient.unit || "count";
    const format = {};

    if (ingredient.countable) {
      format.countable = true;
      format.singular = ingredient.singular || singularize(ingredient.name);
      format.plural = ingredient.plural || pluralize(ingredient.name);
    } else {
      format.decimals = Number.isInteger(ingredient.quantity) ? 0 : 2;
      if (ingredient.fractions) {
        format.fractions = true;
      }
    }

    return {
      id: slugify(ingredient.name),
      name: ingredient.name,
      quantity: Number(ingredient.quantity || 1),
      unit,
      format,
    };
  });

  const recipe = {
    slug: draft.slug,
    title: draft.title,
    description: draft.description,
    category: draft.category,
    tags: draft.tags,
    searchTags: draft.searchTags,
    media: {
      alt: draft.photoAlt || `${draft.title} recipe photo`,
      primaryPhoto: primaryPhotoSrc
        ? { src: primaryPhotoSrc }
        : null,
      thumbnailPhoto: {
        src: thumbnailSrc,
      },
      fallbackPhoto: fallbackSrc
        ? {
            src: fallbackSrc,
            creditText: draft.photoCreditText.trim(),
            creditUrl: draft.photoCreditUrl.trim(),
          }
        : null,
    },
    baseYield: Number(draft.baseYield || 1),
    yieldLabel: draft.yieldLabel,
    heroTitle: draft.heroTitle || draft.title,
    heroCopy: draft.heroCopy || draft.description,
    ingredientsHeading: draft.ingredientsHeading,
    methodHeading: draft.methodHeading,
    notesHeading: draft.notesHeading,
    ingredients: normalizedIngredients,
    steps: draft.stepsText.filter(Boolean).map((step) => convertStepToSource(step, normalizedIngredients)),
    notes: draft.notes.filter(Boolean),
  };

  return {
    recipeSource: buildRecipeSourceFile(recipe),
    cardPreview: {
      slug: recipe.slug,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      tags: recipe.tags,
      searchTags: recipe.searchTags,
      baseYield: recipe.baseYield,
      yieldLabel: recipe.yieldLabel,
      route: `/recipes/${recipe.slug}/`,
    },
  };
}

function convertStepToSource(stepText, ingredients) {
  const parts = [];
  const annotatedSegments = splitAnnotatedStep(stepText);
  const ingredientMatchers = ingredients
    .map((ingredient) => ({
      ingredient,
      aliases: buildIngredientAliases(ingredient.name),
    }))
    .sort((left, right) => right.ingredient.name.length - left.ingredient.name.length);

  annotatedSegments.forEach((segment) => {
    if (segment.type === "annotation") {
      const matchedIngredient = matchAnnotatedIngredient(segment.source, ingredientMatchers);
      if (matchedIngredient) {
        parts.push({
          type: "ingredient",
          id: matchedIngredient.id,
          displayName: segment.display,
        });
        return;
      }

      parts.push({ type: "text", value: segment.raw });
      return;
    }

    let remaining = segment.value;
    while (remaining) {
      const match = findFirstIngredientMatch(remaining, ingredientMatchers);

      if (!match) {
        parts.push({ type: "text", value: remaining });
        break;
      }

      if (match.index > 0) {
        parts.push({ type: "text", value: remaining.slice(0, match.index) });
      }

      parts.push({ type: "ingredient", id: match.ingredient.id });
      remaining = remaining.slice(match.index + match.length);
    }
  });

  const mergedParts = parts.reduce((accumulator, part) => {
    const previous = accumulator[accumulator.length - 1];
    if (part.type === "text" && previous?.type === "text") {
      previous.value += part.value;
      return accumulator;
    }

    accumulator.push(part);
    return accumulator;
  }, []);

  return serializeStepParts(mergedParts.length ? mergedParts : [{ type: "text", value: stepText }]);
}

function serializeStepParts(parts) {
  const mutableParts = parts.map((part) => ({ ...part }));

  mutableParts.forEach((part, index) => {
    if (part.type !== "ingredient") {
      return;
    }

    const previous = mutableParts[index - 1];
    if (!previous || previous.type !== "text") {
      return;
    }

    const extracted = extractTrailingQuantity(previous.value);
    if (!extracted) {
      return;
    }

    previous.value = extracted.remainingText;
    part.quantity = extracted.quantity;
    if (/^\s*of\b/i.test(mutableParts[index + 1]?.value ?? "")) {
      part.displayMode = "amountOnly";
    }
  });

  return mutableParts
    .map((part) => {
      if (part.type === "text") {
        return part.value;
      }

      const attributes = [];
      if (Object.prototype.hasOwnProperty.call(part, "quantity")) {
        attributes.push(`quantity=${part.quantity}`);
      }
      if (part.displayName) {
        attributes.push(`display=${part.displayName}`);
      }
      if (part.displayMode) {
        attributes.push(`mode=${part.displayMode}`);
      }

      return `[[${part.id}${attributes.length ? `|${attributes.join("|")}` : ""}]]`;
    })
    .join("");
}

function extractTrailingQuantity(text) {
  const match = text.match(/^(.*?)(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*([A-Za-z]+)\s*$/);
  if (!match) {
    return null;
  }

  const quantity = parseQuantity(match[2]);
  const unit = normalizeUnit(match[3].toLowerCase(), "");
  const remainingText = match[1];

  if (!["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "count"].includes(unit)) {
    return null;
  }

  return {
    quantity,
    remainingText,
  };
}

function findFirstIngredientMatch(text, ingredientMatchers) {
  let best = null;

  ingredientMatchers.forEach(({ ingredient, aliases }) => {
    aliases.forEach((alias) => {
      const match = findAliasMatch(text, alias);
      if (!match) {
        return;
      }

      if (
        !best ||
        match.index < best.index ||
        (match.index === best.index && match.length > best.length)
      ) {
        best = { ingredient, index: match.index, length: match.length };
      }
    });
  });

  return best;
}

function buildIngredientAliases(name) {
  const cleaned = name.toLowerCase();
  const aliases = new Set([cleaned]);
  const shortName = cleaned
    .replace(/\b(softened|soft|ready-rolled|fresh|whole|large|unsalted|plain|self-raising|for the syrup|for the tin)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (shortName && shortName !== cleaned) {
    aliases.add(shortName);
  }

  const words = shortName.split(" ");
  if (words.length > 1) {
    const tail = words[words.length - 1];
    if (tail.length >= 4 && !GENERIC_ALIAS_WORDS.has(tail)) {
      aliases.add(tail);
    }
  }

  return [...aliases].filter(Boolean);
}

function splitAnnotatedStep(stepText) {
  const pattern = /\[\[([\s\S]+?)\]\]/g;
  const segments = [];
  let cursor = 0;
  let match = pattern.exec(stepText);

  while (match) {
    if (match.index > cursor) {
      segments.push({ type: "text", value: stepText.slice(cursor, match.index) });
    }

    const annotation = parseStepAnnotation(match[1]);
    segments.push(
      annotation
        ? {
            type: "annotation",
            source: annotation.source,
            display: annotation.display,
            raw: match[0],
          }
        : { type: "text", value: match[0] },
    );

    cursor = match.index + match[0].length;
    match = pattern.exec(stepText);
  }

  if (cursor < stepText.length) {
    segments.push({ type: "text", value: stepText.slice(cursor) });
  }

  return segments.length ? segments : [{ type: "text", value: stepText }];
}

function parseStepAnnotation(input) {
  const parts = input.split(/\s*->\s*/);
  if (parts.length !== 2) {
    return null;
  }

  const source = parts[0].trim();
  const display = parts[1].trim();
  if (!source || !display) {
    return null;
  }

  return { source, display };
}

function matchAnnotatedIngredient(source, ingredientMatchers) {
  const normalizedSource = source.trim().toLowerCase();
  const matcher = ingredientMatchers.find(({ ingredient, aliases }) =>
    ingredient.name.toLowerCase() === normalizedSource || aliases.includes(normalizedSource),
  );

  return matcher?.ingredient ?? null;
}

function findAliasMatch(text, alias) {
  const pattern = new RegExp(`(^|[^a-z0-9])(${escapeRegExp(alias)})(?=[^a-z0-9]|$)`, "i");
  const match = pattern.exec(text);
  if (!match) {
    return null;
  }

  return {
    index: match.index + match[1].length,
    length: match[2].length,
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRecipeSourceFile(recipe) {
  const source = {
    title: recipe.title,
    description: recipe.description,
    category: recipe.category,
    tags: recipe.tags,
    searchTags: recipe.searchTags,
    baseYield: recipe.baseYield,
    yieldLabel: recipe.yieldLabel,
    heroTitle: recipe.heroTitle,
    heroCopy: recipe.heroCopy,
    ingredientsHeading: recipe.ingredientsHeading,
    methodHeading: recipe.methodHeading,
    notesHeading: recipe.notesHeading,
    photoAlt: recipe.media.alt,
    primaryPhoto: recipe.media.primaryPhoto?.src ?? "",
    thumbnailPhoto: recipe.media.thumbnailPhoto?.src ?? PHOTO_PLACEHOLDER,
    fallbackPhoto: recipe.media.fallbackPhoto?.src ?? PHOTO_PLACEHOLDER,
    photoCreditText: recipe.media.fallbackPhoto?.creditText ?? "",
    photoCreditUrl: recipe.media.fallbackPhoto?.creditUrl ?? "",
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    notes: recipe.notes,
  };

  return `---\n${toYaml(source)}---\n`;
}

function toYaml(value, indent = 0) {
  const pad = " ".repeat(indent);

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (isScalar(item)) {
          return `${pad}- ${formatScalar(item)}\n`;
        }

        const nested = toYaml(item, indent + 2);
        return `${pad}- ${nested.startsWith(" ".repeat(indent + 2)) ? "\n" : ""}${nested}`;
      })
      .join("");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, entryValue]) => {
        if (isScalar(entryValue)) {
          return `${pad}${key}: ${formatScalar(entryValue)}\n`;
        }

        return `${pad}${key}:\n${toYaml(entryValue, indent + 2)}`;
      })
      .join("");
  }

  return `${pad}${formatScalar(value)}\n`;
}

function isScalar(value) {
  return value == null || ["string", "number", "boolean"].includes(typeof value);
}

function formatScalar(value) {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value == null) {
    return '""';
  }

  return JSON.stringify(String(value));
}

function createEmptyDraft() {
  return {
    title: "",
    slug: "",
    description: "",
    category: "Recipe",
    tags: [],
    searchTags: [],
    baseYield: 4,
    yieldLabel: "servings",
    heroTitle: "",
    heroCopy: "",
    ingredientsHeading: "Ingredients",
    methodHeading: "Method",
    notesHeading: "Notes",
    photoAlt: "",
    primaryPhoto: "",
    fallbackPhoto: "",
    photoCreditText: "",
    photoCreditUrl: "",
    ingredients: [createIngredientDraft()],
    stepsText: [""],
    notes: [""],
  };
}

function createIngredientDraft(overrides = {}) {
  return {
    name: "",
    quantity: 1,
    unit: "g",
    countable: false,
    fractions: false,
    singular: "",
    plural: "",
    ...overrides,
  };
}

function normalizeDraft(draft) {
  const normalized = {
    ...createEmptyDraft(),
    ...draft,
  };

  normalized.category = normalizeCategory(normalized.category, normalized.title, normalized.description);
  normalized.tags = normalizeTags(
    normalized.tags,
    normalized.category,
    normalized.title,
    normalized.description,
  );
  normalized.searchTags = inferSearchTags(normalized.category, normalized.tags);
  normalized.ingredients = Array.isArray(normalized.ingredients) && normalized.ingredients.length
    ? normalized.ingredients.map((ingredient) => createIngredientDraft(ingredient))
    : [createIngredientDraft()];
  normalized.stepsText = Array.isArray(normalized.stepsText) && normalized.stepsText.length
    ? normalized.stepsText
    : [""];
  normalized.notes = Array.isArray(normalized.notes) && normalized.notes.length
    ? normalized.notes
    : [""];
  normalized.slug = normalized.slug || slugify(normalized.title);
  normalized.heroTitle = normalized.heroTitle || normalized.title;
  normalized.heroCopy = normalized.heroCopy || normalized.description;
  normalized.photoAlt = normalized.photoAlt || `${normalized.title || "Recipe"} recipe photo`;

  return normalized;
}

function resetDraft() {
  appState.draft = createEmptyDraft();
  refs.plainText.value = "";
  refs.recipeUrl.value = "";
  refs.urlText.value = "";
  refs.photoText.value = "";
  refs.photoInput.value = "";
  refs.photoPreview.removeAttribute("src");
  appState.uploadedPhotoDataUrl = "";
  appState.uploadedFallbackPhotoDataUrl = "";
  appState.urlFallbackPhotoSrc = "";
  refs.slug.dataset.manuallyEdited = "";
  syncFormFromDraft();
  setStatus("Draft reset.");
}

function splitCommaList(input) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function singularize(name) {
  return name.replace(/s$/i, "").trim() || name;
}

function pluralize(name) {
  return /s$/i.test(name) ? name : `${name}s`;
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function copyText(text, successMessage) {
  await navigator.clipboard.writeText(text);
  setStatus(successMessage);
}

function downloadRecipeSource() {
  const blob = new Blob([refs.recipeOutput.value], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${appState.draft.slug || "recipe"}.md`;
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Recipe source downloaded.");
}

function setStatus(message) {
  refs.importStatus.textContent = message;
}
