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
import PicoSearchBox from "./picocss-searchbox.mjs";

const octokit = new Octokit({});

const settings = {
  selectors: {
    repo: "input[name=repo]",
  },
  elements: {
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
  initRepoSearch();
  results.innerHTML = placeholderArticle();
}

function updateUrl() {
  const repo = document.querySelector(settings.selectors.repo).value;
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
    document.querySelector(settings.selectors.repo).value = repo;
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

function initRepoSearch() {
  const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
  new PicoSearchBox(settings.selectors.repo, {
    data: async (query, signal) => {
      try {
        const response = await octokit.rest.search.repos({
          q: query,
          sort: "stars",
          order: "desc",
          per_page: 10,
          request: {
            signal: signal,
          },
        });
        return response.data.items.map((item) => ({
          full_name: item.full_name,
          description: item.description,
          value: item.full_name,
        }));
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Request canceled for:", query);
        } else {
          console.error("Search error:", error);
        }
      }
    },
    itemListContent: (item) => {
      const strLen = 40;
      const title = item.full_name;
      let description = "";
      if (item.description && item.description.length > 0) {
        description = item.description.slice(0, strLen);
        description += item.description.length > strLen ? "..." : "";
      }
      return `
        ${title}<br/>
        <small>${description}</small>
      `;
    },
    minChars: 1,
    debounce: 350,
    onSelect: (item) => {
      getReleases();
    },
  });
}

function setupEventListeners() {
  settings.elements.compareButton.addEventListener("click", compare);
}

async function getReleases() {
  const owner =
    document.querySelector(settings.selectors.repo).value.split("/")[0] || "";
  const repo =
    document.querySelector(settings.selectors.repo).value.split("/")[1] || "";

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
  const repo = document.querySelector(settings.selectors.repo).value.trim();
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
    `Compare ${document.querySelector(settings.selectors.repo).value} from ${
      settings.elements.from.value
    } to ${settings.elements.to.value}`
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
