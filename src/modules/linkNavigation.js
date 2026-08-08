const path = require("path");
const { fileURLToPath } = require("url");

function isExternalLink(target) {
  if (!target || typeof target !== "string") return false;

  const trimmed = target.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith("#")) return false;

  if (trimmed.startsWith("file:")) return false;

  const protocolPattern = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;
  if (protocolPattern.test(trimmed)) return true;

  return false;
}

function resolveLocalPath(documentPath, target) {
  if (!documentPath || !target || typeof target !== "string") return null;

  const trimmed = target.trim();
  if (!trimmed || trimmed.startsWith("#") || isExternalLink(trimmed)) {
    return null;
  }

  const withoutFragment = trimmed.split("#")[0].split("?")[0];
  if (!withoutFragment) return null;

  if (trimmed.startsWith("file:")) {
    try {
      return fileURLToPath(trimmed);
    } catch {
      return null;
    }
  }

  if (path.isAbsolute(withoutFragment)) {
    return withoutFragment;
  }

  const dir = path.dirname(documentPath);
  return path.resolve(dir, withoutFragment);
}

module.exports = {
  isExternalLink,
  resolveLocalPath,
};
