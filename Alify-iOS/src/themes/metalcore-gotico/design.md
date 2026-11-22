---
id: metalcore-gotico
name: Metalcore Gótico
description: Acero oscuro con púas SVG (spiked-border), ecualizador rojo sangre y flotante con alas de murciélago.
relief: 3d
preview: ["#38232c", "#ff7286", "#d1c2c7"]
colors:
  bg: "#38232c"
  panel: "rgba(255, 255, 255, 0.04)"
  panelStrong: "#38232c"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#ff7286"
  accent2: "#d1c2c7"
  line: "rgba(170, 176, 184, 0.35)"
  playBg: "#ff7286"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.64"
  wallpaperRatio: "1.50059"
  screen: "#24191d"
  phosphor: "#ffe2da"
  keyRadius: "1px"
  font: "Georgia, serif"
  radius: "2px"
floating:
  instrument: metalcore-gotico
  width: 400
  height: 156
  shell: assets/bat-wings.svg
---

# Metalcore Gótico

Marcos metálicos con púas (`assets/spiked-border.svg`), barra de progreso estilo ecualizador rojo sangre y flotante con alas de murciélago.

```css
.app-shell {
  border-radius: 2px;
  border: 2px solid #8a9099;
  box-shadow: inset 0 0 0 1px #000, inset 0 0 0 4px rgba(193,18,31,.38), 0 0 30px rgba(0,0,0,.85);
  background: radial-gradient(ellipse at 50% 0%, rgba(193,18,31,.18), transparent 55%), var(--c-bg);
}
.sidebar, .panel { border: 1px solid #5c6169; border-radius: 2px; position: relative; }
.sidebar::after {
  content: "";
  position: absolute;
  top: 0; left: 100%; width: 100%; height: 8px; pointer-events: none;
  background: var(--asset-spiked-border) repeat-x top / 24px 8px;
  transform: rotate(90deg);
  transform-origin: top left;
}
.play-bar::before {
  content: "";
  position: absolute;
  left: 0; right: 0; top: -10px; height: 10px; pointer-events: none;
  background: var(--asset-spiked-border) repeat-x left bottom / 36px 10px;
}
.btn-play { background: var(--c-play-bg); border: 2px solid #1b1b1f; box-shadow: 0 0 0 2px #aab0b8, 0 0 14px rgba(229,32,46,.65); border-radius: 50%; }
.btn-primary { background: linear-gradient(180deg,#e5202e,#7a0a13); color:#fff; border: 1px solid #aab0b8; border-radius: 2px; text-transform: uppercase; letter-spacing: .08em; font-size: 12px; }
.progress-track { height: 10px; border-radius: 0; background: repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 4px, transparent 4px 6px); }
.progress-fill { border-radius: 0; background: repeating-linear-gradient(90deg,#ff3040 0 4px,#59060d 4px 6px); box-shadow: 0 0 10px #e5202e; }
.eq i { background: linear-gradient(#ff5560,#8f0e19); box-shadow: 0 0 6px #e5202e; }
h1, h2 { text-transform: uppercase; letter-spacing: .06em; }

/* Flotante: alas de murciélago */
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; flex-direction: column; justify-content: center; padding: 34px 140px 28px; gap: 6px; color: #ece7e7; }
.fl-top { top: 34px; right: 50%; transform: translateX(50%); }
.fl-brand { display: none; }
.fl-screen { width: 100%; flex: 0 0 auto; }
.fl-screen .fl-cover { width: 40px; height: 40px; border-radius: 2px; border: 1px solid #aab0b8; }
.fl-title { font-size: 12px; }
.fl-progress { position: static; width: 100%; height: 6px; background: #2a2a30; border-radius: 0; }
.fl-progress i { background: repeating-linear-gradient(90deg,#ff3040 0 4px,#59060d 4px 6px); }
.fl-controls button { background: var(--c-play-bg); color: #12060a; border: 1px solid #1b1b1f; box-shadow: 0 0 0 1px #aab0b8; }
.fl-win button { color: #aab0b8; }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: repeating-linear-gradient(90deg,transparent 0 3px,#ffffff0a 3px 4px), var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: repeating-linear-gradient(90deg,transparent 0 3px,#ffffff0a 3px 4px), var(--c-bg);
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

.titlebar, .play-bar { border-block: 3px double var(--c-accent2); }
.pb-controls { border: 3px double var(--c-accent2); border-radius: 20px 20px 2px 2px; }
main.panel h1 { font-family: Georgia,serif; letter-spacing: .025em; }
.sidebar-extra { border-bottom: 1px solid var(--c-accent2); }
```
