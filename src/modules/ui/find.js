const FIND_TOGGLE_EVENT = "snapdock:find:toggle";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createFindState(text = "", query = "", options = {}) {
  const normalizedQuery = (query ?? "").toString().trim();
  if (!normalizedQuery) {
    return {
      query: "",
      matches: [],
      activeIndex: -1,
      count: 0
    };
  }

  const flags = options.caseSensitive ? "g" : "gi";
  const regex = new RegExp(escapeRegExp(normalizedQuery), flags);
  const matches = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[0].length === 0) {
      regex.lastIndex += 1;
      continue;
    }

    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0]
    });

    if (regex.lastIndex === match.index) {
      regex.lastIndex += 1;
    }
  }

  return {
    query: normalizedQuery,
    matches,
    activeIndex: matches.length ? 0 : -1,
    count: matches.length
  };
}

export function findNextMatch(state, currentIndex = state.activeIndex ?? -1) {
  if (!state?.matches?.length) return state;
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % state.matches.length;
  return { ...state, activeIndex: nextIndex, index: nextIndex };
}

export function findPreviousMatch(state, currentIndex = state.activeIndex ?? -1) {
  if (!state?.matches?.length) return state;
  const previousIndex = currentIndex < 0
    ? state.matches.length - 1
    : (currentIndex - 1 + state.matches.length) % state.matches.length;
  return { ...state, activeIndex: previousIndex, index: previousIndex };
}

export function getMatchSummary(state) {
  if (!state?.matches?.length) {
    return state?.query ? "No matches" : "Find in document";
  }

  return `${state.matches.length} match${state.matches.length === 1 ? "" : "es"}`;
}

export function getScrollTarget(text = "", index = 0, options = {}) {
  const lineHeight = options.lineHeight || 20;
  const viewportHeight = options.viewportHeight || 240;
  const lineIndex = (text.slice(0, index).match(/\n/g) || []).length;
  const targetTop = lineIndex * lineHeight - viewportHeight / 3;

  return Math.max(0, targetTop);
}

export function initFindBox({ editor, host }) {
  if (!editor) {
    return {
      openFind() {},
      closeFind() {},
      focusFind() {},
      isVisible() { return false; }
    };
  }

  const container = host || editor.parentElement;
  if (!container) {
    return {
      openFind() {},
      closeFind() {},
      focusFind() {},
      isVisible() { return false; }
    };
  }

  const bar = document.createElement("div");
  bar.className = "find-bar box-border h-full w-full min-w-0 items-center gap-2 bg-[var(--sidebar-bg)] px-2.5 text-[var(--editor-text)]";
  bar.innerHTML = `
    <span class="find-bar__icon opacity-70">⌕</span>
    <input type="text" class="find-bar__input min-w-0 flex-1 rounded border border-[var(--tab-border)] bg-[var(--editor-bg)] px-2 py-1 text-[var(--editor-text)]" placeholder="Find in document" aria-label="Find" />
    <span class="find-bar__summary min-w-20 text-[.85rem] opacity-80">Find in document</span>
    <button class="find-bar__button cursor-pointer rounded border border-[var(--tab-border)] bg-transparent px-2 py-1 text-[var(--editor-text)] disabled:cursor-not-allowed disabled:opacity-40" data-action="prev" type="button">↑</button>
    <button class="find-bar__button cursor-pointer rounded border border-[var(--tab-border)] bg-transparent px-2 py-1 text-[var(--editor-text)] disabled:cursor-not-allowed disabled:opacity-40" data-action="next" type="button">↓</button>
    <button class="find-bar__button find-bar__close cursor-pointer rounded border border-[var(--tab-border)] bg-transparent px-2 py-1 text-[var(--tab-text)]" data-action="close" type="button">✕</button>
  `;

  const input = bar.querySelector(".find-bar__input");
  const summary = bar.querySelector(".find-bar__summary");
  const prevBtn = bar.querySelector('[data-action="prev"]');
  const nextBtn = bar.querySelector('[data-action="next"]');
  const closeBtn = bar.querySelector('[data-action="close"]');

  container.appendChild(bar);
  bar.style.display = "none";

  let currentState = createFindState(editor.value, "");
  let activeIndex = -1;

  function clearSelection() {
    if (typeof editor.setSelectionRange === "function") {
      editor.setSelectionRange(editor.value.length, editor.value.length);
    }
  }

  function applySelection(index) {
    if (!currentState.matches.length) {
      clearSelection();
      return;
    }

    const safeIndex = (index + currentState.matches.length) % currentState.matches.length;
    const match = currentState.matches[safeIndex];
    if (!match) {
      clearSelection();
      return;
    }

    editor.focus();
    editor.setSelectionRange(match.start, match.end);
    const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 20;
    const viewportHeight = editor.clientHeight || 240;
    editor.scrollTop = getScrollTarget(editor.value, match.start, {
      lineHeight,
      viewportHeight
    });
    activeIndex = safeIndex;
    currentState = { ...currentState, activeIndex: safeIndex };
    summary.textContent = `${safeIndex + 1}/${currentState.matches.length}`;
    prevBtn.disabled = currentState.matches.length < 2;
    nextBtn.disabled = currentState.matches.length < 2;
  }

  function updateState(query) {
    currentState = createFindState(editor.value, query);
    if (!currentState.matches.length) {
      summary.textContent = getMatchSummary(currentState);
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      clearSelection();
      bar.classList.remove("has-results");
      summary.classList.remove("text-[var(--tab-accent)]");
      return;
    }

    bar.classList.add("has-results");
    summary.classList.add("text-[var(--tab-accent)]");
    applySelection(0);
  }

  function showFindBar(preselect = true) {
    bar.style.display = "flex";
    bar.classList.add("is-visible");
    if (preselect) {
      const selection = window.getSelection?.()?.toString()?.trim();
      const prefill = selection || editor.value.slice(editor.selectionStart, editor.selectionEnd).trim();
      input.value = prefill;
      updateState(prefill);
    }
    input.focus();
    input.select();
  }

  function hideFindBar() {
    bar.style.display = "none";
    bar.classList.remove("is-visible");
    clearSelection();
  }

  input.addEventListener("input", (event) => {
    updateState(event.target.value);
  });

  editor.addEventListener("input", () => {
    if (bar.style.display === "flex") {
      updateState(input.value);
    }
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      currentState = event.shiftKey
        ? findPreviousMatch(currentState, activeIndex)
        : findNextMatch(currentState, activeIndex);
      applySelection(currentState.activeIndex);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      hideFindBar();
    }
  });

  bar.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.action;
    if (!action) return;

    event.preventDefault();
    if (action === "next") {
      currentState = findNextMatch(currentState, activeIndex);
      applySelection(currentState.activeIndex);
    } else if (action === "prev") {
      currentState = findPreviousMatch(currentState, activeIndex);
      applySelection(currentState.activeIndex);
    } else if (action === "close") {
      hideFindBar();
    }
  });

  document.addEventListener(FIND_TOGGLE_EVENT, () => {
    if (bar.style.display === "flex") {
      hideFindBar();
    } else {
      showFindBar();
    }
  });

  return {
    openFind() {
      showFindBar(true);
    },
    closeFind() {
      hideFindBar();
    },
    focusFind() {
      showFindBar(false);
    },
    isVisible() {
      return bar.style.display === "flex";
    }
  };
}

export function toggleFindBox() {
  document.dispatchEvent(new CustomEvent(FIND_TOGGLE_EVENT));
}
