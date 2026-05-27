// semver
// 
// prerelease tags
// 
// “newer than latest” edge cases

const semver = require("semver");

// -----------------------------
// Compare two versions
// Returns:
//  -1  if a < b
//   0  if a == b
//   1  if a > b
// -----------------------------
function compareVersions(a, b) {
  try {
    return semver.compare(a, b);
  } catch {
    console.warn("[updater] Invalid semver compare:", a, b);
    return 0;
  }
}

// -----------------------------
// Check if a version is newer
// -----------------------------
function isNewerVersion(latest, current) {
  try {
    return semver.gt(latest, current);
  } catch {
    console.warn("[updater] Invalid semver:", latest, current);
    return false;
  }
}

// -----------------------------
// Check if version is prerelease
// e.g. "3.2.0-beta.1"
// -----------------------------
function isPrerelease(version) {
  try {
    return semver.prerelease(version) !== null;
  } catch {
    return false;
  }
}

// -----------------------------
// Handle “newer than latest” edge cases
// Example:
//   current = 3.2.0-beta.5
//   latest  = 3.2.0
// User is on prerelease newer than stable
// -----------------------------
function isAheadOfStable(current, stableLatest) {
  try {
    // If current is prerelease AND greater than stable
    return isPrerelease(current) && semver.gt(current, stableLatest);
  } catch {
    return false;
  }
}

module.exports = {
  compareVersions,
  isNewerVersion,
  isPrerelease,
  isAheadOfStable
};
