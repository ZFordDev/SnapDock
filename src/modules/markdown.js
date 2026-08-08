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
import { full as emoji } from "markdown-it-emoji";

// 1. MarkdownIt Instance
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  langPrefix: "hljs language-",
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${
          hljs.highlight(str, { language: lang }).value
        }</code></pre>`;
      } catch (_) {}
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  }
});

// 2. Core & Inline Plugins
md.use(footnote);
md.use(taskLists, { enabled: true });
md.use(mark);
md.use(sub);
md.use(sup);
md.use(emoji);

// 3. Anchors & Link Attributes
md.use(anchor, {
  level: [1, 2, 3, 4]
});

// Target external links only, preserving internal anchors (#section)
md.use(mila, {
  matcher(href) {
    return /^https?:\/\//i.test(href);
  },
  attrs: {
    target: "_blank",
    rel: "noopener"
  }
});

// 4. Custom Image Resolution Hook
const defaultImageRenderer = md.renderer.rules.image;

md.renderer.rules.image = (tokens, index, options, env, self) => {
  const token = tokens[index];
  const source = token.attrGet("src");
  const documentPath = env?.documentPath;

  const isWindowDefined = typeof window !== "undefined";
  const resolveFn = isWindowDefined ? window.electronAPI?.resolveLocalAttachment : null;

  if (source && documentPath && resolveFn) {
    token.attrSet("src", resolveFn(documentPath, source));
  }

  return defaultImageRenderer(tokens, index, options, env, self);
};

// 5. Container Callouts (note, warning, tip, info)
const callouts = ["note", "warning", "tip", "info"];

callouts.forEach(type => {
  md.use(container, type, {
    validate: (params) => params.trim().match(new RegExp(`^${type}$`)),
    render(tokens, idx) {
      return tokens[idx].nesting === 1 ? `<div class="md-${type}">` : `</div>`;
    }
  });
});

// 6. Collapsible Details/Summary Container
md.use(container, "details", {
  validate: (params) => params.trim().match(/^details\s*(.*)$/),
  render(tokens, idx) {
    const token = tokens[idx];
    if (token.nesting === 1) {
      const match = token.info.trim().match(/^details\s*(.*)$/);
      const title = match && match[1] ? md.utils.escapeHtml(match[1]) : "Details";
      return `<details class="md-details"><summary>${title}</summary>\n`;
    } else {
      return `</details>\n`;
    }
  }
});

// 7. Exported Renderer
export function renderMarkdown(text, env = {}) {
  return md.render(text || "", env);
}