---
id: zombie
name: Zombie Biohazard
description: Verde ácido radioactivo, oliva desgastado y franjas de peligro biológico.
relief: 2d
preview: ["#35402a", "#c3ed82", "#edaa75"]
colors:
  bg: "#35402a"
  panel: "rgba(132, 204, 22, 0.06)"
  panelStrong: "#35402a"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#c3ed82"
  accent2: "#edaa75"
  line: "rgba(132, 204, 22, 0.38)"
  playBg: "#c3ed82"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.63"
  wallpaperRatio: "1.50059"
  screen: "#bcc59b"
  phosphor: "#283320"
  keyRadius: "2px"
  font: "'Arial Narrow', sans-serif"
  radius: "4px"
floating:
  instrument: zombie
  width: 400
  height: 156
  shell: assets/biohazard.svg
---

# Zombie Biohazard

```css
.app-shell { border: 2px solid #84cc16; box-shadow: inset 0 0 30px rgba(132,204,22,.18); }
.play-bar::before { content: ""; position: absolute; left: 0; right: 0; top: -6px; height: 6px; background: repeating-linear-gradient(-45deg, #84cc16 0 10px, #151b11 10px 20px); }
.btn-primary { background: #84cc16; color: #11170d; border: 2px solid #eab308; }
.progress-fill { background: repeating-linear-gradient(90deg, #84cc16 0 10px, #eab308 10px 14px); }
.eq i { background: #84cc16; }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 22px 30px; }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: repeating-linear-gradient(128deg,transparent 0 9px,#ffffff09 9px 11px), var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: repeating-linear-gradient(128deg,transparent 0 9px,#ffffff09 9px 11px), var(--c-bg);
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
