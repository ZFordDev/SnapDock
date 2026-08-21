export function isExternalLink(target: string): boolean {
  return /^(?:https?:|mailto:|tel:)/i.test(target.trim());
}

export function resolveLocalPath(documentPath: string | null, target: string): string | null {
  if (!documentPath || !target || target.startsWith("#") || isExternalLink(target)) return null;
  const cleanTarget = target.split("#")[0]?.split("?")[0];
  if (!cleanTarget) return null;
  if (/^(?:[a-zA-Z]:[\\/]|[\\/])/.test(cleanTarget)) return cleanTarget;
  const separator = documentPath.includes("\\") ? "\\" : "/";
  const parent = documentPath.slice(0, Math.max(documentPath.lastIndexOf("/"), documentPath.lastIndexOf("\\")));
  const parts = `${parent}${separator}${cleanTarget}`.split(/[\\/]/);
  const normalized: string[] = [];
  for (const part of parts) {
    if (part === "..") normalized.pop();
    else if (part && part !== ".") normalized.push(part);
  }
  const prefix = documentPath.startsWith("/") ? "/" : "";
  return prefix + normalized.join(separator);
}
