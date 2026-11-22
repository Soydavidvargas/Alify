<p align="center">
  <img src="public/alify-icon.png" width="96" alt="Icono de Alify">
</p>

<h1 align="center">Alify</h1>

<p align="center">Tu colección de música en un reproductor gratuito para Windows y Android.</p>

## 🖥️ Descargar para Windows

- [⬇️ Windows de 64 bits (x64) · 7,3 MB](https://github.com/VerVo-Lab/Alify/blob/main/downloads/Alify-Setup.exe?raw=true)
- [⬇️ Windows de 32 bits (x86) · 7,1 MB](https://github.com/VerVo-Lab/Alify/blob/main/downloads/Alify-Setup-x86.exe?raw=true)

## 📱 Descargar para Android

[⬇️ Alify para Android · APK 0.1.13](https://github.com/VerVo-Lab/Alify/raw/refs/heads/main/downloads/Alify-Android-0.1.13.apk)

## 📱 Alify para Android

Abre [Alify para Android 0.1.13](https://github.com/VerVo-Lab/Alify/raw/refs/heads/main/downloads/Alify-Android-0.1.13.apk) y pulsa **Instalar**. El APK requiere Android 7.0 o posterior (API 24), un dispositivo ARM de 32 o 64 bits o x86-64 y espacio para el APK de aproximadamente 61 MB, la aplicación instalada y tu música. Para encontrar tus audios, concede el permiso de música y audio. Internet es necesario para migraciones y búsquedas de portada o letra.

🔐 **Privacidad y seguridad.** Tu música, tus preferencias y tus estadísticas de escucha se guardan en el dispositivo. Al usar migraciones o búsquedas en Internet, Alify se conecta a los servicios necesarios para obtener música, portadas y letras. El código está disponible en este repositorio para su revisión.

Android puede mostrar una advertencia al instalar un APK fuera de Google Play. Windows SmartScreen también puede advertir sobre un instalador de un editor no reconocido. Estas advertencias dependen de la firma y la reputación del archivo. Descarga Alify desde este repositorio y verifica el archivo antes de instalarlo. El APK se firma con una clave local de desarrollo y no cuenta con una certificación independiente de ausencia de malware.

**SHA-256 del APK 0.1.13**  
`AC18E28AD59AC36B06B5933C1F00CEA080B268256ACBC94ADD4F5DE525244F19`

- **Audios del dispositivo.** Al abrir Alify, concede el permiso de música y audio. En **Playlist** verás los archivos que Android ha indexado en el almacenamiento compartido y en las tarjetas montadas. Pulsa **Volver a buscar** después de copiar música nueva.
- **Mi biblioteca.** Toca el corazón de una canción para guardarla. El interruptor de la playlist te permite incluir todos los audios encontrados en la **Reproducción global**. Empieza desactivado.
- **Migrar sin conexión.** En **Migrar** puedes volver a escanear el teléfono, seleccionar una carpeta de audios o importar un archivo de audio o playlist M3U, M3U8, CSV o TXT. Alify conserva el orden de las pistas que puede reproducir.
- **Migrar por Internet.** Pega un enlace HTTPS a un audio, una lista pública o un álbum de Internet Archive, o escribe «Artista - Canción». Alify guarda audios completos en **Música/Alify**, los añade a **Mi biblioteca** y busca portadas y letras cuando existen. Las pistas sin una grabación descargable pueden completarse con un enlace directo.
- **Spotify, YouTube Music y otros reproductores.** Usa **Compartir → Alify** en una canción o playlist. Alify abre **Migrar** y empieza a buscar el audio. Guarda solo las pistas que ya puede reproducir y busca sus letras y portadas cuando están disponibles. La cobertura depende de las fuentes de audio que permitan descargar la grabación completa.
- **Transferir una lista completa desde Windows.** Abre la lista en Alify para Windows, espera a que las pistas que quieras copiar se hayan descargado y pulsa **Exportar para Android**. Copia la carpeta generada al teléfono y selecciónala en **Migrar → Elegir carpeta de audios**. La transferencia conserva el orden, los archivos de audio originales, las portadas incrustadas y las letras que Alify ya tiene.
- **Perfil.** Toca el nombre junto al encabezado para cambiar el nombre y la foto. **Eliminar todas las canciones** solicita confirmación antes de borrar archivos de audio detectados en el dispositivo.
- **Widget.** Toca **Widget** para añadir el minirreproductor a la pantalla de inicio. Lleva la carcasa 2D del tema de Windows y controla la misma reproducción que la app.
- **Playlists y Wrapped.** En **Playlists** encontrarás favoritos, audios del dispositivo e importaciones. Abre **Wrapped** desde la biblioteca para ver tu tiempo de escucha y tus cinco canciones más escuchadas. Puedes guardar una tarjeta PNG con el diseño activo.
- **Letra.** Encuentra la portada encima de la letra. Alify lee letras incrustadas y los tiempos LRC siguen la posición de la canción. En pantalla completa, toca la letra para mostrar los controles y salir.

Para compilar el APK en Windows, instala JDK 17, el SDK Android 36, Build Tools 36, NDK r27c y los destinos Rust `aarch64-linux-android`, `armv7-linux-androideabi` y `x86_64-linux-android`. Configura `JAVA_HOME` y ejecuta `npm ci` y `.\scripts\build-android.ps1`. El script guarda el APK en `downloads` y verifica su firma. Por defecto usa la clave local de pruebas de Android. Para firmar con tu propia clave, pasa `-Keystore` y `-KeyAlias`.

## 🖥️ Instala Alify en Windows

1. Abre el instalador que descargaste y sigue el asistente.
2. Deja marcada la opción **Crear acceso directo en el escritorio** y pulsa **Finalizar**.
3. Abre **Alify** desde el escritorio o el menú Inicio.

> Si falta Microsoft Edge WebView2, el instalador lo descarga. Si GitHub te pide iniciar sesión para descargar Alify, usa una cuenta con acceso al repositorio.

## 🎵 Añade tu música

Ve a **Configuración → Elegir carpeta de música** y selecciona la carpeta que contiene tus canciones. Alify leerá los títulos, artistas y portadas que estén guardados en los archivos.

- 🔀 **Reproducción.** Organiza tus listas, consulta la cola y activa el orden aleatorio. Usa **Espacio** para pausar o reanudar.
- 🎤 **Letras sincronizadas.** Abre **Letras** desde el reproductor. Alify sigue las marcas LRC y busca una posible entrada de voz para ajustar el comienzo.
- 🎛️ **Minirreproductor.** Abre la ventana flotante desde la barra, ajusta su tamaño o acóplala arriba. Pulsa **Expandir** para recuperar su tamaño y posición.
- 📊 **Wrapped.** Consulta tu tiempo de escucha y tus canciones más reproducidas. Puedes descargar el resumen como PNG con el fondo del tema activo.

La música local se reproduce sin conexión. Las búsquedas en servicios externos requieren Internet. Tu biblioteca y tus preferencias se guardan en tu perfil de Windows.

## 🎨 Elige un diseño

Aplica un tema en **Temas y diseños**. Cada uno cambia la apariencia de la aplicación y de su minirreproductor.

| Frutiger Aero | Metalcore Gótico | Retro Videojuego |
| :---: | :---: | :---: |
| <img src="src/themes/frutiger-aero/assets/wallpaper.webp" width="240" alt="Praderas verdes y burbujas sobre un lago azul"> | <img src="src/themes/metalcore-gotico/assets/wallpaper.webp" width="240" alt="Escenario gótico con rosas rojas y alas de metal"> | <img src="src/themes/retro-videojuego/assets/wallpaper.webp" width="240" alt="Paisaje pixelado con una consola portátil al atardecer"> |
| <img src="src/themes/frutiger-aero/assets/instrument.svg" width="200" alt="Carcasa Frutiger Aero del minirreproductor"> | <img src="src/themes/metalcore-gotico/assets/instrument.svg" width="200" alt="Carcasa Metalcore Gótico del minirreproductor"> | <img src="src/themes/retro-videojuego/assets/instrument.svg" width="200" alt="Carcasa Retro Videojuego del minirreproductor"> |

## 🧰 Desarrollo y publicación

<details>
<summary>Compilar el instalador desde el código</summary>

En Windows x64 instala Node.js 20 o posterior con npm, Rust con MSVC, Visual Studio Build Tools con **Desarrollo para el escritorio con C++** y WebView2. Desde la raíz del repositorio ejecuta:

```powershell
npm ci
npm run tauri build
```

- **Ejecutable** — `src-tauri/target/release/alify.exe`
- **Instalador NSIS** — `src-tauri/target/release/bundle/nsis/*-setup.exe`
- **Modo desarrollo** — `npm run tauri dev`

Al subir una etiqueta `v*`, el [flujo de publicación](.github/workflows/release-windows.yml) compila y adjunta el instalador, la versión portátil y sus sumas SHA-256. Para actualizar la descarga directa del README, reemplaza también `downloads/Alify-Setup.exe`.

</details>

Para desinstalar, busca **Alify** en **Configuración → Aplicaciones → Aplicaciones instaladas** de Windows.
