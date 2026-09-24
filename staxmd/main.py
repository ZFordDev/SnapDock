from __future__ import annotations

import sys

from PySide6.QtWidgets import QApplication

from .ui.window import StaxMDWindow


def _get_version() -> str:
    try:
        from importlib.metadata import version as _pkg_version

        return _pkg_version("staxmd")
    except Exception:
        return "0.2.0"


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
    args = sys.argv[1:]
    if args and args[0] in ("--version", "-v", "-V"):
        print(f"staxmd {_get_version()}")
        return 0

    return launch(args[0] if args else None)


if __name__ == "__main__":
    sys.exit(main())
