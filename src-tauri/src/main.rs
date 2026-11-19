// Punto de entrada de escritorio. Toda la lógica vive en lib.rs para poder
// reutilizarla en el futuro build de Android (mobile_entry_point).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    alify_lib::run()
}
