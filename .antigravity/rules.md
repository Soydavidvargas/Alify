# Reglas de Alify (inmutables)

- NUNCA añadir red, telemetría, analytics, anuncios, "wrapped", CDN, fuentes remotas ni auto-update.
- Stack fijo: Tauri v2, React 18, TypeScript, TailwindCSS, Rust. Sin Electron ni librerías 3D; efectos 3D solo con CSS3/SVG.
- Peso objetivo del instalador < 15 MB: evitar dependencias pesadas; revisar cada `npm i`/`cargo add`.
- Arquitectura portable a Android APK: lógica en `src-tauri/src/lib.rs`, `src/core` sin dependencias de Tauri, API de escritorio tras `cfg`/`isDesktop()`.
- Temas solo vía `src/themes/<id>/design.md` (+ `assets/`); componentes sin estilos por tema.
- Accesibilidad: aria-label, foco visible, teclado.
- Antes de terminar: `npm run typecheck` y `cargo check` sin errores.
