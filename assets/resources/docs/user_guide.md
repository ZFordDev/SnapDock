<div align="center">

# 📖 Welcome to SnapDock

SnapDock is a local-first Markdown workspace built for writing, organizing, previewing, and exporting documents. Your files stay on your computer as standard plain-text Markdown, and the core editor works completely offline.

> [!WARNING]
> **Phoenix v4 Warning:** This is the experimental v4 build! It is currently being rebuilt from the ground up, so features may break, UI elements might move around, or tools may occasionally wander off on vacation. If you need 100% rock-solid stability, stick with the v3 `main` release.

> [!NOTE]
> **New to SnapDock?** Open a folder, pick a file from **Project Files**, write away, and hit **View → Raw View** to inspect your rendered document.

---

## ⚡ Quick Start

### 📝 Write a New Document
1. Select **New** (or press `Ctrl + N`).
2. Start typing.
3. Select **Save → Save** (or press `Ctrl + S`).
4. Choose a name and directory on your first save.

*Unsaved files live in memory until saved. An unsaved tab will display a dot indicator.*

### 📂 Open an Existing Document
Select **Open → Open File** (`Ctrl + O`), or grab a document from **Recent Files**. If the file is already open, SnapDock will jump straight to its existing tab.

### 📁 Work with a Workspace Folder
Select **Open → Open Folder** (`Ctrl + Shift + O`). The chosen folder becomes your active workspace, and all contained Markdown files will populate under **Project Files**.

Opening a workspace reads files directly in place without moving or importing them. SnapDock remembers and restores your last active workspace on launch.

---

## 🗺️ Finding Your Way Around

- **New, Open, & Save:** Main file handling operations.
- **Recent Files:** Quick list of recently opened workspace files. Click the **×** next to the header to clear history (your files remain safe on disk).
- **Project Files:** File tree showing Markdown files in the active workspace.
- **Tabs:** Drag and drop tabs to reorganize your active document workspace.
- **View:** Toggle between **Raw View** and **Split View**. *(Live View is currently backstage getting ready for its dramatic entrance).*
- **Edit:** Controls spellcheck, editor typography, and theme choices.
- **Help:** Access this guide, check for updates, or switch update channels.
- **Status Bar:** Real-time metrics (word/character counts) and build information.

---

## ⌨️ Keyboard Shortcuts

On Windows and Linux, use `Ctrl`.

| Action | Shortcut |
| :--- | :--- |
| **New Tab** | `Ctrl + N` |
| **Open File** | `Ctrl + O` |
| **Open Workspace Folder** | `Ctrl + Shift + O` |
| **Save Active File** | `Ctrl + S` |
| **Close Active Tab** | `Ctrl + W` |
| **Find in Active Document** | `Ctrl + F` |
| **Next Tab** | `Ctrl + Shift + Right Arrow` |
| **Previous Tab** | `Ctrl + Shift + Left Arrow` |
| **Toggle Preview** | `Ctrl + Shift + P` |
| **Open User Guide** | `Ctrl + /` |

---

## ✍️ Writing Markdown

Markdown is simple plain text enhanced with minimal formatting characters. Here are the basics:

```markdown
# Main Heading
## Section Heading

**Bold text** and *italic text*

- Bullet point item
- Another bullet

1. First step
2. Second step

[SnapDock Website](https://snapdock.app)
![Sample Image](image.png)

> Blockquote or featured quote

`inline code`

```

For multi-line code blocks, wrap your snippet in triple backticks (`). Append the language name immediately after the opening backticks (e.g., `javascript) for syntax highlighting.

SnapDock also natively supports tables, task lists, footnotes, emojis, highlight formatting, subscript, superscript, and automatic heading anchors.

### 🖼️ Images & Attachments

Relative image paths resolve from the saved location of your Markdown file.

If your document and image are in the same directory:

```markdown
![Image description](image.png)

```

If the image resides inside an `images` subfolder:

```markdown
![Image description](images/image.png)

```

> [!TIP]
> Always save new documents to disk before adding relative image attachments so SnapDock knows where to resolve the path!

---

## 👁️ Previewing Your Work

* **Raw View:** Go to **View → Raw View** to hide the editor and view your rendered output full-width. Click **Edit** in the top bar to return to typing.
* **Split View:** Go to **View → Split View** to edit on the left while previewing live on the right. Drag the center divider to adjust panel widths.

> [!NOTE]
> **Live View** is grayed out in v4 right now. It isn't broken—it just hasn't been migrated over to Phoenix yet!

---

## 🔍 Finding Text

Press `Ctrl + F` to search within the open document. Use the navigation arrows to cycle through matches, and hit **×** or `Esc` when you're done.

*Note: Search operates on the active document only, not across the entire workspace folder.*

---

## 💾 Saving & Safety First

* `Ctrl + S` saves the active tab instantly.
* **Save → Save All** flushes all modified tabs to disk.
* Closing a tab or quitting SnapDock with unsaved changes will prompt you to save or discard your work.

> [!WARNING]
> SnapDock does not currently run background automatic snapshots or local file history. Keep critical projects inside a backed-up folder or a Git repository!

---

## 📄 Exporting to PDF

> [!TIP]
> **Page Breaks in PDF Export:**
> To force a clean page break in your exported PDF, insert `<!-- pagebreak -->` on its own line in your Markdown. It will stay hidden in editor previews but trigger a page break on export!

1. Open the document you want to export.
2. Verify its layout in **Split View** or **Raw View**.
3. Select **Save → Export**.
4. SnapDock will render your PDF and launch it using your default system viewer.

---

## 🎨 Themes & Customization

Open **Edit** to manage your workspace settings:

* **Spellcheck:** Right-click flagged words to pick corrections (uses system dictionary engines).
* **Themes:** Switch instantly between **Light**, **Dark**, **Solarized**, **Arctic Dark**, and **Forest**. Your choice persists across app restarts.

---

## 🔄 Updates

Navigate to **Help → Check for Updates** to check for new releases.

> [!NOTE]
> Store-managed versions (Snap Store, Microsoft Store) usually handle update distribution automatically through their respective package managers.

---

## 🛠️ Troubleshooting

* **File missing in Project Files:** Verify you opened the correct workspace folder and that the file uses a `.md` or `.markdown` extension. Re-open the folder if an external tool created the file while SnapDock was open.
* **Image failed to load:** Ensure the document is saved and that the relative file path is correct (including case sensitivity on Linux).
* **Export or Preview looks incorrect:** Ensure all code blocks, brackets, and HTML tags are closed properly in your source text.
* **Linux display glitches:** Display server behavior can vary between Wayland and X11. When opening an issue, include your Linux distribution, desktop environment, and display server (`echo $XDG_SESSION_TYPE`).

---

## 📬 Support & Community

This guide is bundled directly inside SnapDock and is accessible offline anytime (`Ctrl + /`). When online, check out our ecosystem links:

* 🌐 [Official Website](https://snapdock.app)
* 📖 [Online Documentation](https://docs.snapdock.app)
* 🐛 [Report a Bug or Issue](https://github.com/ZFordDev/SnapDock/issues)
* 📦 [GitHub Repository](https://github.com/ZFordDev/SnapDock)

For security vulnerabilities or private inquiries, reach out directly to **zforddev@gmail.com**.

> [!IMPORTANT]
> Please report standard bug reports and feature requests via the public GitHub Issue tracker so the entire community can benefit from solutions and workarounds!

---

**Thank you for using SnapDock!**

Keep writing, keep it local, and make it yours. 🚀

⭐ *If SnapDock helps you focus, consider throwing us a star on GitHub!* ⭐

</div>