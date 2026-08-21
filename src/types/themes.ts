export type ThemeName = "light" | "dark" | "solarized" | "arctic" | "forest";

export interface ThemeDefinition {
  name: ThemeName;
  displayName: string;
  dark: boolean;
  variables: Record<string, string>;
}

/**
 * All CSS variables required for a complete SnapDock theme.
 * Any missing variable will be filled from the fallback theme.
 */
export const REQUIRED_THEME_VARIABLES: string[] = [
  "--workspace-bg",
  "--toolbar-bg",
  "--sidebar-bg",
  "--footer-bg",
  "--editor-bg",
  "--editor-text",
  "--editor-text-secondary",
  "--border-color",
  "--code-bg",
  "--code-text",
  "--inline-code-bg",
  "--note-bg",
  "--note-accent",
  "--warning-bg",
  "--warning-accent",
  "--tip-bg",
  "--tip-accent",
  "--table-header-bg",
  "--table-row-bg",
  "--accent-yellow",
  "--accent-orange",
  "--accent-red",
  "--accent-magenta",
  "--accent-violet",
  "--accent-blue",
  "--accent-cyan",
  "--accent-green",
  "--hljs-bg",
  "--hljs-text",
  "--hljs-comment",
  "--hljs-keyword",
  "--hljs-number",
  "--hljs-string",
  "--hljs-title",
  "--hljs-variable",
  "--hljs-addition-bg",
  "--hljs-addition-text",
  "--hljs-deletion-bg",
  "--hljs-deletion-text",
  "--tab-bar-bg",
  "--tab-idle-bg",
  "--tab-active-bg",
  "--tab-text",
  "--tab-accent",
  "--tab-border",
  "--footer-bg-glass",
];
