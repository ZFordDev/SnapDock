<!-- ========================================================= -->
<!-- Standards Approval Badge -->
<!-- ========================================================= -->
<table align="right">
  <tr>
    <td>
      <img src="https://raw.githubusercontent.com/ZFordDev/ZFordDev/main/assets/standards-approved.svg" width="80" alt="ZFordDev Standards Approved Badge">
    </td>
  </tr>
</table>

<!-- ========================================================= -->

<!-- Required Badges -->

<!-- ========================================================= -->

[![Docs](https://img.shields.io/badge/DocsHub-docs.zford.dev-4F46E5?style=flat-square)](https://docs.zford.dev/docs/snapdockstudio/snapdock/)
![Status](https://img.shields.io/badge/Status-ACTIVE-4CAF50?style=flat-square)
![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20Linux-blue?style=flat-square)

<!-- ========================================================= -->

<!-- Optional Badges (Uncomment if applicable) -->

<!-- ========================================================= -->

[![itch.io](https://img.shields.io/badge/itch.io-SnapDock-FA5C5C?style=flat-square)](https://zforddev.itch.io/snapdock)
![Downloads](https://img.shields.io/github/downloads/ZFordDev/SnapDock/total?style=flat-square)
![JavaScript](https://img.shields.io/badge/Built_with-JavaScript-yellow?style=flat-square)

# SnapDock 

> *A Minimal, Modern Markdown Editor*
>
> **Status:**
> Stable (V2 Classic) • Actively Maintained • V3 in development • Accepting Contributions

---

## Why This Exists

Most Markdown editors fall into two extremes: they’re either too minimal to be useful or overloaded with plugins, settings, and IDE‑level complexity. There was no middle ground — nothing stable, calm, and modern that simply lets people write.

SnapDock was created to fill that gap.  
It provides a predictable, distraction‑free Markdown workspace for writers, developers, and creators who want clarity, speed, and a local‑first environment that stays out of the way.



## Overview
SnapDock is a modern, distraction-free Markdown editor built for people who want to write without fighting their tools.

It focuses on clarity, stability, and local-first writing — offering a calm editing experience without plugin overload, IDE complexity, or unnecessary workflow friction.

SnapDock sits between minimalist note apps and heavily extensible writing platforms, providing a predictable and focused desktop writing experience that stays fast and approachable.

---

## Features

- Multi‑tab Markdown editing  
- Drag‑and‑drop tab reordering  
- Selectable preview modes  
- Workspace‑based file management  
- Recent file tracking  
- Local‑first document workflow  
- Lightweight, modern UI  
- Multiple built‑in themes  
- Cross‑platform desktop support  

---

## Requirements

SnapDock runs on any modern system that supports Electron‑based desktop apps. No additional runtimes or dependencies need to be installed.

**Operating System**
- Windows 10 or later  
- Linux (Ubuntu, Debian, Fedora, Arch, Mint, Pop!\_OS, etc.)  
- WSL is supported (in‑app updater disabled)  
- macOS support is not currently available  

**Hardware**
- CPU: 1 core minimum (2 cores recommended)  
- Memory: 512 MB minimum (1 GB recommended)  
- Disk Space: ~750 MB  

**Performance**
SnapDock typically uses around **180 MB RAM** and **under 1% CPU** during normal editing, making it suitable for low‑power laptops, VMs, and older hardware.

> **Note for Linux users:**  
> SnapDock AppImage builds require `FUSE` to run.  
> Some modern Linux distributions no longer ship FUSE by default.  
> Install it using your package manager (e.g. `sudo apt install libfuse2` on Ubuntu/Debian).

---

## Quick Start

Get SnapDock running from source:

```bash
git clone https://github.com/ZFordDev/SnapDock.git
cd SnapDock

# Install dependencies
npm install

# Build the app
npm run build
```

**Windows**
- `npm install | npm run build`  
- If npm is missing, install Node.js from [https://nodejs.org](https://nodejs.org)

**Linux**
- `npm install && npm run build`  
- If npm is missing: `sudo apt install npm`

**Dev mode:** Coming soon

---

## Installation

Most users should install SnapDock using the prebuilt packages available on the Releases page:

👉 [https://github.com/ZFordDev/SnapDock/releases](https://github.com/ZFordDev/SnapDock/releases)

**Windows**
- Download the `.exe` installer  
- Run it  
- SnapDock is ready to use

**Linux**
- Download the `.AppImage` or `.deb` package  

**AppImage**
```bash
chmod +x SnapDock-Setup.AppImage
./SnapDock-Setup.AppImage
```
> If your distro blocks AppImages, install FUSE or use the `.deb` package instead.

**.deb Package**
- Double‑click to install via your Software Center  
  **or**
```bash
sudo apt install ./SnapDock-Setup.deb
```

No additional runtimes or dependencies are required.

---

## Project Structure
*SnapDock uses a clean, modular layout. Only the high‑level structure is shown*

```
SnapDock/
├── assets/                 # App icons, images, and user guide resources
│
├── src/
│   ├── modules/            # Core application logic
│   │   ├── file/           # File operations, autosave, workspace, tabs
│   │   ├── markdown.js     # Markdown rendering pipeline
│   │   ├── pdf/            # PDF export templates and logic
│   │   ├── system/         # Dirty state + update system
│   │   ├── ui/             # UI logic (menus, themes, editor state)
│   │   └── updater/        # In-app update system
│   │
│   ├── styles/             # CSS structure (base, components, themes)
│   ├── preload.js          # Electron preload bridge
│   ├── scripts.js          # Renderer scripts
│   └── styles.css          # Entry stylesheet
│
├── index.html              # Main application window
├── main.js                 # Electron main process
├── build.js                # Build pipeline
│
├── README.md
├── LICENSE
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── SECURITY.md
└── temp_notes.md           # Internal notes (not part of the app)
```

---

## Roadmap

Planned improvements and upcoming development goals for SnapDock.  
This list reflects active GitHub issues and near‑term release targets.

### **In Progress / High Priority**
- [X] **Ecosystem Standards Migration**  
  _Documentation improvements and alignment with ZFordDev ecosystem standards_  
  (#109)

- [ ] **Integrate New Updater Logic**  
  _Modernized update pipeline for V3 and future releases_  
  (#104)

### **UI / UX Improvements**
- [X] **Replace Electron Frame With Custom SnapDock Frame**  
  _Cleaner, native-feeling window chrome_  
  (#95)

- [X] **Add Tab Overflow Scrolling / Horizontal Scroll**  
  _Improves usability for large workspaces_  
  (#87)

### **Platform Releases**
- [ ] **Windows Store Release**  
  _Submission + certification for Microsoft Store_

- [ ] **Snap Store Release**  
  _Snapcraft packaging + publishing_

### **Upcoming (V3 Cycle)**
- [ ] New developer mode (`npm run dev`)
- [ ] Theme engine improvements + custom theme support
- [ ] Enhanced PDF export pipeline
- [ ] V3 UI/UX redesign
- [ ] Import custom `.sdwp` files as virtual workspaces

---

## Screenshots

<p align="center">
  <img src="assets/screenshots/snapdock-light.png" width="45%" alt="SnapDock on Ubuntu 26 (Light Theme)" />
  <img src="assets/screenshots/snapdock-dark.png" width="45%" alt="SnapDock on Windows 11 (Dark Theme)" />
</p>

---

## Known Issues

SnapDock is stable on all supported platforms, but one upstream limitation is worth noting:

### Electron on Linux (Wayland/X11 Variability)
Some Linux distributions may experience minor rendering or window‑manager issues due to upstream Electron/Chromium behaviour. These issues vary between distros and desktop environments and are outside SnapDock’s direct control.

We continue to update Electron regularly and are evaluating alternative runtimes to maximise long‑term stability on Linux.

---

## Related Projects

SnapDock is part of a growing ecosystem of focused, long‑term tools.

- **SnapBoard** — Local‑first planning and card system  
  https://github.com/ZFordDev/SnapBoard

---

## Support

You can support SnapDock by:

- Leaving a ⭐ on GitHub  
- Reporting bugs  
- Suggesting features  
- Improving documentation  
- Contributing code

---

## Contributing

Contributions, bug reports, feature requests, and feedback are welcome.

See `CONTRIBUTING.md` for project‑specific guidelines.  
For ecosystem‑wide expectations, see [STANDARDS.md](https://github.com/ZFordDev/ZFordDev/blob/main/STANDARDS.md).

---

## Security

See `SECURITY.md` for vulnerability reporting guidelines.  
If no security policy is present, please report issues responsibly via GitHub Issues.

---

## License

Released under the MIT License.  
See `LICENSE` for details.

---

## About ZFordDev

This project is part of the ZFordDev ecosystem — a collection of lightweight, practical tools built with clarity, simplicity, and long‑term maintainability in mind.

For ecosystem‑wide standards, see [STANDARDS.md](https://github.com/ZFordDev/ZFordDev/blob/main/STANDARDS.md).

---
