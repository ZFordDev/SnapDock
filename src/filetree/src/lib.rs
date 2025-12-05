use std::fs;

pub fn list_directory(path: &str) -> Vec<String> {
    let mut entries = Vec::new();
    if let Ok(read_dir) = fs::read_dir(path) {
        for entry in read_dir.flatten() {
            if let Ok(name) = entry.file_name().into_string() {
                entries.push(name);
            }
        }
    }
    entries
}