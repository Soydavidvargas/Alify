---
id: retro-videojuego
name: Retro Videojuego
description: Bordes pixelados, carcasa gris de consola portátil, cruceta para cambiar de pista, pantalla LCD verde y teclas de acción.
relief: 2d
preview: ["#31324e", "#77edce", "#ffbc60"]
colors:
  bg: "#31324e"
  panel: "rgba(15, 56, 15, 0.40)"
  panelStrong: "#31324e"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#77edce"
  accent2: "#ffbc60"
  line: "rgba(155, 188, 15, 0.55)"
  playBg: "#77edce"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.63"
  wallpaperRatio: "1.50059"
  transportLayout: handheld
  screen: "#b4bd83"
  phosphor: "#20281d"
  keyRadius: "2px"
  font: "Consolas, monospace"
  radius: "0px"
floating:
  instrument: retro-videojuego
  width: 400
  height: 156
  shell: assets/console.svg
---

# Retro Videojuego

Pixel-art, bordes escalonados (`box-shadow`), cruceta D-pad y botones A/B circulares en relieve.

```css
* { image-rendering: pixelated; }
.app-shell {
  border-radius: 0;
  border: 4px solid #1b1b2b;
  box-shadow: inset 0 0 0 4px #c4c2c0, inset 0 0 0 8px #5a5f8c;
}
.sidebar, .panel {
  border: 3px solid #0f380f;
  border-radius: 0;
  box-shadow: 4px 0 0 #0f380f, -4px 0 0 #0f380f, 0 4px 0 #0f380f, 0 -4px 0 #0f380f;
}
.btn-play { background: #a8123c; border: 3px solid #1b1b2b; border-radius: 50%; box-shadow: inset -2px -3px 0 rgba(0,0,0,.35), 3px 3px 0 #1b1b2b; color:#fff; }
.pb-prev, .pb-next { background: #2b2b3a; color: #fff !important; border-radius: 2px !important; border: 2px solid #0f380f; box-shadow: 2px 2px 0 #0f380f; }
.btn-primary { background: #8bac0f; color: #0f380f; border: 3px solid #0f380f; border-radius: 0; box-shadow: 3px 3px 0 #0f380f; text-transform: uppercase; }
.progress-track, .progress-fill { border-radius: 0 !important; }
.progress-fill { background: repeating-linear-gradient(90deg,#9bbc0f 0 6px,#8bac0f 6px 8px); }
.eq i { background: #9bbc0f; border-radius: 0; }
.row-active { background: #0f380f; }

/* Flotante: consola portátil */
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; flex-direction: column; align-items: stretch; padding: 40px 52px 28px; gap: 0; color: #0f380f; }
.fl-top { top: 12px; left: 50%; right: auto; transform: translateX(-50%); }
.fl-brand { display: none; }
.fl-win button { color: #c4c2c0; }
.fl-screen { height: 150px; flex: 0 0 auto; background: #9bbc0f; border: 4px solid #0f380f; padding: 8px; align-items: flex-start; color: #0f380f; }
.fl-screen .fl-cover { width: 56px; height: 56px; border-radius: 0; border: 2px solid #0f380f; filter: grayscale(1) contrast(1.4); }
.fl-title { font-weight: 700; white-space: normal; }
.fl-eq, .fl-screen .eq { align-self: flex-end; }
.eq i { background: #0f380f !important; }
.fl-progress { position: static; margin-top: 8px; height: 8px; background: #8bac0f; border: 2px solid #0f380f; border-radius: 0; }
.fl-progress i { background: #0f380f; }
/* controles: D-pad (prev/next) + botón A (play) + B decorativo */
.fl-controls { position: relative; flex: 1; margin-top: 18px; justify-content: space-between; align-items: center; padding: 0 2px; }
.fl-controls button { border-radius: 0; border: 0; box-shadow: none; }
.fl-prev, .fl-next { width: 34px; height: 34px; background: #2b2b3a; color: #fff; position: relative; z-index: 1; }
.fl-prev { margin-right: -34px; border-radius: 4px 0 0 4px; }
.fl-next { margin-left: 0; border-radius: 0 4px 4px 0; margin-right: 0; }
.fl-controls::before { content: ""; position: absolute; left: 34px; top: calc(50% - 34px); width: 34px; height: 68px; background: #2b2b3a; border-radius: 4px; pointer-events: none; }
.fl-random { position: absolute; right: 56px; top: calc(50% + 4px); width: 34px !important; height: 34px !important; border-radius: 50% !important; background: #3b5bdb !important; color: #fff !important; display: grid; place-items: center; box-shadow: inset -2px -2px 0 rgba(0,0,0,.35), 2px 2px 0 #1b1b2b !important; z-index: 2; }
.fl-shuffle { position: absolute; left: 38%; bottom: 4px; width: 46px !important; height: 18px !important; border-radius: 9px !important; background: #5a5f8c !important; color: #fff !important; box-shadow: 1px 1px 0 #1b1b2b !important; z-index: 2; }
.fl-play { position: absolute; right: 8px; top: calc(50% - 30px); width: 40px; height: 40px; border-radius: 50% !important; background: #a8123c; color: #fff; box-shadow: inset -2px -2px 0 rgba(0,0,0,.35), 2px 2px 0 #1b1b2b !important; z-index: 2; }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: repeating-linear-gradient(0deg,transparent 0 4px,#ffffff09 4px 5px), var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: repeating-linear-gradient(0deg,transparent 0 4px,#ffffff09 4px 5px), var(--c-bg);
  box-shadow: inset 0 2px var(--c-line), inset 0 -3px color-mix(in srgb,var(--c-accent) 46%,transparent);
}
.pb-controls {
  padding: 2px 8px;
  border: 1px solid var(--c-line);
  border-radius: var(--v-key-radius,6px);
  background: var(--c-bg);
}
.play-bar .pb-cover:empty {
  background: var(--asset-insignia) center/cover no-repeat !important;
}
.sidebar .nav-item[aria-current="page"] { box-shadow: inset 3px 0 var(--c-accent); }

.play-bar { border-top: 4px ridge var(--c-accent2); }
.pb-controls { border: 2px solid var(--c-accent2); box-shadow: inset -2px -2px #101017,2px 2px #101017; border-radius: 3px; }
.pb-controls .icon-btn { border-radius: 3px; }
.progress-fill { background: repeating-linear-gradient(90deg,var(--c-accent) 0 7px,var(--c-bg) 7px 9px); }
main.panel h1 { font-family: Consolas,monospace; }
```
