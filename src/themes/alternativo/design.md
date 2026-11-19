---
id: alternativo
name: Alternativo
description: Estética indie de cassette analógico, mostaza cálido y pizarra mate.
relief: 2d
preview: ["#47372e", "#f5c27f", "#a1cbbe"]
colors:
  bg: "#47372e"
  panel: "rgba(255, 255, 255, 0.05)"
  panelStrong: "#47372e"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#f5c27f"
  accent2: "#a1cbbe"
  line: "rgba(224, 168, 46, 0.28)"
  playBg: "#f5c27f"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.63"
  wallpaperRatio: "1.50059"
  screen: "#e7d8b4"
  phosphor: "#302922"
  keyRadius: "2px"
  font: "'Courier New', monospace"
  radius: "8px"
floating:
  instrument: alternativo
  width: 400
  height: 156
  shell: assets/cassette.svg
---

# Alternativo

```css
.app-shell { border: 2px solid rgba(224,168,46,.45); }
.sidebar, .panel { border: 1px dashed rgba(224,168,46,.32); }
.btn-primary { background: #e0a82e; color: #1a1c22; }
.progress-fill { background: linear-gradient(90deg, #d96b43, #e0a82e); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 24px 28px 26px; }
.fl-cover { border-radius: 4px; border: 2px solid #e0a82e; }

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

.play-bar { border-top: 4px ridge var(--c-accent2); }
.pb-controls { border: 2px solid var(--c-accent2); box-shadow: inset -2px -2px #101017,2px 2px #101017; border-radius: 3px; }
.pb-controls .icon-btn { border-radius: 3px; }
.progress-fill { background: repeating-linear-gradient(90deg,var(--c-accent) 0 7px,var(--c-bg) 7px 9px); }
main.panel h1 { font-family: Consolas,monospace; }
```
