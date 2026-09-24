import os
import tempfile
import unittest
from pathlib import Path

from PySide6.QtWidgets import QApplication

import snapdock.persistence as persistence
from snapdock.ui.window import SnapDockWindow

THEMES_DIR = Path(__file__).resolve().parents[1] / "snapdock/themes"


_ORIG_CONFIG_DIR = None


def setUpModule() -> None:
    global _ORIG_CONFIG_DIR
    _ORIG_CONFIG_DIR = os.environ.get("SNAPDOCK_CONFIG_DIR")
    os.environ["SNAPDOCK_CONFIG_DIR"] = tempfile.mkdtemp()


def tearDownModule() -> None:
    if _ORIG_CONFIG_DIR is None:
        os.environ.pop("SNAPDOCK_CONFIG_DIR", None)
    else:
        os.environ["SNAPDOCK_CONFIG_DIR"] = _ORIG_CONFIG_DIR


class SnapDockWindowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])

    def setUp(self) -> None:
        self._cfg = tempfile.mkdtemp()
        self._prev = os.environ.get("SNAPDOCK_CONFIG_DIR")
        os.environ["SNAPDOCK_CONFIG_DIR"] = self._cfg

    def tearDown(self) -> None:
        if self._prev is None:
            os.environ.pop("SNAPDOCK_CONFIG_DIR", None)
        else:
            os.environ["SNAPDOCK_CONFIG_DIR"] = self._prev

    def test_light_and_dark_theme_assets_exist(self) -> None:
        self.assertTrue((THEMES_DIR / "light.qss").is_file())
        self.assertTrue((THEMES_DIR / "dark.qss").is_file())

    def test_apply_light_theme_loads_qss(self) -> None:
        window = SnapDockWindow()
        window.apply_theme("light")
        # Light theme uses white background, which is specific to that asset
        self.assertIn("#ffffff", window.styleSheet())

    def test_apply_dark_theme_loads_qss(self) -> None:
        window = SnapDockWindow()
        window.apply_theme("dark")
        # Dark theme uses the #0f1216 workspace background, specific to that asset
        self.assertIn("#0f1216", window.styleSheet())

    def test_unknown_theme_falls_back_to_empty_stylesheet(self) -> None:
        window = SnapDockWindow()
        window.apply_theme("does-not-exist")
        self.assertEqual(window.styleSheet(), "")

    def test_session_is_restored_from_settings(self) -> None:
        with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w") as f:
            f.write("# Saved\n\ncontent")
            saved_path = f.name
        try:
            settings = persistence.Settings(
                theme="dark",
                view_mode="preview",
                session=[
                    {"path": None, "text": "untitled work", "dirty": True, "label": "Scratch"},
                    {"path": saved_path, "text": None, "dirty": False, "label": None},
                ],
                active_tab=1,
            )
            persistence.save_settings(settings)

            window = SnapDockWindow()
            self.assertEqual(window.tab_bar.count(), 2)
            self.assertEqual(window._tabs[1].path, saved_path)
            self.assertEqual(window._tabs[1].text, "# Saved\n\ncontent")
            self.assertEqual(window._active_tab, 1)
            self.assertEqual(window.editor.toPlainText(), "# Saved\n\ncontent")
            self.assertEqual(window._current_mode.value, "preview")
        finally:
            Path(saved_path).unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()

