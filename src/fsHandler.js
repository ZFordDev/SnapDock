// src/fsHandler.js
import init, { list_directory } from './filetree/pkg/filetree.js';

export async function initRust() {
  await init();
}

export function getDirectory(path) {
  try {
    return list_directory(path);
  } catch (err) {
    console.error("Rust error:", err);
    return [];
  }
}