import { Marked, type MarkedExtension, type Tokens } from "marked";
import { markedHighlight } from "marked-highlight";
import { gfmHeadingId } from "marked-gfm-heading-id";
import markedFootnote from "marked-footnote";
import hljs from "highlight.js";
import { get as getEmoji, has as hasEmoji } from "node-emoji";
import type { FilePath } from "../types/files";

export interface MarkdownRenderOptions {
  documentPath?: FilePath | null;
  resolveLocalAttachment?: (documentPath: FilePath, attachmentPath: string) => string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function snapDockSyntax(): MarkedExtension {
  return {
    extensions: [
      {
        name: "pageBreak",
        level: "block",
        start: (source) => source.search(/<!--\s*pagebreak\s*-->/i),
        tokenizer(source) {
          const match = /^\s*<!--\s*pagebreak\s*-->\s*(?:\n|$)/i.exec(source);
          return match ? { type: "pageBreak", raw: match[0] } : undefined;
        },
        renderer: () => '<div class="page-break" aria-hidden="true"></div>\n',
      },
      {
        name: "container",
        level: "block",
        start: (source) => source.match(/^:::/m)?.index,
        tokenizer(source) {
          const match = /^:::\s*(note|warning|tip|info|details)(?:[ \t]+([^\n]*))?[ \t]*\n([\s\S]*?)\n:::[ \t]*(?:\n|$)/i.exec(source);
          if (!match?.[1]) return;
          const kind = match[1].toLowerCase();
          return {
            type: "container",
            raw: match[0],
            kind,
            title: match[2]?.trim() || "Details",
            tokens: this.lexer.blockTokens(match[3] ?? ""),
          };
        },
        renderer(token) {
          const kind = String(token.kind);
          const content = this.parser.parse(token.tokens as Tokens.Generic[]);
          if (kind === "details") {
            return `<details class="md-details"><summary>${escapeHtml(String(token.title))}</summary>\n${content}</details>\n`;
          }
          return `<div class="md-${kind}">${content}</div>`;
        },
        childTokens: ["tokens"],
      },
      {
        name: "mark",
        level: "inline",
        start: (source) => source.indexOf("=="),
        tokenizer(source) {
          const match = /^==(?=\S)([\s\S]*?\S)==/.exec(source);
          return match ? { type: "mark", raw: match[0], tokens: this.lexer.inlineTokens(match[1] ?? "") } : undefined;
        },
        renderer(token) {
          return `<mark>${this.parser.parseInline(token.tokens as Tokens.Generic[])}</mark>`;
        },
        childTokens: ["tokens"],
      },
      {
        name: "subscript",
        level: "inline",
        start: (source) => source.search(/~(?!~)/),
        tokenizer(source) {
          const match = /^~(?!~)([^~\n]+?)~(?!~)/.exec(source);
          return match ? { type: "subscript", raw: match[0], text: match[1] } : undefined;
        },
        renderer: (token) => `<sub>${escapeHtml(String(token.text))}</sub>`,
      },
      {
        name: "superscript",
        level: "inline",
        start: (source) => source.indexOf("^"),
        tokenizer(source) {
          const match = /^\^([^\^\n]+?)\^/.exec(source);
          return match ? { type: "superscript", raw: match[0], text: match[1] } : undefined;
        },
        renderer: (token) => `<sup>${escapeHtml(String(token.text))}</sup>`,
      },
      {
        name: "emoji",
        level: "inline",
        start: (source) => source.search(/:[+\-\w]+:/),
        tokenizer(source) {
          const match = /^:([+\-\w]+):/.exec(source);
          if (!match?.[1] || !hasEmoji(match[1])) return;
          return { type: "emoji", raw: match[0], emoji: getEmoji(match[1]) };
        },
        renderer: (token) => String(token.emoji),
      },
    ],
  };
}

function createRenderer(options: MarkdownRenderOptions): Marked {
  const renderer = new Marked(
    { gfm: true, breaks: false },
    markedHighlight({
      emptyLangClass: "hljs",
      langPrefix: "hljs language-",
      highlight(code, language) {
        const resolvedLanguage = language && hljs.getLanguage(language) ? language : "plaintext";
        return hljs.highlight(code, { language: resolvedLanguage }).value;
      },
    }),
    gfmHeadingId(),
    markedFootnote(),
    snapDockSyntax(),
  );

  renderer.use({
    renderer: {
      link({ href, title, tokens }) {
        const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
        const externalAttributes = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener"' : "";
        return `<a href="${escapeHtml(href)}"${titleAttribute}${externalAttributes}>${this.parser.parseInline(tokens)}</a>`;
      },
      image({ href, title, text }) {
        const { documentPath } = options;
        const resolveAttachment = options.resolveLocalAttachment
          ?? (typeof window !== "undefined" ? window.snapdockAPI?.resolveLocalAttachment : undefined);
        const source = documentPath && resolveAttachment ? resolveAttachment(documentPath, href) : href;
        const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
        return `<img src="${escapeHtml(source)}" alt="${escapeHtml(text)}"${titleAttribute}>`;
      },
    },
  });
  return renderer;
}

export function renderMarkdown(text: string, options: MarkdownRenderOptions = {}): string {
  return createRenderer(options).parse(text || "", { async: false });
}
