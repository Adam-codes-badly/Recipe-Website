const recipe = {
  title: "Pastel de Nata",
  baseYield: 12,
  yieldLabel: "tarts",
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
      { type: "text", value: "Heat the oven to 220°C / 200°C fan. Lightly grease a 12-hole muffin tin with " },
      { type: "ingredient", id: "butter" },
      { type: "text", value: "." },
    ],
    [
      { type: "text", value: "Roll the " },
      { type: "ingredient", id: "puff-pastry" },
      { type: "text", value: " into a tight log, cut into even rounds, then press each round into the muffin tin so the pastry comes just above the rim. Chill the tray while you make the custard." },
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
      { type: "text", value: "Whisk the warm dairy into the flour paste, then whisk in " },
      { type: "ingredient", id: "egg-yolks" },
      { type: "text", value: " until the custard is glossy. Strain out the cinnamon stick and lemon peel." },
    ],
    [
      { type: "text", value: "Fill each pastry case almost to the top with the custard. Bake for 15 to 18 minutes, until the pastry is deep golden and the custard has dark blistered patches." },
    ],
    [
      { type: "text", value: "Cool in the tin for 5 minutes, then transfer the tarts to a rack. Serve warm, ideally with a dusting of cinnamon." },
    ],
  ],
  notes: [
    "The base recipe makes about 12 tarts. Yield is scaled and rounded to the nearest whole tart for display.",
    "If the slider rounds egg yolks up or down, the recipe stays practical for home baking rather than mathematically exact.",
    "For the classic finish, bake the tarts in the hottest part of the oven so the tops take on dark caramel spots.",
  ],
};

const slider = document.querySelector("#scale-slider");
const scaleValue = document.querySelector("#scale-value");
const yieldValue = document.querySelector("#yield-value");
const ingredientsList = document.querySelector("#ingredients-list");
const methodList = document.querySelector("#method-list");
const notesList = document.querySelector("#notes-list");

const FRACTIONS = [
  { value: 0.25, label: "1/4" },
  { value: 1 / 3, label: "1/3" },
  { value: 0.5, label: "1/2" },
  { value: 2 / 3, label: "2/3" },
  { value: 0.75, label: "3/4" },
];

renderNotes();
renderRecipe(Number(slider.value));

slider.addEventListener("input", (event) => {
  renderRecipe(Number(event.target.value));
});

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

function renderNotes() {
  notesList.replaceChildren(
    ...recipe.notes.map((note) => {
      const item = document.createElement("li");
      item.textContent = note;
      return item;
    }),
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
      part.quantity
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
  const rawQuantity = ingredient.quantity * scale;
  return applyScalingRules(ingredient, rawQuantity);
}

function getScaledPartQuantity(ingredient, baseQuantity, scale) {
  const rawQuantity = baseQuantity * scale;
  return applyScalingRules(ingredient, rawQuantity);
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

    const label = ingredient.scaledQuantity === 1
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
  const unit = ingredient.unit;
  const format = ingredient.format ?? {};

  if (unit === "count") {
    return String(quantity);
  }

  const renderedNumber = formatNumber(quantity, format);
  return `${renderedNumber}${unit}`;
}

function formatNumber(quantity, format) {
  if (format.fractions) {
    const fraction = toFractionString(quantity);
    if (fraction) {
      return fraction;
    }
  }

  const decimals = format.decimals ?? inferDecimals(quantity);
  const rounded = Number(quantity.toFixed(decimals));
  return stripTrailingZeros(rounded);
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

  const match = FRACTIONS.find((candidate) =>
    Math.abs(fraction - candidate.value) <= tolerance,
  );

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
