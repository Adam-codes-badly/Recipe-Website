const STORAGE_KEY = "recipe-builder-openai-key";
const MODEL_KEY = "recipe-builder-openai-model";
const DEFAULT_MODEL = "gpt-5-mini";

const appState = {
  mode: "plain",
  uploadedPhotoDataUrl: "",
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
    refs.photoPreview.src = appState.uploadedPhotoDataUrl;
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
  refs.copyRecipe.addEventListener("click", () => copyText(refs.recipeOutput.value, "Recipe JSON copied."));
  refs.copyManifest.addEventListener("click", () => copyText(refs.manifestOutput.value, "Manifest entry copied."));
  refs.downloadRecipe.addEventListener("click", downloadRecipeJson);
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
    setStatus("Readable page text fetched. Generate the draft when ready.");
  } catch (error) {
    setStatus("Direct URL fetch failed. Paste page text or HTML into the URL text box and try again.");
  }
}

async function generateDraft() {
  setStatus("Generating recipe draft...");

  try {
    const draft = await buildDraftFromCurrentMode();
    appState.draft = normalizeDraft(draft);
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
    "Turn the provided recipe source into a draft for a static recipe website.",
    "Return only JSON matching the schema.",
    "Use concise but useful title, description, hero copy, and headings.",
    "Prefer sensible UK kitchen units.",
    "Infer tags and searchTags that help site browsing.",
    "Set photoAlt based on the dish.",
    "Leave primaryPhoto empty.",
    "Leave fallbackPhoto and photoCredit fields empty unless the source explicitly provides a usable image.",
    "Method steps should be plain text steps. Do not tokenise them.",
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
    return "Cake";
  }
  if (/tart|pastry|nata/.test(haystack)) {
    return "Pastry";
  }
  if (/pasta|soup|stew|curry/.test(haystack)) {
    return "Main";
  }
  return "Recipe";
}

function inferTags(title, description, category) {
  const tags = new Set([category.toLowerCase()]);
  const haystack = `${title} ${description}`.toLowerCase();
  ["dessert", "lemon", "cake", "pastry", "tart", "portuguese", "citrus", "loaf"].forEach((tag) => {
    if (haystack.includes(tag)) {
      tags.add(tag);
    }
  });
  return [...tags];
}

function inferSearchTags(category, tags) {
  return [...new Set([category, ...tags.map((tag) => titleCase(tag))])];
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
  refs.recipeOutput.value = JSON.stringify(compiled.recipe, null, 2);
  refs.manifestOutput.value = JSON.stringify(compiled.manifestEntry, null, 2);
}

function compileDraft(draft) {
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
      primaryPhoto: draft.primaryPhoto
        ? { src: draft.primaryPhoto.trim() }
        : null,
      fallbackPhoto: draft.fallbackPhoto
        ? {
            src: draft.fallbackPhoto.trim(),
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
    steps: draft.stepsText.filter(Boolean).map((step) => tokenizeStep(step, normalizedIngredients)),
    notes: draft.notes.filter(Boolean),
  };

  return {
    recipe,
    manifestEntry: {
      slug: recipe.slug,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      tags: recipe.tags,
      searchTags: recipe.searchTags,
      media: recipe.media,
      baseYield: recipe.baseYield,
      yieldLabel: recipe.yieldLabel,
    },
  };
}

function tokenizeStep(stepText, ingredients) {
  let remaining = stepText;
  const parts = [];
  const ingredientMatchers = ingredients
    .map((ingredient) => ({
      ingredient,
      aliases: buildIngredientAliases(ingredient.name),
    }))
    .sort((left, right) => right.ingredient.name.length - left.ingredient.name.length);

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

  return parts.length ? parts : [{ type: "text", value: stepText }];
}

function findFirstIngredientMatch(text, ingredientMatchers) {
  const lower = text.toLowerCase();
  let best = null;

  ingredientMatchers.forEach(({ ingredient, aliases }) => {
    aliases.forEach((alias) => {
      const index = lower.indexOf(alias);
      if (index === -1) {
        return;
      }

      if (!best || index < best.index) {
        best = { ingredient, index, length: alias.length };
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
    aliases.add(words[words.length - 1]);
  }

  return [...aliases].filter(Boolean);
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

  normalized.tags = Array.isArray(normalized.tags) ? normalized.tags.filter(Boolean) : [];
  normalized.searchTags = Array.isArray(normalized.searchTags)
    ? normalized.searchTags.filter(Boolean)
    : [];
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

function downloadRecipeJson() {
  const blob = new Blob([refs.recipeOutput.value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${appState.draft.slug || "recipe"}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Recipe JSON downloaded.");
}

function setStatus(message) {
  refs.importStatus.textContent = message;
}
