use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, fs, path::Path, path::PathBuf, sync::{Arc, Mutex}, time::Duration};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_updater::{Update, UpdaterExt};
use url::Url;

const SPELLCHECK_CONFIG_FILE: &str = "spellcheck-config.json";
const UPDATE_CONFIG_FILE: &str = "update-config.json";
const THEMES_DIR: &str = "themes";
const UPDATE_BASE_URL: &str = "https://update.snapdock.app";

#[derive(Serialize, Deserialize, Default)]
struct SpellcheckConfig {
    enabled: bool,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct UpdateConfig {
    channel: String,
    auto_check: bool,
}

impl Default for UpdateConfig {
    fn default() -> Self {
        Self {
            channel: "latest".into(),
            auto_check: true,
        }
    }
}

struct RuntimeState {
    watcher: Mutex<Option<RecommendedWatcher>>,
    spellcheck_enabled: Mutex<bool>,
    config_path: Mutex<Option<PathBuf>>,
    // FIX Phoenix #19: debounce file watcher events
    watcher_event_pending: Arc<Mutex<bool>>,
    update_config: Mutex<UpdateConfig>,
    update_config_path: Mutex<Option<PathBuf>>,
    pending_update: Mutex<Option<Update>>,
    downloaded_bytes: Mutex<Option<Vec<u8>>>,
    custom_themes_path: Mutex<Option<PathBuf>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OpenedFile {
    content: String,
    file_path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileTreeEntry {
    name: String,
    #[serde(rename = "type")]
    entry_type: &'static str,
    full_path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SavedAsFile {
    new_file_path: String,
}

#[derive(Serialize)]
#[serde(untagged)]
enum SaveFileResult {
    Saved(bool),
    SavedAs(SavedAsFile),
}

fn path_string(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

#[tauri::command]
async fn open_file() -> Result<Option<OpenedFile>, String> {
    let handle = rfd::AsyncFileDialog::new()
        .add_filter("Markdown", &["md", "markdown", "txt"])
        .pick_file()
        .await;
    let Some(handle) = handle else {
        return Ok(None);
    };
    let path = handle.path().to_path_buf();
    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    Ok(Some(OpenedFile {
        content,
        file_path: path_string(&path),
    }))
}

#[tauri::command]
async fn open_folder(
    app: AppHandle,
    state: State<'_, RuntimeState>,
) -> Result<Option<String>, String> {
    let Some(handle) = rfd::AsyncFileDialog::new().pick_folder().await else {
        return Ok(None);
    };
    let path = handle.path().to_path_buf();
    let watched_path = path.clone();
    let event_app = app.clone();
    // FIX Phoenix #19: debounce watcher events — rapid filesystem changes
    // (e.g., IDE saves creating temp files) flood the frontend with re-render
    // requests. Use a pending flag to coalesce events within a short window.
    let pending_clone = state.watcher_event_pending.clone();
    let mut watcher = notify::recommended_watcher(move |result: notify::Result<notify::Event>| {
        match result {
            Ok(_event) => {
                if let Ok(mut pending) = pending_clone.lock() {
                    if !*pending {
                        *pending = true;
                        let app_clone = event_app.clone();
                        let pending_for_spawn = pending_clone.clone();
                        std::thread::spawn(move || {
                            std::thread::sleep(Duration::from_millis(100));
                            let _ = app_clone.emit("workspace-updated", ());
                            if let Ok(mut p) = pending_for_spawn.lock() {
                                *p = false;
                            }
                        });
                    }
                }
            }
            // FIX Phoenix #20: log watcher errors instead of silently discarding
            Err(error) => {
                eprintln!("[SnapDock] File watcher error: {error}");
            }
        }
    })
    .map_err(|error| error.to_string())?;
    watcher
        .configure(notify::Config::default().with_poll_interval(Duration::from_millis(250)))
        .map_err(|error| error.to_string())?;
    watcher
        .watch(&watched_path, RecursiveMode::Recursive)
        .map_err(|error| error.to_string())?;
    *state
        .watcher
        .lock()
        .map_err(|_| "Workspace watcher lock failed")? = Some(watcher);
    Ok(Some(path_string(&path)))
}

#[tauri::command]
async fn save_file(
    file_path: Option<String>,
    content: String,
    suggested_name: Option<String>,
) -> Result<SaveFileResult, String> {
    if let Some(path) = file_path {
        fs::write(path, content).map_err(|error| error.to_string())?;
        return Ok(SaveFileResult::Saved(true));
    }
    let mut dialog = rfd::AsyncFileDialog::new()
        .add_filter("Markdown", &["md"])
        .set_file_name(suggested_name.as_deref().unwrap_or("untitled.md"));
    let Some(handle) = dialog.save_file().await else {
        return Ok(SaveFileResult::Saved(false));
    };
    let mut path = handle.path().to_path_buf();
    if path.extension().is_none() {
        path.set_extension("md");
    }
    fs::write(&path, content).map_err(|error| error.to_string())?;
    Ok(SaveFileResult::SavedAs(SavedAsFile {
        new_file_path: path_string(&path),
    }))
}

#[tauri::command]
fn read_text_file(file_path: String) -> Result<Option<String>, String> {
    // FIX Phoenix #21: log errors instead of silently swallowing them
    // FIX Phoenix #27: return Result for consistency with other commands
    match fs::read_to_string(&file_path) {
        Ok(content) => Ok(Some(content)),
        Err(error) => {
            eprintln!("[SnapDock] Failed to read file {file_path}: {error}");
            Ok(None)
        }
    }
}

#[tauri::command]
fn list_files(dir_path: String) -> Result<Vec<FileTreeEntry>, String> {
    // FIX Phoenix #21: log errors instead of silently swallowing them
    // FIX Phoenix #27: return Result for consistency with other commands
    let entries = match fs::read_dir(&dir_path) {
        Ok(entries) => entries,
        Err(error) => {
            eprintln!("[SnapDock] Failed to list directory {dir_path}: {error}");
            return Ok(Vec::new());
        }
    };
    Ok(entries
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let file_type = entry.file_type().ok()?;
            let path = entry.path();
            Some(FileTreeEntry {
                name: entry.file_name().to_string_lossy().into_owned(),
                entry_type: if file_type.is_dir() { "folder" } else { "file" },
                full_path: path_string(&path),
            })
        })
        .collect())
}

#[tauri::command]
async fn confirm_tab_close(title: String) -> Result<bool, String> {
    // FIX Phoenix #27: return Result for consistency with other commands
    Ok(rfd::AsyncMessageDialog::new()
        .set_title("Unsaved Changes")
        .set_description(format!("\"{title}\" has unsaved changes. Close anyway?"))
        .set_level(rfd::MessageLevel::Warning)
        .set_buttons(rfd::MessageButtons::OkCancel)
        .show()
        .await
        == rfd::MessageDialogResult::Ok)
}

#[tauri::command]
async fn prompt_app_close() -> String {
    let result = rfd::AsyncMessageDialog::new()
        .set_title("Unsaved Changes")
        .set_description("You have unsaved changes. Save before closing SnapDock?")
        .set_level(rfd::MessageLevel::Warning)
        .set_buttons(rfd::MessageButtons::YesNoCancel)
        .show()
        .await;
    match result {
        rfd::MessageDialogResult::Yes => "save",
        rfd::MessageDialogResult::No => "discard",
        _ => "cancel",
    }
    .to_owned()
}

#[tauri::command]
fn open_help() -> String {
    include_str!("../../assets/resources/docs/user_guide.md").to_owned()
}

#[tauri::command]
fn get_spellcheck_state(state: State<'_, RuntimeState>) -> bool {
    state
        .spellcheck_enabled
        .lock()
        .map(|value| *value)
        .unwrap_or(true)
}

#[tauri::command]
fn set_spellcheck_state(enabled: bool, state: State<'_, RuntimeState>) -> bool {
    if let Ok(mut value) = state.spellcheck_enabled.lock() {
        *value = enabled;
    }
    // FIX Phoenix #7: persist spellcheck state to disk
    if let Ok(config_path) = state.config_path.lock() {
        if let Some(path) = config_path.as_ref() {
            let config = SpellcheckConfig { enabled };
            if let Ok(json) = serde_json::to_string_pretty(&config) {
                let _ = fs::write(path, json);
            }
        }
    }
    enabled
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VersionInfo {
    version: &'static str,
    stage: &'static str,
    date: Option<&'static str>,
    install_source: &'static str,
    channel: &'static str,
    platform: &'static str,
}

/// Detect install source at runtime. Used by both get_version and get_install_source.
fn detect_install_source() -> &'static str {
    #[cfg(target_os = "linux")]
    {
        if std::env::var("SNAP").is_ok() {
            return "snap";
        }
        if std::env::var("APPIMAGE").is_ok() {
            return "appimage";
        }
    }
    // TODO: detect Windows Store (UWP) installs
    // if std::env::var("PACKAGE_FAMILY_NAME").is_ok() { return "windows-store"; }
    "direct"
}

#[tauri::command]
fn get_version() -> VersionInfo {
    VersionInfo {
        version: env!("CARGO_PKG_VERSION"),
        stage: option_env!("BUILD_STAGE").unwrap_or("dev"),
        // FIX Phoenix #8: read build date from BUILD_DATE env var
        date: option_env!("BUILD_DATE"),
        // FIX Phoenix #26: use detect_install_source() instead of hardcoding
        install_source: detect_install_source(),
        channel: option_env!("BUILD_CHANNEL").unwrap_or("dev"),
        platform: std::env::consts::OS,
    }
}

#[tauri::command]
fn get_install_source() -> &'static str {
    detect_install_source()
}

#[tauri::command]
fn get_update_config(state: State<'_, RuntimeState>) -> Result<UpdateConfig, String> {
    state
        .update_config
        .lock()
        .map(|config| config.clone())
        .map_err(|_| "Update config lock failed".into())
}

#[tauri::command]
fn set_update_config(
    channel: String,
    auto_check: bool,
    state: State<'_, RuntimeState>,
) -> Result<UpdateConfig, String> {
    let config = UpdateConfig {
        channel: channel.clone(),
        auto_check,
    };
    // Persist to disk
    if let Ok(path_lock) = state.update_config_path.lock() {
        if let Some(path) = path_lock.as_ref() {
            if let Ok(json) = serde_json::to_string_pretty(&config) {
                let _ = fs::write(path, json);
            }
        }
    }
    // Update in-memory state
    if let Ok(mut current) = state.update_config.lock() {
        *current = config.clone();
    }
    Ok(config)
}

/// Check for updates against the user's selected channel endpoint.
/// Skips the check for snap/appimage installs which have their own update mechanisms.
#[tauri::command]
async fn check_for_updates(
    app: AppHandle,
    state: State<'_, RuntimeState>,
) -> Result<serde_json::Value, String> {
    // Snap and AppImage have their own update mechanisms — skip Tauri updater
    let source = detect_install_source();
    if source == "snap" || source == "appimage" {
        return Ok(serde_json::json!({
            "updateAvailable": false,
            "latestVersion": null,
            "currentVersion": null,
            "disabled": true,
            "reason": source,
        }));
    }
    // Read channel from persisted config
    let channel = state
        .update_config
        .lock()
        .map(|config| config.channel.clone())
        .unwrap_or_else(|_| "latest".into());
    let endpoint_url = Url::parse(&format!("{UPDATE_BASE_URL}/{channel}/latest.json"))
        .map_err(|e| format!("Invalid updater URL: {e}"))?;
    // Use Tauri's updater builder with dynamic endpoint
    let update = app
        .updater_builder()
        .endpoints(vec
![endpoint_url])
        .map_err(|e| format!("Failed to set updater endpoint: {e}"))?
        .build()
        .map_err(|e| format!("Failed to build updater: {e}"))?
        .check()
        .await
        .map_err(|e| format!("Update check failed: {e}"))?;
    match update {
        Some(update) => {
            let version = update.version.clone();
            let current = update.current_version.clone();
            // Store the Update object for later download/install
            if let Ok(mut pending) = state.pending_update.lock() {
                *pending = Some(update);
            }
            Ok(serde_json::json!({
                "updateAvailable": true,
                "latestVersion": version,
                "currentVersion": current,
            }))
        }
        None => Ok(serde_json::json!({
            "updateAvailable": false,
            "latestVersion": null,
            "currentVersion": null,
        })),
    }
}

#[tauri::command]
async fn download_update(
    app: AppHandle,
    state: State<'_, RuntimeState>,
) -> Result<String, String> {
    let update = {
        let mut pending = state
            .pending_update
            .lock()
            .map_err(|_| "Update lock failed")?;
        pending
            .take()
            .ok_or("No update available to download")?
    };
    let version = update.version.clone();
    // Download with progress events emitted to the frontend
    let app_clone = app.clone();
    let bytes = update
        .download(
            move |chunk_len: usize, total: Option<u64>| {
                let _ = app_clone.emit(
                    "updater://progress",
                    serde_json::json!({
                        "chunkLength": chunk_len,
                        "total": total,
                    }),
                );
            },
            || {},
        )
        .await
        .map_err(|e| format!("Download failed: {e}"))?;
    // Store downloaded bytes for install
    if let Ok(mut stored) = state.downloaded_bytes.lock() {
        *stored = Some(bytes);
    }
    // Re-store the Update metadata for install
    // (We need the Update object's install method, but we consumed it in download)
    // Actually, Update::install needs the bytes, not the Update itself.
    // Store the update back so install can use it
    Ok(version)
}

#[tauri::command]
async fn install_update(
    app: AppHandle,
    state: State<'_, RuntimeState>,
) -> Result<(), String> {
    let bytes = {
        let mut stored = state
            .downloaded_bytes
            .lock()
            .map_err(|_| "Download lock failed")?;
        stored
            .take()
            .ok_or("No downloaded update available")?
    };
    // We need the Update object to call install(). Re-check to get a fresh Update.
    let channel = state
        .update_config
        .lock()
        .map(|config| config.channel.clone())
        .unwrap_or_else(|_| "latest".into());
    let endpoint_url = Url::parse(&format!("{UPDATE_BASE_URL}/{channel}/latest.json"))
        .map_err(|e| format!("Invalid updater URL: {e}"))?;
    let update = app
        .updater_builder()
        .endpoints(vec
![endpoint_url])
        .map_err(|e| format!("Failed to set updater endpoint: {e}"))?
        .build()
        .map_err(|e| format!("Failed to build updater: {e}"))?
        .check()
        .await
        .map_err(|e| format!("Update check failed: {e}"))?
        .ok_or("No update found for install")?;
    update
        .install(&bytes)
        .map_err(|e| format!("Install failed: {e}"))?;
    // Relaunch the app after successful install
    app.restart();
}

#[tauri::command]
fn list_custom_themes(state: State<'_, RuntimeState>) -> Result<Vec<String>, String> {
    let path_lock = state
        .custom_themes_path
        .lock()
        .map_err(|_| "Theme path lock failed")?;
    let Some(dir) = path_lock.as_ref() else {
        return Ok(Vec::new());
    };
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let entries = fs::read_dir(dir).map_err(|e| format!("Failed to read themes dir: {e}"))?;
    Ok(entries
        .filter_map(Result::ok)
        .filter(|e| {
            e.path()
                .extension()
                .map(|ext| ext == "json")
                .unwrap_or(false)
        })
        .map(|e| e.path().to_string_lossy().into_owned())
        .collect())
}

#[tauri::command]
fn load_theme_file(file_path: String) -> Result<Option<String>, String> {
    match fs::read_to_string(&file_path) {
        Ok(content) => Ok(Some(content)),
        Err(error) => {
            eprintln!("[SnapDock] Failed to load theme file {file_path}: {error}");
            Ok(None)
        }
    }
}

#[tauri::command]
fn save_theme_file(file_name: String, content: String, state: State<'_, RuntimeState>) -> Result<bool, String> {
    let path_lock = state
        .custom_themes_path
        .lock()
        .map_err(|_| "Theme path lock failed")?;
    let Some(dir) = path_lock.as_ref() else {
        return Err("Themes directory not available".into());
    };
    if !dir.exists() {
        fs::create_dir_all(dir).map_err(|e| format!("Failed to create themes dir: {e}"))?;
    }
    let path = dir.join(&file_name);
    fs::write(path, content).map_err(|e| format!("Failed to save theme: {e}"))?;
    Ok(true)
}

#[tauri::command]
fn delete_theme_file(file_path: String) -> Result<bool, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Ok(false);
    }
    fs::remove_file(path).map_err(|e| format!("Failed to delete theme: {e}"))?;
    Ok(true)
}

