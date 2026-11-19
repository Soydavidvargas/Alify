---
id: y2k
name: Y2K Cromado
description: Verde lima, plateado cromado con biseles 3D, azul eléctrico y disco CD giratorio en reproducción.
relief: 3d
preview: ["#28345a", "#d5ff55", "#87e6ff"]
colors:
  bg: "#28345a"
  panel: "rgba(210, 222, 240, 0.14)"
  panelStrong: "#28345a"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#d5ff55"
  accent2: "#87e6ff"
  line: "rgba(225, 234, 248, 0.42)"
  playBg: "#d5ff55"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.64"
  wallpaperRatio: "1.50059"
  screen: "#cbe788"
  phosphor: "#20342a"
  keyRadius: "18px"
  font: "'Trebuchet MS', sans-serif"
  radius: "22px"
floating:
  instrument: y2k
  width: 400
  height: 156
  shell: assets/cd-player.svg
---

# Y2K

Cromo + lima + azul eléctrico. Disco CD giratorio cuando está reproduciendo y flotante en forma de CD player portátil.

```css
@keyframes y2k-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.app-shell {
  border: 2px solid rgba(232,238,248,.65);
  border-radius: 22px;
  box-shadow: inset 0 2px 0 rgba(255,255,255,.55), inset 0 -2px 0 rgba(0,0,0,.45), inset 0 0 0 2px rgba(47,107,255,.55);
  background: linear-gradient(135deg, rgba(47,107,255,.22), transparent 42%, rgba(182,255,46,.12));
}
.sidebar, .panel {
  border: 1px solid rgba(230,238,248,.45);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 4px 12px rgba(0,0,0,.35);
  background-image: linear-gradient(180deg, rgba(255,255,255,.2), rgba(255,255,255,0) 42%);
}
.pb-cover {
  border-radius: 50% !important;
  border: 2px solid #e6ecf5;
  box-shadow: 0 0 0 2px #2f6bff, 0 0 12px rgba(182,255,46,.45);
  position: relative;
}
.pb-cover::after {
  content: "";
  position: absolute;
  inset: 38%;
  border-radius: 50%;
  background: radial-gradient(circle, #0e1630 42%, #c9d4e4 46%, #fff 100%);
  border: 1px solid #2f6bff;
}
[data-playing="true"] .pb-cover,
[data-playing="true"] .fl-cover {
  animation: y2k-spin 4s linear infinite;
}
.btn-play { background: var(--c-play-bg); border: 2px solid #fff; box-shadow: 0 0 0 2px #2f6bff, 0 4px 10px rgba(0,0,0,.5), inset 0 -3px 6px rgba(0,0,0,.25); }
.pb-prev, .pb-next { background: linear-gradient(180deg,#eef2f8,#99a5b8); color:#101a3a !important; border: 1px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,.4); }
.btn-primary { background: linear-gradient(180deg,#e6ff9a,#b6ff2e 50%,#7fd100); color:#0b1a00; border: 1px solid #fff; border-radius: 999px; box-shadow: 0 0 12px rgba(182,255,46,.55); }
.progress-fill { background: linear-gradient(90deg,#2f6bff,#b6ff2e); box-shadow: 0 0 8px rgba(182,255,46,.65); }
.eq i { background: #b6ff2e; }
.row-active { box-shadow: inset 3px 0 0 #b6ff2e; }

/* Flotante: CD player portátil circular */
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; flex-direction: column; justify-content: center; padding: 34px 58px 30px; gap: 6px; color: #101a3a; }
.fl-top { top: 26px; left: 50%; right: auto; transform: translateX(-50%); }
.fl-brand { display: none; }
.fl-screen { flex: 0 0 auto; width: 100%; background: #b7d97a; border: 2px inset #6b7f3a; border-radius: 6px; padding: 6px; color: #1b2a07; font-family: Consolas, monospace; }
.fl-screen .fl-cover { width: 44px; height: 44px; border-radius: 50%; border: 2px solid #2f6bff; }
.fl-info .fl-artist { color: #3a4c14; }
.fl-progress { position: static; width: 100%; height: 6px; border: 1px solid #1b2a07; background: #dfe8ef; border-radius: 3px; }
.fl-progress i { background: linear-gradient(90deg, #2f6bff, #b6ff2e); }
.fl-controls { gap: 12px; }
.fl-controls button { background: var(--c-play-bg); border: 2px solid #fff; box-shadow: 0 0 0 1px #2f6bff, 0 3px 5px rgba(0,0,0,.4); color: #101a3a; }
.fl-win button { color: #101a3a; }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: radial-gradient(#ffffff15 1px,transparent 1.5px) 0 0/8px 8px, var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: radial-gradient(#ffffff15 1px,transparent 1.5px) 0 0/8px 8px, var(--c-bg);
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

.pb-controls { border-radius: 26px; border-color: var(--c-accent2); box-shadow: inset 0 2px #eaffff88,inset 0 -2px #121f3580; }
.pb-play { box-shadow: inset 0 2px #fff9,0 2px 4px #10263888; }
```
