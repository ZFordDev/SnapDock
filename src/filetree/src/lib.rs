use wasm_bindgen::prelude::*;
use std::fs;

#[wasm_bindgen]
pub fn list_directory(path: &str) -> Vec<JsValue> {
    let mut entries: Vec<JsValue> = Vec::new();

    if let Ok(read_dir) = fs::read_dir(path) {
        for entry_result in read_dir {
            if let Ok(entry) = entry_result {
                let name = entry.file_name()
                                .into_string()
                                .unwrap_or_else(|_| String::from("<invalid utf8>"));
                let is_dir = entry.file_type()
                                  .map(|ft| ft.is_dir())
                                  .unwrap_or(false);

                // Build a JS object { name: "...", isDir: true/false }
                let obj = js_sys::Object::new();
                let _ = js_sys::Reflect::set(&obj, &JsValue::from_str("name"), &JsValue::from_str(&name));
                let _ = js_sys::Reflect::set(&obj, &JsValue::from_str("isDir"), &JsValue::from_bool(is_dir));

                entries.push(obj.into());
            }
        }
    }

    entries
}