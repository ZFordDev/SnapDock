export function initHelp() {
  const helpBtn = document.getElementById("helpBtn");
  if (!helpBtn) return;

  helpBtn.addEventListener("click", async () => {
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
          <button type="button" id="closeHelp">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById("closeHelpFloat").addEventListener("click", closeModal);
    document.getElementById("closeHelp").addEventListener("click", closeModal);
  });
}