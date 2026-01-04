
// no longer needed for the new app structure but kept for reference
/*
const AUTOSAVE_KEY = "snapdock_autosave";

export function initAutosave({ editor }) {
  if (!editor) return;

  const saved = localStorage.getItem(AUTOSAVE_KEY);
  if (saved) editor.value = saved;

  let timer;
  editor.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, editor.value || "");
    }, 500);
  });
}
*/