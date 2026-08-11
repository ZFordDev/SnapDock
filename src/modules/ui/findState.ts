import type { FindState } from "../../types/ui";

export interface FindOptions {
  caseSensitive?: boolean;
}

export interface ScrollTargetOptions {
  lineHeight?: number;
  viewportHeight?: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createFindState(
  text = "",
  query: unknown = "",
  options: FindOptions = {},
): FindState {
  const normalizedQuery = String(query ?? "").trim();
  if (!normalizedQuery) {
    return { query: "", matches: [], activeIndex: -1, count: 0 };
  }

  const flags = options.caseSensitive ? "g" : "gi";
  const regex = new RegExp(escapeRegExp(normalizedQuery), flags);
  const matches: FindState["matches"] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
    });

    if (regex.lastIndex === match.index) regex.lastIndex += 1;
  }

  return {
    query: normalizedQuery,
    matches,
    activeIndex: matches.length ? 0 : -1,
    count: matches.length,
  };
}

export function findNextMatch(
  state: FindState,
  currentIndex = state.activeIndex ?? -1,
): FindState {
  if (!state.matches.length) return state;
  const index = currentIndex < 0 ? 0 : (currentIndex + 1) % state.matches.length;
  return { ...state, activeIndex: index, index };
}

export function findPreviousMatch(
  state: FindState,
  currentIndex = state.activeIndex ?? -1,
): FindState {
  if (!state.matches.length) return state;
  const index = currentIndex < 0
    ? state.matches.length - 1
    : (currentIndex - 1 + state.matches.length) % state.matches.length;
  return { ...state, activeIndex: index, index };
}

export function getMatchSummary(state: FindState): string {
  if (!state.matches.length) {
    return state.query ? "No matches" : "Find in document";
  }
  return `${state.matches.length} match${state.matches.length === 1 ? "" : "es"}`;
}

export function getScrollTarget(
  text = "",
  index = 0,
  options: ScrollTargetOptions = {},
): number {
  const lineHeight = options.lineHeight ?? 20;
  const viewportHeight = options.viewportHeight ?? 240;
  const lineIndex = (text.slice(0, index).match(/\n/g) ?? []).length;
  return Math.max(0, lineIndex * lineHeight - viewportHeight / 3);
}
