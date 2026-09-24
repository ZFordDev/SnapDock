# StaxMD

A local-first StaxMD desktop application from the StaxDash **StaxSuite** family.
Runs entirely on your own machine � no cloud account, no telemetry.

Part of the StaxSuite desktop suite (launched by **StaxOffice**), but also runs
standalone via its own command:

`
staxmd
`

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
staxmd                 # open the editor
staxmd file.ext        # open a file directly
staxmd --version       # print version
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

Settings live in a platform config directory (e.g. `~/.config/staxmd` on Linux,
`%LOCALAPPDATA%/StaxMD` on Windows, `~/Library/Application Support/StaxMD` on macOS).

## Packaging

A standalone binary is produced with PyInstaller and published as a GitHub Release asset on tagged builds:

`
python -m pip install -e ".[dev]" pyinstaller
pyinstaller --onefile --name staxmd --add-data "staxmd/themes/*:staxmd/themes" staxmd/main.py
`

## Development & tests

`
python -m pip install -e ".[dev]"
python -m unittest discover -s tests -v
`

## Licence

Proprietary � see [EULA.md](EULA.md). Not open-source licensed.
