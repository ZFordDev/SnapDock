from __future__ import annotations

from dataclasses import dataclass

from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QKeySequence, QShortcut
from PySide6.QtWidgets import QHBoxLayout, QPushButton, QTabBar, QWidget

# Close button icon — a simple × rendered via QSS (see themes/*.qss)
_CLOSE_BTN_STYLE = """
 QPushButton#TabCloseBtn {
     background: transparent;
     border: none;
     border-radius: 3px;
     font-size: 13px;
     font-weight: bold;
     color: #888;
     padding: 0px;
     margin: 0px;
 }
 QPushButton#TabCloseBtn:hover {
     background-color: rgba(0,0,0,0.10);
     color: #333;
 }
 QPushButton#TabCloseBtn:pressed {
     background-color: rgba(0,0,0,0.18);
 }
"""


@dataclass
class TabDocument:
    """State snapshot for a single open document."""

    path: str | None = None
    text: str = ""
    cursor_block: int = 0
    cursor_col: int = 0
    dirty: bool = False
    label: str = "Untitled"

    @staticmethod
    def from_path(path: str) -> TabDocument:
        try:
            with open(path, encoding="utf-8") as f:
                text = f.read()
        except Exception:
            text = ""
        from pathlib import Path

        label = Path(path).name
        return TabDocument(path=path, text=text, label=label)


class _TabCloseButton(QPushButton):
    """Small × button embedded in each tab."""

    def __init__(self, idx: int, parent=None) -> None:
        super().__init__("\u00d7", parent)  # × character
        self.setObjectName("TabCloseBtn")
        self.setFixedSize(18, 18)
        self.setCursor(Qt.PointingHandCursor)
        self.setStyleSheet(_CLOSE_BTN_STYLE)
        self._tab_idx = idx


class SnapDockTabBar(QWidget):
    """Tab bar with close buttons, dirty indicator, and a + button."""

    tab_changed = Signal(int)
    tab_close_requested = Signal(int)
    new_tab_requested = Signal()

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setObjectName("TabBar")

        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        self._tab_bar = QTabBar()
        self._tab_bar.setMovable(True)
        self._tab_bar.setExpanding(False)
        self._tab_bar.setDrawBase(False)
        self._tab_bar.setObjectName("DocumentTabs")

        # We handle close buttons manually via custom widget for reliable rendering
        self._tab_bar.setTabsClosable(False)

        self._tab_bar.currentChanged.connect(self.tab_changed)
        layout.addWidget(self._tab_bar, 1)

        self._add_btn = QPushButton("+")
        self._add_btn.setObjectName("NewTabButton")
        self._add_btn.setFixedSize(32, 28)
        self._add_btn.clicked.connect(self.new_tab_requested)
        layout.addWidget(self._add_btn)

        self._new_tab_shortcut = QShortcut(QKeySequence("Ctrl+T"), self)
        self._new_tab_shortcut.activated.connect(self.new_tab_requested)

        # Track dirty state per tab index
        self._dirty_flags: dict[int, bool] = {}

    # --- Public API ---

    def add_tab(self, label: str) -> int:
        idx = self._tab_bar.addTab(label)
        self._tab_bar.setTabToolTip(idx, label)
        self._dirty_flags[idx] = False
        self._sync_close_buttons()
        return idx

    def remove_tab(self, idx: int) -> None:
        if 0 <= idx < self._tab_bar.count():
            self._tab_bar.removeTab(idx)
            self._dirty_flags.pop(idx, None)
            self._reindex_dirty()
            self._sync_close_buttons()

    def set_tab_label(self, idx: int, label: str) -> None:
        if 0 <= idx < self._tab_bar.count():
            self._tab_bar.setTabText(idx, label)
            self._tab_bar.setTabToolTip(idx, label)

    def set_tab_dirty(self, idx: int, dirty: bool) -> None:
        if 0 <= idx < self._tab_bar.count():
            self._dirty_flags[idx] = dirty
            label = self._tab_bar.tabText(idx).lstrip("\u25cf ").strip()
            prefix = "\u25cf " if dirty else ""  # ● bullet
            self._tab_bar.setTabText(idx, prefix + label)

    def set_current_index(self, idx: int) -> None:
        if 0 <= idx < self._tab_bar.count():
            self._tab_bar.setCurrentIndex(idx)

    def current_index(self) -> int:
        return self._tab_bar.currentIndex()

    def count(self) -> int:
        return self._tab_bar.count()

    # --- Internal helpers ---

    def _sync_close_buttons(self) -> None:
        """Rebuild the close buttons after any tab add/remove."""
        for i in range(self._tab_bar.count()):
            btn = _TabCloseButton(i, self._tab_bar)
            btn.clicked.connect(lambda _checked, idx=i: self.tab_close_requested.emit(idx))
            self._tab_bar.setTabButton(i, QTabBar.ButtonPosition.RightSide, btn)

    def _reindex_dirty(self) -> None:
        """Rebuild dirty flags dict after a tab is removed."""
        new_flags: dict[int, bool] = {}
        for i in range(self._tab_bar.count()):
            new_flags[i] = self._dirty_flags.get(i, False)
        self._dirty_flags = new_flags
