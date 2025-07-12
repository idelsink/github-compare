// GitHub Autolink References Extensions for marked.js + Mentions
//
// Based on the documentation from:
// https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls

// When adding an extension, also add it to the export list
const extensionConfigs = {
  // Mentions (@mention)
  githubMentions: {
    name: "githubMentions",
    pattern: /@[\w.-]+/,
    tokenizer: (src) => {
      const match = src.match(/^@([\w.-]+)/);
      return match
        ? {
            type: "githubMentions",
            raw: match[0],
            username: match[1],
          }
        : false;
    },
    renderer: (token) => {
      const url = `https://github.com/${token.username}`;
      return `<a href="${url}">${token.raw}</a>`;
    },
  },

  // Issue request URL - https://github.com/owner/repo/issues/26
  githubIssueUrl: {
    name: "githubIssueUrl",
    pattern: /https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+/,
    tokenizer: (src) => {
      const match = src.match(
        /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/issues\/(\d+)/
      );
      return match
        ? {
            type: "githubIssueUrl",
            raw: match[0],
            owner: match[1],
            repo: match[2],
            number: match[3],
            url: match[0],
          }
        : false;
    },
    renderer: (token) => `<a href="${token.url}">#${token.number}</a>`,
  },

  // Pull request URL https://github.com/owner/repo/pull/26
  githubPullRequestUrl: {
    name: "githubPullRequestUrl",
    pattern: /https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/,
    tokenizer: (src) => {
      const match = src.match(
        /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)/
      );
      return match
        ? {
            type: "githubPullRequestUrl",
            raw: match[0],
            owner: match[1],
            repo: match[2],
            number: match[3],
            url: match[0],
          }
        : false;
    },
    renderer: (token) => `<a href="${token.url}">#${token.number}</a>`,
  },

  // # and issue or pull request number - #26
  githubIssueReference: {
    name: "githubIssueReference",
    pattern: /#\d+/,
    requiresRepository: true,
    tokenizer: (src, { repository }) => {
      const match = src.match(/^#(\d+)/);
      return match
        ? {
            type: "githubIssueReference",
            raw: match[0],
            number: match[1],
            repository,
          }
        : false;
    },
    renderer: (token) => {
      if (token.repository) {
        const url = `https://github.com/${token.repository}/issues/${token.number}`;
        return `<a href="${url}">${token.raw}</a>`;
      }
      return token.raw;
    },
  },

  // GH - and issue or pull request number - GH-26
  githubGHReference: {
    name: "githubGHReference",
    pattern: /GH-\d+/i,
    requiresRepository: true,
    tokenizer: (src, { repository }) => {
      const match = src.match(/^GH-(\d+)/i);
      return match
        ? {
            type: "githubGHReference",
            raw: match[0],
            number: match[1],
            repository,
          }
        : false;
    },
    renderer: (token) => {
      if (token.repository) {
        const url = `https://github.com/${token.repository}/issues/${token.number}`;
        return `<a href="${url}">${token.raw}</a>`;
      }
      return token.raw;
    },
  },

  // Username-or-org/Repository# and issue or pull request number - owner/repo#26
  githubCrossRepoReference: {
    name: "githubCrossRepoReference",
    pattern: /[\w.-]+\/[\w.-]+#\d+/,
    tokenizer: (src) => {
      const match = src.match(/^([\w.-]+)\/([\w.-]+)#(\d+)/);
      return match
        ? {
            type: "githubCrossRepoReference",
            raw: match[0],
            owner: match[1],
            repo: match[2],
            number: match[3],
          }
        : false;
    },
    renderer: (token) => {
      const url = `https://github.com/${token.owner}/${token.repo}/issues/${token.number}`;
      return `<a href="${url}">${token.raw}</a>`;
    },
  },

  // Commit SHAs - References to a commit's SHA hash are automatically converted into shortened links to the commit on GitHub.
  // Commit URL - https://github.com/owner/repo/commit/a5c3785ed8d6a35868bc169f07e40e889087fd2e
  githubCommitUrl: {
    name: "githubCommitUrl",
    pattern: /https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/commit\/[a-f0-9]{40}/,
    tokenizer: (src) => {
      const match = src.match(
        /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/commit\/([a-f0-9]{40})/
      );
      return match
        ? {
            type: "githubCommitUrl",
            raw: match[0],
            owner: match[1],
            repo: match[2],
            sha: match[3],
            url: match[0],
          }
        : false;
    },
    renderer: (token) =>
      `<a href="${token.url}">${token.sha.substring(0, 7)}</a>`,
  },
  // SHA - a5c3785ed8d6a35868bc169f07e40e889087fd2e
  githubCommitSHA: {
    name: "githubCommitSHA",
    pattern: /[a-f0-9]{7,40}(?=\s|$)/i,
    requiresRepository: true,
    tokenizer: (src, { repository }) => {
      const match = src.match(/^([a-f0-9]{7,40})(?=\s|$)/i);
      return match
        ? {
            type: "githubCommitSHA",
            raw: match[0],
            sha: match[1],
            repository,
          }
        : false;
    },
    renderer: (token) => {
      if (token.repository) {
        const url = `https://github.com/${token.repository}/commit/${token.sha}`;
        return `<a href="${url}">${token.sha.substring(0, 7)}</a>`;
      }
      return token.raw;
    },
  },
  // User@SHA - owner@a5c3785ed8d6a35868bc169f07e40e889087fd2e
  githubUserCommit: {
    name: "githubUserCommit",
    pattern: /[\w.-]+@[a-f0-9]{7,40}/i,
    requiresRepository: true,
    tokenizer: (src, { repository }) => {
      const match = src.match(/^([\w.-]+)@([a-f0-9]{7,40})/i);
      return match
        ? {
            type: "githubUserCommit",
            raw: match[0],
            user: match[1],
            sha: match[2],
            repository,
          }
        : false;
    },
    renderer: (token) => {
      if (token.repository) {
        const url = `https://github.com/${token.repository}/commit/${token.sha}`;
        return `<a href="${url}">${token.user}@${token.sha.substring(
          0,
          7
        )}</a>`;
      }
      return token.raw;
    },
  },
  // Username/Repository@SHA - owner/repo@a5c3785ed8d6a35868bc169f07e40e889087fd2e
  githubRepoCommit: {
    name: "githubRepoCommit",
    pattern: /[\w.-]+\/[\w.-]+@[a-f0-9]{7,40}/i,
    tokenizer: (src) => {
      const match = src.match(/^([\w.-]+)\/([\w.-]+)@([a-f0-9]{7,40})/i);
      return match
        ? {
            type: "githubRepoCommit",
            raw: match[0],
            owner: match[1],
            repo: match[2],
            sha: match[3],
          }
        : false;
    },
    renderer: (token) => {
      const url = `https://github.com/${token.owner}/${token.repo}/commit/${token.sha}`;
      return `<a href="${url}">${token.owner}/${
        token.repo
      }@${token.sha.substring(0, 7)}</a>`;
    },
  },
};

// Helper function to validate repository format
function validateRepository(repository) {
  if (repository && !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    throw new Error('Repository must be in format "username/repository"');
  }
}

// Generic extension based on config
function createAutolinkExtension({
  name,
  pattern,
  tokenizer,
  renderer,
  requiresRepository = false,
}) {
  return function ({ repository }) {
    if (requiresRepository) {
      validateRepository(repository);
    }

    return {
      name,
      level: "inline",
      start(src) {
        const match = src.match(pattern);
        return match ? match.index : -1;
      },
      tokenizer(src) {
        return tokenizer(src, { repository });
      },
      renderer(token) {
        return renderer(token);
      },
    };
  };
}

// Dynamically generate named exports for each extension
const namedExports = {};
Object.keys(extensionConfigs).forEach((key) => {
  namedExports[key] = (options) => {
    return {
      extensions: [createAutolinkExtension(extensionConfigs[key])(options)],
    };
  };
});

export const {
  githubMentions,
  githubIssueUrl,
  githubPullRequestUrl,
  githubIssueReference,
  githubGHReference,
  githubCrossRepoReference,
  githubCommitUrl,
  githubCommitSHA,
  githubUserCommit,
  githubRepoCommit,
  // Any new extensions added to extensionConfigs will automatically be available here
} = namedExports;

// Default export all extensions
export default (options) => {
  return {
    extensions: Object.values(extensionConfigs).map((extensionConfig) =>
      createAutolinkExtension(extensionConfig)(options)
    ),
  };
};
