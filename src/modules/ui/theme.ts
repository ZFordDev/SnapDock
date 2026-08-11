import type { ThemeName } from "../../types/ui";

const THEME_KEY = "snapdock_theme";
const THEMES: readonly ThemeName[] = ["light", "dark", "solarized", "arctic", "forest"];

function isThemeName(value: string): value is ThemeName {
  return THEMES.includes(value as ThemeName);
}

export function initTheme({
  selector,
}: { selector?: HTMLSelectElement | null } = {}): void {
  const stored = localStorage.getItem(THEME_KEY);
  const theme: ThemeName = stored && isThemeName(stored) ? stored : "light";
  applyTheme(theme);

  if (selector) {
    selector.value = theme;
    selector.addEventListener("change", () => {
      if (isThemeName(selector.value)) applyTheme(selector.value);
    });
  }
}

export function applyTheme(theme: ThemeName): void {
  THEMES.forEach((name) => document.body.classList.remove(`${name}-theme`));
  document.body.classList.add(`${theme}-theme`);
  localStorage.setItem(THEME_KEY, theme);
}
