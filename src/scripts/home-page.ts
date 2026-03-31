export function setupHomePage() {
  const searchInput = document.querySelector<HTMLInputElement>("#recipe-search");
  const searchSummary = document.querySelector<HTMLElement>("#search-summary");
  const recipeCards = [...document.querySelectorAll<HTMLElement>("[data-recipe-card]")];
  const filterButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-filter]")];
  const recipeGrid = document.querySelector<HTMLElement>("#recipe-grid");

  if (!searchInput || !searchSummary || !recipeGrid) {
    return;
  }

  let activeFilter = "All";

  renderResults("");

  searchInput.addEventListener("input", (event) => {
    renderResults(event.currentTarget?.value.trim().toLowerCase() ?? "");
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter ?? "All";
      filterButtons.forEach((candidate) => {
        candidate.classList.toggle("is-active", candidate === button);
      });
      renderResults(searchInput.value.trim().toLowerCase());
    });
  });

  function renderResults(query: string) {
    let visibleCount = 0;

    recipeCards.forEach((card) => {
      const matchesQuery = (card.dataset.search ?? "").includes(query);
      const tags = (card.dataset.filters ?? "").split("|").filter(Boolean);
      const matchesFilter = activeFilter === "All" || tags.includes(activeFilter);
      const visible = matchesQuery && matchesFilter;
      card.hidden = !visible;
      if (visible) {
        visibleCount += 1;
      }
    });

    const existingEmptyState = recipeGrid.querySelector(".empty-state");
    if (visibleCount === 0 && !existingEmptyState) {
      const empty = document.createElement("div");
      empty.className = "recipe-card empty-state";
      empty.textContent = `No recipes matched "${query}". Try a broader search term.`;
      recipeGrid.append(empty);
    } else if (visibleCount > 0 && existingEmptyState) {
      existingEmptyState.remove();
    }

    const filterSummary = activeFilter === "All" ? "all tags" : `the ${activeFilter} tag`;
    searchSummary.textContent = `Showing ${visibleCount} recipe${visibleCount === 1 ? "" : "s"} for ${filterSummary}`;
  }
}
