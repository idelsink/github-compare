import { Octokit } from "octokit";
import emojis from "./emojis.mjs";
import { markdownParse } from "./markdown.mjs";
import { debounce } from "./utils.mjs";
import {
  releaseArticle,
  alertArticle,
  compareHeader,
  placeholderArticle,
} from "./html-templates.mjs";

const octokit = new Octokit({});

const settings = {
  elements: {
    repo: document.querySelector("input[name=repo]"),
    repos: document.querySelector("datalist[id=repos]"),
    from: document.querySelector("select[name=from]"),
    to: document.querySelector("select[name=to]"),
    compareButton: document.querySelector("input[name=compare]"),
    results: document.querySelector("[id=results]"),
    showPrereleases: document.querySelector("input[name=show-prereleases]"),
  },
};

const releases = {};

function init(settings_ = {}) {
  Object.assign(settings, settings_);
  setupEventListeners();
  initUrlSearchParams();
  results.innerHTML = placeholderArticle();
}

function updateUrl() {
  const repo = settings.elements.repo.value;
  const from = settings.elements.from.value;
  const to = settings.elements.to.value;
  const prereleases = settings.elements.showPrereleases.checked;

  if (repo && from && to) {
    const params = new URLSearchParams({ repo, from, to, prereleases });
    window.history.replaceState({}, "", `?${params}`);
  }
}

function initUrlSearchParams() {
  const params = new URLSearchParams(window.location.search);
  const repo = params.get("repo");
  const from = params.get("from");
  const to = params.get("to");
  const prereleases = params.get("prereleases");

  if (repo) {
    settings.elements.repo.value = repo;
  }
  if (from) {
    settings.elements.from.add(new Option(from));
    settings.elements.from.value = from;
  }
  if (to) {
    settings.elements.to.add(new Option(to));
    settings.elements.to.value = to;
  }
  if (prereleases == "true") {
    settings.elements.showPrereleases.checked = prereleases;
  }
  if (repo && from && to) {
    settings.elements.compareButton.click();
  }
}

function setupEventListeners() {
  let currentController = null;
  let lastResults = [];
  settings.elements.repo.addEventListener(
    "input",
    debounce(async (e) => {
      const query = e.target.value.trim();
      currentController?.abort(); // Cancel previous request if it exists
      if (!query) return; // Don't search for empty queries

      const currentRepos = Array.from(settings.elements.repos.options);

      // If the value matches an option, user likely selected from list
      if (currentRepos.some((option) => option.value === query)) {
        console.log("Selected option", query);
        settings.elements.from.value = "";
        settings.elements.to.value = "";
        await getReleases();
        return;
      }

      currentController = new AbortController();
      try {
        const response = await octokit.rest.search.repos({
          q: query,
          sort: "stars",
          order: "desc",
          per_page: 10,
          request: {
            signal: currentController.signal,
          },
        });
        // Clear existing options and add new options
        settings.elements.repos.innerHTML = "";
        response.data.items.forEach((repo) => {
          const option = document.createElement("option");
          option.value = repo.full_name;
          option.textContent = `${repo.full_name} - ${
            repo.description || "No description"
          }`;
          settings.elements.repos.appendChild(option);
        });
        // Clear controller since request completed successfully
        currentController = null;
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Request canceled for:", query);
        } else {
          console.error("Search error:", error);
        }
        currentController = null;
      }
    }, 250)
  );
  // Compare button
  settings.elements.compareButton.addEventListener("click", compare);
}

async function getReleases() {
  const owner = settings.elements.repo.value.split("/")[0] || "";
  const repo = settings.elements.repo.value.split("/")[1] || "";

  if (!owner || !repo) return;

  if (!releases[`${repo}/${owner}`]) {
    [settings.elements.from, settings.elements.to].forEach((element) => {
      element.options[0].textContent = "Loading releases...";
    });

    try {
      const response = await octokit.rest.repos.listReleases({
        owner: owner,
        repo: repo,
        per_page: 100,
      });
      releases[`${owner}/${repo}`] = response.data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request canceled for:", query);
      } else {
        console.error("Search error:", error);
      }
    }
  }

  [settings.elements.from, settings.elements.to].forEach((element) => {
    const lastSelected = element.value;

    Array.from(element.options).forEach((o) => {
      if (!o.disabled) o.remove();
    });

    releases[`${owner}/${repo}`].forEach((release) => {
      const option = document.createElement("option");
      option.value = release.tag_name;
      option.textContent = `
      ${release.tag_name} - ${new Date(
        release.published_at
      ).toLocaleDateString()}`;

      element.appendChild(option);
    });

    element.options[0].textContent = "Select your version...";

    // Restore last selected item if possible
    if (Array.from(element.options).some((o) => o.value === lastSelected)) {
      element.value = lastSelected;
    } else {
      element.value = "";
    }
  });
}

async function compare() {
  const repo = settings.elements.repo.value.trim();
  const fromTag = settings.elements.from.value;
  const toTag = settings.elements.to.value;
  const results = settings.elements.results;
  if (!repo || !fromTag || !toTag) {
    results.innerHTML = alertArticle(
      "<strong>Error:</strong> Please fill in all fields",
      "danger"
    );
    return;
  }

  console.log(
    `Compare ${settings.elements.repo.value} from ${settings.elements.from.value} to ${settings.elements.to.value}`
  );
  updateUrl();
  results.innerHTML = `<article aria-busy="true"></article>`;
  await getReleases();

  try {
    const fromIndex = releases[repo].findIndex((r) => r.tag_name === fromTag);
    const toIndex = releases[repo].findIndex((r) => r.tag_name === toTag);

    if (fromIndex === -1) throw new Error(`Tag ${fromTag} not found`);
    if (toIndex === -1) throw new Error(`Tag ${toTag} not found`);

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    const betweenReleases = releases[repo].slice(start, end);

    if (fromIndex > toIndex) betweenReleases.reverse();

    try {
      displayResults(betweenReleases, fromTag, toTag, repo);
    } catch (e) {
      console.error("Display Results Error", e);
      throw new Error(`Display Results Error: ${e.message}`);
    } finally {
    }
  } catch (error) {
    results.innerHTML = alertArticle(
      `<strong>Error:</strong> ${error.message}`,
      "danger"
    );
  }
}

function displayResults(allReleases, fromTag, toTag, repo) {
  let releases = [];
  if (settings.elements.showPrereleases.checked) {
    releases = allReleases;
  } else {
    releases = allReleases.filter((o) => !o.prerelease);
  }

  const results = settings.elements.results;

  if (releases.length === 0) {
    results.innerHTML = alertArticle(
      `
      No releases found between ${fromTag} and ${toTag}
      <br/>
      <a href="https://github.com/${repo}/compare/${fromTag}...${toTag}" target="_blank">View comparison on GitHub</a>
      `,
      "info"
    );

    return;
  }
  let html = "";
  html += compareHeader({ repo, releases, from: fromTag, to: toTag });
  releases.forEach((release) => {
    html += releaseArticle({ repo, release });
  });

  results.innerHTML = html;
}

export { init };
