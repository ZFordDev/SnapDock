import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_EDITOR_FONT_STATE,
  resolveEditorFontState,
  applyEditorFontToElement,
} from "./editorFont";

test("resolveEditorFontState defaults to the built-in values", () => {
  assert.deepEqual(resolveEditorFontState(null), DEFAULT_EDITOR_FONT_STATE);
  assert.deepEqual(resolveEditorFontState({}), DEFAULT_EDITOR_FONT_STATE);
});

test("resolveEditorFontState preserves supported family and size values", () => {
  const state = resolveEditorFontState({ family: "sans", size: "125%" });
  assert.equal(state.family, "sans");
  assert.equal(state.size, "125%");
});

test("applyEditorFontToElement updates the textarea style immediately", () => {
  const editor = {
    style: { fontFamily: "", fontSize: "" },
    dataset: {},
  };
  applyEditorFontToElement(editor, { family: "serif", size: "110%" });

  assert.equal(editor.style.fontFamily, "Georgia, 'Times New Roman', serif");
  assert.equal(editor.style.fontSize, "110%");
});
