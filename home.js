const searchInput = document.querySelector("#recipe-search");
const searchSummary = document.querySelector("#search-summary");
const recipeGrid = document.querySelector("#recipe-grid");
const filterBar = document.querySelector("#filter-bar");

const recipes = await fetchJson("./recipes/index.json");
const availableFilters = ["All", ...new Set(recipes.flatMap((recipe) => recipe.searchTags ?? []))];
let activeFilter = "All";

renderFilters();
renderResults();

searchInput.addEventListener("input", (event) => {
  renderResults(event.target.value.trim().toLowerCase());
});

function renderResults(query = searchInput.value.trim().toLowerCase()) {
  const filtered = recipes.filter(
    (recipe) => matchesRecipe(recipe, query) && matchesFilter(recipe, activeFilter),
  );
  renderRecipes(filtered, query);
}

function renderFilters() {
  filterBar.replaceChildren(
    ...availableFilters.map((filter) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "filter-chip";
      if (filter === activeFilter) {
        button.classList.add("is-active");
      }
      button.textContent = filter;
      button.addEventListener("click", () => {
        activeFilter = filter;
        renderFilters();
        renderResults();
      });
      return button;
    }),
  );
}

function renderRecipes(recipeList, query = "") {
  recipeGrid.replaceChildren(
    ...recipeList.map((recipe) => {
      const card = document.createElement("a");
      card.className = "recipe-tile";
      card.href = `./recipe.html?slug=${encodeURIComponent(recipe.slug)}`;

      const meta = document.createElement("p");
      meta.className = "recipe-tile-meta";
      meta.textContent = `${recipe.category} • Makes about ${recipe.baseYield} ${recipe.yieldLabel}`;

      const title = document.createElement("h3");
      title.textContent = recipe.title;

      const description = document.createElement("p");
      description.className = "recipe-tile-copy";
      description.textContent = recipe.description;

      const tags = document.createElement("p");
      tags.className = "recipe-tags";
      tags.textContent = (recipe.searchTags ?? recipe.tags).map((tag) => `#${tag}`).join(" ");

      card.append(meta, title, description, tags);
      return card;
    }),
  );

  if (recipeList.length === 0) {
    const empty = document.createElement("div");
    empty.className = "recipe-card empty-state";
    empty.textContent = `No recipes matched "${query}". Try a broader search term.`;
    recipeGrid.append(empty);
  }

  const filterSummary =
    activeFilter === "All" ? "all tags" : `the ${activeFilter} tag`;
  searchSummary.textContent = `Showing ${recipeList.length} recipe${recipeList.length === 1 ? "" : "s"} for ${filterSummary}`;
}

function matchesRecipe(recipe, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    recipe.title,
    recipe.description,
    recipe.category,
    recipe.tags.join(" "),
    (recipe.searchTags ?? []).join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesFilter(recipe, filter) {
  if (filter === "All") {
    return true;
  }

  return (recipe.searchTags ?? []).includes(filter);
}

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
}
