from __future__ import annotations

from enum import Enum
from pathlib import Path

from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QFileDialog,
    QMessageBox,
    QSplitter,
    QStackedWidget,
    QVBoxLayout,
    QWidget,
)

from .editor import StaxMDEditor
from .filetree import StaxMDFileTree
from .footer import StaxMDFooter
from .menubar import StaxMDMenuBar
from .preview import StaxMDPreview
from .tabs import StaxMDTabBar, TabDocument


class ViewMode(Enum):
    SOURCE = "source"
    PREVIEW = "preview"
    SPLIT = "split"
    LIVE = "live"


class StaxMDWindow(QWidget):
    def __init__(self, version: str = "0.1.0") -> None:
        super().__init__()
        self.setWindowTitle("StaxMD - Markdown Editor")
        self.resize(1200, 800)
        self._current_mode = ViewMode.SPLIT

        # --- Tab state ---
        self._tabs: list[TabDocument] = []
        self._active_tab: int = -1

        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Top Menu Bar
        self.menu_bar = StaxMDMenuBar()
        layout.addWidget(self.menu_bar)

        # Tab Bar
        self.tab_bar = StaxMDTabBar()
        layout.addWidget(self.tab_bar)

        # Main Splitter (File Tree + Workspace)
        main_splitter = QSplitter(Qt.Horizontal)
        main_splitter.setObjectName("AppContainer")
        main_splitter.setHandleWidth(1)
        main_splitter.setChildrenCollapsible(False)

        self.file_tree = StaxMDFileTree()
        main_splitter.addWidget(self.file_tree)

        # Workspace wrapper
        workspace = QWidget()
        workspace.setObjectName("WorkspaceArea")
        workspace_layout = QVBoxLayout(workspace)
        workspace_layout.setContentsMargins(16, 16, 16, 16)
        workspace_layout.setSpacing(0)

        # Single shared editor + preview — always in the same splitter parent.
        self.editor = StaxMDEditor()
        self.preview = StaxMDPreview()

        # Splitter: editor + preview side by side (for Split, Source, Preview modes)
        self._splitter = QSplitter(Qt.Horizontal)
        self._splitter.setObjectName("WorkspaceSplitter")
        self._splitter.setHandleWidth(1)
        self._splitter.setChildrenCollapsible(False)
        self._splitter.addWidget(self.editor)
        self._splitter.addWidget(self.preview)

        # Live overlay: preview rendered on top of editor (for Live mode)
        self._live_container = QWidget()
        self._live_stack = QStackedWidget()
        live_layout = QVBoxLayout(self._live_container)
        live_layout.setContentsMargins(0, 0, 0, 0)
        live_layout.addWidget(self._live_stack)

        # Switcher between splitter and live overlay
        self._mode_stack = QStackedWidget()
        self._mode_stack.addWidget(self._splitter)       # page 0
        self._mode_stack.addWidget(self._live_container)  # page 1
        self._mode_stack.setCurrentIndex(0)

        workspace_layout.addWidget(self._mode_stack)
        main_splitter.addWidget(workspace)
        layout.addWidget(main_splitter, 1)

        # Footer
        self.footer = StaxMDFooter(version)
        layout.addWidget(self.footer)

        # Default Theme
        self.apply_theme("light")

        # --- Wire editor signals ---
        self.editor.preview_changed.connect(self.preview.update_preview)
        self.editor.metrics_changed.connect(self.footer.update_metrics)
        self.editor.file_dirty_changed.connect(self._on_editor_dirty_changed)
        self.editor.cursorPositionChanged.connect(self._on_cursor_position_changed)
        self.file_tree.file_opened.connect(self.load_file)

        # --- Wire menu actions ---
        self.menu_bar.action_open.triggered.connect(self._on_open)
        self.menu_bar.action_save.triggered.connect(self._on_save)
        self.menu_bar.action_save_as.triggered.connect(self._on_save_as)
        self.menu_bar.action_view_source.triggered.connect(lambda: self.set_view_mode(ViewMode.SOURCE))
        self.menu_bar.action_view_preview.triggered.connect(lambda: self.set_view_mode(ViewMode.PREVIEW))
        self.menu_bar.action_view_split.triggered.connect(lambda: self.set_view_mode(ViewMode.SPLIT))
        self.menu_bar.action_view_live.triggered.connect(lambda: self.set_view_mode(ViewMode.LIVE))
        self.menu_bar.action_theme_light.triggered.connect(lambda: self.apply_theme("light"))
        self.menu_bar.action_theme_dark.triggered.connect(lambda: self.apply_theme("dark"))

        # --- Wire tab bar ---
        self.tab_bar.tab_changed.connect(self._on_tab_changed)
        self.tab_bar.tab_close_requested.connect(self._on_tab_close_requested)
        self.tab_bar.new_tab_requested.connect(self._new_tab)

        # Create first tab and default to split
        self._new_tab()
        self.set_view_mode(ViewMode.SPLIT)

    # ---------------------------------------------------------
    # Tab management
    # ---------------------------------------------------------

    def _new_tab(self) -> None:
        doc = TabDocument()
        idx = self.tab_bar.add_tab(doc.label)
        self._tabs.append(doc)
        self.tab_bar.set_current_index(idx)

    def _on_tab_changed(self, idx: int) -> None:
        if idx == self._active_tab:
            return
        if idx < 0 or idx >= len(self._tabs):
            return
        self._save_tab_state(self._active_tab)
        self._active_tab = idx
        self._load_tab_state(idx)
        self._update_title_dirty(self._tabs[idx].dirty)

    def _on_tab_close_requested(self, idx: int) -> None:
        if idx < 0 or idx >= len(self._tabs):
            return
        doc = self._tabs[idx]
        if doc.dirty:
            reply = QMessageBox.question(
                self,
                "Unsaved Changes",
                f'"{doc.label}" has unsaved changes. Save before closing?',
                QMessageBox.Save | QMessageBox.Discard | QMessageBox.Cancel,
                QMessageBox.Save,
            )
            if reply == QMessageBox.Save:
                if doc.path:
                    self._save_tab_state(idx)
                    old_active = self._active_tab
                    self._active_tab = idx
                    self._load_tab_state(idx)
                    self.editor.save_file()
                    doc.dirty = False
                    self._active_tab = old_active
                    if old_active >= 0:
                        self._load_tab_state(old_active)
                else:
                    return
            elif reply == QMessageBox.Cancel:
                return

        self.tab_bar.remove_tab(idx)
        self._tabs.pop(idx)

        if not self._tabs:
            self._new_tab()
            return

        if self._active_tab >= len(self._tabs):
            self._active_tab = len(self._tabs) - 1
        elif self._active_tab > idx:
            self._active_tab -= 1

        self.tab_bar.set_current_index(self._active_tab)
        self._load_tab_state(self._active_tab)
        self._update_title_dirty(self._tabs[self._active_tab].dirty)

    def _save_tab_state(self, idx: int) -> None:
        if idx < 0 or idx >= len(self._tabs):
            return
        doc = self._tabs[idx]
        doc.text = self.editor.toPlainText()
        cursor = self.editor.textCursor()
        doc.cursor_block = cursor.blockNumber()
        doc.cursor_col = cursor.columnNumber()
        doc.path = self.editor.current_path()
        doc.dirty = self.editor.is_dirty()
        if doc.path:
            doc.label = Path(doc.path).name

    def _load_tab_state(self, idx: int) -> None:
        if idx < 0 or idx >= len(self._tabs):
            return
        doc = self._tabs[idx]

        self.editor.file_dirty_changed.disconnect(self._on_editor_dirty_changed)
        self.editor.setPlainText(doc.text)
        self.editor.file_dirty_changed.connect(self._on_editor_dirty_changed)

        from PySide6.QtGui import QTextCursor

        cursor = self.editor.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.Start)
        for _ in range(doc.cursor_block):
            cursor.movePosition(QTextCursor.MoveOperation.NextBlock)
        cursor.movePosition(
            QTextCursor.MoveOperation.Right,
            QTextCursor.MoveMode.MoveAnchor,
            doc.cursor_col,
        )
        self.editor.setTextCursor(cursor)

        self.editor._current_path = doc.path
        self.editor._dirty = doc.dirty
        self.editor.file_dirty_changed.emit(doc.dirty)

        self.tab_bar.set_tab_label(idx, doc.label)
        self.tab_bar.set_tab_dirty(idx, doc.dirty)

        self.editor.preview_changed.emit(doc.text)

    def _on_editor_dirty_changed(self, dirty: bool) -> None:
        if 0 <= self._active_tab < len(self._tabs):
            self._tabs[self._active_tab].dirty = dirty
            self.tab_bar.set_tab_dirty(self._active_tab, dirty)
        self._update_title_dirty(dirty)

    # ---------------------------------------------------------
    # View modes — toggle visibility + reparent for live overlay
    # ---------------------------------------------------------

    def set_view_mode(self, mode: ViewMode) -> None:
        self._current_mode = mode

        # Determine which container the widgets should live in
        want_live = mode == ViewMode.LIVE
        currently_live = self._mode_stack.currentIndex() == 1

        if want_live and not currently_live:
            # Move editor + preview from splitter → live overlay
            self._detach_from_splitter(self.editor)
            self._detach_from_splitter(self.preview)
            self._live_stack.addWidget(self.editor)
            self._live_stack.addWidget(self.preview)
            self.editor.show()
            self.preview.show()
            self._mode_stack.setCurrentIndex(1)

        elif not want_live and currently_live:
            # Move editor + preview from live overlay → splitter
            self._live_stack.removeWidget(self.editor)
            self._live_stack.removeWidget(self.preview)
            self._splitter.addWidget(self.editor)
            self._splitter.addWidget(self.preview)
            self._mode_stack.setCurrentIndex(0)

        # Toggle visibility within the current container
        if mode == ViewMode.SOURCE:
            self.editor.show()
            self.preview.hide()
        elif mode == ViewMode.PREVIEW:
            self.editor.hide()
            self.preview.show()
        else:  # SPLIT or LIVE
            self.editor.show()
            self.preview.show()

        self.menu_bar.set_view_mode(mode.value)
        self.footer.update_mode(mode.value)

    @staticmethod
    def _detach_from_splitter(widget: QWidget) -> None:
        """Remove a widget from its parent without deleting it."""
        layout = widget.parentWidget().layout() if widget.parentWidget() else None
        if layout is not None:
            layout.removeWidget(widget)
        widget.setParent(None)

    # ---------------------------------------------------------
    # File operations
    # ---------------------------------------------------------

    def _on_open(self) -> None:
        path, _ = QFileDialog.getOpenFileName(
            self,
            "Open Markdown File",
            "",
            "Markdown Files (*.md *.markdown);;Text Files (*.txt);;All Files (*)",
        )
        if path:
            self.load_file(path)

    def _on_save(self) -> None:
        if self._active_tab < 0:
            return
        doc = self._tabs[self._active_tab]
        if doc.path:
            self.editor.save_file()
            doc.dirty = False
            self.tab_bar.set_tab_dirty(self._active_tab, False)
            self._update_title_dirty(False)
        else:
            self._on_save_as()

    def _on_save_as(self) -> None:
        path, _ = QFileDialog.getSaveFileName(
            self,
            "Save Markdown File",
            "",
            "Markdown Files (*.md);;All Files (*)",
        )
        if path:
            self.editor.save_file(path)
            if self._active_tab >= 0:
                doc = self._tabs[self._active_tab]
                doc.path = path
                doc.label = Path(path).name
                doc.dirty = False
                self.tab_bar.set_tab_label(self._active_tab, doc.label)
                self.tab_bar.set_tab_dirty(self._active_tab, False)
            self._update_title_dirty(False)

    # ---------------------------------------------------------
    # Theme
    # ---------------------------------------------------------

    def apply_theme(self, theme_name: str) -> None:
        theme_dir = Path(__file__).resolve().parents[1] / "themes"
        qss_path = theme_dir / f"{theme_name}.qss"
        if qss_path.exists():
            self.setStyleSheet(qss_path.read_text(encoding="utf-8"))
        else:
            self.setStyleSheet("")

    # ---------------------------------------------------------
    # Title / dirty state
    # ---------------------------------------------------------

    def _update_title_dirty(self, dirty: bool) -> None:
        title = "StaxMD - Markdown Editor"
        if 0 <= self._active_tab < len(self._tabs):
            doc = self._tabs[self._active_tab]
            if doc.path:
                title += f" \u2014 {doc.path}"
        if dirty:
            title += " \u2022"
        self.setWindowTitle(title)

    # ---------------------------------------------------------
    # Public helpers
    # ---------------------------------------------------------

    def load_file(self, path: str) -> None:
        for idx, doc in enumerate(self._tabs):
            if doc.path == path:
                self.tab_bar.set_current_index(idx)
                return

        doc = TabDocument.from_path(path)
        idx = self.tab_bar.add_tab(doc.label)
        self._tabs.append(doc)
        self.tab_bar.set_current_index(idx)

    # ---------------------------------------------------------
    # Footer cursor position
    # ---------------------------------------------------------

    def _on_cursor_position_changed(self) -> None:
        cursor = self.editor.textCursor()
        self.footer.update_cursor_position(cursor.blockNumber() + 1, cursor.columnNumber() + 1)

    # ---------------------------------------------------------
    # Close confirmation
    # ---------------------------------------------------------

    def closeEvent(self, event) -> None:
        self._save_tab_state(self._active_tab)

        dirty_tabs = [doc for doc in self._tabs if doc.dirty]
        if not dirty_tabs:
            event.accept()
            return

        reply = QMessageBox.question(
            self,
            "Unsaved Changes",
            f"{len(dirty_tabs)} document(s) have unsaved changes. Save before closing?",
            QMessageBox.SaveAll | QMessageBox.Discard | QMessageBox.Cancel,
            QMessageBox.SaveAll,
        )

        if reply == QMessageBox.SaveAll:
            for idx, doc in enumerate(self._tabs):
                if doc.dirty and doc.path:
                    self._active_tab = idx
                    self._load_tab_state(idx)
                    self.editor.save_file()
                    doc.dirty = False
            event.accept()
        elif reply == QMessageBox.Discard:
            event.accept()
        else:
            event.ignore()
