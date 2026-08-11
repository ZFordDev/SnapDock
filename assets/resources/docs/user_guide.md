# Welcome to SnapDock

SnapDock is a local-first Markdown workspace for writing, organising, previewing, and exporting documents. Your files remain ordinary Markdown files on your computer, and the core editor works without an internet connection.

> **New to SnapDock?** Open a folder, choose a Markdown file from **Project Files**, write in the editor, and select **Show Preview** to see the rendered result.

## Quick start

### Write a new document

1. Select **New** or press `Ctrl + N`.
2. Start writing in the editor.
3. Select **Save → Save** or press `Ctrl + S`.
4. Choose a name and location the first time you save.

New documents are not written to disk until you save them. A dot on a tab indicates unsaved changes.

### Continue an existing document

Select **Open → Open File**, press `Ctrl + O`, or choose a document from **Recent Files**. If the file is already open, SnapDock switches to its existing tab.

### Work with a folder

Select **Open → Open Folder** or press `Ctrl + Shift + O`. The folder becomes your workspace and its Markdown files appear under **Project Files**.

Opening a workspace does not import or move anything. SnapDock reads the files from their existing location. The most recently used workspace is restored the next time the app starts.

## Find your way around

- **New, Open, and Save** contain the main file actions.
- **Recent Files** lists documents from the current workspace. Use × beside its heading to clear the list without deleting any files.
- **Project Files** displays Markdown documents from the open folder.
- **Tabs** let you keep several documents open and can be reordered by dragging.
- **Show Preview** switches between editing and the rendered document. Its arrow opens the preview-mode menu.
- **Tools** contains updates, spellcheck, themes, and this guide.
- The **status bar** shows writing metrics and the SnapDock version.

## Keyboard shortcuts

On Windows and Linux, use `Ctrl`.

| Action | Shortcut |
| --- | --- |
| New tab | `Ctrl + N` |
| Open file | `Ctrl + O` |
| Open folder | `Ctrl + Shift + O` |
| Save active file | `Ctrl + S` |
| Close active tab | `Ctrl + W` |
| Find in the active document | `Ctrl + F` |
| Next tab | `Ctrl + Shift + Right Arrow` |
| Previous tab | `Ctrl + Shift + Left Arrow` |
| Toggle preview | `Ctrl + Shift + P` |
| Open this guide | `Ctrl + /` |

## Writing Markdown

Markdown is plain text with a few characters used for formatting. Here are the essentials:

```markdown
# Main heading
## Section heading

**Bold text** and *italic text*

- Bulleted item
- Another item

1. Numbered item
2. Another item

[Link text](https://example.com)
![Image description](image.png)

> A quotation

`inline code`
```

Use three backticks before and after a block of code. Add a language name after the opening backticks, such as `javascript`, for syntax highlighting.

SnapDock also renders tables, task lists, footnotes, emoji, highlighted text, subscript, superscript, and heading anchors.

### Images and attachments

Relative image paths are resolved from the saved Markdown document's folder. For a document and image stored together, use:

```markdown
![Description of the image](image.png)
```

If the image is in a nearby `images` folder, use `![Description](images/image.png)`. Save a new document before relying on relative attachments so SnapDock knows its location.

## Previewing your work

Select **Show Preview** to replace the editor with the rendered document. Select **Edit Markdown** to return to editing.

Open the arrow beside the preview control and choose **Split View** to edit and preview side by side. Drag the divider to give either side more room. Preview content refreshes as you type.

**Live View** is shown as a future option and is not currently selectable.

## Finding text

Press `Ctrl + F` to search the active document. Type a word or phrase, then use the up and down controls to move between matches. Close the find bar with × when finished.

Search applies only to the active document; it does not search the whole workspace.

## Saving and closing safely

- `Ctrl + S` saves the active tab.
- **Save → Save All** saves every changed document. SnapDock asks for a location for any new document that has not been saved before.
- Closing a tab with unsaved changes asks whether you want to discard them.
- Closing SnapDock checks for unsaved work and attempts to protect open changes.

SnapDock does not currently provide version history or automatic backups. Keep important work in a backed-up folder or version-control repository.

## Exporting a PDF

> **Tip: Page Breaks**
> To force a hard page break in your exported PDF, insert `<!-- pagebreak -->` on its own line where you want the split to occur. This remain invisible in the standard editor preview.

1. Open the document you want to export.
2. Check its appearance in Preview or Split View.
3. Select **Save → Export**.
4. SnapDock creates the PDF and opens it with your system's PDF viewer.

The export uses the rendered content of the active document. If something looks wrong in the PDF, check the preview first.

## Spellcheck and themes

Open **Tools** to turn spellcheck on or off. When spellcheck is enabled, right-click a marked word to see available corrections. Suggestions depend on the dictionaries provided by your operating system.

The **Tools** menu also includes Light, Dark, Solarized, Arctic Dark, and Forest themes. Your selected theme is remembered between sessions.

## Updates

Select **Tools → Update** to check for updates when that option is supported by your installation. Microsoft Store and Snap Store packages are normally updated by their stores, and update behaviour can differ for other Linux packages and WSL.

You can continue using SnapDock offline; an internet connection is only needed to check for or download updates and to open online links.

## Troubleshooting

### A file does not appear in Project Files

Confirm that you opened the correct folder and that the file uses a Markdown extension. Try reopening the workspace if another program created or moved the file while SnapDock was running.

### An image does not appear

Save the Markdown document, check the spelling and letter case of the image path, and make sure the path is relative to the document rather than the workspace root.

### Preview or PDF output looks unexpected

Check that Markdown markers and code fences are properly closed. Switch to Preview before exporting so you can identify whether the issue is in the Markdown or the PDF step.

### SnapDock behaves differently on Linux

Window and rendering behaviour can vary between Wayland, X11, desktop environments, and package formats. When reporting the problem, include your Linux distribution, desktop environment, display server, and installation type.

### The app will not update itself

Store-managed installations may disable SnapDock's built-in updater. Check for updates through the store or package source you used to install the app.

## Help, feedback, and private contact

This guide is included with SnapDock and remains available offline. When you have internet access, these official resources provide current information:

- [Online documentation](https://docs.snapdock.app)
- [Official SnapDock website](https://snapdock.app)
- [Report a bug or request a feature](https://github.com/ZFordDev/SnapDock/issues)
- [View the source and releases](https://github.com/ZFordDev/SnapDock)

For security vulnerabilities, sensitive conduct concerns, or another issue that should not be public, email [zforddev@gmail.com](mailto:zforddev@gmail.com). Please do not include private document contents unless they are necessary and you are comfortable sharing them.

> For ordinary bugs and feature requests, use the public GitHub issue tracker so progress and solutions can help everyone.

## Thank you for using SnapDock

Thank you for choosing SnapDock as a place for your ideas, notes, and projects. Every report, suggestion, contribution, and kind word helps make it better.

If SnapDock is useful to you, use the **⭐ Star SnapDock on GitHub** button below. It opens the official repository, where one click on **Star** helps more writers discover the project.

Keep writing, keep it local, and make it yours.
