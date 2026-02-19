const THEME_KEY = "snapdock_theme";

// List of all supported themes
const THEMES = ["light", "dark", "solarized", "arctic", "forest"]; 

export function initTheme({ selector }) {
  const saved = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(saved);

  // If a dropdown/select element is provided
  if (selector) {
    selector.value = saved;
    selector.addEventListener("change", (e) => {
      applyTheme(e.target.value);
    });
  }
}

export function applyTheme(theme) {
  // Remove all theme classes
  THEMES.forEach(t => {
    document.body.classList.remove(`${t}-theme`);
  });

  // Apply the selected theme
  document.body.classList.add(`${theme}-theme`);

  // Save preference
  localStorage.setItem(THEME_KEY, theme);
}