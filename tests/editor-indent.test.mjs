import test from "node:test";
import assert from "node:assert/strict";

import { indentMarkdown, MARKDOWN_INDENT } from "../src/modules/ui/editorIndent.js";

test("Tab inserts four spaces at the caret", () => {
  const result = indentMarkdown("- item", 2, 2);
  assert.equal(result.value, `- ${MARKDOWN_INDENT}item`);
  assert.equal(result.selectionStart, 2 + MARKDOWN_INDENT.length);
  assert.equal(result.selectionEnd, 2 + MARKDOWN_INDENT.length);
});

test("Tab indents every selected line", () => {
  const source = "- first\n- second\n- third";
  const result = indentMarkdown(source, 0, source.length);
  assert.equal(result.value, "    - first\n    - second\n    - third");
  assert.equal(result.selectionStart, 0);
  assert.equal(result.selectionEnd, source.length + 12);
});

test("a selection ending after a newline does not indent the next line", () => {
  const source = "one\ntwo\nthree";
  const result = indentMarkdown(source, 0, 4);
  assert.equal(result.value, "    one\ntwo\nthree");
});

test("Shift+Tab removes up to four leading spaces from the current line", () => {
  const result = indentMarkdown("    - nested", 8, 8, true);
  assert.equal(result.value, "- nested");
  assert.equal(result.selectionStart, 4);
  assert.equal(result.selectionEnd, 4);
});

test("Shift+Tab outdents selected lines with mixed indentation", () => {
  const source = "    one\n  two\n\tthree";
  const result = indentMarkdown(source, 0, source.length, true);
  assert.equal(result.value, "one\ntwo\nthree");
  assert.equal(result.selectionStart, 0);
  assert.equal(result.selectionEnd, "one\ntwo\nthree".length);
});

test("Shift+Tab leaves an unindented line unchanged", () => {
  const result = indentMarkdown("plain", 2, 2, true);
  assert.deepEqual(result, {
    value: "plain",
    selectionStart: 2,
    selectionEnd: 2,
    changed: false,
  });
});
