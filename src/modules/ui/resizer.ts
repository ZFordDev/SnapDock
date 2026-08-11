export function initResizer(): void {
  const sidebar = document.querySelector<HTMLElement>("#sidebar");
  const resizer = document.querySelector<HTMLElement>("#resizer");
  if (!sidebar || !resizer) return;

  const resizeSidebar = (event: MouseEvent): void => {
    const newWidth = event.clientX;
    if (newWidth > 180 && newWidth < 400) sidebar.style.width = `${newWidth}px`;
  };

  const stopResize = (): void => {
    document.removeEventListener("mousemove", resizeSidebar);
    document.removeEventListener("mouseup", stopResize);
  };

  resizer.addEventListener("mousedown", () => {
    document.addEventListener("mousemove", resizeSidebar);
    document.addEventListener("mouseup", stopResize);
  });
}
