const FRACTIONS = [
  { value: 0.25, label: "1/4" },
  { value: 1 / 3, label: "1/3" },
  { value: 0.5, label: "1/2" },
  { value: 2 / 3, label: "2/3" },
  { value: 0.75, label: "3/4" },
];

function setupRecipePageFromDom() {
  const source = document.querySelector("#recipe-runtime-data");
  if (!source?.textContent) {
    return;
  }

  const recipe = JSON.parse(source.textContent);
  const slider = document.querySelector("#scale-slider");
  const scaleValue = document.querySelector("#scale-value");
  const yieldValue = document.querySelector("#yield-value");
  const ingredientsList = document.querySelector("#ingredients-list");
  const methodList = document.querySelector("#method-list");

  if (!slider || !scaleValue || !yieldValue || !ingredientsList || !methodList) {
    return;
  }

  function renderRecipe(scale) {
    const scaledIngredients = createScaledIngredientMap(recipe, scale);
    const seenIngredientIds = new Set();
    scaleValue.textContent = `${stripTrailingZeros(scale)}x`;
    yieldValue.textContent = `Makes about ${formatYield(recipe, scale)} ${recipe.yieldLabel}`;

    ingredientsList.replaceChildren(
      ...recipe.ingredients.map((ingredient) => {
        const item = document.createElement("li");
        const name = document.createElement("span");
        const amount = document.createElement("span");

        name.className = "ingredient-name";
        amount.className = "ingredient-amount";
        name.textContent = ingredient.name;
        amount.textContent = formatIngredient(scaledIngredients.get(ingredient.id), "full");
        item.append(name, amount);
        return item;
      }),
    );

    methodList.replaceChildren(
      ...recipe.steps.map((step) => {
        const item = document.createElement("li");
        step.forEach((part, index) => {
          if (part.type === "text") {
            item.append(document.createTextNode(part.value));
            return;
          }

          const amount = document.createElement("span");
          const isFirstUse = !seenIngredientIds.has(part.id);
          seenIngredientIds.add(part.id);
          amount.className = isFirstUse ? "step-amount" : "step-amount step-amount-repeat";
          amount.textContent = renderStepPart(step, index, scaledIngredients, scale);
          item.append(amount);
        });
        return item;
      }),
    );
  }

  renderRecipe(Number(slider.value));
  slider.addEventListener("input", (event) => {
    renderRecipe(Number(event.currentTarget.value));
  });
}

function createScaledIngredientMap(recipe, scale) {
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

function renderStepPart(step, index, scaledIngredients, scale) {
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

function formatYield(recipe, scale) {
  return Math.max(1, Math.round(recipe.baseYield * scale));
}

function formatIngredient(ingredient, mode = "full") {
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

function resolveStepPartDisplayMode(step, index, part, ingredient) {
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

function contextIncludesLabel(context, label) {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(label)}(?=[^a-z0-9]|$)`, "i");
  return pattern.test(context);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function stripTrailingZeros(value) {
  return value.toString().replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function hasFreeTextUnit(unit) {
  return typeof unit === "string" && /\s/.test(unit.trim()) && unit !== "count";
}

setupRecipePageFromDom();
