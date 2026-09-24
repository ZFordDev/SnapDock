from __future__ import annotations

from PySide6.QtWidgets import QHBoxLayout, QLabel, QWidget


class SnapDockFooter(QWidget):
    def __init__(self, version: str) -> None:
        super().__init__()

        self.setObjectName("AppFooter")

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 6, 12, 6)
        layout.setSpacing(20)

        # --- Metrics (left) ---
        self.metrics_label = QLabel("0 words  |  0 chars")
        self.metrics_label.setObjectName("FooterMetrics")

        # --- Mode indicator (center-left) ---
        self.mode_label = QLabel("Split")
        self.mode_label.setObjectName("FooterMode")

        # --- Version (center) ---
        self.version_label = QLabel(f"v{version}")
        self.version_label.setObjectName("FooterVersion")

        # --- Cursor position (right) ---
        self.cursor_label = QLabel("Ln 1, Col 1")
        self.cursor_label.setObjectName("FooterStatus")

        layout.addWidget(self.metrics_label)
        layout.addWidget(self.mode_label)
        layout.addStretch(1)
        layout.addWidget(self.version_label)
        layout.addStretch(1)
        layout.addWidget(self.cursor_label)

    def update_metrics(self, words: int, chars: int) -> None:
        self.metrics_label.setText(f"{words} words  |  {chars} chars")

    def update_cursor_position(self, line: int, col: int) -> None:
        self.cursor_label.setText(f"Ln {line}, Col {col}")

    def update_mode(self, mode: str) -> None:
        label = mode.capitalize()
        self.mode_label.setText(label)
