const systemSettingDark = window.matchMedia("(prefers-color-scheme: dark)");
const allThemes = {
  auto: {
    name: "auto",
    icon: "🌓",
    title: "Auto (follows system)",
  },
  light: {
    name: "light",
    icon: "☀️",
    title: "Light theme",
  },
  dark: {
    name: "dark",
    icon: "🌙",
    title: "Dark theme",
  },
};

// Order themes based on system preference for logical progression
const themes = systemSettingDark.matches
  ? [
      // Dark order
      allThemes.auto, // Defaults to dark
      allThemes.light,
      allThemes.dark,
    ]
  : [
      // Light order
      allThemes.auto, // Defaults to light
      allThemes.dark,
      allThemes.light,
    ];

const settings = {
  elements: {
    themeButton: document.querySelector("button[name=theme]"),
  },
};

function init(settings_ = {}) {
  Object.assign(settings, settings_);
  initTheme();
  setupEventListeners();
}

function initTheme() {
  const theme = localStorage.getItem("theme") || "auto";
  applyTheme(theme);
}

function setupEventListeners() {
  // Init theme on color change event
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", initTheme);

  // toggle theme on themebutton click
  settings.elements.themeButton.addEventListener("click", toggleTheme);
}

function applyTheme(theme) {
  localStorage.setItem("theme", theme);

  if (theme === "auto") {
    document.documentElement.setAttribute(
      "data-theme",
      systemSettingDark.matches ? "dark" : "light"
    );
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }

  const nextTheme = themes.find(({ name }) => name === theme);
  settings.elements.themeButton.textContent = nextTheme.icon;
  settings.elements.themeButton.title = nextTheme.title;
}

function toggleTheme() {
  const currentTheme = localStorage.getItem("theme");
  const currentIndex = themes.findIndex(({ name }) => name === currentTheme);
  const newTheme = themes[(currentIndex + 1) % themes.length].name;
  applyTheme(newTheme);
}

export { init };
