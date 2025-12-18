<p align="center">
  <img src="assets/banner.png" alt="SnapDock Banner" width="100%">
</p>

<p align="center">
   <strong>Markdown Workspace with File‑Tree Navigation</strong><br/>
   Built by <strong>ZFordDev</strong>
</p>

---

## Overview

SnapDock is a lightweight Markdown workspace with a built‑in file‑tree dock, designed for navigating and editing folders of `.md` files quickly and cleanly.  
It’s ideal for documentation, notes, and study workflows where simplicity, speed, and clarity matter.

---

## Release Status

**Current build:** Beta 2.1.1  
This update introduces SnapDock’s new **theme engine**, a fully modular **CSS architecture**, and major upgrades to the **Markdown preview** and **PDF export pipeline**.

### 🔧 What’s new in 2.1.1

#### **✨ New Theme Engine (4 Themes + Drop‑Up Selector)**
SnapDock now includes a fully modular theme system with:

- **Light**
- **Dark**
- **Solarized Light**
- **Arctic Dark (Nord‑inspired)**

A new **drop‑up theme selector** in the footer makes switching instant and intuitive.  
Themes are now isolated, maintainable, and easy to extend.

#### **📝 Modern Markdown Renderer (Preview Engine v2)**
Supports:

- Tables  
- Footnotes  
- Callouts  
- Syntax highlighting  
- Subscript / superscript  
- Cleaner typography  
- Better spacing and layout  

#### **📄 PDF Export Pipeline Upgrade**
PDF rendering now uses a dedicated styling layer, separate from the preview.  
This unlocks:

- Page‑break rules  
- Print‑safe colors  
- Layout control  
- Future header/footer support  

#### **🧹 Architecture Cleanup**
The entire CSS system has been refactored into:

- `base/` (layout, variables)  
- `components/` (header, sidebar, editor, theme selector, etc.)  
- `themes/` (each theme isolated)  
- `markdown/` (preview + PDF styles)  

This makes SnapDock easier to maintain, extend, and theme.

**Next milestone:** UI editor upgrade — improved text box, spacing, and writing experience.

---

## Why I Made SnapDock

While studying, I noticed how many Markdown tools were overloaded with features, cluttered interfaces, or slow performance — especially for students and developers who just needed to read and navigate `.md` files quickly.

SnapDock was built to be a **simple, fast, distraction‑free Markdown workspace** with a **file‑tree dock** that makes browsing folders of notes effortless.  
It’s ideal for documentation, study materials, and project exploration.

Looking ahead, SnapDock will gain a more capable editor, refined PDF output, and eventually **AI‑assisted writing tools**.

---

## Download & Install

SnapDock is now packaged as a full desktop app:

- **GitHub Releases (free builds):**  
  [Download the latest Windows installer](https://github.com/ZFordDev/SnapDock/releases)

- **Ko‑Fi (support the project):**  
  [Pay‑what‑you‑want](https://ko-fi.com/zetolabs)

- **Other platforms:**  
  macOS and Linux builds are planned once testing is complete

> Developers can still build from source if they prefer, but most users should grab the packaged app.

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

## Features

- Modern Markdown rendering (tables, code, callouts, footnotes, etc.)
- Integrated file‑tree dock for navigating folders of `.md` files
- **Four themes** with a new drop‑up theme selector
- Minimal, distraction‑free interface
- Basic editing support for quick adjustments
- Automatic updates (2.1.x)
- PDF export (new in 2.1.1 — foundational support added)

---

## Known Issues (Beta 2.1.1)

1. **PDF export:** Functional but still early — layout tuning and page‑break logic coming soon  
2. **File‑tree behavior:** Selecting items may override unsaved changes  
3. **Saving logic:** Basic editor support only; not a full Markdown editor yet  
4. **macOS/Linux builds:** Pending testing and packaging  

---

## Roadmap

- **UI editor upgrade:** Improved text box, spacing, and writing experience  
- **PDF enhancements:** Page breaks, headers/footers, print presets  
- **Performance upgrades:** Faster rendering and smoother navigation  
- **File‑handling safety:** Reduce risk of lost work  
- **Editor enhancements:** Toward a full Markdown editor  
- **Pro features (future):** Rust‑powered PDF export and advanced parsing reserved for SnapDock Pro  

---

## Contribute

SnapDock is an active, evolving project — if you have ideas, improvements, or expertise to share, you’re welcome to jump in.

- **Pull Requests:** Features, fixes, refactors  
- **Issues:** Bug reports, suggestions, feedback  
- **Community:** Discuss ideas and development on Discord  

[💬 Join the Discord](https://discord.gg/4RGzagyt7C)

---

## License

MIT License — free to use, modify, and distribute. Please keep this notice.

---

## Explore More

See what else I'm building at:  
https://zford.dev