import unittest

from staxmd.ui.preview import render_markdown


class RenderMarkdownTests(unittest.TestCase):
    """Unit tests for the standalone render_markdown() function."""

    def test_empty_string(self) -> None:
        result = render_markdown("")
        self.assertIn("<p></p>", result)
        self.assertIn("<style>", result)

    def test_whitespace_only(self) -> None:
        result = render_markdown("   \n  \n  ")
        self.assertIn("<p></p>", result)

    def test_none_like_input(self) -> None:
        # The function should handle falsy input without crashing
        result = render_markdown("")
        self.assertIsInstance(result, str)

    def test_heading(self) -> None:
        result = render_markdown("# Hello")
        self.assertIn("<h1", result)
        self.assertIn("Hello", result)

    def test_bold_and_italic(self) -> None:
        result = render_markdown("**bold** and *italic*")
        self.assertIn("<strong", result)
        self.assertIn("<em", result)

    def test_strikethrough(self) -> None:
        result = render_markdown("~~deleted~~")
        self.assertIn("<del", result)

    def test_highlight(self) -> None:
        result = render_markdown("==highlighted==")
        self.assertIn("<mark", result)

    def test_superscript(self) -> None:
        result = render_markdown("x^2^")
        self.assertIn("<sup", result)

    def test_blockquote(self) -> None:
        result = render_markdown("> quote")
        self.assertIn("<blockquote", result)

    def test_fenced_code_block(self) -> None:
        md = "```python\nprint('hi')\n```"
        result = render_markdown(md)
        self.assertIn("<code", result)
        self.assertIn("print", result)

    def test_inline_code(self) -> None:
        result = render_markdown("`code`")
        self.assertIn("<code", result)

    def test_table(self) -> None:
        md = "| A | B |\n|---|---|\n| 1 | 2 |"
        result = render_markdown(md)
        self.assertIn("<table", result)
        self.assertIn("<th", result)

    def test_unordered_list(self) -> None:
        result = render_markdown("- item1\n- item2")
        self.assertIn("<ul", result)
        self.assertIn("item1", result)

    def test_ordered_list(self) -> None:
        result = render_markdown("1. first\n2. second")
        self.assertIn("<ol", result)

    def test_task_list(self) -> None:
        md = "- [x] done\n- [ ] todo"
        result = render_markdown(md)
        self.assertIn("task-list", result)
        self.assertIn("checkbox", result)

    def test_horizontal_rule(self) -> None:
        result = render_markdown("---")
        self.assertIn("<hr", result)

    def test_link(self) -> None:
        result = render_markdown("[click](https://example.com)")
        self.assertIn("href", result)
        self.assertIn("example.com", result)

    def test_emoji(self) -> None:
        result = render_markdown(":rocket:")
        # Emoji renders as an <img> tag (emojione CDN or alt text)
        self.assertIn("rocket", result)

    def test_html_is_not_escaped(self) -> None:
        result = render_markdown("<div>raw html</div>")
        self.assertIn("<div>", result)

    def test_preview_style_included(self) -> None:
        result = render_markdown("# Test")
        self.assertIn("<style>", result)
        self.assertIn("font-family", result)

    def test_gfm_features_combined(self) -> None:
        md = """# Title

## Features

**Bold**, *italic*, ~~strike~~, ==mark==, ^sup^

- [x] Task 1
- [ ] Task 2

> Blockquote

```python
code()
```

| Col | Val |
|-----|-----|
| A   | 1   |

---

:heart:
"""
        result = render_markdown(md)
        # Should not crash and should contain key elements
        self.assertIn("<h1", result)
        self.assertIn("<h2", result)
        self.assertIn("<strong", result)
        self.assertIn("<del", result)
        self.assertIn("<mark", result)
        self.assertIn("<sup", result)
        self.assertIn("task-list", result)
        self.assertIn("<blockquote", result)
        self.assertIn("<code", result)
        self.assertIn("<table", result)
        self.assertIn("<hr", result)

