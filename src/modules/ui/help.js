// src/modules/ui/help.js

/**
 * Open the help modal.  Exported so both the old helpBtn handler
 * AND the new Tools dropdown can call it.
 */
export async function openHelpModal() {
  const content = await window.electronAPI.openHelp();
  const md = window.markdown.render(content);

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content modal-content--help">
      <div class="modal-close-float-wrap">
        <button type="button" id="closeHelpFloat" class="modal-close-float" aria-label="Close">×</button>
      </div>
      <div class="modal-help-body">
        ${md}
        <button type="button" id="starSnapDock">⭐ Star SnapDock on GitHub</button>
        <button type="button" id="closeHelp">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  document.getElementById("closeHelpFloat").addEventListener("click", closeModal);
  document.getElementById("closeHelp").addEventListener("click", closeModal);
  document.getElementById("starSnapDock").addEventListener("click", () => {
    window.electronAPI.openExternal("https://github.com/ZFordDev/SnapDock");
  });

  modal.querySelector(".modal-help-body").addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;

    event.preventDefault();
    window.electronAPI.openExternal(link.href);
  });
}

/**
 * Legacy initializer — kept for backward compat but the dropdown
 * now handles help via openHelpModal() directly.
 */
export function initHelp() {
  // No-op — help is now wired via the Tools dropdown
}
