import emojis from "./emojis.mjs";
import { markdownParse } from "./markdown.mjs";
import "@github/relative-time-element";

function compareHeader({ releases, from, to, repo }) {
  const header = `
    <h3>
      ${releases.length} release${releases.length > 1 ? "s" : ""}
      between ${from} and ${to}
    </h3>
    <p>
      <a href="https://github.com/${repo}/compare/${from}...${to}" target="_blank">View full comparison on GitHub</a>
    </p>
  `;
  return header;
}

// Repo is the repo string owner/repo
// Release is a GitHub release item
//
// This method returns a single article for for a release.
function releaseArticle({ repo, release }) {
  const header = `
    <hgroup>
      <h3 class="inline-content">
        ${release.name || release.tag_name}
      </h3>
      <small class="inline-content">
        ${
          release.prerelease
            ? "<span class='badge badge-warning'>Pre-release</span>"
            : ""
        }
      </small>

      <p>
        <small>
          <a href="${release.author?.html_url}" target="_blank">
            ${release.author?.login || "Unknown"}
          </a>
          released this
          <relative-time datetime="${release.published_at}">
            ${new Date(release.published_at).toLocaleDateString()}
          </relative-time>
          •
          <a href="${release.html_url}" target="_blank">View on GitHub</a>
          •
          🏷️
          <a
            href="https://github.com/${repo}/tree/${release.tag_name}"
            target="_blank"
          >
            ${release.tag_name}
          </a>
        </small>
      </p>
    </hgroup>
  `;

  const body = markdownParse(release.body);

  let footer = "";
  for (const [key, value] of Object.entries(release.reactions || {})) {
    if (key !== "url" && key !== "total_count" && value > 0) {
      let emoji = `:${key}:`;
      footer += `<span class='badge badge-outline badge-secondary badge-spacing'>${emojis[key]} ${value}</span>`;
    }
  }

  const article = `
    <article>
      <header>
        ${header}
      </header>
      <div>
        ${body}
      </div>
      <footer>
        ${footer}
      </footer>
    </article>
  `;
  return article;
}

function alertArticle(content, level = "info") {
  const article = `
    <article class="alert alert-${level}">
      ${content}
    </article>
  `;
  return article;
}

export { releaseArticle, alertArticle, compareHeader };
