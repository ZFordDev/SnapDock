from __future__ import annotations

import sys

from PySide6.QtWidgets import QApplication

from .ui.window import StaxMDWindow


def launch(file_path: str | None = None) -> int:
    """Launch StaxMD as an independent application."""
    app = QApplication.instance()
    if app is None:
        app = QApplication(sys.argv)

    window = StaxMDWindow()
    if file_path:
        window.load_file(file_path)
    window.show()

    return app.exec()


def main() -> int:
    return launch(sys.argv[1] if len(sys.argv) > 1 else None)


if __name__ == "__main__":
    sys.exit(main())
