// src/modules/ui/help.js

/**
 * Open the help modal.  Exported so both the old helpBtn handler
 * AND the new Tools dropdown can call it.
 */
export async function openHelpModal() {
  const content = await window.electronAPI.openHelp();
  const md = window.markdown.render(content);

  const modal = document.createElement("div");
  modal.className = "modal fixed inset-0 z-[1000] flex h-full w-full items-center justify-center bg-black/50";
  modal.innerHTML = `
    <div class="modal-content modal-content--help max-h-[80vh] max-w-[600px] overflow-y-auto rounded-xl bg-[var(--workspace-bg)] px-6 pb-6 pt-0 text-inherit">
      <div class="modal-close-float-wrap sticky top-0 z-[2] -mx-6 mb-4 box-border flex min-h-14 items-start justify-end bg-[var(--workspace-bg)] pb-0 pl-6 pr-4 pt-6">
        <button type="button" id="closeHelpFloat" class="modal-close-float flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[var(--border-color,rgba(128,128,128,.4))] bg-[var(--workspace-bg)] p-0 text-2xl leading-none text-inherit transition-colors duration-150 hover:bg-[var(--hover-bg,rgba(128,128,128,.15))]" aria-label="Close">×</button>
      </div>
      <div class="modal-help-body">
        ${md}
        <button type="button" id="starSnapDock" class="cursor-pointer rounded border border-[var(--border-color)] bg-[var(--toolbar-bg)] px-3 py-1.5 text-[.9em] text-inherit transition-colors duration-200 hover:border-[var(--border-color)] hover:bg-[var(--border-color)] active:opacity-80">⭐ Star SnapDock on GitHub</button>
        <button type="button" id="closeHelp" class="cursor-pointer rounded border border-[var(--border-color)] bg-[var(--toolbar-bg)] px-3 py-1.5 text-[.9em] text-inherit transition-colors duration-200 hover:border-[var(--border-color)] hover:bg-[var(--border-color)] active:opacity-80">Close</button>
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
