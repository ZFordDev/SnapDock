import type { ThemeDefinition, ThemeName } from "../../types/themes";
import { REQUIRED_THEME_VARIABLES } from "../../types/themes";
import { invoke } from "@tauri-apps/api/core";

const THEME_KEY = "snapdock_theme";

// Built-in themes bundled at build time via esbuild JSON import
import lightTheme from "../../themes/light.json";
import darkTheme from "../../themes/dark.json";
import solarizedTheme from "../../themes/solarized.json";
import arcticTheme from "../../themes/arctic.json";
import forestTheme from "../../themes/forest.json";

const BUILTIN_THEMES: Record<ThemeName, ThemeDefinition> = {
  light: lightTheme as ThemeDefinition,
  dark: darkTheme as ThemeDefinition,
  solarized: solarizedTheme as ThemeDefinition,
  arctic: arcticTheme as ThemeDefinition,
  forest: forestTheme as ThemeDefinition,
};

const FALLBACK_THEME: ThemeDefinition = BUILTIN_THEMES.light;

let currentTheme: ThemeDefinition = FALLBACK_THEME;
let customThemes: ThemeDefinition[] = [];

function isThemeName(value: string): value is ThemeName {
  return value in BUILTIN_THEMES;
}

function isThemeDefinition(obj: unknown): obj is ThemeDefinition {
  if (!obj || typeof obj !== "object") return false;
  const rec = obj as Record<string, unknown>;
  return typeof rec.name === "string" && typeof rec.variables === "object" && rec.variables !== null;
}

function applyVariables(theme: ThemeDefinition): void {
  const root = document.documentElement;
  for (const key of REQUIRED_THEME_VARIABLES) {
    const value = theme.variables[key] ?? FALLBACK_THEME.variables[key] ?? "";
    root.style.setProperty(key, value);
  }
}

export function initTheme(): void {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored && isThemeName(stored)) {
    currentTheme = BUILTIN_THEMES[stored];
  } else if (stored) {
    // Check if stored name matches a custom theme
    const match = customThemes.find((t) => t.name === stored);
    if (match) currentTheme = match;
  }
  applyVariables(currentTheme);
  document.documentElement.classList.toggle("dark", currentTheme.dark);
}

export async function loadCustomThemes(): Promise<ThemeDefinition[]> {
  try {
    const paths = await invoke<string[]>("list_custom_themes");
    customThemes = [];
    for (const path of paths) {
      const content = await invoke<string | null>("load_theme_file", { filePath: path });
      if (!content) continue;
      try {
        const parsed = JSON.parse(content);
        if (isThemeDefinition(parsed)) {
          customThemes.push(parsed);
        }
      } catch {
        console.warn(`[SnapDock] Failed to parse theme file: ${path}`);
      }
    }
  } catch (error) {
    console.warn("[SnapDock] Failed to load custom themes:", error);
  }
  return customThemes;
}

export function setTheme(name: string): void {
  if (isThemeName(name)) {
    currentTheme = BUILTIN_THEMES[name];
  } else {
    const match = customThemes.find((t) => t.name === name);
    if (match) currentTheme = match;
    else return;
  }
  applyVariables(currentTheme);
  document.documentElement.classList.toggle("dark", currentTheme.dark);
  document.documentElement.setAttribute("data-theme", name);
  localStorage.setItem(THEME_KEY, name);
}

export function getTheme(): ThemeDefinition {
  return currentTheme;
}

export function getThemeName(): string {
  return currentTheme.name;
}

export function isDark(): boolean {
  return currentTheme.dark;
}

export function getAllThemes(): ThemeDefinition[] {
  return [...Object.values(BUILTIN_THEMES), ...customThemes];
}

export function isBuiltinTheme(name: string): boolean {
  return isThemeName(name);
}

export function getBuiltinThemes(): ThemeDefinition[] {
  return Object.values(BUILTIN_THEMES);
}

export function getCustomThemes(): ThemeDefinition[] {
  return [...customThemes];
}

export async function saveCustomTheme(theme: ThemeDefinition): Promise<boolean> {
  const fileName = `${theme.name}.json`;
  const content = JSON.stringify(theme, null, 2);
  try {
    await invoke("save_theme_file", { fileName, content });
    const existing = customThemes.findIndex((t) => t.name === theme.name);
    if (existing >= 0) customThemes[existing] = theme;
    else customThemes.push(theme);
    return true;
  } catch (error) {
    console.error("[SnapDock] Failed to save theme:", error);
    return false;
  }
}

export async function deleteCustomTheme(theme: ThemeDefinition): Promise<boolean> {
  try {
    const paths = await invoke<string[]>("list_custom_themes");
    for (const path of paths) {
      if (path.endsWith(`${theme.name}.json`)) {
        await invoke("delete_theme_file", { filePath: path });
        break;
      }
    }
    customThemes = customThemes.filter((t) => t.name !== theme.name);
    return true;
  } catch (error) {
    console.error("[SnapDock] Failed to delete theme:", error);
    return false;
  }
}

export function exportTheme(theme: ThemeDefinition): string {
  return JSON.stringify(theme, null, 2);
}

export function importTheme(json: string): ThemeDefinition | null {
  try {
    const parsed = JSON.parse(json);
    if (!isThemeDefinition(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}
