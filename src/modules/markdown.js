import MarkdownIt from "markdown-it";
import mila from "markdown-it-link-attributes";
import anchor from "markdown-it-anchor";
import footnote from "markdown-it-footnote";
import taskLists from "markdown-it-task-lists";
import mark from "markdown-it-mark";
import sub from "markdown-it-sub";
import sup from "markdown-it-sup";
import container from "markdown-it-container";
import hljs from "highlight.js";

// MarkdownIt Instance

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
      } catch (_) {}
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  }
});

// Plugins

md.use(footnote);
md.use(taskLists, { enabled: true });
md.use(mark);
md.use(sub);
md.use(sup);

md.use(anchor, {
  level: [1, 2, 3, 4]
});

md.use(mila, {
  attrs: {
    target: "_blank",
    rel: "noopener"
  }
});

// Custom containers (:::note, :::warning, :::tip)
["note", "warning", "tip"].forEach(type => {
  md.use(container, type, {
    render(tokens, idx) {
      const token = tokens[idx];
      if (token.nesting === 1) {
        return `<div class="md-${type}">`;
      } else {
        return `</div>`;
      }
    }
  });
});

// Exported Renderer

export function renderMarkdown(text) {
  return md.render(text || "");
}