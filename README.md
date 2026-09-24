# SnapDock (Guppy)

A local-first Markdown desktop application in the **SnapDock** family.
Runs entirely on your own machine — no cloud account, no telemetry.

This is the **Guppy** line — a Python/Qt prototype of SnapDock built with
PySide6. It develops alongside the Electron (v3) and Tauri (v4) releases and
is tracked on the `guppy` branch of the SnapDock repository.

## Requirements

- Python 3.10 or later
- A desktop environment with a display server (or run headless with
  QT_QPA_PLATFORM=offscreen)

## Installation

`
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows
python -m pip install -e .
`

## Running

`
snapdock-guppy                 # open the editor
snapdock-guppy file.ext        # open a file directly
snapdock-guppy --version       # print version
`

## Features

- **Local-first, no account** — everything runs on your machine.
- **Live Markdown preview** — Source, Preview, Split, and a Live overlay mode (Ctrl+1 … Ctrl+4).
- **Autosave & crash recovery** — the open session is persisted every 30s and on close, so an
  unsaved document survives a crash or accidental quit. Next launch restores your tabs, cursor
  position, and the active view.
- **Recent files** — File ▸ Recent Files lists your last opened/saved documents; clear it any
  time from the same menu.
- **Session restore** — reopens exactly the documents you had open, including untitled drafts.
- **Export to HTML** — File ▸ Export HTML (Ctrl+E) renders the current document to a standalone `.html` file.
- **Theme & layout memory** — light/dark theme, view mode, and window geometry are remembered between runs.

Settings live in the SnapDock family config directory
(`%LOCALAPPDATA%\ZFordDev\SnapDock` on Windows,
`~/Library/Application Support/ZFordDev/SnapDock` on macOS,
`~/.config/ZFordDev/SnapDock` on Linux) inside `settings.json`.
The `SNAPDOCK_CONFIG_DIR` environment variable overrides this location.

## Packaging

A standalone binary is produced with PyInstaller and published as a GitHub Release asset on tagged builds:

`
python -m pip install -e ".[dev]" pyinstaller
pyinstaller --onefile --name snapdock-guppy --add-data "snapdock/themes/*:snapdock/themes" snapdock/main.py
`

## Development & tests

`
python -m pip install -e ".[dev]"
python -m unittest discover -s tests -v
`

## Licence

MIT — see [LICENSE](LICENSE).