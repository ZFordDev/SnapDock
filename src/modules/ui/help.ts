import { renderMarkdown } from "../markdown.js";

export async function openHelpModal(): Promise<void> {
  const content = await window.snapdockAPI.openHelp();
  const modal = document.createElement("div");
  modal.className = "modal fixed inset-0 z-[1000] flex h-full w-full items-center justify-center bg-black/50";
  modal.innerHTML = `
    <div class="modal-content modal-content--help max-h-[80vh] max-w-[600px] overflow-y-auto rounded-xl bg-[var(--workspace-bg)] px-6 pb-6 pt-0 text-inherit">
      <div class="modal-close-float-wrap sticky top-0 z-[2] -mx-6 mb-4 box-border flex min-h-14 items-start justify-end bg-[var(--workspace-bg)] pb-0 pl-6 pr-4 pt-6">
        <button type="button" class="modal-close-float flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[var(--border-color,rgba(128,128,128,.4))] bg-[var(--workspace-bg)] p-0 text-2xl leading-none text-inherit transition-colors duration-150 hover:bg-[var(--hover-bg,rgba(128,128,128,.15))]" data-action="close" aria-label="Close">×</button>
      </div>
      <div class="modal-help-body">
        ${renderMarkdown(content)}
        <button type="button" data-action="star" class="cursor-pointer rounded border border-[var(--border-color)] bg-[var(--toolbar-bg)] px-3 py-1.5 text-[.9em] text-inherit transition-colors duration-200 hover:bg-[var(--border-color)] active:opacity-80">⭐ Star SnapDock on GitHub</button>
        <button type="button" data-action="close" class="cursor-pointer rounded border border-[var(--border-color)] bg-[var(--toolbar-bg)] px-3 py-1.5 text-[.9em] text-inherit transition-colors duration-200 hover:bg-[var(--border-color)] active:opacity-80">Close</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.querySelectorAll<HTMLElement>('[data-action="close"]').forEach((button) => {
    button.addEventListener("click", () => modal.remove());
  });
  modal.querySelector<HTMLElement>('[data-action="star"]')?.addEventListener("click", () => {
    void window.snapdockAPI.openExternal("https://github.com/ZFordDev/SnapDock");
  });
  modal.querySelector<HTMLElement>(".modal-help-body")?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!link) return;
    event.preventDefault();
    void window.snapdockAPI.openExternal(link.href);
  });
}

export function initHelp(): void {
  // Help is wired through the Tools dropdown.
}
