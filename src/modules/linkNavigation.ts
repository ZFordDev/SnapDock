import path from "node:path";
import { fileURLToPath } from "node:url";

export function isExternalLink(target: unknown): boolean {
  if (typeof target !== "string") return false;

  const trimmed = target.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("file:")) return false;
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(trimmed);
}

export function resolveLocalPath(
  documentPath: string | null,
  target: unknown,
): string | null {
  if (!documentPath || typeof target !== "string") return null;

  const trimmed = target.trim();
  if (!trimmed || trimmed.startsWith("#") || isExternalLink(trimmed)) return null;

  const withoutFragment = trimmed.split("#")[0]?.split("?")[0];
  if (!withoutFragment) return null;

  if (trimmed.startsWith("file:")) {
    try {
      return fileURLToPath(trimmed);
    } catch {
      return null;
    }
  }

  return path.isAbsolute(withoutFragment)
    ? withoutFragment
    : path.resolve(path.dirname(documentPath), withoutFragment);
}
