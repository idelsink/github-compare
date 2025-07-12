/**
 * PicoSearchBox - Ultra-lightweight searchbox for PicoCSS
 */
class PicoSearchBox {
  constructor(selector, options = {}) {
    this.input = document.querySelector(selector);

    if (!this.input.parentElement.classList.contains("pico-searchbox")) {
      throw new Error(
        `PicoSearchBox ${selector}'s parent does not have a class with pico-searchbox.`
      );
    }
    this.options = {
      data: [], // Can be: array or (async) function
      // content inside the item list
      itemListContent: (item) => {
        return typeof item === "string"
          ? item
          : item.value || JSON.stringify(item);
      },
      minChars: 1,
      placeholder: "No results found",
      onSelect: () => {},
      debounce: 0,
      ...options,
    };

    this.selectedIndex = -1;
    this.filteredData = [];
    this.isOpen = false;
    this.isLoading = false;
    this.abortController = null;
    this.debounceTimer = null;

    this.init();
  }

  init() {
    this.createResultsContainer();
    this.bindEvents();
  }

  createResultsContainer() {
    this.results = document.createElement("div");
    this.results.className = "pico-searchbox-results";
    this.input.after(this.results);
  }

  bindEvents() {
    this.input.addEventListener("input", (e) => this.handleInput(e));
    this.input.addEventListener("keydown", (e) => this.handleKeydown(e));
    this.input.addEventListener("focus", () => this.handleFocus());

    document.addEventListener("click", (e) => {
      if (!this.input.contains(e.target) && !this.results.contains(e.target)) {
        this.close();
      }
    });
  }

  handleInput(e) {
    const query = e.target.value.trim();
    this.search(query);
  }

  handleKeydown(e) {
    if (!this.isOpen) return;

    switch (e.key) {
      case "Escape":
        this.close();
        break;
    }
  }

  handleFocus() {
    this.search(this.input.value.trim());
  }

  search(query) {
    const data = this.options.data;

    this.cancelPendingRequests();

    if (query.length < this.options.minChars) {
      return;
    }

    // Handle array data - synchronous filtering
    if (Array.isArray(data)) {
      this.filterLocal(query);
      this.render();
      this.open();
      return;
    }

    this.debounceTimer = setTimeout(() => {
      this.performAsyncSearch(query);
    }, this.options.debounce);
  }

  async performAsyncSearch(query) {
    this.abortController = new AbortController();
    try {
      this.isLoading = true;
      this.renderLoading();
      this.open();

      let results;

      if (typeof this.options.data === "function") {
        // Custom function
        results = await this.options.data(query, this.abortController.signal);
      }

      this.filteredData = results;

      this.isLoading = false;
      this.selectedIndex = -1;
      this.render();
    } catch (error) {
      this.isLoading = false;
      if (error.name !== "AbortError") {
        console.error("Search error:", error);
        this.filteredData = [];
        this.render();
      }
    } finally {
      this.abortController = null;
    }
  }

  cancelPendingRequests() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  filterLocal(query) {
    const lowerQuery = query.toLowerCase();
    this.filteredData = this.options.data.filter((item) =>
      (typeof item === "string"
        ? item
        : item.display || item.name || item.title || ""
      )
        .toLowerCase()
        .includes(lowerQuery)
    );
    this.selectedIndex = -1;
  }

  render() {
    this.results.innerHTML = "";

    if (this.isLoading) {
      this.renderLoading();
      return;
    }

    if (!this.filteredData || this.filteredData.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "pico-searchbox-empty";
      emptyDiv.innerHTML = this.options.placeholder;
      this.results.appendChild(emptyDiv);
      return;
    }

    this.filteredData.forEach((item, index) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "pico-searchbox-item";
      itemDiv.innerHTML = this.options.itemListContent(item);
      itemDiv.addEventListener("click", () => this.selectItem(item));
      this.results.appendChild(itemDiv);
    });
  }

  renderLoading() {
    this.results.innerHTML = "";
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "pico-searchbox-loading";
    loadingDiv.textContent = "Loading...";
    this.results.appendChild(loadingDiv);
  }

  selectItem(item) {
    const displayValue =
      typeof item === "string" ? item : item.value || JSON.stringify(item);
    this.input.value = displayValue;
    this.close();
    this.options.onSelect(item);
  }

  open() {
    this.results.style.display = "block";
    this.isOpen = true;
  }

  close() {
    this.results.style.display = "none";
    this.isOpen = false;
    this.selectedIndex = -1;
    this.cancelPendingRequests();
  }

  // Public methods
  setData(data) {
    this.options.data = data;
  }

  clear() {
    this.input.value = "";
    this.close();
  }

  destroy() {
    this.cancelPendingRequests();
    this.results.remove();
  }
}

export default PicoSearchBox;
