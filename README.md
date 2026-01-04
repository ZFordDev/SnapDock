<p align="center">
  <img src="assets/banner.png" alt="SnapDock Banner" width="25%">
</p>

<p align="center">
   <strong>Markdown Workspace with File‑Tree Navigation</strong><br/>
   Built by <strong>ZFordDev</strong>
</p>

---

> **A Note from ZFordDev**  
SnapDock is back from its holiday break — refreshed, refocused, and ready for the next stage.

> Over the past few weeks, I’ve been quietly rebuilding core systems, cleaning up the UI, fixing long‑standing wiring issues, and preparing SnapDock for its first **Release Candidate**. This RC marks a major milestone: the app is now stable, consistent, and feature‑complete enough to stand on its own as a daily Markdown workspace.

> Thank you to everyone who tested the early builds, reported bugs, and supported the project during its Beta phase. Your feedback directly shaped this release.

> The RC build will go live on **January 5th**, and from there the final polish begins as we move toward SnapDock’s official 2026 release.

> Let’s make this the year SnapDock becomes something truly special.

> — **ZFordDev**

---

### 🌐 Official Website  
https://snapdock.app

---

## Overview
SnapDock RC 2.2.0 introduces a stable, feature‑complete Markdown workspace with a rebuilt editor core, improved save logic, and a refined tab system. This release focuses on stability, polish, and preparing the app for the January 15th public launch.

---

```
SnapDock/
│
├── main.js                 # Electron main process
├── preload.js              # Secure API bridge
├── index.html              # App shell
├── package.json
│
├── assets/                 # Icons, banners, screenshots
│
├── src/
│   ├── modules/
│   │   ├── ui/             # UI logic (theme menu, view mode, editor sync, etc.)
│   │   ├── file/           # File handling (open, save, tabs, workspace)
│   │   ├── system/         # Updater and system utilities
│   │   └── markdown.js     # Markdown rendering engine
│   │
│   └── styles/
│       ├── base/           # Reset + layout
│       ├── components/     # Editor, tabs, sidebar, footer, etc.
│       ├── markdown/       # Highlighting + markdown styling
│       └── themes/         # Light, Dark, Solarized, Arctic
```

---

# **Download & Install**

SnapDock is available as a full desktop application.  
Choose the option that best suits your workflow:

### **1. Download the Latest Stable Build (Recommended)**
Get the most up‑to‑date and stable version directly from the website:

[SnapDock official website](https://snapdock.app)

This is the preferred way to install SnapDock for most users.

---

### **2. GitHub Releases (Free Builds)**  
If you prefer downloading directly from GitHub, the latest packaged Windows installer is always available here:

**https://github.com/ZFordDev/SnapDock/releases**

---

### **3. Build From Source**  
Developers can clone the repository and build SnapDock manually:

```bash
npm install
npm run build
```

This produces a local packaged build identical to the release version.

---

### **Other Platforms**  
macOS and Linux builds are planned and will be added once cross‑platform testing is complete.

---

## Screenshots

<div align="center">
    <img src="assets/ren_v2_lite.png" alt="Live preview in light theme" width="700" />
    <br/>
    <em>Live preview — Light theme</em>
</div>

<br/>

<div align="center">
    <img src="assets/v2_dark.png" alt="Editor view in dark theme" width="700" />
    <br/>
    <em>Editor view — Dark theme</em>
</div>

<br/>

<div align="center">
    <img src="assets/OG.png" alt="Filename header editing" width="700" />
    <br/>
    <em>The Original V1 design</em>
</div>

---

# ✅ **Features (Updated for RC 2.2.0)**

- Modern Markdown rendering (tables, code blocks, callouts, footnotes, etc.)  
- Integrated file‑tree dock for navigating folders of `.md` files  
- **Four themes** with a clean drop‑up theme selector  
- Stable tabbed editing system  
- Recent files with workspace‑aware history  
- Minimal, distraction‑free interface  
- Live preview with theme‑accurate styling  
- PDF export (restored and functional in RC)  
- Automatic update checker  
- Workspace auto‑loading on startup  

---

# ✅ **Known Issues (RC 2.2.0)**

1. **PDF export:** Fully functional, but advanced layout tuning (page breaks, headers/footers) is still planned  
2. **macOS/Linux builds:** Packaging and testing are still in progress  
3. **File‑tree edge cases:** Some workflows may still override unsaved changes if switching rapidly between files  

---

# ✅ **Roadmap (2026)**

- **Stability improvements:** Continued refinement of core systems and event handling  
- **Theme expansion:** Additional themes and improved customization options  
- **PDF enhancements:** Better page layout, print presets, and cleaner formatting  
- **Editor refinements:** Smoother typing experience, spacing improvements, and quality‑of‑life upgrades  
- **Performance tuning:** Faster rendering and more responsive navigation  

---

## **Contribute**

SnapDock is an active, evolving project — if you have ideas, improvements, or expertise to share, you’re welcome to jump in.

- **Pull Requests:** Features, fixes, refactors  
- **Issues:** Bug reports, suggestions, feedback  

---

## **License**

MIT License — free to use, modify, and distribute.  
Please keep this notice.

---

## **Explore More**

See what else I'm building at:  
https://zford.dev

---
