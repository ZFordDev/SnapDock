// src/fsHandler.js
import init, { list_directory } from './filetree/pkg/filetree.js';

function resolveWasmUrl() {
  if (!window.electronAPI || typeof window.electronAPI.getResourcesPath !== 'function') {
    // Point directly to the source pkg folder in dev
    return new URL('../filetree/pkg/filetree_bg.wasm', import.meta.url).toString();
  }

  // Packaged build: preload exposes process.resourcesPath
  const base = window.electronAPI.getResourcesPath();
  if (base) {
    // Normalize Windows backslashes
    const normalized = base.replace(/\\/g, '/');
    // Construct a file:// URL into resources/filetree/pkg
    return `file://${normalized}/filetree/pkg/filetree_bg.wasm`;
  }

  // Fallback to dev path
  return new URL('../filetree/pkg/filetree_bg.wasm', import.meta.url).toString();
}

/**
 * Initialize the Rust.
 */
export async function initRust() {
  const wasmUrl = resolveWasmUrl();
  try {
    // Pass an options object with `module`
    await init({ module: wasmUrl });
    console.log('Rust WASM initialized from', wasmUrl);
  } catch (err) {
    console.error('Failed to initialize Rust WASM:', err);
  }
}

/**
 * wrapper for Rust directory listing.
 */
export function getDirectory(path) {
  try {
    return list_directory(path);
  } catch (err) {
    console.error('Rust error in getDirectory:', err);
    return [];
  }
}