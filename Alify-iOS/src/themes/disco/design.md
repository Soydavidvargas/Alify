---
id: disco
name: Disco de pista
description: Plato de cabina, aluminio cepillado y teselas de espejo.
relief: 2d
preview: ["#362e46", "#efc6fa", "#b4dedb"]
colors:
  bg: "#362e46"
  panel: "rgba(255, 255, 255, 0.04)"
  panelStrong: "#362e46"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#efc6fa"
  accent2: "#b4dedb"
  line: "rgba(255, 255, 255, 0.08)"
  playBg: "#efc6fa"
  playFg: "#16191c"
  floatBg: "rgba(16, 16, 18, 0.86)"
vars:
  wallpaperShade: "0.61"
  wallpaperRatio: "1.50059"
  screen: "#eee2cb"
  phosphor: "#30282d"
  keyRadius: "18px"
  font: "'Trebuchet MS', sans-serif"
  radius: "12px"
floating:
  instrument: disco
  width: 400
  height: 156
---

# Disco de pista

```css
.app-shell { border: 2px solid var(--c-line); }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: repeating-linear-gradient(90deg,transparent 0 12px,#ffffff0b 12px 13px), var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: repeating-linear-gradient(90deg,transparent 0 12px,#ffffff0b 12px 13px), var(--c-bg);
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

.titlebar { border-bottom: 2px solid var(--c-accent2); }
.pb-controls { border-radius: 24px; border-color: var(--c-accent2); box-shadow: inset 0 0 8px color-mix(in srgb,var(--c-accent2) 25%,transparent); }
.progress-fill { background: linear-gradient(90deg,var(--c-accent2),var(--c-accent)); }
main.panel h1 { text-shadow: 2px 2px var(--c-bg); }
```
