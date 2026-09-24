from __future__ import annotations

from PySide6.QtCore import Qt, QTimer, Signal
from PySide6.QtWidgets import QTextEdit

from snapdock.fonts import MONO, make_font

# Delay (ms) before emitting preview_changed after the last keystroke.
# Prevents re-rendering on every character while the user is typing fast.
_PREVIEW_DEBOUNCE_MS = 150


class SnapDockEditor(QTextEdit):
    # Signals emitted to window.py
    metrics_changed = Signal(int, int)  # words, chars
    preview_changed = Signal(str)  # raw Markdown text
    file_dirty_changed = Signal(bool)  # dirty state toggled

    def __init__(self) -> None:
        super().__init__()

        self.setObjectName("MarkdownInputMain")
        self.setFont(make_font(MONO, 12))
        self.setPlaceholderText(
            "# Welcome to SnapDock\n\nStart typing your Markdown content here..."
        )
        self.setFrameStyle(0)

        # File state
        self._current_path: str | None = None
        self._dirty: bool = False

        # Debounce timer for preview updates
        self._preview_timer = QTimer()
        self._preview_timer.setSingleShot(True)
        self._preview_timer.setInterval(_PREVIEW_DEBOUNCE_MS)
        self._preview_timer.timeout.connect(self._emit_preview)

        # Connect live update hooks
        self.textChanged.connect(self._on_text_changed)

    # ---------------------------------------------------------
    # Clipboard / Paste Sanitization
    # ---------------------------------------------------------

    def insertFromMimeData(self, source) -> None:
        """Intercepts paste operations to ensure only raw plain text enters the editor.

        This strips out all underlying HTML/Rich text formatting from the
        clipboard.
        """
        if source.hasText():
            # Force-insert only the unformatted plain text string
            self.insertPlainText(source.text())
        else:
            super().insertFromMimeData(source)

    # ---------------------------------------------------------
    # File Handling
    # ---------------------------------------------------------

    def load_file(self, path: str) -> None:
        """Load a file's contents into the editor."""
        try:
            with open(path, encoding="utf-8") as f:
                self.setPlainText(f.read())
            self._current_path = path
            self._dirty = False
            self.file_dirty_changed.emit(False)
            self.preview_changed.emit(self.toPlainText())
        except Exception as e:
            print(f"[SnapDock] Failed to load file: {e}")

    def save_file(self, path: str | None = None) -> None:
        """Save the editor contents to a file."""
        if path is None:
            path = self._current_path

        if path is None:
            print("[SnapDock] No file path provided for save.")
            return

        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(self.toPlainText())
            self._dirty = False
            self.file_dirty_changed.emit(False)
        except Exception as e:
            print(f"[SnapDock] Failed to save file: {e}")

    # ---------------------------------------------------------
    # Metrics
    # ---------------------------------------------------------

    def get_metrics(self) -> tuple[int, int]:
        """Return (word_count, char_count)."""
        text = self.toPlainText()
        words = len(text.split())
        chars = len(text)
        return words, chars

    # ---------------------------------------------------------
    # Live Update Hooks
    # ---------------------------------------------------------

    def _on_text_changed(self) -> None:
        """Internal: update metrics, preview, and dirty state."""
        # Dirty state
        if not self._dirty:
            self._dirty = True
            self.file_dirty_changed.emit(True)

        # Metrics (always immediate — they're cheap)
        words, chars = self.get_metrics()
        self.metrics_changed.emit(words, chars)

        # Preview (debounced — markdown rendering is expensive)
        self._preview_timer.start()

    # ---------------------------------------------------------
    # Editor Enhancements
    # ---------------------------------------------------------

    def _emit_preview(self) -> None:
        """Emit the current text for preview rendering (called by debounce timer)."""
        self.preview_changed.emit(self.toPlainText())

    def insert_tab(self) -> None:
        """Insert 4 spaces instead of a literal tab."""
        self.insertPlainText("    ")

    def keyPressEvent(self, event) -> None:
        """Override key events for indentation and markdown helpers."""
        key = event.key()

        # Tab → insert spaces
        if key == Qt.Key_Tab:
            self.insert_tab()
            return

        super().keyPressEvent(event)

    # ---------------------------------------------------------
    # Public API
    # ---------------------------------------------------------

    def current_path(self) -> str | None:
        return self._current_path

    def is_dirty(self) -> bool:
        return self._dirty
