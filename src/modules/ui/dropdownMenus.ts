import type { EditorFontFamily, EditorFontSize, ThemeName } from "../../types/ui";
import { applyTheme } from "./theme.js";
import { openHelpModal } from "./help.js";
import { setEditorFont } from "./editorFont.js";

const themes: readonly ThemeName[] = ["light", "dark", "solarized", "arctic", "forest"];
const fontFamilies: readonly EditorFontFamily[] = ["mono", "sans", "serif"];
const fontSizes: readonly EditorFontSize[] = ["90%", "100%", "110%", "125%"];

export function initDropdownToggles(): void {
  const menus = document.querySelectorAll<HTMLElement>(".dropdown-menu");
  menus.forEach((menu) => {
    menu.querySelector<HTMLElement>(".dropdown-toggle")?.addEventListener("click", (event) => {
      event.stopPropagation();
      const wasOpen = menu.classList.contains("open");
      closeAll();
      if (!wasOpen) menu.classList.add("open");
    });
    menu.querySelector<HTMLElement>(".dropdown-panel")?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("button");
      if (button && !button.classList.contains("dropdown-item-stub")) closeAll();
    });
  });
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest(".dropdown-menu")) closeAll();
  });
}

export function initToolsDropdown(): void {
  const updateBtn = document.querySelector<HTMLButtonElement>("#updateBtn");
  if (updateBtn) initUpdateButton(updateBtn);
  const spellcheckBtn = document.querySelector<HTMLButtonElement>("#spellcheckBtn");
  if (spellcheckBtn) initSpellcheckButton(spellcheckBtn);

  document.querySelectorAll<HTMLElement>(".theme-option").forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.dataset.theme;
      if (themes.includes(theme as ThemeName)) applyTheme(theme as ThemeName);
    });
  });
  attachEditorFontActions();
  document.getElementById("helpBtn")?.addEventListener("click", () => void openHelpModal());
}

function attachEditorFontActions(): void {
  const editor = document.querySelector<HTMLTextAreaElement>("#markdownInputMain");
  const familyButtons = document.querySelectorAll<HTMLElement>(".editor-font-family");
  const sizeButtons = document.querySelectorAll<HTMLElement>(".editor-font-size");
  familyButtons.forEach((button) => button.addEventListener("click", () => {
    const family = button.dataset.family;
    if (!fontFamilies.includes(family as EditorFontFamily)) return;
    setEditorFont(editor, { family: family as EditorFontFamily });
    familyButtons.forEach((item) => item.classList.toggle("active", item === button));
  }));
  sizeButtons.forEach((button) => button.addEventListener("click", () => {
    const size = button.dataset.size;
    if (!fontSizes.includes(size as EditorFontSize)) return;
    setEditorFont(editor, { size: size as EditorFontSize });
    sizeButtons.forEach((item) => item.classList.toggle("active", item === button));
  }));
  const currentFont = editor?.dataset.editorFontFamily ?? "mono";
  const currentSize = editor?.dataset.editorFontSize ?? "100%";
  familyButtons.forEach((button) => button.classList.toggle("active", button.dataset.family === currentFont));
  sizeButtons.forEach((button) => button.classList.toggle("active", button.dataset.size === currentSize));
}

function initSpellcheckButton(button: HTMLButtonElement): void {
  const editor = document.querySelector<HTMLTextAreaElement>("#markdownInputMain");
  const applyState = (enabled: boolean): void => {
    button.dataset.enabled = String(enabled);
    button.textContent = enabled ? "Spellcheck: On" : "Spellcheck: Off";
    button.classList.toggle("active", enabled);
    button.setAttribute("aria-pressed", String(enabled));
    if (editor) editor.spellcheck = enabled;
  };
  void window.snapdockAPI.getSpellcheckState().then(applyState).catch(() => applyState(true));
  button.addEventListener("click", async () => {
    applyState(await window.snapdockAPI.setSpellcheckState(button.dataset.enabled !== "true"));
  });
}

function hasUpdate(result: Awaited<ReturnType<SnapDockAPI["checkForUpdates"]>>): boolean {
  return "updateAvailable" in result && result.updateAvailable;
}

function initUpdateButton(button: HTMLButtonElement): void {
  void checkForUpdatesOnLaunch(button);
  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Checking...";
    setFooterStatus("Checking for updates…");
    const result = await window.snapdockAPI.checkForUpdates();
    if ("error" in result) {
      button.textContent = "Update Failed";
      button.disabled = false;
      setFooterStatus("Update check failed", "error");
      console.error("Update check failed:", result.error);
      return;
    }
    if (!hasUpdate(result)) {
      button.textContent = "No Updates";
      setFooterStatus("Up to date ✓");
      window.setTimeout(() => {
        button.textContent = "Update";
        button.disabled = false;
        setFooterStatus("");
      }, 2500);
      return;
    }
    button.textContent = "Downloading...";
    setFooterStatus("Downloading update…");
    await window.snapdockAPI.downloadUpdate();
  });
  window.snapdockAPI.onUpdateProgress((progress) => {
    const percent = Math.floor(progress.percent);
    button.textContent = `Downloading ${percent}%`;
    setFooterStatus(`Downloading update… ${percent}%`);
  });
  window.snapdockAPI.onUpdateReady(() => {
    button.textContent = "Restart to Update";
    button.disabled = false;
    button.onclick = () => void window.snapdockAPI.installUpdate();
    setFooterStatus("Update ready — restart to apply", "ready");
  });
  window.snapdockAPI.onUpdateError((error) => {
    button.textContent = "Update Failed";
    setFooterStatus("Update failed", "error");
    console.error("Update error:", error);
  });
}

async function checkForUpdatesOnLaunch(button: HTMLButtonElement): Promise<void> {
  const result = await window.snapdockAPI.checkForUpdates();
  if ("error" in result || !hasUpdate(result)) return;
  button.classList.add("update-available");
  button.textContent = "Update Available";
  setFooterStatus("Update available", "ready");
}

function setFooterStatus(text: string, state?: "ready" | "error"): void {
  const element = document.getElementById("updateStatus");
  if (!element) return;
  element.textContent = text;
  const stateClasses = state === "ready"
    ? "update-status--ready font-semibold text-[var(--tab-accent)] opacity-100"
    : state === "error" ? "font-semibold text-red-500 opacity-100" : "text-[var(--tab-text)] opacity-70";
  element.className = `update-status text-[.72rem] transition-opacity duration-300 empty:hidden ${stateClasses}`;
}

function closeAll(): void {
  document.querySelectorAll(".dropdown-menu").forEach((menu) => menu.classList.remove("open"));
}
