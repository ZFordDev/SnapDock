use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, fs, path::PathBuf, sync::Mutex, time::Duration};
use tauri::{AppHandle, Emitter, Manager, State};

const SPELLCHECK_CONFIG_FILE: &str = "spellcheck-config.json";

#[derive(Serialize, Deserialize, Default)]
struct SpellcheckConfig {
    enabled: bool,
}

struct RuntimeState {
    watcher: Mutex<Option<RecommendedWatcher>>,
    spellcheck_enabled: Mutex<bool>,
    config_path: Mutex<Option<PathBuf>>,
    // FIX Phoenix #19: debounce file watcher events
    watcher_event_pending: Mutex<bool>,
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
fn read_text_file(file_path: String) -> Option<String> {
    fs::read_to_string(file_path).ok()
}

#[tauri::command]
fn list_files(dir_path: String) -> Vec<FileTreeEntry> {
    let Ok(entries) = fs::read_dir(dir_path) else {
        return Vec::new();
    };
    entries
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
        .collect()
}

#[tauri::command]
async fn confirm_tab_close(title: String) -> bool {
    rfd::AsyncMessageDialog::new()
        .set_title("Unsaved Changes")
        .set_description(format!("\"{title}\" has unsaved changes. Close anyway?"))
        .set_level(rfd::MessageLevel::Warning)
        .set_buttons(rfd::MessageButtons::OkCancel)
        .show()
        .await
        == rfd::MessageDialogResult::Ok
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

#[tauri::command]
fn get_version() -> VersionInfo {
    VersionInfo {
        version: env!("CARGO_PKG_VERSION"),
        stage: option_env!("BUILD_STAGE").unwrap_or("dev"),
        // FIX Phoenix #8: read build date from BUILD_DATE env var
        // Set via: export BUILD_DATE=$(date +%Y-%m-%d)
        date: option_env!("BUILD_DATE"),
        install_source: "direct",
        channel: option_env!("BUILD_CHANNEL").unwrap_or("dev"),
        platform: std::env::consts::OS,
    }
}

#[tauri::command]
fn get_install_source() -> &'static str {
    // FIX Phoenix #9: detect install source instead of hardcoding "direct"
    // Store-managed installs should disable auto-updates
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

pub fn run() {
    tauri::Builder::default()
        .manage(RuntimeState {
            watcher: Mutex::new(None),
            spellcheck_enabled: Mutex::new(true),
            config_path: Mutex::new(None),
            watcher_event_pending: Mutex::new(false),
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
        ])
        .setup(|app| {
            // FIX Phoenix #7: load spellcheck state from disk on startup
            let config_path = app
                .path()
                .app_config_dir()
                .ok()
                .map(|dir| dir.join(SPELLCHECK_CONFIG_FILE));
            if let Some(ref path) = config_path {
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
                    *path_lock = config_path;
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
