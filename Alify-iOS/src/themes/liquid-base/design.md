---
id: liquid-base
name: Liquid Base
description: Vidrio ahumado con bordes de luz, reflejos de ópalo y una lente líquida iridiscente.
relief: 3d
preview: ["#161e37", "#a4f0ee", "#c8b8ff"]
colors:
  bg: "#161e37"
  panel: "rgba(31,41,69,.88)"
  panelStrong: "#354461"
  text: "#f7faff"
  muted: "#cbd9ed"
  accent: "#a4f0ee"
  accent2: "#c8b8ff"
  line: "rgba(210,231,255,.36)"
  playBg: "#a4f0ee"
  playFg: "#182836"
  floatBg: "#19233c"
vars:
  wallpaperShade: "0.64"
  wallpaperRatio: "1.50059"
  screen: "#233049"
  phosphor: "#f4fbff"
  keyRadius: "20px"
  font: "'Segoe UI Variable', 'Segoe UI', sans-serif"
  radius: "24px"
floating:
  instrument: liquid-base
  width: 400
  height: 156
---

# Liquid Base

```css
.app-shell {
  background: radial-gradient(ellipse at 5% 82%, #244d59, transparent 50%),
              radial-gradient(ellipse at 85% 7%, #494263, transparent 52%), var(--c-bg);
  box-shadow: inset 0 1px 1px #e1f8ff99;
}
.sidebar, .panel, .titlebar {
  background: linear-gradient(125deg, #d9eeff0f, transparent 48%), var(--c-panel);
  border: 1px solid var(--c-line);
  box-shadow: inset 0 1px 0 #ecfcff44, inset 0 -1px 0 #b3afff33, 0 6px 18px #080e192e;
  backdrop-filter: blur(12px);
}
.btn-primary, .btn-play {
  background: linear-gradient(155deg, #f2fffc, var(--c-play-bg) 48%, var(--c-accent2));
  color: var(--c-play-fg);
  box-shadow: inset 0 1px 0 white, 0 2px 5px #080e1955;
}
.progress-fill { background: linear-gradient(90deg,var(--c-accent2),var(--c-accent)); }

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

.pb-controls { border-radius: 26px; border-color: var(--c-accent2); box-shadow: inset 0 2px #eaffff88,inset 0 -2px #121f3580; }
.pb-play { box-shadow: inset 0 2px #fff9,0 2px 4px #10263888; }
```
