use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
struct AssetItem {
    name: String,
    path: String,
    url: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AssetSnapshot {
    music: Vec<AssetItem>,
    overlays: Vec<AssetItem>,
    #[serde(rename = "endVideos")]
    end_videos: Vec<AssetItem>,
    #[serde(rename = "titleCards")]
    title_cards: Vec<AssetItem>,
}

fn app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|error| format!("Could not resolve app data dir: {error}"))
}

fn repo_root(app: &AppHandle) -> Result<PathBuf, String> {
    if cfg!(debug_assertions) {
        std::env::current_dir().map_err(|error| format!("Could not resolve current dir: {error}"))
    } else {
        app.path()
            .resource_dir()
            .map_err(|error| format!("Could not resolve resource dir: {error}"))
    }
}

fn ensure_dir(path: &Path) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|error| format!("Could not create {}: {error}", path.display()))
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_data_dir(app)?.join("settings.json"))
}

fn file_url(path: &Path) -> String {
    let normalized = path.to_string_lossy().replace('\\', "/");
    format!("file:///{}", normalized.trim_start_matches('/'))
}

fn list_files(dir: &Path) -> Vec<AssetItem> {
    let mut items = fs::read_dir(dir)
        .ok()
        .into_iter()
        .flat_map(|entries| entries.filter_map(Result::ok))
        .filter_map(|entry| {
            let path = entry.path();
            if !path.is_file() {
                return None;
            }
            let name = path.file_name()?.to_string_lossy().to_string();
            Some(AssetItem {
                name,
                path: path.to_string_lossy().to_string(),
                url: file_url(&path),
            })
        })
        .collect::<Vec<_>>();
    items.sort_by(|left, right| left.name.cmp(&right.name));
    items
}

fn ensure_asset_dirs(root: &Path) -> Result<(), String> {
    for dir in [
        "assets/music",
        "assets/overlays",
        "assets/end-videos",
        "assets/fonts",
        "assets/title-cards",
        "assets/generated/images",
        "assets/generated/videos",
        "assets/generated/voiceovers",
        "assets/exports",
        "projects",
    ] {
        ensure_dir(&root.join(dir))?;
    }
    Ok(())
}

#[tauri::command]
fn bootstrap(app: AppHandle) -> Result<Value, String> {
    let root = repo_root(&app)?;
    ensure_asset_dirs(&root)?;
    let data_dir = app_data_dir(&app)?;
    ensure_dir(&data_dir)?;

    Ok(json!({
        "repoRoot": root.to_string_lossy(),
        "appDataDir": data_dir.to_string_lossy(),
        "assets": list_assets(app)?,
    }))
}

#[tauri::command]
fn get_settings(app: AppHandle) -> Result<Value, String> {
    let path = settings_path(&app)?;
    if !path.exists() {
        return Ok(json!({}));
    }
    let raw = fs::read_to_string(&path).map_err(|error| format!("Could not read settings: {error}"))?;
    serde_json::from_str(&raw).map_err(|error| format!("Settings JSON is invalid: {error}"))
}

#[tauri::command]
fn save_settings(app: AppHandle, settings: Value) -> Result<Value, String> {
    let path = settings_path(&app)?;
    if let Some(parent) = path.parent() {
        ensure_dir(parent)?;
    }
    fs::write(&path, serde_json::to_string_pretty(&settings).map_err(|error| error.to_string())?)
        .map_err(|error| format!("Could not save settings: {error}"))?;
    Ok(json!({ "success": true, "path": path.to_string_lossy() }))
}

#[tauri::command]
fn list_assets(app: AppHandle) -> Result<AssetSnapshot, String> {
    let root = repo_root(&app)?;
    ensure_asset_dirs(&root)?;
    let assets = root.join("assets");
    Ok(AssetSnapshot {
        music: list_files(&assets.join("music")),
        overlays: list_files(&assets.join("overlays")),
        end_videos: list_files(&assets.join("end-videos")),
        title_cards: list_files(&assets.join("title-cards")),
    })
}

#[tauri::command]
fn save_project(app: AppHandle, project: Value) -> Result<Value, String> {
    let root = repo_root(&app)?;
    ensure_asset_dirs(&root)?;
    let title = project
        .get("title")
        .and_then(Value::as_str)
        .unwrap_or("untitled")
        .chars()
        .filter(|ch| !r#"<>:"/\|?*"#.contains(*ch))
        .collect::<String>();
    let safe_title = if title.trim().is_empty() { "untitled" } else { title.trim() };
    let path = root.join("projects").join(format!("{safe_title}.ypromo"));
    fs::write(&path, serde_json::to_string_pretty(&project).map_err(|error| error.to_string())?)
        .map_err(|error| format!("Could not save project: {error}"))?;
    Ok(json!({ "success": true, "path": path.to_string_lossy() }))
}

#[tauri::command]
fn load_project(path: String) -> Result<Value, String> {
    let raw = fs::read_to_string(&path).map_err(|error| format!("Could not read project: {error}"))?;
    serde_json::from_str(&raw).map_err(|error| format!("Project JSON is invalid: {error}"))
}

#[tauri::command]
fn open_exports_folder(app: AppHandle) -> Result<(), String> {
    let root = repo_root(&app)?;
    let exports = root.join("assets").join("exports");
    ensure_dir(&exports)?;
    tauri_plugin_opener::open_path(exports.to_string_lossy().to_string(), None::<String>)
        .map_err(|error| format!("Could not open exports folder: {error}"))
}

#[tauri::command]
fn export_draft_plan(app: AppHandle, timeline: Value) -> Result<Value, String> {
    let root = repo_root(&app)?;
    let exports = root.join("assets").join("exports");
    ensure_dir(&exports)?;
    let stamp = chrono::Utc::now().format("%Y%m%d-%H%M%S");
    let path = exports.join(format!("draft-timeline-{stamp}.json"));
    fs::write(&path, serde_json::to_string_pretty(&timeline).map_err(|error| error.to_string())?)
        .map_err(|error| format!("Could not write draft timeline: {error}"))?;
    Ok(json!({ "success": true, "path": path.to_string_lossy() }))
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            bootstrap,
            get_settings,
            save_settings,
            list_assets,
            save_project,
            load_project,
            open_exports_folder,
            export_draft_plan
        ])
        .run(tauri::generate_context!())
        .expect("error while running YPROMO");
}
