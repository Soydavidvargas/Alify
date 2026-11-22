---
id: frutiger-aero
name: Frutiger Aero
description: Frutiger Aero con lago turquesa, praderas luminosas, burbujas y cristal azul verdoso.
relief: 3d
preview: ["#104052", "#b4e18c", "#86d7ff"]
colors:
  bg: "#104052"
  panel: "#16485a"
  panelStrong: "#104052"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#b4e18c"
  accent2: "#86d7ff"
  line: "rgba(255, 255, 255, 0.65)"
  playBg: "#b4e18c"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.64"
  wallpaperRatio: "1.50059"
  screen: "#edf6e4"
  phosphor: "#20342a"
  keyRadius: "9px"
  font: "'Trebuchet MS', sans-serif"
  radius: "9px"
floating:
  instrument: frutiger-aero
  width: 400
  height: 156
  shell: assets/shell.svg
---

# Frutiger Aero

```css
.app-shell {
  background: linear-gradient(#103a5355,#11394c88), var(--asset-meadow) center/cover no-repeat, var(--c-bg);
  border: 2px solid #3678d5;
}
.titlebar {
  background: linear-gradient(#428398,#215267 46%,#123e52 52%,#246478);
  box-shadow: inset 0 1px #b5dfff;
}
.titlebar .icon-btn, .titlebar .t-muted { color: white; }
.sidebar, .panel {
  background: linear-gradient(180deg,#b7e5ff0e,transparent 40%), var(--c-panel);
  border: 1px solid var(--c-line);
  box-shadow: inset 0 1px #b6deff55;
}
.nav-item[aria-current="page"], .btn-primary, .btn-play {
  background: linear-gradient(#d4f3a8,var(--c-play-bg) 45%,#84bc67);
  color: var(--c-play-fg);
  box-shadow: inset 0 1px #edffda, 0 1px 3px #0a2b4680;
}
.progress-fill { background: repeating-linear-gradient(90deg,#9ad069 0 9px,#517d50 9px 11px); }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: linear-gradient(150deg,#ffffff10,transparent 60%), var(--c-bg);
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
.play-bar { background: linear-gradient(180deg,#477b88,#164759 46%,#123c50 50%,#21586a); }

.pb-controls { border-radius: 26px; border-color: var(--c-accent2); box-shadow: inset 0 2px #eaffff88,inset 0 -2px #121f3580; }
.pb-play { box-shadow: inset 0 2px #fff9,0 2px 4px #10263888; }
```
