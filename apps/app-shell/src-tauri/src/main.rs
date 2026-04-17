#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Write;

fn audit_log_path() -> Result<std::path::PathBuf, String> {
    let dirs = directories::ProjectDirs::from("com", "the-damn-life", "desktop").ok_or_else(
        || "could not resolve application data directory".to_string(),
    )?;
    Ok(dirs.data_dir().join("host-audit.ndjson"))
}

#[tauri::command]
fn append_host_audit_line(line: String) -> Result<(), String> {
    let path = audit_log_path()?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| e.to_string())?;
    writeln!(file, "{line}").map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![append_host_audit_line])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
