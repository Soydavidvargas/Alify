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

    tauri_build::build()
}
