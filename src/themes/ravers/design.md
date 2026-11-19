---
id: ravers
name: Ravers Neón
description: Negro absoluto con láseres cian, magenta y lima fluorescente.
relief: 3d
preview: ["#312454", "#abff60", "#ff80ef"]
colors:
  bg: "#312454"
  panel: "rgba(0, 245, 212, 0.06)"
  panelStrong: "#312454"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#abff60"
  accent2: "#ff80ef"
  line: "rgba(0, 245, 212, 0.42)"
  playBg: "#abff60"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.64"
  wallpaperRatio: "1.50059"
  screen: "#141c19"
  phosphor: "#b5ff80"
  keyRadius: "2px"
  font: "Consolas, monospace"
  radius: "14px"
floating:
  instrument: ravers
  width: 400
  height: 156
  shell: assets/visor.svg
---

# Ravers Neón

```css
.app-shell { border: 2px solid #00f5d4; box-shadow: inset 0 0 36px rgba(241,91,181,.22); }
.sidebar, .panel { border: 1px solid rgba(0,245,212,.35); box-shadow: 0 0 14px rgba(0,245,212,.14); }
.btn-play { box-shadow: 0 0 18px rgba(0,245,212,.75); }
.btn-primary { background: linear-gradient(90deg, #00f5d4, #f15bb5); color: #070510; }
.progress-fill { background: linear-gradient(90deg, #00f5d4, #fee440, #f15bb5); box-shadow: 0 0 10px #00f5d4; }
.eq i { background: linear-gradient(#f15bb5, #00f5d4); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 20px 38px; }

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
