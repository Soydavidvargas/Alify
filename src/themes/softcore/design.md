---
id: softcore
name: Softcore
description: Rosa empolvado, crema aterciopelado y degradados suaves de ensueño.
relief: 2d
preview: ["#584558", "#ffd1e8", "#c3bafb"]
colors:
  bg: "#584558"
  panel: "rgba(255, 232, 240, 0.08)"
  panelStrong: "#584558"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#ffd1e8"
  accent2: "#c3bafb"
  line: "rgba(242, 181, 200, 0.30)"
  playBg: "#ffd1e8"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.64"
  wallpaperRatio: "1.50059"
  screen: "#f5e7ee"
  phosphor: "#45384a"
  keyRadius: "18px"
  font: "'Trebuchet MS', sans-serif"
  radius: "20px"
floating:
  instrument: softcore
  width: 400
  height: 156
  shell: assets/cloud-pill.svg
---

# Softcore

```css
.app-shell { background: radial-gradient(circle at 20% 10%, rgba(242,181,200,.24), transparent 50%), var(--c-bg); border: 1px solid var(--c-line); }
.sidebar, .panel { box-shadow: 0 8px 24px rgba(24, 10, 18, .28); }
.progress-fill { background: linear-gradient(90deg, #d88ca8, #fff5f8); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 22px 34px; }

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

.titlebar { border-bottom: 2px solid var(--c-accent2); }
.pb-controls { border-radius: 24px; border-color: var(--c-accent2); box-shadow: inset 0 0 8px color-mix(in srgb,var(--c-accent2) 25%,transparent); }
.progress-fill { background: linear-gradient(90deg,var(--c-accent2),var(--c-accent)); }
main.panel h1 { text-shadow: 2px 2px var(--c-bg); }
```
