use epub::doc::EpubDoc;
use walkdir::WalkDir;
use base64::prelude::*;

#[derive(serde::Serialize)]
struct Book {
    path: String,
    title: String,
    author: String,
    cover_base64: Option<String>,
}

#[tauri::command]
fn scan_books(paths: Vec<String>) -> Vec<Book> {
    let mut books = Vec::new();

    for path in paths {
        for entry in WalkDir::new(&path).into_iter().filter_map(|e| e.ok()) {
            if entry.path().extension().map_or(false, |ext| ext.eq_ignore_ascii_case("epub")) {
                let file_path = entry.path().to_string_lossy().to_string();
                
                // Try to parse EPUB
                // use quiet matching to avoid panic if file is corrupted
                if let Ok(mut doc) = EpubDoc::new(entry.path()) {
                    let title = doc.mdata("title")
                        .map(|s| s.value.clone())
                        .unwrap_or_else(|| "Unknown Title".to_string());
                    let author = doc.mdata("creator")
                        .map(|s| s.value.clone())
                        .unwrap_or_else(|| "Unknown Author".to_string());
                    
                    let cover_base64 = doc.get_cover().map(|(data, mime)| {
                        format!("data:{};base64,{}", mime, BASE64_STANDARD.encode(data))
                    });

                    books.push(Book {
                        path: file_path,
                        title,
                        author,
                        cover_base64,
                    });
                }
            }
        }
    }
    books
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, scan_books])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
