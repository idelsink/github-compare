import "@picocss/pico";
import "./styles/picocss-modifications.css";
import "./styles/alerts.css";
import "./styles/picocss-searchbox.css";
import "./styles/badges.css";
import "./styles/avatar.css";
import "./styles/marked-alerts.css";
import "./styles/custom-styles.css";
import { init as initThemeSwitcher } from "./modules/theme-switcher.mjs";
import { init as initGithubCompare } from "./modules/github-compare.mjs";

initThemeSwitcher();
initGithubCompare();
