# Alify — Memoria del Proyecto

Reproductor musical **estrictamente local**, gratuito, accesible y ultraligero (<15 MB) para Windows (Tauri v2 + WebView2), con migración futura a Android APK.

## Reglas inmutables
1. **Cero red / cero telemetría.** Sin servidores, anuncios, analytics, "wrapped", actualizaciones automáticas ni fuentes/CDN externos. Prohibido `fetch` a URLs remotas, `tauri-plugin-http`, `updater`, `shell`. El CSP solo permite `self`, `blob:`, `data:` y el protocolo `asset:`.
2. **Ligero.** Sin Electron, sin three.js ni librerías 3D. Solo Web Audio API + CSS3/SVG acelerado por GPU. Perfil release: `opt-level="s"`, LTO, strip.
3. **Todo lo nativo en Rust** (`lofty` metadatos, `window-vibrancy` Acrylic). El frontend no accede al sistema de archivos directamente: usa comandos Tauri.
4. **Preparado para Android**: lógica de la app en `src-tauri/src/lib.rs` (`#[cfg_attr(mobile, tauri::mobile_entry_point)]`); código específico de escritorio (vibrancy, ventana flotante) detrás de `cfg(desktop/windows)` y en el frontend detrás de `isDesktop()`. La UI debe ser responsive y `core/` no depende de Tauri.
5. **Accesibilidad**: botones con `aria-label`, foco visible, atajos de teclado (Espacio = play/pausa), contraste suficiente en todos los temas.
6. **Temas** = carpeta `src/themes/<id>/design.md` (YAML frontmatter + CSS en bloque ```css) + `assets/`. Nunca estilos específicos de tema en componentes.

## Estructura
- `src/core/audioEngine.ts` motor doble deck, MIX crossfade lineal, True Shuffle (Fisher-Yates sin repeticiones).
- `src/core/lyricsParser.ts` LRC / letras ID3. `src/core/importer.ts` importador My Tune Music + M3U con fuzzy matching.
- `src/core/bridge.ts` sincronización ventana principal ↔ flotante (eventos Tauri).
- `src/theme-engine/themeLoader.ts` parser `design.md` e inyección.
- `src-tauri/` backend Rust.

## Comandos
- Windows requiere Rust (MSVC) + *Visual Studio Build Tools (Desktop C++)* + WebView2.
- `npm install` · `npm run typecheck` · `npm run tauri dev` · `npm run tauri build`
