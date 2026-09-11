<div align="center">

# SnapDock

### 🌟 Phoenix 🌟

<p align="center">
  <a href="https://snapdock.app"><b>🌐 Mainframe</b></a> •
  <a href="https://docs.snapdock.app"><b>📖 The Grimoire</b></a> •
  <a href="https://snapdock.app/downloads"><b>📦 Grab Builds</b></a> •
  <a href="https://github.com/ZFordDev/SnapDock/issues/new/choose"><b>💥 Sound the Alarm</b></a>
</p>

</div>

> [!IMPORTANT]
> **Welcome to SnapDock v4 (The Wild West Edition)** 🤠  
> 
> You’ve stumbled into the experimental branch. Things might break, things might fly, and things might occasionally do a backflip.  
> 
> If you're brave enough to test drive v4, we’d love your feedback, bug reports, and chaos reports. The more eyes we get on this, the faster we can polish it up and ship it out! Help us build something awesome! 🚀

---

## 💡 What is SnapDock?

Look, standard text editors are great, but sometimes you just want to write Markdown without setting up a 12-step build pipeline or configuring 40 VS Code extensions. 

SnapDock is a clean, hyper-focused writing environment. No bloat, no subscription traps, no mandatory cloud sync, just your notes, your local files, and absolute speed. 

<!-- Main Showpieces -->
<p align="center">
  <img src="assets/screenshots/snapdock-light.png" width="48%" alt="SnapDock Light Theme" />
  <img src="assets/screenshots/snapdock-dark.png" width="48%" alt="SnapDock Dark Theme" />
</p>

<!-- Video + Extra Screenshots Dropdown -->
<details>
  <summary><b>🍿 Want to see more? (Video Demo & Screenshot Gallery)</b></summary>
  <br>

  <p align="center">
    <a href="https://www.youtube.com/watch?v=NCIC2UwcUgE" target="_blank">
      <img src="https://img.youtube.com/vi/NCIC2UwcUgE/hqdefault.jpg" width="80%" alt="SnapDock Demo Video" />
    </a>
    <br>
    <sub>▶️ <i>Click to watch the demo on YouTube</i></sub>
  </p>

  <p align="center">
    <img src="assets/screenshots/pic3.png" width="48%" alt="Feature 3" />
    <img src="assets/screenshots/pic4.png" width="48%" alt="Feature 4" />
  </p>
  <p align="center">
    <img src="assets/screenshots/pic5.png" width="48%" alt="Feature 5" />
    <img src="assets/screenshots/pic6.png" width="48%" alt="Feature 6" />
  </p>
  <p align="center">
    <img src="assets/screenshots/pic7.png" width="48%" alt="Feature 7" />
    <img src="assets/screenshots/pic8.png" width="48%" alt="Feature 8" />
  </p>
</details>

---

## ✨ Features

> [!NOTE]
> **Out with the old, in with the rust.**  
> I'll save you the trouble, the old feature list got vaporized in the rebuild. New superpowers are actively landing, so check back soon (or poke around the codebase and help us add them!).

---

## 🚀 Installation

For the brave pioneers testing v4 right now, installing via **Snap Edge** is the recommended flavor.

### 🐧 Snap Store (Recommended for v4)

[![Get it from the Snap Store](https://snapcraft.io/en/dark/install.svg)](https://snapcraft.io/markdown-workspace)

```bash
# Jump on the bleeding edge!
sudo snap install markdown-workspace --edge

```

### 🪟 Microsoft Store

> [!NOTE]
> Currently serving stable **v3** while v4 cooks in the oven.

### 📦 GitHub Releases

Yeah, you're already here anyway! Since the in-app auto-updater for v4 isn't wired up yet, you'll need to check back here for fresh release builds manually. *(Sorry! We're workin' on it!)*

---

## ⚡ System Requirements

> [!IMPORTANT]
> Official benchmarking is still pending, but let’s just say... it’s lightyears lighter than Electron. ⚡  
>  
> `#TeamTauri` `#SnapDockRules` `#PhoenixNoFear` `#HashtagsAreBack`

---

## 🛠️ Build from Source

Got Node.js, Rust, and Tauri's system prerequisites installed? Cool. Let's build this rocket:

```bash
# 1. Grab the repo
git clone https://github.com/ZFordDev/SnapDock.git
cd SnapDock

# 2. Install dependencies & launch dev server
npm install
npm start

# 3. Package native installers
npm run tauri:build

```

---

## 🗺️ Project Status & Roadmap

SnapDock is undergoing an ambitious v4 rebirth under project **Phoenix**.

The [V3 Migration Roadmap](https://www.google.com/search?q=assets/docs/v3-migration-roadmap.md) details our parity checks and feature migration progress from the legacy branch. However, since things move fast in the wild west, the live GitHub trackers are your source of truth:

* 📋 [V3 Migration Roadmap Doc](https://www.google.com/search?q=assets/docs/v3-migration-roadmap.md)
* 🐛 [Open Issues & Feature Requests](https://github.com/ZFordDev/SnapDock/issues)
* 🏷️ [Releases & Changelogs](https://github.com/ZFordDev/SnapDock/releases)
* 🤝 [Contributing Guide](https://www.google.com/search?q=CONTRIBUTING.md)

---

## ⚠️ Known Limitations & Quirks

* **Live Sync Preview:** Standard and split previews render while you type, but dynamic real-time sync is still being polished.
* **Linux WebViews:** Tauri relies on system webviews (`webkit2gtk`). Depending on whether you're running X11, Wayland, Hyprland, or Gnome, mileage may vary. If something looks funky, [scream at us in the issues](https://github.com/ZFordDev/SnapDock/issues/new/choose) with your distro and display server specs!

---

## 🤝 Join the Madness (Contributing)

Whether you want to squash bugs, refactor Rust backend calls, tweak UI components, or just fix typos in the docs **you are welcome here!**

1. Take a peak at [CONTRIBUTING.md](https://www.google.com/search?q=CONTRIBUTING.md) to get primed.
2. Check [Open Issues](https://github.com/ZFordDev/SnapDock/issues) for something to tackle (or open one if you found something broken).
3. Drop a pull request and help us bring v4 home!

*Found a critical security vulnerability? Please check [SECURITY.md](SECURITY.md) to report it responsibly rather than opening a public issue.*

---

## 📜 License

SnapDock is free, open-source software released under the [MIT License](https://www.google.com/search?q=LICENSE). Build with it, break it, hack on it.

---

Crafted with 🧠 & ☕ by **[ZFordDev](https://github.com/ZFordDev)**

*Part of the [SnapDock Ecosystem](https://snapdock.app) - tools built for speed, privacy, and focus.*

⭐ **If SnapDock makes your writing life easier, throw us a star on GitHub!** ⭐
