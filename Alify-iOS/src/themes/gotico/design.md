---
id: gotico
name: Gótico Catedral
description: Violeta catedralicio, plata antigua y arcos ojivales oscuros.
relief: 3d
preview: ["#322a42", "#d8adf8", "#b8a9d2"]
colors:
  bg: "#322a42"
  panel: "rgba(167, 139, 250, 0.06)"
  panelStrong: "#322a42"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#d8adf8"
  accent2: "#b8a9d2"
  line: "rgba(167, 139, 250, 0.35)"
  playBg: "#d8adf8"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.64"
  wallpaperRatio: "1.50059"
  screen: "#291e30"
  phosphor: "#efdfc3"
  keyRadius: "4px"
  font: "Georgia, serif"
  radius: "8px"
floating:
  instrument: gotico
  width: 400
  height: 156
  shell: assets/arch.svg
---

# Gótico Catedral

```css
.app-shell { border: 2px solid rgba(167,139,250,.48); background: radial-gradient(ellipse at 50% 0%, rgba(124,58,237,.22), transparent 55%), var(--c-bg); }
.sidebar, .panel { border: 1px solid rgba(167,139,250,.28); }
.btn-primary { background: linear-gradient(180deg, #a78bfa, #5b21b6); color: #fff; }
.progress-fill { background: linear-gradient(90deg, #5b21b6, #d8d0e8); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 34px 34px 20px; }

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
