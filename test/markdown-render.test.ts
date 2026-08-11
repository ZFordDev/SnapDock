import test from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../src/modules/markdown.js";

const sampleMarkdown = `
# Title Test

::: note
This is a note callout.
:::

::: info
This is an info callout.
:::

::: details Click to expand
Hidden **details** content.
:::

- [x] Task done
- [ ] Task pending

| Feature | Status |
| --- | --- |
| GFM | ~~missing~~ supported |

Check this ~sub~, ^sup^, and ==mark== text :rocket:.

External Link: https://staxdash.com
Internal Link: [Jump](#title-test)

![Image test](attachment.png)

[^note]: A footnote.
Footnote reference[^note].

\`\`\`typescript
const phase: number = 5;
\`\`\`

<!-- pagebreak -->

Content on the next page.
`;

test("renders the complete SnapDock Markdown feature set through Marked", () => {
  const html = renderMarkdown(sampleMarkdown, {
    documentPath: "/docs/test.md",
    resolveLocalAttachment: (_documentPath, source) => `app://local-assets/${source}`,
  });

  assert.match(html, /<h1 id="title-test">Title Test<\/h1>/);
  assert.match(html, /<div class="md-note">/);
  assert.match(html, /<div class="md-info">/);
  assert.match(html, /<details class="md-details"><summary>Click to expand<\/summary>/);
  assert.match(html, /<strong>details<\/strong>/);
  assert.match(html, /<input[^>]*checked[^>]*type="checkbox"/);
  assert.match(html, /<table>/);
  assert.match(html, /<del>missing<\/del>/);
  assert.match(html, /<sub>sub<\/sub>/);
  assert.match(html, /<sup>sup<\/sup>/);
  assert.match(html, /<mark>mark<\/mark>/);
  assert.match(html, /🚀/u);
  assert.match(html, /href="https:\/\/staxdash\.com"[^>]*target="_blank"[^>]*rel="noopener"/);
  assert.match(html, /href="#title-test"/);
  assert.doesNotMatch(html, /href="#title-test"[^>]*target="_blank"/);
  assert.match(html, /src="app:\/\/local-assets\/attachment\.png"/);
  assert.match(html, /class="footnotes"/);
  assert.match(html, /class="hljs language-typescript"/);
  assert.match(html, /<span class="hljs-keyword">const<\/span>/);
  assert.match(html, /<div class="page-break" aria-hidden="true"><\/div>/);
});

test("only converts standalone page-break comments", () => {
  assert.match(renderMarkdown("Before <!-- pagebreak --> after"), /<!-- pagebreak -->/);
  assert.match(renderMarkdown("<!-- ordinary comment -->"), /<!-- ordinary comment -->/);
});

test("escapes container titles and preserves raw HTML compatibility", () => {
  const html = renderMarkdown("::: details <Unsafe>\nBody\n:::\n\n<span>HTML</span>");
  assert.match(html, /<summary>&lt;Unsafe&gt;<\/summary>/);
  assert.match(html, /<span>HTML<\/span>/);
});
