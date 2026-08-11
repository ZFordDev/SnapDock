import type { FindController, FindState } from "../../types/ui";
import { createFindState, findNextMatch, findPreviousMatch, getMatchSummary, getScrollTarget } from "./findState.js";

export { createFindState, findNextMatch, findPreviousMatch, getMatchSummary, getScrollTarget } from "./findState.js";

const FIND_TOGGLE_EVENT = "snapdock:find:toggle";
const emptyController: FindController = {
  openFind() {}, closeFind() {}, focusFind() {}, isVisible: () => false,
};

interface FindBoxOptions {
  editor: HTMLTextAreaElement | null;
  host?: HTMLElement | null;
}

export function initFindBox({ editor, host }: FindBoxOptions): FindController {
  if (!editor) return emptyController;
  const container = host ?? editor.parentElement;
  if (!container) return emptyController;

  const bar = document.createElement("div");
  bar.className = "find-bar box-border h-full w-full min-w-0 items-center gap-2 bg-[var(--sidebar-bg)] px-2.5 text-[var(--editor-text)]";
  bar.innerHTML = `
    <span class="find-bar__icon opacity-70">⌕</span>
    <input type="text" class="find-bar__input min-w-0 flex-1 rounded border border-[var(--tab-border)] bg-[var(--editor-bg)] px-2 py-1 text-[var(--editor-text)]" placeholder="Find in document" aria-label="Find" />
    <span class="find-bar__summary min-w-20 text-[.85rem] opacity-80">Find in document</span>
    <button class="find-bar__button cursor-pointer rounded border border-[var(--tab-border)] bg-transparent px-2 py-1 text-[var(--editor-text)] disabled:cursor-not-allowed disabled:opacity-40" data-action="prev" type="button">↑</button>
    <button class="find-bar__button cursor-pointer rounded border border-[var(--tab-border)] bg-transparent px-2 py-1 text-[var(--editor-text)] disabled:cursor-not-allowed disabled:opacity-40" data-action="next" type="button">↓</button>
    <button class="find-bar__button find-bar__close cursor-pointer rounded border border-[var(--tab-border)] bg-transparent px-2 py-1 text-[var(--tab-text)]" data-action="close" type="button">✕</button>`;

  const input = bar.querySelector<HTMLInputElement>(".find-bar__input");
  const summary = bar.querySelector<HTMLElement>(".find-bar__summary");
  const previousButton = bar.querySelector<HTMLButtonElement>('[data-action="prev"]');
  const nextButton = bar.querySelector<HTMLButtonElement>('[data-action="next"]');
  if (!input || !summary || !previousButton || !nextButton) return emptyController;

  container.appendChild(bar);
  bar.style.display = "none";
  let currentState: FindState = createFindState(editor.value, "");
  let activeIndex = -1;

  const clearSelection = (): void => editor.setSelectionRange(editor.value.length, editor.value.length);
  const applySelection = (index: number): void => {
    if (!currentState.matches.length) return clearSelection();
    const safeIndex = (index + currentState.matches.length) % currentState.matches.length;
    const match = currentState.matches[safeIndex];
    if (!match) return clearSelection();
    editor.focus();
    editor.setSelectionRange(match.start, match.end);
    editor.scrollTop = getScrollTarget(editor.value, match.start, {
      lineHeight: Number.parseFloat(getComputedStyle(editor).lineHeight) || 20,
      viewportHeight: editor.clientHeight || 240,
    });
    activeIndex = safeIndex;
    currentState = { ...currentState, activeIndex: safeIndex };
    summary.textContent = `${safeIndex + 1}/${currentState.matches.length}`;
    previousButton.disabled = currentState.matches.length < 2;
    nextButton.disabled = currentState.matches.length < 2;
  };
  const updateState = (query: string): void => {
    currentState = createFindState(editor.value, query);
    if (!currentState.matches.length) {
      summary.textContent = getMatchSummary(currentState);
      previousButton.disabled = true;
      nextButton.disabled = true;
      clearSelection();
      bar.classList.remove("has-results");
      summary.classList.remove("text-[var(--tab-accent)]");
      return;
    }
    bar.classList.add("has-results");
    summary.classList.add("text-[var(--tab-accent)]");
    applySelection(0);
  };
  const showFindBar = (preselect = true): void => {
    bar.style.display = "flex";
    bar.classList.add("is-visible");
    if (preselect) {
      const selectedPageText = window.getSelection()?.toString().trim();
      const selectedEditorText = editor.value.slice(editor.selectionStart, editor.selectionEnd).trim();
      input.value = selectedPageText || selectedEditorText;
      updateState(input.value);
    }
    input.focus();
    input.select();
  };
  const hideFindBar = (): void => {
    bar.style.display = "none";
    bar.classList.remove("is-visible");
    clearSelection();
  };

  input.addEventListener("input", () => updateState(input.value));
  editor.addEventListener("input", () => {
    if (bar.style.display === "flex") updateState(input.value);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      currentState = event.shiftKey ? findPreviousMatch(currentState, activeIndex) : findNextMatch(currentState, activeIndex);
      applySelection(currentState.activeIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      hideFindBar();
    }
  });
  bar.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const action = event.target.closest<HTMLElement>("button")?.dataset.action;
    if (!action) return;
    event.preventDefault();
    if (action === "close") return hideFindBar();
    currentState = action === "next" ? findNextMatch(currentState, activeIndex) : findPreviousMatch(currentState, activeIndex);
    applySelection(currentState.activeIndex);
  });
  document.addEventListener(FIND_TOGGLE_EVENT, () => {
    if (bar.style.display === "flex") hideFindBar(); else showFindBar();
  });

  return {
    openFind: () => showFindBar(true),
    closeFind: hideFindBar,
    focusFind: () => showFindBar(false),
    isVisible: () => bar.style.display === "flex",
  };
}

export function toggleFindBox(): void {
  document.dispatchEvent(new CustomEvent(FIND_TOGGLE_EVENT));
}
