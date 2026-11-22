---
id: minimalista
name: Minimalista
description: Cristal esmerilado monocromático oscuro con blur moderno, alto contraste en blanco puro y grises neutros.
relief: 2d
preview: ["#343f43", "#d3ece6", "#9cc1bb"]
colors:
  bg: "#343f43"
  panel: "rgba(255, 255, 255, 0.04)"
  panelStrong: "#343f43"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#d3ece6"
  accent2: "#9cc1bb"
  line: "rgba(255, 255, 255, 0.08)"
  playBg: "#d3ece6"
  playFg: "#16191c"
  floatBg: "rgba(16, 16, 18, 0.86)"
vars:
  wallpaperShade: "0.62"
  wallpaperRatio: "1.50059"
  screen: "#213131"
  phosphor: "#dbefdf"
  keyRadius: "2px"
  font: "'Courier New', monospace"
  radius: "12px"
floating:
  instrument: minimalista
  width: 400
  height: 156
---

# Minimalista

Monocromático moderno con cristal esmerilado oscuro.

```css
.app-shell {
  backdrop-filter: blur(28px) saturate(140%);
  -webkit-backdrop-filter: blur(28px) saturate(140%);
}
.sidebar, .panel {
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(28px) saturate(140%);
}
.float-shell {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(28px) saturate(140%);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65);
}

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
```
