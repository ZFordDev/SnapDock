from __future__ import annotations

from PySide6.QtGui import QAction, QKeySequence
from PySide6.QtWidgets import QMenuBar, QWidget


class StaxMDMenuBar(QMenuBar):
    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)

        action_parent = parent if parent is not None else self

        # --- File Menu ---
        file_menu = self.addMenu("File")
        self.action_open = QAction("Open", action_parent)
        self.action_save = QAction("Save", action_parent)
        self.action_save_as = QAction("Save As", action_parent)

        self.action_open.setShortcut(QKeySequence.StandardKey.Open)
        self.action_save.setShortcut(QKeySequence.StandardKey.Save)
        self.action_save_as.setShortcut(QKeySequence("Ctrl+Shift+S"))

        file_menu.addAction(self.action_open)
        file_menu.addAction(self.action_save)
        file_menu.addAction(self.action_save_as)

        # --- View Menu (checkable, radio-style) ---
        view_menu = self.addMenu("View")

        self.action_view_source = QAction("Source", action_parent)
        self.action_view_preview = QAction("Preview", action_parent)
        self.action_view_split = QAction("Split", action_parent)
        self.action_view_live = QAction("Live", action_parent)

        self.action_view_source.setShortcut(QKeySequence("Ctrl+1"))
        self.action_view_preview.setShortcut(QKeySequence("Ctrl+2"))
        self.action_view_split.setShortcut(QKeySequence("Ctrl+3"))
        self.action_view_live.setShortcut(QKeySequence("Ctrl+4"))

        for action in (
            self.action_view_source,
            self.action_view_preview,
            self.action_view_split,
            self.action_view_live,
        ):
            action.setCheckable(True)

        self._view_actions = [
            self.action_view_source,
            self.action_view_preview,
            self.action_view_split,
            self.action_view_live,
        ]

        view_menu.addAction(self.action_view_source)
        view_menu.addAction(self.action_view_preview)
        view_menu.addAction(self.action_view_split)
        view_menu.addAction(self.action_view_live)

        # Default to Split
        self.action_view_split.setChecked(True)

        # --- Theme Menu ---
        theme_menu = self.addMenu("Theme")
        self.action_theme_light = QAction("Light", action_parent)
        self.action_theme_dark = QAction("Dark", action_parent)

        theme_menu.addAction(self.action_theme_light)
        theme_menu.addAction(self.action_theme_dark)

    def set_view_mode(self, mode: str) -> None:
        """Set the checked state of view mode actions by name."""
        mapping = {
            "source": self.action_view_source,
            "preview": self.action_view_preview,
            "split": self.action_view_split,
            "live": self.action_view_live,
        }
        for name, action in mapping.items():
            action.setChecked(name == mode)
