import unittest
from pathlib import Path

from PySide6.QtWidgets import QApplication

from staxmd.ui.window import StaxMDWindow

THEMES_DIR = Path(__file__).resolve().parents[1] / "staxmd/themes"


class StaxMDWindowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])

    def test_light_and_dark_theme_assets_exist(self) -> None:
        self.assertTrue((THEMES_DIR / "light.qss").is_file())
        self.assertTrue((THEMES_DIR / "dark.qss").is_file())

    def test_apply_light_theme_loads_qss(self) -> None:
        window = StaxMDWindow()
        window.apply_theme("light")
        # Light theme uses white background, which is specific to that asset
        self.assertIn("#ffffff", window.styleSheet())

    def test_apply_dark_theme_loads_qss(self) -> None:
        window = StaxMDWindow()
        window.apply_theme("dark")
        # Dark theme uses the #0f1216 workspace background, specific to that asset
        self.assertIn("#0f1216", window.styleSheet())

    def test_unknown_theme_falls_back_to_empty_stylesheet(self) -> None:
        window = StaxMDWindow()
        window.apply_theme("does-not-exist")
        self.assertEqual(window.styleSheet(), "")


if __name__ == "__main__":
    unittest.main()

