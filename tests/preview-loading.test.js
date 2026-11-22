const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const settle = () => new Promise(setImmediate);
function element() {
  const classes = new Set();
  return {
    style: {}, listeners: {}, attributes: {}, children: [], value: "first document",
    classList: {
      add: name => classes.add(name), remove: name => classes.delete(name),
      contains: name => classes.has(name),
    },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(name, callback) { this.listeners[name] = callback; },
    replaceChildren(...children) { this.children = children; },
  };
}

function setup({ split = false, load } = {}) {
  const editor = element(), preview = element(), button = element();
  const editorWrapper = element(), previewWrapper = element(), workspace = element();
  const events = {}, rendered = [];
  let filePath = "/docs/first.md", loads = 0;
  const renderer = { renderMarkdown: (text, env) => {
    rendered.push({ text, path: env.documentPath });
    return `rendered:${text}`;
  } };
  const wrappers = {
    ".editor-wrapper": editorWrapper, ".preview-wrapper": previewWrapper, ".workspace": workspace,
  };
  const context = vm.createContext({
    console: { error() {} }, setTimeout, clearTimeout,
    document: {
      querySelector: selector => wrappers[selector] || null,
      getElementById: () => null,
      addEventListener: (name, callback) => { events[name] = callback; },
    },
    localStorage: { getItem: () => split ? "split" : null, setItem() {} },
    DOMParser: class { parseFromString(html) { return { body: { childNodes: [html] } }; } },
    getActiveTab: () => ({ filePath }),
    loadMarkdown: () => { loads++; return load ? load(renderer, loads) : Promise.resolve(renderer); },
    editor, preview, button,
  });
  const source = fs.readFileSync(path.join(__dirname, "../src/modules/ui/viewMode.js"), "utf8")
    .replace(/^import .*;\r?$/gm, "")
    .replace("export function initViewModeToggle", "function initViewModeToggle")
    // Control chunk completion while executing the actual view-mode implementation.
    .replace('import("../markdown.js")', "loadMarkdown()");
  vm.runInContext(source, context);
  vm.runInContext("initViewModeToggle({ toggleBtn: button, editor, preview });", context);
  return {
    editor, preview, editorWrapper, previewWrapper, rendered, events,
    get loads() { return loads; },
    setFile: value => { filePath = value; },
    toggle: () => button.listeners.click({ stopPropagation() {}, target: { closest: () => null } }),
  };
}

test("editor startup does not import the renderer; first preview loads it once", async () => {
  const h = setup();
  await settle();
  assert.equal(h.loads, 0);
  h.toggle();
  await settle();
  assert.equal(h.loads, 1);
  assert.deepEqual(h.preview.children, ["rendered:first document"]);
  h.toggle(); h.toggle();
  await settle();
  assert.equal(h.loads, 1);
});

test("saved split view loads its renderer immediately", async () => {
  const h = setup({ split: true });
  await settle();
  assert.equal(h.loads, 1);
  assert.equal(h.previewWrapper.classList.contains("hidden"), false);
  assert.equal(h.editorWrapper.classList.contains("hidden"), false);
  assert.deepEqual(h.preview.children, ["rendered:first document"]);
});

test("a tab change during loading renders only the latest document and path", async () => {
  let finish;
  const h = setup({ load: renderer => new Promise(resolve => { finish = () => resolve(renderer); }) });
  h.toggle();
  h.editor.value = "latest document";
  h.setFile("/docs/latest.md");
  h.events["snapdock:updatePreview"]();
  finish();
  await settle();
  assert.deepEqual(h.rendered, [{ text: "latest document", path: "/docs/latest.md" }]);
  assert.equal(h.preview.attributes["aria-busy"], undefined);
});

test("returning to the editor during loading does not update the hidden preview", async () => {
  let finish;
  const h = setup({ load: renderer => new Promise(resolve => { finish = () => resolve(renderer); }) });
  h.toggle(); h.toggle();
  finish();
  await settle();
  assert.equal(h.editorWrapper.classList.contains("hidden"), false);
  assert.deepEqual(h.rendered, []);
});

test("renderer failure is handled and a later preview attempt can retry", async () => {
  const h = setup({ load: (renderer, count) => count === 1
    ? Promise.reject(new Error("chunk unavailable")) : Promise.resolve(renderer) });
  h.toggle();
  await settle();
  assert.match(h.preview.textContent, /Unable to load preview/);
  assert.equal(h.preview.attributes["aria-busy"], undefined);
  h.toggle(); h.toggle();
  await settle();
  assert.equal(h.loads, 2);
  assert.deepEqual(h.preview.children, ["rendered:first document"]);
});
