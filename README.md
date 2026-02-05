[![Website](https://img.shields.io/badge/Website-zford.dev-000000?style=flat-square)](https://zford.dev)
[![Store](https://img.shields.io/badge/Store-staxdash.com-4CAF50?style=flat-square)](https://staxdash.com)
[![Ko‑Fi](https://img.shields.io/badge/Support-KoFi-FF5E5B?style=flat-square)](https://ko-fi.com/zforddev)
[![itch.io](https://img.shields.io/badge/itch.io-SnapDock-FA5C5C?style=flat-square)](https://zforddev.itch.io/snapdock)

---

<p align="center">
  <img src="assets/SnapDock.png" alt="SnapDock Banner" width="100%">
</p>

<p align="center">
   <strong>Clean, stable, long‑term Markdown editing</strong><br/>
   Built by <strong>ZFordDev</strong>
</p>

---

### 🌐 Official Website  
https://snapdock.app

---

## **Overview**

SnapDock is a lightweight Markdown editor built with Electron and powered by **markdown‑it**.  
It delivers a clean, modern writing experience with a layout inspired by professional editors — but without the bloat.

SnapDock feels closer to a traditional writing app than a developer tool.  
It’s designed for clarity, stability, and long‑term reliability, making it ideal for notes, documents, and everyday writing.

---

## 🛡️ **Long‑Term Support (LTS)**

SnapDock is a **Long‑Term Support** application.

The architecture is intentionally stable and complete.  
Future updates focus exclusively on:

- Bug fixes  
- Safety improvements  
- Performance tuning  
- Minor quality‑of‑life refinements  

SnapDock will **not** undergo major rewrites or experimental feature additions.  
This ensures:

- Predictable behaviour  
- Long‑term reliability  
- Consistent performance  
- A stable writing environment you can trust  

---

## 📁 Project Structure

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
│   │   ├── ui/             # UI logic (themes, view mode, editor sync)
│   │   ├── file/           # File handling (open, save, tabs, workspace)
│   │   ├── system/         # Updater + system utilities
│   │   └── markdown.js     # Markdown rendering engine
│   │
│   └── styles/
│       ├── base/           # Reset + layout
│       ├── components/     # Editor, tabs, sidebar, footer
│       ├── markdown/       # Highlighting + markdown styling
│       └── themes/         # Light, Dark, Solarized, Arctic
```

---

## 🚫 **Why SnapDock Avoids Node.js in the Renderer**

SnapDock intentionally avoids Node.js APIs in the renderer process.

By relying on **pure HTML, CSS, and browser‑standard JavaScript**, SnapDock benefits from:

- Lower memory usage  
- Faster startup  
- Smaller runtime footprint  
- Reduced attack surface  
- Fewer long‑term dependencies  

Electron is treated as a **lightweight desktop shell**, not a full Node.js runtime.  
This directly supports SnapDock’s LTS philosophy.

---

# **Download & Install**

### **1. GitHub Releases (Recommended)**  
Download the latest Windows installer:  
https://github.com/ZFordDev/SnapDock/releases

---

### **2. Build From Source**

```bash
npm install
npm run build
```

---

### **Other Platforms**

Linux builds are available, but behaviour may vary depending on distribution and environment.

SnapDock V3 is planned to introduce official store distribution, including:

- **Windows Store (Microsoft Store)**  
- **Snap Store (for Linux)**  

macOS App Store distribution is not currently planned due to the high cost of development and platform requirements, but may be considered if requested.

---

## **Screenshots**

<table>
  <tr>
      <td align="center">
      <img src="assets/Screenshot 2026-01-20 065757.png" width="300" />
      <br/>
      <em>2026 (LTS) — Light theme</em>
    </td>
    <td align="center">
      <img src="assets/Screenshot 2026-01-20 065739.png" width="300" />
      <br/>
      <em>2026 (LTS) — Arctic Dark</em>
    </td>
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
      <em>The original V1 design</em>
    </td>
  </tr>
</table>

---

# ✅ **Features**

- Modern Markdown rendering (tables, code blocks, callouts, footnotes, etc.)  
- Stable tabbed editing  
- Integrated file‑tree dock  
- **Four themes** with a clean drop‑up selector  
- Recent files with workspace‑aware history  
- Theme‑accurate live preview  
- PDF export  
- Automatic update checker  
- Workspace‑aware behaviour without forced auto‑restore  
- Minimal, distraction‑free interface  

---

# ⚠️ **Known Issues**

1. **PDF export:** Fully functional, but advanced layout tuning is still planned  
2. **macOS builds:** Packaging and testing are in progress; macOS support is not guaranteed yet  
3. **Linux builds:** `.deb` and AppImage are supported, but behaviour may vary across distributions; feedback is encouraged  
4. **Preview mode:** Some advanced Markdown features may render differently between themes  

*(Note: “rapid switching may override unsaved changes” has been removed — it is no longer an issue as of 2.3.0.)*

---

## 🔧 **Maintenance & Stability**

SnapDock is actively maintained with a focus on:

- Stability  
- Bug fixes  
- Performance tuning  
- Platform compatibility  

Major feature expansion is intentionally limited to preserve the LTS identity.

---

## **Recent Changes**

- Fixed workspace close safety  
- Fixed tab‑close freeze caused by blocking dialogs  
- Improved unsaved‑changes detection  
- Preview mode now updates correctly when switching tabs  
- Updated dependency stack  
- Marked SnapDock as **Stable** with a clear LTS roadmap  

---

## **Contribute**

Contributions are welcome:

- **Pull Requests:** Features, fixes, refactors  
- **Issues:** Bugs, suggestions, questions  

---

## **License**

MIT License — free to use, modify, and share.  
Please keep the original notice.

---

# ⭐ **SnapDock V3 (Coming Soon)**

SnapDock V3 is the next major evolution of the editor.  
It focuses on improved performance, a refreshed UI, and a more modern architecture designed for long‑term growth.

V3 is also planned to support:

- **Windows Store distribution**  
- **Snap Store distribution (Linux)**  
- `.deb` and AppImage builds (as today)

macOS support is not currently planned due to the high cost of development on the platform, but may be considered if requested.

### **V2 and V3 Will Remain Separate**

SnapDock V2 will continue to receive Long‑Term Support (LTS) updates.  
V2 **will not automatically upgrade into V3** — both versions will exist side‑by‑side.

- **V2** remains the stable, minimal, long‑term Markdown editor  
- **V3** introduces new UI, improved performance, and modern features  

Users can choose the version that best fits their workflow.

---

## Explore More

**zford.dev** — the projects that shape the platform  
**staxdash.com** — the storefront for all tools  
**Ko‑Fi** — support the work: https://ko-fi.com/zforddev

---