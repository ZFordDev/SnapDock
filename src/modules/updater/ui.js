// src/modules/updater/ui.js

export async function initUpdateSystem() {
  const updateBtn = document.getElementById("update");
  if (!updateBtn) return;

  // Detect install source
  const source = await window.electronAPI.getInstallSource();

  // -----------------------------
  // WINDOWS STORE
  // -----------------------------
  if (source === "windows-store") {
    updateBtn.textContent = "Open Microsoft Store";
    updateBtn.disabled = false;

    updateBtn.onclick = () => {
      window.open("ms-windows-store://pdp/?productid=YOUR_PRODUCT_ID");
    };

    return;
  }

  // -----------------------------
  // SNAP STORE
  // -----------------------------
  if (source === "snap-store") {
    updateBtn.textContent = "Open Snap Store";
    updateBtn.disabled = false;

    updateBtn.onclick = () => {
      window.open("snap-store://snapdock");
    };

    return;
  }

  // -----------------------------
  // DIRECT INSTALL (normal updater)
  // -----------------------------
  checkForUpdatesOnLaunch(updateBtn);

  updateBtn.addEventListener("click", async () => {
    updateBtn.disabled = true;
    updateBtn.textContent = "Checking...";

    const result = await window.electronAPI.checkForUpdates();

    if (!result || !result.updateAvailable) {
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

  window.electronAPI.onUpdateProgress(progress => {
    updateBtn.textContent = `Downloading ${Math.floor(progress.percent)}%`;
  });

  window.electronAPI.onUpdateReady(() => {
    updateBtn.textContent = "Restart to Update";
    updateBtn.disabled = false;
    updateBtn.onclick = () => window.electronAPI.installUpdate();
  });

  window.electronAPI.onUpdateError(err => {
    updateBtn.textContent = "Update Failed";
    console.error("Update error:", err);
  });
}

async function checkForUpdatesOnLaunch(updateBtn) {
  const result = await window.electronAPI.checkForUpdates();

  if (result?.updateAvailable) {
    updateBtn.classList.add("update-available");
    updateBtn.textContent = "Update Available";
  }
}
