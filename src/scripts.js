import { initInitialState } from "./modules/ui/editorState.js";
import { initTheme } from "./modules/ui/theme.js";
import { initViewModeToggle } from "./modules/ui/viewMode.js";
import { loadContent, saveCurrentFile } from "./modules/file/operations.js";
import { initAutosave } from "./modules/file/autosave.js";
import { renderRecentFiles, saveToRecentFiles } from "./modules/file/recent.js";

function byId(id) { return document.getElementById(id); }

const editor = byId("markdownInputMain");
const preview = byId("previewMain");
const themeToggleBtn = byId("themeToggleBtnBottom");
const previewToggleBtn = byId("previewToggleBtn");
const versionTag = byId("versionTag");
const recentList = byId("recentFilesList");
const fileTreeList = byId("fileTreeList");
const sidebar = document.getElementById("sidebar");
const resizer = document.getElementById("resizer");
const updateBtn = document.getElementById("update");

// INITIALIZATION

initInitialState({ editor });
initTheme({ toggleBtn: themeToggleBtn });
initViewModeToggle({ toggleBtn: previewToggleBtn, editor, preview });
initAutosave({ editor });
renderRecentFiles(recentList, editor);
renderFileTree(fileTreeList);
setVersionTag();
checkForUpdatesOnLaunch();

// VERSION TAG

async function setVersionTag() {
  const info = await window.electronAPI.getVersion();
  versionTag.textContent = `SnapDock ${info.version} (${info.stage}) — ${info.date}`;
}

// FILENAME DISPLAY

function setFilenameDisplay(filePath) {
  const parts = filePath.split(/[\\/]/);
  const base = parts[parts.length - 1];
  const name = base.replace(/\.[^/.]+$/, "");
  document.getElementById("filenameDisplay").textContent = name;
}

// FILE OPERATIONS

document.getElementById("newFileBtn")?.addEventListener("click", () => {
  editor.value = "";
  preview.innerHTML = "";
  document.getElementById("filenameDisplay").textContent = "Untitled";
});

document.getElementById("saveFileBtnTop")?.addEventListener("click", () => {
  saveCurrentFile(editor);
});

document.getElementById("openFileBtnTop")?.addEventListener("click", async () => {
  const result = await loadContent(editor);
  if (result && result.filePath) {
    saveToRecentFiles(result.filePath);
    renderRecentFiles(recentList, editor);
    setFilenameDisplay(result.filePath);
  }
});

document.getElementById("openFolderBtnTop")?.addEventListener("click", async () => {
  const folderPath = await window.electronAPI.openFolder();
  if (folderPath) {
    fileTreeList.innerHTML = "";
    renderFileTree(fileTreeList, folderPath);
  }
});

// HELP MODAL

document.getElementById("helpBtn")?.addEventListener("click", async () => {
  const content = await window.electronAPI.openHelp();
  const md = window.markdown.render(content);

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      ${md}
      <button id="closeHelp">Close</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("closeHelp").addEventListener("click", () => modal.remove());
});

// FILE TREE

async function renderFileTree(container, dirPath) {
  const files = await window.electronAPI.listFiles(dirPath);
  files.forEach(f => {
    const li = document.createElement("li");
    li.textContent = f.name;
    li.className = f.type;

    if (f.type === "folder") {
      const nested = document.createElement("ul");
      nested.style.display = "none";

      li.addEventListener("click", async () => {
        if (nested.childElementCount === 0) {
          const subFiles = await window.electronAPI.listFiles(f.fullPath);
          subFiles.forEach(sf => {
            const subLi = document.createElement("li");
            subLi.textContent = sf.name;
            subLi.className = sf.type;

            if (sf.type === "file") {
              subLi.addEventListener("click", async (e) => {
                e.stopPropagation();
                const content = await window.electronAPI.openRecentFile(sf.fullPath);
                if (content !== null) editor.value = content;
              });
            }

            nested.appendChild(subLi);
          });
        }
        nested.style.display = nested.style.display === "none" ? "block" : "none";
      });

      li.appendChild(nested);
    } else {
      li.addEventListener("click", async () => {
        const content = await window.electronAPI.openRecentFile(f.fullPath);
        if (content !== null) editor.value = content;
      });
    }

    container.appendChild(li);
  });
}

// UPDATE SYSTEM (NEW)

async function checkForUpdatesOnLaunch() {
  const result = await window.electronAPI.checkForUpdates();

  if (result?.updateAvailable) {
    updateBtn.classList.add("update-available");
    updateBtn.textContent = "Update Available";
  }
}

// User clicks update button
updateBtn?.addEventListener("click", async () => {
  updateBtn.disabled = true;
  updateBtn.textContent = "Checking...";

  const result = await window.electronAPI.checkForUpdates();

  if (!result.updateAvailable) {
    updateBtn.textContent = "No Updates";
    setTimeout(() => {
      updateBtn.textContent = "Update";
      updateBtn.disabled = false;
    }, 1500);
    return;
  }

  updateBtn.textContent = "Downloading...";
  await window.electronAPI.downloadUpdate();
});

// Update events
window.electronAPI.onUpdateProgress((progress) => {
  updateBtn.textContent = `Downloading ${Math.floor(progress.percent)}%`;
});

window.electronAPI.onUpdateReady(() => {
  updateBtn.textContent = "Restart to Update";
  updateBtn.disabled = false;

  updateBtn.onclick = () => {
    window.electronAPI.installUpdate();
  };
});

window.electronAPI.onUpdateError((err) => {
  updateBtn.textContent = "Update Failed";
  console.error("Update error:", err);
});

// SIDEBAR RESIZER

resizer.addEventListener("mousedown", e => {
  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", stopResize);
});

function resize(e) {
  const newWidth = e.clientX;
  if (newWidth > 180 && newWidth < 400) {
    sidebar.style.width = newWidth + "px";
  }
}

function stopResize() {
  document.removeEventListener("mousemove", resize);
  document.removeEventListener("mouseup", stopResize);
}