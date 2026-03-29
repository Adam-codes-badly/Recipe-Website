const FRACTIONS = [
  { value: 0.25, label: "1/4" },
  { value: 1 / 3, label: "1/3" },
  { value: 0.5, label: "1/2" },
  { value: 2 / 3, label: "2/3" },
  { value: 0.75, label: "3/4" },
];

const slider = document.querySelector("#scale-slider");
const scaleValue = document.querySelector("#scale-value");
const yieldValue = document.querySelector("#yield-value");
const ingredientsList = document.querySelector("#ingredients-list");
const methodList = document.querySelector("#method-list");
const notesList = document.querySelector("#notes-list");
const recipePhoto = document.querySelector("#recipe-photo");
const recipePhotoCredit = document.querySelector("#recipe-photo-credit");
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const recipe = slug ? await fetchRecipe(slug) : null;
const PHOTO_PLACEHOLDER = "./assets/placeholders/recipe-photo.svg";

if (!recipe) {
  renderMissingRecipe();
} else {
  renderStaticContent();
  renderRecipe(Number(slider.value));

  slider.addEventListener("input", (event) => {
    renderRecipe(Number(event.target.value));
  });
}

function renderStaticContent() {
  document.title = `Favourite Recipes | ${recipe.title}`;
  document.querySelector('meta[name="description"]').setAttribute("content", recipe.description);
  document.querySelector("#site-title").textContent = recipe.heroTitle;
  document.querySelector("#site-copy").textContent = recipe.heroCopy;
  document.querySelector("#crumb-current").textContent = recipe.title;
  document.querySelector("#ingredients-heading").textContent = recipe.ingredientsHeading;
  document.querySelector("#method-heading").textContent = recipe.methodHeading;
  document.querySelector("#notes-heading").textContent = recipe.notesHeading;
  renderRecipePhoto(recipe);

  notesList.replaceChildren(
    ...recipe.notes.map((note) => {
      const item = document.createElement("li");
      item.textContent = note;
      return item;
    }),
  );
}

function renderRecipe(scale) {
  const scaledIngredients = new Map(
    recipe.ingredients.map((ingredient) => [
      ingredient.id,
      {
        ...ingredient,
        scaledQuantity: getScaledQuantity(ingredient, scale),
      },
    ]),
  );

  scaleValue.textContent = `${stripTrailingZeros(scale)}x`;
  yieldValue.textContent = `Makes about ${formatYield(scale)} ${recipe.yieldLabel}`;

  ingredientsList.replaceChildren(
    ...recipe.ingredients.map((ingredient) =>
      renderIngredientItem(scaledIngredients.get(ingredient.id)),
    ),
  );

  methodList.replaceChildren(
    ...recipe.steps.map((step) => renderStepItem(step, scaledIngredients, scale)),
  );
}

function renderIngredientItem(ingredient) {
  const item = document.createElement("li");
  const name = document.createElement("span");
  const amount = document.createElement("span");

  name.className = "ingredient-name";
  amount.className = "ingredient-amount";

  name.textContent = ingredient.name;
  amount.textContent = formatIngredient(ingredient, "full");

  item.append(name, amount);
  return item;
}

function renderStepItem(step, scaledIngredients, scale) {
  const item = document.createElement("li");

  step.forEach((part) => {
    if (part.type === "text") {
      item.append(document.createTextNode(part.value));
      return;
    }

    const ingredient = scaledIngredients.get(part.id);
    const amount = document.createElement("span");
    amount.className = "step-amount";
    amount.textContent = formatIngredient(
      Object.prototype.hasOwnProperty.call(part, "quantity")
        ? {
            ...ingredient,
            scaledQuantity: getScaledPartQuantity(ingredient, part.quantity, scale),
          }
        : ingredient,
      part.displayMode ?? "full",
    );
    item.append(amount);
  });

  return item;
}

function getScaledQuantity(ingredient, scale) {
  return applyScalingRules(ingredient, ingredient.quantity * scale);
}

function getScaledPartQuantity(ingredient, baseQuantity, scale) {
  return applyScalingRules(ingredient, baseQuantity * scale);
}

function applyScalingRules(ingredient, rawQuantity) {
  const format = ingredient.format ?? {};

  if (format.countable) {
    return Math.max(1, Math.round(rawQuantity));
  }

  return rawQuantity;
}

function formatIngredient(ingredient, mode = "full") {
  const amount = formatQuantity(ingredient.scaledQuantity, ingredient);

  if (ingredient.unit === "count") {
    if (mode === "amountOnly") {
      return amount;
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

  return `${amount} ${ingredient.name}`;
}

function formatQuantity(quantity, ingredient) {
  if (ingredient.unit === "count") {
    return String(quantity);
  }

  return `${formatNumber(quantity, ingredient.format ?? {})}${ingredient.unit}`;
}

function formatNumber(quantity, format) {
  if (format.fractions) {
    const fraction = toFractionString(quantity);
    if (fraction) {
      return fraction;
    }
  }

  const decimals = format.decimals ?? inferDecimals(quantity);
  return stripTrailingZeros(Number(quantity.toFixed(decimals)));
}

function inferDecimals(quantity) {
  if (Number.isInteger(quantity)) {
    return 0;
  }

  if (quantity < 5) {
    return 2;
  }

  return 1;
}

function stripTrailingZeros(value) {
  return value.toString().replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function toFractionString(quantity) {
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

function formatYield(scale) {
  return Math.max(1, Math.round(recipe.baseYield * scale));
}

function renderMissingRecipe() {
  document.title = "Favourite Recipes | Recipe not found";
  document.querySelector("#site-title").textContent = "Recipe not found";
  document.querySelector("#site-copy").textContent =
    "This recipe could not be loaded. Return to the home page and choose a recipe from the list.";
  document.querySelector("#crumb-current").textContent = "Missing recipe";
  document.querySelector("#ingredients-heading").textContent = "Unavailable";
  document.querySelector("#method-heading").textContent = "Unavailable";
  document.querySelector("#notes-heading").textContent = "Unavailable";
  document.querySelector(".recipe-layout").classList.add("is-missing");
  slider.disabled = true;
  yieldValue.textContent = "Recipe data unavailable";
  recipePhoto.src = PHOTO_PLACEHOLDER;
  recipePhoto.alt = "Recipe image placeholder";
  recipePhotoCredit.textContent = "";
}

async function fetchRecipe(recipeSlug) {
  const response = await fetch(`./recipes/${encodeURIComponent(recipeSlug)}.json`);

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function renderRecipePhoto(currentRecipe) {
  const media = currentRecipe.media ?? {};
  const chosen = media.primaryPhoto?.src
    ? media.primaryPhoto
    : media.fallbackPhoto?.src
      ? media.fallbackPhoto
      : null;

  recipePhoto.src = chosen?.src ?? PHOTO_PLACEHOLDER;
  recipePhoto.alt = media.alt ?? `${currentRecipe.title} recipe photo`;

  if (!chosen?.creditText) {
    recipePhotoCredit.textContent = chosen?.src ? "" : "Photo placeholder shown until you add a personal or stock image.";
    return;
  }

  if (!chosen.creditUrl) {
    recipePhotoCredit.textContent = chosen.creditText;
    return;
  }

  const link = document.createElement("a");
  link.href = chosen.creditUrl;
  link.textContent = chosen.creditText;
  link.target = "_blank";
  link.rel = "noreferrer";
  recipePhotoCredit.replaceChildren(link);
}
