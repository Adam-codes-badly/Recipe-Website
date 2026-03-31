import {
  createScaledIngredientMap,
  formatIngredient,
  formatYield,
  renderStepPart,
  type RuntimeRecipe,
} from "../lib/recipe-runtime";

export function setupRecipePage(recipe: RuntimeRecipe) {
  const slider = document.querySelector<HTMLInputElement>("#scale-slider");
  const scaleValue = document.querySelector<HTMLElement>("#scale-value");
  const yieldValue = document.querySelector<HTMLElement>("#yield-value");
  const ingredientsList = document.querySelector<HTMLElement>("#ingredients-list");
  const methodList = document.querySelector<HTMLElement>("#method-list");

  if (!slider || !scaleValue || !yieldValue || !ingredientsList || !methodList) {
    return;
  }

  const renderRecipe = (scale: number) => {
    const scaledIngredients = createScaledIngredientMap(recipe, scale);
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
        amount.textContent = formatIngredient(scaledIngredients.get(ingredient.id)!, "full");
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
          amount.className = "step-amount";
          amount.textContent = renderStepPart(step, index, scaledIngredients, scale);
          item.append(amount);
        });
        return item;
      }),
    );
  };

  renderRecipe(Number(slider.value));
  slider.addEventListener("input", (event) => {
    renderRecipe(Number((event.currentTarget as HTMLInputElement).value));
  });
}

function stripTrailingZeros(value: number) {
  return value.toString().replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}
