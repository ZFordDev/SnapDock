> [!NOTE]
> **ZFordDev Standard: Temp Notes**
>
> This file is included in every repository as part of the ZFordDev ecosystem
> standards. It provides a safe local-only space for scratch notes, planning,
> and quick thoughts while working.
>
> This file is ignored by Git (see `.gitignore`) and will never be committed
> or pushed to the repository.

# ***NOTES***

---

  Continue  opencode -s ses_fe4460135ffeCGFPeNMm3BkSMP


## Phoenix (v4 Tauri) — Internal Issue Tracker

### Changelog
- 2026-08-20: Initial audit — 32 issues found (4 Critical, 7 High, 12 Medium, 9 Low)

### CRITICAL

| # | Status | Issue | File |
|---|--------|-------|------|
| 1 | ✅ | PDF export has zero HTML sanitization — malicious .md files execute code on export | `tauriBridge.ts:44-65` |
| 2 | ✅ | Redundant `set_file_name` in save dialog — dead logic | `lib.rs:101-106` |
| 3 | ✅ | Dead PDF template files — ported from v3, never referenced | `pdf/template.html`, `pdf/pdf.css` |
| 4 | ✅ | `url` crate in Cargo.toml unused — adds compile time | `Cargo.toml:26` |

### HIGH

| # | Status | Issue | File |
|---|--------|-------|------|
| 5 | ✅ | Live View silently degrades to preview mode | `viewMode.ts:86-91` |
| 6 | ✅ | `onUpdateAvailable`/`onUpdateNone` are empty stubs | `tauriBridge.ts:157-158` |
| 7 | ✅ | Spellcheck state not persisted — resets every restart | `lib.rs:6-9` |
| 8 | ✅ | Version date always "unknown" — `date: None` hardcoded | `lib.rs:211` |
| 9 | ✅ | `getInstallSource` always returns "direct" — no store detection | `lib.rs:218-221` |
| 10 | ✅ | `linkNavigation.ts` dead code — duplicated in tauriBridge | `linkNavigation.ts` |
| 11 | ✅ | Missing `.md-info` CSS rule — info containers unstyled | `markdown.css:70-91` |

### MEDIUM

| # | Status | Issue | File |
|---|--------|-------|------|
| 12 | ✅ | IPC channel maps unused — type safety bypassed | `ipc.ts:1-69` |
| 13 | ✅ | `getDirtyTabs` exported, never imported | `dirtyState.ts:7-9` |
| 14 | ✅ | `clearTabs` exported, never imported | `tabs.ts:101-105` |
| 15 | ✅ | `save_all_tabs` snake_case alias unused | `tabs.ts:287` |
| 16 | ✅ | `openRecentFile` never called | `tauriBridge.ts:99` |
| 17 | ✅ | `initHelp()` empty function called on startup | `help.ts:35-37` |
| 18 | ✅ | No dirty state timeout safety net — data loss risk | `dirtyState.ts:11-13` |
| 19 | ✅ | File watcher emits all events without debouncing | `lib.rs:72-76` |
| 20 | ✅ | Watcher errors silently discarded | `lib.rs:73-74` |
| 21 | ✅ | `read_text_file`/`list_files` swallow errors silently | `lib.rs:121-142` |
| 22 | ✅ | Updater pubkey is placeholder — updater fails at runtime | `tauri.conf.json:49` |
| 23 | ✅ | `snapcraft.yaml` references missing `snapdock.desktop` | `snapcraft.yaml:53` |

### LOW

| # | Status | Issue | File |
|---|--------|-------|------|
| 24 | ⏭️ | CSP allows `unsafe-inline` for styles — required for markdown inline styles | `tauri.conf.json:24` |
| 25 | ⏭️ | Asset protocol scope `["**"]` — expected for local markdown editor | `tauri.conf.json:27` |
| 26 | ✅ | `getInstallSource` redundant with `get_version` | `lib.rs:218-221` |
| 27 | ✅ | `confirm_tab_close`/`read_text_file` lack `Result` wrappers | `lib.rs:145,121` |
| 28 | ⏭️ | `build/metadata.json` unused by Tauri backend — file doesn't exist | `build/metadata.json` |
| 29 | ✅ | `TabDragState.startX`/`placeholder` never used | `tabs.ts:21-22` |
| 30 | ✅ | `FindState.index` redundant with `activeIndex` | `ui.ts:22` |
| 31 | ✅ | Poll interval config may have no effect on Linux | `lib.rs:79` |
| 32 | ✅ | Open/save dialog filter mismatch (.txt vs .md) | `lib.rs:47` |

---

## v3 (main) — Completed Fixes

| Issue | Fix | Status |
|-------|-----|--------|
| 241 | Close handler async dirty state check | ✅ merged |
| 237 | open-external-link protocol validation | ✅ merged |
| 239 | PDF export window sandbox/contextIsolation | ✅ merged |
| 240 | sanitizeHtml regex hardening | ✅ merged |
