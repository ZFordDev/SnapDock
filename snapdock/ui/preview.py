from __future__ import annotations

import markdown
from PySide6.QtWidgets import QTextBrowser

# Snapdock-matching preview CSS — injected inline into rendered HTML
# so QTextBrowser renders clean typography without external stylesheets.
_PREVIEW_STYLE = """
<style>
  body {
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.7;
    color: #111111;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }
  h1 { font-size: 2em; font-weight: 700; margin: 0.6em 0 0.3em; color: #111111; }
  h2 { font-size: 1.5em; font-weight: 600; margin: 0.5em 0 0.25em;
       color: #111111; border-bottom: 1px solid #eee; padding-bottom: 0.2em; }
  h3 { font-size: 1.25em; font-weight: 600; margin: 0.4em 0 0.2em; color: #111111; }
  h4 { font-size: 1.1em; font-weight: 600; margin: 0.3em 0 0.15em; color: #333333; }
  p  { margin: 0.5em 0; }
  a  { color: #0969da; text-decoration: none; }
  a:hover { text-decoration: underline; }
  blockquote {
    border-left: 4px solid #d0d7de;
    margin: 1em 0;
    padding: 0.5em 1em;
    color: #57606a;
    background-color: #f6f8fa;
    border-radius: 0 6px 6px 0;
  }
  code {
    font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', Menlo, Consolas, monospace;
    font-size: 0.9em;
    background-color: #eff1f3;
    padding: 0.15em 0.4em;
    border-radius: 4px;
    color: #111111;
  }
  pre {
    background-color: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 1em 0;
  }
  pre code {
    background: none;
    padding: 0;
    border-radius: 0;
    font-size: 0.85em;
    line-height: 1.5;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }
  th, td {
    border: 1px solid #d0d7de;
    padding: 8px 12px;
    text-align: left;
  }
  th {
    background-color: #f6f8fa;
    font-weight: 600;
  }
  tr:nth-child(even) { background-color: #f6f8fa; }
  hr {
    border: none;
    border-top: 1px solid #d0d7de;
    margin: 1.5em 0;
  }
  ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
  li { margin: 0.25em 0; }
  img { max-width: 100%; border-radius: 6px; }
  strong { font-weight: 600; }

  /* Task lists (GFM) */
  ul.task-list { list-style: none; padding-left: 1em; }
  .task-list-item { display: flex; align-items: baseline; gap: 0.5em; }
  .task-list-item input[type="checkbox"] {
    margin: 0;
    accent-color: #0969da;
  }

  /* Details / summary (collapsible) */
  details {
    border: 1px solid #d0d7de;
    border-radius: 6px;
    padding: 0.5em 1em;
    margin: 1em 0;
    background-color: #f6f8fa;
  }
  details[open] { padding-bottom: 0.5em; }
  summary {
    font-weight: 600;
    cursor: pointer;
    padding: 0.25em 0;
    color: #0969da;
  }

  /* Highlighted text (==mark==) */
  mark {
    background-color: #fff8c5;
    padding: 0.1em 0.3em;
    border-radius: 3px;
  }

  /* Emoji images */
  img.emojione, img.twemoji {
    height: 1.1em;
    width: 1.1em;
    vertical-align: -0.15em;
    display: inline;
  }
</style>
"""

# Extensions that provide a GitHub Flavored Markdown experience.
_EXTENSIONS: list[str] = [
    # Core GFM features
    "fenced_code",
    "tables",
    "toc",
    "sane_lists",
    "nl2br",
    # Pymdown Extensions — GFM superset
    "pymdownx.extra",        # bundles footnotes, attr_list, def_list, admonition, md_in_html
    "pymdownx.superfences",  # nested fenced code, custom fences
    "pymdownx.highlight",    # syntax highlighting (inline styles for QTextBrowser)
    "pymdownx.magiclink",    # auto-linking URLs and emails
    "pymdownx.betterem",     # smarter emphasis (underscores in words)
    "pymdownx.caret",        # ^superscript^
    "pymdownx.tilde",        # ~~strikethrough~~
    "pymdownx.tasklist",     # - [x] checkbox task lists
    "pymdownx.emoji",        # :rocket: GitHub-style emoji
    "pymdownx.mark",         # ==highlighted text==
    "pymdownx.details",      # <details>/<summary> collapsible blocks
]

_EXTENSION_CONFIGS: dict = {
    "pymdownx.highlight": {
        "noclasses": True,
        "pygments_style": "monokai",
    },
    "pymdownx.superfences": {
        "preserve_tabs": True,
    },
    "toc": {
        "permalink": True,
    },
}


def render_markdown(text: str) -> str:
    """Convert Markdown text to HTML with full GFM support.

    Returns a complete HTML string with inline styles suitable for
    QTextBrowser rendering.  Always returns a valid string — on error
    the original text is wrapped in a ``<pre>`` block so the user can
    still read it.
    """
    if not text or not text.strip():
        return _PREVIEW_STYLE + "<p></p>"

    try:
        html = markdown.markdown(
            text,
            extensions=_EXTENSIONS,
            extension_configs=_EXTENSION_CONFIGS,
        )
    except Exception:
        # Second attempt: strip pymdownx extensions and fall back to core
        # markdown only.  This covers the case where an optional extension
        # crashes on unusual input.
        try:
            html = markdown.markdown(
                text,
                extensions=["fenced_code", "tables", "toc", "sane_lists"],
            )
        except Exception:
            # Last resort — show raw text so the user never sees a blank
            # preview pane.
            import html as _html
            html = "<pre>" + _html.escape(text) + "</pre>"

    return _PREVIEW_STYLE + html


class SnapDockPreview(QTextBrowser):

    def __init__(self) -> None:
        super().__init__()

        self.setObjectName("PreviewMain")
        self.setOpenExternalLinks(True)
        self.setPlaceholderText("Preview will appear here")
        self.setFrameStyle(0)

    # --- Markdown Rendering ---
    def render_markdown(self, text: str) -> str:
        """Convert Markdown text into HTML with advanced options and syntax highlighting."""
        return render_markdown(text)

    def update_preview(self, markdown_text: str) -> None:
        """Render Markdown and update the preview pane."""
        html = self.render_markdown(markdown_text)
        self.setHtml(html)

    # --- Optional: overlay mode toggle ---
    def set_overlay_mode(self, enabled: bool) -> None:
        """Enable or disable overlay preview mode."""
        if enabled:
            self.raise_()
            self.show()
        else:
            self.lower()
            self.show()

    # --- Optional: clear preview ---
    def clear_preview(self) -> None:
        self.setHtml("")
