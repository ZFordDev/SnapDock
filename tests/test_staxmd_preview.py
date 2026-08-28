import unittest

from PySide6.QtCore import QEventLoop, QTimer
from PySide6.QtWidgets import QApplication

from staxmd.ui.editor import StaxMDEditor


class StaxMDPreviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])

    def test_text_change_emits_preview_update(self) -> None:
        editor = StaxMDEditor()
        received = []
        editor.preview_changed.connect(lambda markdown_text: received.append(markdown_text))

        editor.setPlainText("# Hello\n\nThis is markdown")

        # The preview signal is debounced — wait for the timer to fire.
        loop = QEventLoop()
        QTimer.singleShot(300, loop.quit)
        loop.exec()

        self.assertTrue(received)
        self.assertIn("# Hello", received[-1])


if __name__ == "__main__":
    unittest.main()

