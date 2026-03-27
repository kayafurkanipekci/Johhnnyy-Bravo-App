use tauri::Manager;
use std::path::PathBuf;
use std::fs;

#[tauri::command]
fn get_sidecar_path(app: tauri::AppHandle, name: &str) -> Result<String, String> {
    // Resolve the absolute path of a sidecar binary.
    // In dev mode: src-tauri/binaries/<name>-<target_triple>.exe
    // In production: <resource_dir>/<name>-<target_triple>.exe
    let ext = if cfg!(windows) { ".exe" } else { "" };
    let target_triple = if cfg!(all(target_arch = "x86_64", target_os = "windows")) {
        "x86_64-pc-windows-msvc"
    } else if cfg!(all(target_arch = "aarch64", target_os = "macos")) {
        "aarch64-apple-darwin"
    } else if cfg!(all(target_arch = "x86_64", target_os = "macos")) {
        "x86_64-apple-darwin"
    } else if cfg!(all(target_arch = "x86_64", target_os = "linux")) {
        "x86_64-unknown-linux-gnu"
    } else {
        "unknown"
    };

    // Build the expected sidecar filename
    let sidecar_filename = format!("{}-{}{}", name.replace("binaries/", ""), target_triple, ext);

    // In dev mode, check relative to the src-tauri directory
    let dev_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("binaries").join(&sidecar_filename);
    if dev_path.exists() {
        return Ok(dev_path.to_string_lossy().to_string());
    }

    // In production, check resource directory
    if let Ok(resource_dir) = app.path().resource_dir() {
        let prod_path = resource_dir.join(&sidecar_filename);
        if prod_path.exists() {
            return Ok(prod_path.to_string_lossy().to_string());
        }
        // Also check without the binaries prefix
        let plain_name = format!("{}{}", name.replace("binaries/", ""), ext);
        let prod_path2 = resource_dir.join(&plain_name);
        if prod_path2.exists() {
            return Ok(prod_path2.to_string_lossy().to_string());
        }
    }

    Err(format!("Sidecar binary '{}' not found (looked for {})", name, sidecar_filename))
}

#[tauri::command]
fn get_appdata_binary_path(app: tauri::AppHandle, binary_name: &str) -> Result<String, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let bin_dir = app_data.join("binaries");
    fs::create_dir_all(&bin_dir).map_err(|e| e.to_string())?;

    let ext = if cfg!(windows) { ".exe" } else { "" };
    let path = bin_dir.join(format!("{}{}", binary_name, ext));
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn ensure_ytdlp_in_appdata(app: tauri::AppHandle) -> Result<String, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let bin_dir = app_data.join("binaries");
    fs::create_dir_all(&bin_dir).map_err(|e| e.to_string())?;

    let ext = if cfg!(windows) { ".exe" } else { "" };
    let dest = bin_dir.join(format!("yt-dlp{}", ext));

    if dest.exists() {
        return Ok(dest.to_string_lossy().to_string());
    }

    let target_triple = if cfg!(all(target_arch = "x86_64", target_os = "windows")) {
        "x86_64-pc-windows-msvc"
    } else if cfg!(all(target_arch = "aarch64", target_os = "macos")) {
        "aarch64-apple-darwin"
    } else if cfg!(all(target_arch = "x86_64", target_os = "macos")) {
        "x86_64-apple-darwin"
    } else if cfg!(all(target_arch = "x86_64", target_os = "linux")) {
        "x86_64-unknown-linux-gnu"
    } else {
        "unknown"
    };

    let mut source_opt = None;
    
    // Check Dev Mode path
    let sidecar_filename = format!("yt-dlp-{}{}", target_triple, ext);
    let dev_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("binaries").join(&sidecar_filename);
    if dev_path.exists() {
        source_opt = Some(dev_path);
    } else {
        // Check Prod Mode path
        if let Ok(resource_dir) = app.path().resource_dir() {
            let plain_name = format!("yt-dlp{}", ext);
            source_opt = find_sidecar(&resource_dir, &plain_name);
        }
    }

    let source = source_opt.ok_or_else(|| "Bundled yt-dlp not found.".to_string())?;

    fs::copy(&source, &dest).map_err(|e| format!("Failed to copy yt-dlp: {}", e))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&dest).map_err(|e| e.to_string())?.permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&dest, perms).map_err(|e| e.to_string())?;
    }

    Ok(dest.to_string_lossy().to_string())
}

fn find_sidecar(resource_dir: &PathBuf, name: &str) -> Option<PathBuf> {
    // Check direct path first
    let direct = resource_dir.join(name);
    if direct.exists() {
        return Some(direct);
    }
    // Check in binaries subdirectory
    let in_binaries = resource_dir.join("binaries").join(name);
    if in_binaries.exists() {
        return Some(in_binaries);
    }
    // Search recursively
    if let Ok(entries) = fs::read_dir(resource_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_name() {
                    if file_name.to_string_lossy().contains("yt-dlp") {
                        return Some(path);
                    }
                }
            }
        }
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_sidecar_path,
            get_appdata_binary_path,
            ensure_ytdlp_in_appdata
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
