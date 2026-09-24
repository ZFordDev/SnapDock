"""Local-first persistence for SnapDock.

Everything SnapDock remembers between runs — settings, recent files, and the open
session (so an unsaved document survives a crash) — lives in a single JSON file
in a platform-appropriate config directory. No cloud, no accounts.
"""

from __future__ import annotations

import contextlib
import json
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

SETTINGS_FILENAME = "settings.json"
AUTOSAVE_INTERVAL_MS = 30_000
MAX_RECENT_FILES = 12
DEFAULT_THEME = "light"
DEFAULT_VIEW_MODE = "split"


def _default_config_dir() -> Path:
    if sys.platform.startswith("win"):
        base = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
        return Path(base) / "ZFordDev" / "SnapDock"
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "ZFordDev" / "SnapDock"
    return Path.home() / ".config" / "ZFordDev" / "SnapDock"


def app_config_dir() -> Path:
    override = os.environ.get("SNAPDOCK_CONFIG_DIR")
    base = Path(override) if override else _default_config_dir()
    base.mkdir(parents=True, exist_ok=True)
    return base


def settings_path() -> Path:
    return app_config_dir() / SETTINGS_FILENAME


@dataclass
class Settings:
    theme: str = DEFAULT_THEME
    view_mode: str = DEFAULT_VIEW_MODE
    geometry: list[int] | None = None
    recent_files: list[str] = field(default_factory=list)
    session: list[dict[str, Any]] = field(default_factory=list)
    active_tab: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "theme": self.theme,
            "view_mode": self.view_mode,
            "geometry": self.geometry,
            "recent_files": self.recent_files,
            "session": self.session,
            "active_tab": self.active_tab,
        }


def load_settings() -> Settings:
    path = settings_path()
    if not path.exists():
        return Settings()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return Settings()
    return Settings(
        theme=data.get("theme", DEFAULT_THEME),
        view_mode=data.get("view_mode", DEFAULT_VIEW_MODE),
        geometry=data.get("geometry"),
        recent_files=list(data.get("recent_files", [])),
        session=list(data.get("session", [])),
        active_tab=int(data.get("active_tab", 0) or 0),
    )


def save_settings(settings: Settings) -> None:
    path = settings_path()
    # Persistence is best-effort; never crash the editor over a write failure.
    with contextlib.suppress(Exception):
        path.write_text(json.dumps(settings.to_dict(), indent=2), encoding="utf-8")


def add_recent_file(path: str, settings: Settings | None = None) -> Settings:
    """Prepend ``path`` to the recent list, de-duplicating and trimming."""
    settings = settings or load_settings()
    if path in settings.recent_files:
        settings.recent_files.remove(path)
    settings.recent_files.insert(0, path)
    settings.recent_files = settings.recent_files[:MAX_RECENT_FILES]
    return settings


def clear_recent_files(settings: Settings | None = None) -> Settings:
    settings = settings or load_settings()
    settings.recent_files = []
    return settings
