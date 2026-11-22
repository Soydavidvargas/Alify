use std::{env, fs, path::PathBuf};

fn main() {
    // Ofusca el script del migrador en tiempo de compilación para que no quede en texto plano en el binario
    println!("cargo:rerun-if-changed=src/extractor.js");
    if let Ok(js) = fs::read("src/extractor.js") {
        let key: [u8; 16] = [
            0x4A, 0x9F, 0x2C, 0xE1, 0x73, 0xB8, 0x15, 0xD4,
            0x6E, 0x09, 0xA7, 0x3B, 0xF2, 0x58, 0xC6, 0x81,
        ];
        let enc: Vec<u8> = js
            .iter()
            .enumerate()
            .map(|(i, b)| b ^ key[i % key.len()] ^ ((i as u8).wrapping_mul(31)))
            .collect();
        let out_dir = PathBuf::from(env::var("OUT_DIR").unwrap());
        let _ = fs::write(out_dir.join("extractor.bin"), enc);
    }

    #[cfg(target_os = "macos")]
    if env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("ios") {
        link_ios_audio();
    }

    tauri_build::build()
}

#[cfg(target_os = "macos")]
fn link_ios_audio() {
    use std::{io, path::Path};

    fn copy_swift_api(source: &Path, target: &Path) -> io::Result<()> {
        fs::create_dir_all(target)?;
        for entry in fs::read_dir(source)? {
            let entry = entry?;
            let name = entry.file_name();
            if matches!(name.to_str(), Some(".build" | "Package.resolved" | "Tests")) {
                continue;
            }
            let destination = target.join(name);
            if entry.file_type()?.is_dir() {
                copy_swift_api(&entry.path(), &destination)?;
            } else {
                fs::copy(entry.path(), destination)?;
            }
        }
        Ok(())
    }

    println!("cargo:rerun-if-changed=ios/Package.swift");
    println!("cargo:rerun-if-changed=ios/Sources");
    println!("cargo:rerun-if-env-changed=DEP_TAURI_IOS_LIBRARY_PATH");
    let source = PathBuf::from(env::var_os("DEP_TAURI_IOS_LIBRARY_PATH").expect("Tauri iOS Swift API"));
    copy_swift_api(&source, Path::new(".tauri/tauri-api")).expect("copy Tauri iOS Swift API");
    tauri_utils::build::link_apple_library("alify", "ios");
}
