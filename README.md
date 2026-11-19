# Alify

Alify es un reproductor gratuito para Windows de 64 bits. Elige una carpeta de música de tu equipo, organiza tus listas y reproduce tus archivos desde la biblioteca o desde una ventana flotante.

## Descargar e instalar

**[Descargar Alify-Setup.exe](https://github.com/VerVo-Lab/Alify/blob/main/downloads/Alify-Setup.exe?raw=true)** · [Ver las versiones publicadas](https://github.com/VerVo-Lab/Alify/releases)

El instalador está disponible en el repositorio. Si GitHub te pide iniciar sesión, usa una cuenta con acceso a Alify.

1. Abre **Alify-Setup.exe** y sigue los pasos del asistente. La instalación se realiza para tu usuario de Windows.
2. El asistente comprueba si tienes **Microsoft Edge WebView2**, el componente que Alify usa para mostrar su interfaz. Si falta, necesita conexión a Internet para descargarlo e instalarlo.
3. En la última pantalla, deja marcada la opción de **crear el acceso directo del escritorio** y pulsa **Finalizar**. El icono **Alify** abre el ejecutable instalado. También puedes abrirlo desde Inicio.

El instalador ya incluye la aplicación compilada. Para desinstalarla, busca **Alify** en **Configuración → Aplicaciones → Aplicaciones instaladas** de Windows.

## Escuchar música

- **Biblioteca.** Abre **Configuración → Elegir carpeta de música** y selecciona la carpeta que contiene tus canciones. Alify lee los archivos y sus etiquetas para mostrar títulos, artistas y portadas.
- **Reproducción.** Elige una pista o una lista. La barra inferior permite pausar, cambiar de canción, activar el orden aleatorio, ajustar el volumen y consultar la cola. La barra espaciadora alterna entre reproducción y pausa.
- **Letras.** Abre **Letras** en la barra del reproductor. Las letras con marcas de tiempo LRC siguen la posición del audio. Para afinar el comienzo, la app busca una posible entrada de voz cerca de la primera marca. La precisión depende de la grabación y de sus marcas de tiempo.
- **Temas y minirreproductor.** Aplica un diseño en **Temas y diseños**. Desde la barra de reproducción puedes abrir el flotante, arrastrar sus bordes para cambiar el tamaño o acoplarlo arriba. **Expandir** recupera su posición y tamaño anteriores.
- **Wrapped.** Consulta tu tiempo de escucha y tus canciones más reproducidas. Puedes guardar el resumen como PNG con la ilustración del tema activo.

La reproducción de archivos locales funciona sin conexión. Las funciones opcionales de búsqueda en servicios externos requieren Internet. La biblioteca y las preferencias se guardan en el perfil del usuario.

## Compilar el instalador desde el código

En Windows x64 instala Node.js 20 o posterior con npm, Rust con el toolchain MSVC, Visual Studio Build Tools con la carga **Desarrollo para el escritorio con C++** y WebView2. Desde la raíz del repositorio ejecuta:

```powershell
npm ci
npm run tauri build
```

El ejecutable se genera en `src-tauri/target/release/alify.exe`. El instalador queda en `src-tauri/target/release/bundle/nsis/` con un nombre que incluye la versión y termina en `-setup.exe`. Para trabajar en la interfaz y probar cambios en vivo, usa `npm run tauri dev`.

## Publicar una versión en GitHub

Al subir una etiqueta `v*` al repositorio, [el flujo de publicación](.github/workflows/release-windows.yml) compila en Windows y adjunta **Alify-Setup.exe**, **Alify-Portable.exe** y **SHA256SUMS.txt** a la versión de GitHub. Al actualizar la descarga de este README, reemplaza también `downloads/Alify-Setup.exe` con el instalador de la versión correspondiente.
