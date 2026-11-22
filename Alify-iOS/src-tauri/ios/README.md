# Alify para iPhone

La versión para iOS 17 o posterior usa la misma interfaz móvil y los temas de Android. Importa archivos desde **Archivos → En mi iPhone** con el botón **Migrar**. Alify guarda una copia en su propia biblioteca y conserva los originales. Para trasladar una playlist de Alify para Windows, elige la carpeta que contiene `alify-transfer.json`. También puedes importar un audio o una lista de texto, o añadir un archivo LRC en **Letra**.

La pantalla de inicio admite el widget mediano de Alify. Mantén pulsado el fondo, toca **Editar → Añadir widget** y busca **Alify**. La reproducción también usa los controles de la pantalla bloqueada. Esta versión usa archivos locales y deja fuera los proveedores en línea, el ecualizador y Wrapped de la versión Android.

## Compilar en macOS

Instala Xcode con su SDK y simulador de iOS, XcodeGen, Node.js 22 o posterior y Rust. Abre la carpeta del proyecto existente de Alify en el Mac. La raíz contiene `package.json`, `mobile.html` y `src-tauri`.

```sh
npm ci
rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
npm run ios:prepare
npm run tauri -- ios build --open
```

`npm run ios:prepare` genera el proyecto de Xcode y añade el widget, el modo de audio en segundo plano y el App Group. En Xcode, selecciona el esquema de Alify y un simulador de iPhone para la primera prueba. Para instalar en un iPhone, configura el mismo equipo de firma para la app y la extensión y habilita `group.app.alify.player` en ambos identificadores de tu equipo de Apple. También puedes exportar el identificador del equipo como `APPLE_DEVELOPMENT_TEAM` antes de generar el proyecto.

Prueba la importación, la posición y la cola, la reproducción con la pantalla bloqueada y los tres botones del widget. Cambia a **Punk Zine** y comprueba que el widget actualiza su tema y conserva centrados el título y los controles.
