<p align="center">
  <img src="assets/SnapDock.png" alt="SnapDock Banner" width="100%">
</p>

<p align="center">
   <strong>Markdown Workspace with File‑Tree Navigation</strong><br/>
   Built by <strong>ZFordDev</strong>
</p>

---

### 🌐 Official Website  
https://snapdock.app

---

## **Overview**

SnapDock is a lightweight Markdown editor built with Electron and powered by markdown‑it. It offers a clean, modern writing experience with a layout similar to professional editors, but with a focus on simplicity and visual clarity. The interface is styled more like a traditional word processor, making it approachable for everyday writing while still supporting full Markdown features.

SnapDock is designed to be fast, minimal, and easy to use — a workspace that stays out of the way so you can focus on your notes, documents, and projects.

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
If you're here on GitHub, you likely want either the packaged release or the source.

---

### **1. GitHub Releases (Recommended)**  
The latest packaged Windows installer is available here:

**https://github.com/ZFordDev/SnapDock/releases**

This is the easiest way to install SnapDock directly from the repo.

---

### **2. Build From Source**  
If you prefer to build the app yourself:

```bash
npm install
npm run build
```

This produces a local packaged build identical to the official release.

---

### **Other Platforms**  
macOS and Linux builds are planned and will be added once cross‑platform testing is complete.

---

## Screenshots

<table>
  <tr>
    <td align="center">
      <img src="assets/ren_v2_lite.png" width="300" />
      <br/>
      <em>Live preview — Light theme</em>
    </td>
    <td align="center">
      <img src="assets/v2_dark.png" width="300" />
      <br/>
      <em>Editor view — Dark theme</em>
    </td>
    <td align="center">
      <img src="assets/OG.png" width="300" />
      <br/>
      <em>The Original V1 design</em>
    </td>
  </tr>
</table>

---

# ✅ **Features**

- Modern Markdown rendering (tables, code blocks, callouts, footnotes, etc.)  
- Integrated file‑tree dock for navigating folders of `.md` files  
- **Four themes** with a clean drop‑up theme selector  
- Stable tabbed editing system  
- Recent files with workspace‑aware history  
- Minimal, distraction‑free interface  
- Live preview with theme‑accurate styling  
- PDF export  
- Automatic update checker  
- Workspace auto‑loading on startup  

---

# ⚠️ **Known Issues**

1. **PDF export:** Fully functional, but advanced layout tuning (page breaks, headers/footers) is still planned  
2. **macOS builds:** Packaging and testing are still in progress  
3. **Linux (.deb):** Released and stable, but broader Linux packaging (Snap/AppImage/Flatpak) is no longer planned  
4. **File‑tree edge cases:** Rapid switching between files may still override unsaved changes in rare cases  

---

# 🛠️ **Roadmap (2026)**

- **Stability improvements:** Continued refinement of core systems and event handling  
- **Theme expansion:** Additional themes and improved customization options  
- **PDF enhancements:** Better page layout, print presets, and cleaner formatting  
- **Editor refinements:** Smoother typing experience, spacing improvements, and quality‑of‑life upgrades  
- **Performance tuning:** Faster rendering and more responsive navigation  
- **macOS support:** Finalize packaging and testing for a stable macOS release  

---

### **Recent Changes**

- Fixed update pipeline issue introduced in 2.2.2  
- Marked SnapDock as **Stable** and transitioned to a Stable / Pre‑release channel system  
- Updated platform distribution: Windows (.exe) and Linux (.deb) now fully supported; AppImage removed  

---

## **Contribute**

SnapDock is an open, evolving project.  
If you’d like to improve something, fix a bug, or explore an idea, you’re welcome here.

- **Pull Requests:** Features, fixes, refactors  
- **Issues:** Bugs, suggestions, questions  

Thanks for taking the time to look around.

---

## **License**

MIT License — free to use, modify, and share.  
Please keep the original notice.

---

## **Explore More**

If you’re curious about the other tools I’m building:  
https://zford.dev

---

