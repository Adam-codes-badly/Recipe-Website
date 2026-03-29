const searchInput = document.querySelector("#recipe-search");
const searchSummary = document.querySelector("#search-summary");
const recipeGrid = document.querySelector("#recipe-grid");
const filterBar = document.querySelector("#filter-bar");
const PHOTO_PLACEHOLDER = "./assets/placeholders/recipe-photo.svg";

const recipes = (await fetchJson("./recipes/index.json")).map(normalizeRecipeSummary);
const availableFilters = ["All", ...new Set(recipes.flatMap((recipe) => recipe.searchTags ?? []))];
let activeFilter = "All";

searchInput.value = "";
renderFilters();
renderResults("");

searchInput.addEventListener("input", (event) => {
  renderResults(event.target.value.trim().toLowerCase());
});

function renderResults(query = "") {
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

      const media = document.createElement("div");
      const photo = document.createElement("img");
      const body = document.createElement("div");

      media.className = "recipe-tile-media";
      body.className = "recipe-tile-body";

      const photoChoice = pickRecipePhoto(recipe);
      photo.className = "recipe-tile-photo";
      photo.src = photoChoice.src;
      photo.alt = photoChoice.alt;
      photo.loading = "lazy";
      photo.addEventListener("error", () => {
        if (photo.dataset.fallbackApplied === "true") {
          return;
        }
        photo.dataset.fallbackApplied = "true";
        photo.src = PHOTO_PLACEHOLDER;
      });
      media.append(photo);

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

      body.append(meta, title, description, tags);
      card.append(media, body);
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
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
}

function pickRecipePhoto(recipe) {
  const media = recipe.media ?? {};
  const chosen = media.thumbnailPhoto?.src
    ? media.thumbnailPhoto
    : media.primaryPhoto?.src
    ? media.primaryPhoto
    : media.fallbackPhoto?.src
      ? media.fallbackPhoto
      : null;

  return {
    src: chosen?.src ?? PHOTO_PLACEHOLDER,
    alt: media.alt ?? `${recipe.title} recipe photo`,
  };
}

function normalizeRecipeSummary(recipe) {
  return {
    slug: String(recipe?.slug ?? ""),
    title: String(recipe?.title ?? "Untitled Recipe"),
    description: String(recipe?.description ?? ""),
    category: String(recipe?.category ?? "Recipe"),
    tags: Array.isArray(recipe?.tags) ? recipe.tags.map(String) : [],
    searchTags: Array.isArray(recipe?.searchTags) ? recipe.searchTags.map(String) : [],
    baseYield: Number(recipe?.baseYield ?? 0),
    yieldLabel: String(recipe?.yieldLabel ?? "servings"),
    media: normalizeMedia(recipe?.media),
  };
}

function normalizeMedia(media) {
  if (!media || typeof media !== "object") {
    return {
      alt: "",
      primaryPhoto: null,
      thumbnailPhoto: null,
      fallbackPhoto: null,
    };
  }

  return {
    alt: String(media.alt ?? ""),
    primaryPhoto: normalizePhotoRef(media.primaryPhoto),
    thumbnailPhoto: normalizePhotoRef(media.thumbnailPhoto),
    fallbackPhoto: normalizePhotoRef(media.fallbackPhoto),
  };
}

function normalizePhotoRef(photo) {
  if (!photo || typeof photo !== "object" || !photo.src) {
    return null;
  }

  return {
    src: String(photo.src),
    creditText: String(photo.creditText ?? ""),
    creditUrl: String(photo.creditUrl ?? ""),
  };
}
