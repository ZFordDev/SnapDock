export const MARKDOWN_INDENT = "    ";

function lineStartAt(value, position) {
  return value.lastIndexOf("\n", Math.max(0, position - 1)) + 1;
}

function selectedLineRange(value, selectionStart, selectionEnd) {
  const start = lineStartAt(value, selectionStart);
  let effectiveEnd = selectionEnd;

  // A selection ending immediately after a newline does not include the next
  // line, matching the behaviour users expect from code editors.
  if (selectionEnd > selectionStart && value[selectionEnd - 1] === "\n") {
    effectiveEnd -= 1;
  }

  const newline = value.indexOf("\n", effectiveEnd);
  const end = newline === -1 ? value.length : newline;
  return { start, end };
}

function outdentWidth(value, lineStart) {
  if (value[lineStart] === "\t") return 1;

  let spaces = 0;
  while (spaces < MARKDOWN_INDENT.length && value[lineStart + spaces] === " ") {
    spaces += 1;
  }
  return spaces;
}

function mapPositionAfterRemovals(position, removals) {
  let mapped = position;
  for (const removal of removals) {
    if (position <= removal.from) continue;
    mapped -= Math.min(removal.count, position - removal.from);
  }
  return mapped;
}

export function indentMarkdown(value, selectionStart, selectionEnd, outdent = false) {
  const source = value ?? "";
  const start = Math.max(0, Math.min(selectionStart ?? 0, source.length));
  const end = Math.max(start, Math.min(selectionEnd ?? start, source.length));

  if (!outdent && start === end) {
    return {
      value: source.slice(0, start) + MARKDOWN_INDENT + source.slice(end),
      selectionStart: start + MARKDOWN_INDENT.length,
      selectionEnd: start + MARKDOWN_INDENT.length,
      changed: true,
    };
  }

  const range = selectedLineRange(source, start, end);
  const lineStarts = [range.start];
  for (let index = range.start; index < range.end; index += 1) {
    if (source[index] === "\n") lineStarts.push(index + 1);
  }

  if (!outdent) {
    let result = source;
    for (let index = lineStarts.length - 1; index >= 0; index -= 1) {
      const lineStart = lineStarts[index];
      result = result.slice(0, lineStart) + MARKDOWN_INDENT + result.slice(lineStart);
    }

    return {
      value: result,
      selectionStart: start === range.start ? start : start + MARKDOWN_INDENT.length,
      selectionEnd: end + MARKDOWN_INDENT.length * lineStarts.length,
      changed: true,
    };
  }

  const removals = lineStarts
    .map(from => ({ from, count: outdentWidth(source, from) }))
    .filter(removal => removal.count > 0);

  if (!removals.length) {
    return { value: source, selectionStart: start, selectionEnd: end, changed: false };
  }

  let result = source;
  for (let index = removals.length - 1; index >= 0; index -= 1) {
    const removal = removals[index];
    result = result.slice(0, removal.from) + result.slice(removal.from + removal.count);
  }

  return {
    value: result,
    selectionStart: mapPositionAfterRemovals(start, removals),
    selectionEnd: mapPositionAfterRemovals(end, removals),
    changed: true,
  };
}

export function initEditorIndent(editor = document.getElementById("markdownInputMain")) {
  if (!editor) return;

  editor.addEventListener("keydown", event => {
    if (event.key !== "Tab" || event.ctrlKey || event.metaKey || event.altKey) return;

    event.preventDefault();
    const result = indentMarkdown(
      editor.value,
      editor.selectionStart,
      editor.selectionEnd,
      event.shiftKey
    );

    if (!result.changed) return;

    editor.setRangeText(result.value, 0, editor.value.length, "preserve");
    editor.setSelectionRange(result.selectionStart, result.selectionEnd);
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
