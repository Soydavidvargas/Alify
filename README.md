# Alify

Reproductor musical **100 % local**, gratuito, accesible y ultraligero para Windows. Sin servidores, anuncios, telemetría ni estadísticas. 20 temas (`design.md`), modo MIX con crossfade, True Shuffle, letras `.lrc` y ventana flotante.

## Instalación (una línea, sin administrador)

> Reemplaza `TU_USUARIO/alify` por el repositorio real.

**PowerShell**
```powershell
irm https://raw.githubusercontent.com/VerVo-Lab/Alify/main/scripts/install.ps1 | iex
```

**CMD**
```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/VerVo-Lab/Alify/main/scripts/install.ps1 | iex"
```

El script descarga el último release en `%LOCALAPPDATA%\Alify`, crea accesos directos (Escritorio y Menú Inicio), agrega `alify` al `PATH` del usuario y abre la app. Para otro repositorio: `$env:ALIFY_REPO="usuario/repo"` antes del comando.

También puedes bajar `Alify-Setup.exe` (instalador por usuario) o `Alify-Portable.exe` desde *Releases*.

## Datos del usuario
Todo se guarda en `%LOCALAPPDATA%\Alify` (playlists, favoritos, temas personalizados y caché de WebView2 en `Alify\webview`). No se escribe fuera de tu perfil.

## Desarrollo
Requisitos: Node 20+, Rust (MSVC), **Visual Studio Build Tools con "Desktop development with C++"** y WebView2.
```
npm install
npm run typecheck
npm run tauri dev
npm run tauri build
```

## Publicar un release
```
git tag v1.0.0 && git push origin v1.0.0
```
GitHub Actions (`.github/workflows/release-windows.yml`) compila y publica `Alify-Setup.exe` y `Alify-Portable.exe`.

## Fase 2: Android
`src/utils/platform.ts` detecta la plataforma y marca `<html data-os data-form>`. En móvil la sidebar pasa a barra inferior táctil y la ventana flotante se reemplaza por un Mini-Player arrastrable dentro de la app. Siguiente paso: `npm run tauri android init` (requiere Android SDK/NDK).
