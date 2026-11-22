---
id: deathcore
name: Deathcore
description: Obsidiana brutal, hueso pálido y detalles carmesí con silueta de corona afilada.
relief: 3d
preview: ["#303725", "#c9ec70", "#dbb992"]
colors:
  bg: "#303725"
  panel: "rgba(255, 255, 255, 0.03)"
  panelStrong: "#303725"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#c9ec70"
  accent2: "#dbb992"
  line: "rgba(212, 212, 216, 0.28)"
  playBg: "#c9ec70"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.60"
  wallpaperRatio: "1.50059"
  screen: "#201d18"
  phosphor: "#e1e5bd"
  keyRadius: "2px"
  font: "'Arial Narrow', sans-serif"
  radius: "0px"
floating:
  instrument: deathcore
  width: 400
  height: 156
  shell: assets/sigil.svg
---

# Deathcore

```css
.app-shell { border: 2px solid #52525b; box-shadow: inset 0 0 40px rgba(153,27,27,.28); }
.sidebar, .panel { border: 1px solid #3f3f46; }
.btn-primary { background: #991b1b; color: #fff; border: 1px solid #d4d4d8; border-radius: 0; }
.progress-fill { background: linear-gradient(90deg, #450a0a, #dc2626); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 26px 40px; }

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
