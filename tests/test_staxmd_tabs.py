import tempfile
import unittest
from pathlib import Path

from PySide6.QtWidgets import QApplication, QTabBar

from staxmd.ui.tabs import StaxMDTabBar, TabDocument
from staxmd.ui.window import StaxMDWindow


class TabDocumentTests(unittest.TestCase):
    def test_empty_document(self) -> None:
        doc = TabDocument()
        self.assertIsNone(doc.path)
        self.assertEqual(doc.text, "")
        self.assertFalse(doc.dirty)
        self.assertEqual(doc.label, "Untitled")

    def test_from_path(self) -> None:
        with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w") as f:
            f.write("# Hello\n\nWorld")
            path = f.name
        try:
            doc = TabDocument.from_path(path)
            self.assertEqual(doc.text, "# Hello\n\nWorld")
            self.assertEqual(doc.label, Path(path).name)
            self.assertEqual(doc.path, path)
        finally:
            Path(path).unlink(missing_ok=True)

    def test_from_missing_path(self) -> None:
        doc = TabDocument.from_path("/nonexistent/file.md")
        self.assertEqual(doc.text, "")
        self.assertEqual(doc.label, "file.md")


class StaxMDTabBarTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])

    def test_add_and_count(self) -> None:
        bar = StaxMDTabBar()
        bar.add_tab("Doc 1")
        bar.add_tab("Doc 2")
        self.assertEqual(bar.count(), 2)

    def test_remove_tab(self) -> None:
        bar = StaxMDTabBar()
        bar.add_tab("Doc 1")
        bar.add_tab("Doc 2")
        bar.remove_tab(0)
        self.assertEqual(bar.count(), 1)

    def test_set_tab_label(self) -> None:
        bar = StaxMDTabBar()
        idx = bar.add_tab("Old")
        bar.set_tab_label(idx, "New")
        self.assertEqual(bar._tab_bar.tabText(idx), "New")

    def test_set_tab_dirty(self) -> None:
        bar = StaxMDTabBar()
        idx = bar.add_tab("Doc")
        bar.set_tab_dirty(idx, True)
        self.assertTrue("\u25cf" in bar._tab_bar.tabText(idx))
        bar.set_tab_dirty(idx, False)
        self.assertFalse("\u25cf" in bar._tab_bar.tabText(idx))

    def test_close_button_exists(self) -> None:
        bar = StaxMDTabBar()
        idx = bar.add_tab("Doc")
        btn = bar._tab_bar.tabButton(idx, QTabBar.ButtonPosition.RightSide)
        self.assertIsNotNone(btn)


class StaxMDWindowTabTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])

    def test_window_starts_with_one_tab(self) -> None:
        window = StaxMDWindow()
        self.assertEqual(window.tab_bar.count(), 1)
        self.assertEqual(len(window._tabs), 1)

    def test_new_tab_creates_tab(self) -> None:
        window = StaxMDWindow()
        window._new_tab()
        self.assertEqual(window.tab_bar.count(), 2)
        self.assertEqual(len(window._tabs), 2)

    def test_load_file_creates_new_tab(self) -> None:
        window = StaxMDWindow()
        with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w") as f:
            f.write("# Test")
            path = f.name
        try:
            window.load_file(path)
            self.assertEqual(window.tab_bar.count(), 2)
            self.assertEqual(window._tabs[1].text, "# Test")
        finally:
            Path(path).unlink(missing_ok=True)

    def test_load_same_file_does_not_duplicate(self) -> None:
        window = StaxMDWindow()
        with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w") as f:
            f.write("# Test")
            path = f.name
        try:
            window.load_file(path)
            window.load_file(path)
            self.assertEqual(window.tab_bar.count(), 2)  # initial + 1
        finally:
            Path(path).unlink(missing_ok=True)

    def test_view_modes_switch_correctly(self) -> None:
        from staxmd.ui.window import ViewMode

        window = StaxMDWindow()
        window.show()
        # Default is split — both in splitter (page 0)
        self.assertEqual(window._mode_stack.currentIndex(), 0)

        # Source: both in splitter, preview hidden
        window.set_view_mode(ViewMode.SOURCE)
        self.assertEqual(window._mode_stack.currentIndex(), 0)
        self.assertTrue(window.editor.isVisible())
        self.assertFalse(window.preview.isVisible())

        # Preview: both in splitter, editor hidden
        window.set_view_mode(ViewMode.PREVIEW)
        self.assertEqual(window._mode_stack.currentIndex(), 0)
        self.assertFalse(window.editor.isVisible())
        self.assertTrue(window.preview.isVisible())

        # Live: widgets moved to live overlay (page 1)
        window.set_view_mode(ViewMode.LIVE)
        self.assertEqual(window._mode_stack.currentIndex(), 1)
        self.assertTrue(window.editor.isVisible())
        self.assertTrue(window.preview.isVisible())

        # Back to split: widgets back in splitter (page 0)
        window.set_view_mode(ViewMode.SPLIT)
        self.assertEqual(window._mode_stack.currentIndex(), 0)
        self.assertTrue(window.editor.isVisible())
        self.assertTrue(window.preview.isVisible())

    def test_title_updates_with_dirty(self) -> None:
        window = StaxMDWindow()
        window.editor.setPlainText("hello")
        self.assertTrue("\u2022" in window.windowTitle())