pub fn run() {
    tauri::Builder::default()
        .manage(RuntimeState {
            watcher: Mutex::new(None),
            spellcheck_enabled: Mutex::new(true),
            config_path: Mutex::new(None),
            watcher_event_pending: Arc::new(Mutex::new(false)),
            update_config: Mutex::new(UpdateConfig::default()),
            update_config_path: Mutex::new(None),
            pending_update: Mutex::new(None),
            downloaded_bytes: Mutex::new(None),
            custom_themes_path: Mutex::new(None),
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            open_file,
            open_folder,
            save_file,
            read_text_file,
            list_files,
            confirm_tab_close,
            prompt_app_close,
            open_help,
            get_spellcheck_state,
            set_spellcheck_state,
            get_version,
            get_install_source,
            get_update_config,
            set_update_config,
            check_for_updates,
            download_update,
            install_update,
            list_custom_themes,
            load_theme_file,
            save_theme_file,
            delete_theme_file,
        ])
        .setup(|app| {
            // Load config directory path (shared by spellcheck and update configs)
            let config_dir = app.path().app_config_dir().ok();
            // FIX Phoenix #7: load spellcheck state from disk on startup
            let spellcheck_config_path =
                config_dir.as_ref().map(|dir| dir.join(SPELLCHECK_CONFIG_FILE));
            if let Some(ref path) = spellcheck_config_path {
                if let Ok(contents) = fs::read_to_string(path) {
                    if let Ok(config) = serde_json::from_str::<SpellcheckConfig>(&contents) {
                        if let Some(state) = app.try_state::<RuntimeState>() {
                            if let Ok(mut enabled) = state.spellcheck_enabled.lock() {
                                *enabled = config.enabled;
                            }
                        }
                    }
                }
            }
            if let Some(state) = app.try_state::<RuntimeState>() {
                if let Ok(mut path_lock) = state.config_path.lock() {
                    *path_lock = spellcheck_config_path;
                }
            }
            // Load update config from disk on startup
            let update_config_path =
                config_dir.as_ref().map(|dir| dir.join(UPDATE_CONFIG_FILE));
            if let Some(ref path) = update_config_path {
                if let Ok(contents) = fs::read_to_string(path) {
                    if let Ok(config) = serde_json::from_str::<UpdateConfig>(&contents) {
                        if let Some(state) = app.try_state::<RuntimeState>() {
                            if let Ok(mut update_cfg) = state.update_config.lock() {
                                *update_cfg = config;
                            }
                        }
                    }
                }
            }
            if let Some(state) = app.try_state::<RuntimeState>() {
                if let Ok(mut path_lock) = state.update_config_path.lock() {
                    *path_lock = update_config_path;
                }
            }
            // Initialize custom themes directory
            let themes_dir = config_dir.as_ref().map(|dir| dir.join(THEMES_DIR));
            if let Some(ref path) = themes_dir {
                if !path.exists() {
                    let _ = fs::create_dir_all(path);
                }
            }
            if let Some(state) = app.try_state::<RuntimeState>() {
                if let Ok(mut path_lock) = state.custom_themes_path.lock() {
                    *path_lock = themes_dir;
                }
            }
            if let Some(window) = app.get_webview_window("main") {
                let window_for_event = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Resized(_) = event {
                        if let Ok(maximized) = window_for_event.is_maximized() {
                            let _ = window_for_event.emit("window-is-maximized", maximized);
                        }
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running SnapDock");
}
