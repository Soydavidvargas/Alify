---
id: post-hardcore
name: Post-Hardcore
description: Ceniza oscura, cortes diagonales en rojo intenso y tipografía angular.
relief: 2d
preview: ["#313543", "#ffa477", "#a5c1e8"]
colors:
  bg: "#313543"
  panel: "rgba(255, 255, 255, 0.04)"
  panelStrong: "#313543"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#ffa477"
  accent2: "#a5c1e8"
  line: "rgba(230, 57, 70, 0.36)"
  playBg: "#ffa477"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.62"
  wallpaperRatio: "1.50059"
  screen: "#2c2420"
  phosphor: "#ffdbb5"
  keyRadius: "2px"
  font: "'Arial Narrow', sans-serif"
  radius: "4px"
floating:
  instrument: post-hardcore
  width: 400
  height: 156
  shell: assets/shard.svg
---

# Post-Hardcore

```css
.app-shell { border: 1px solid #e63946; background: linear-gradient(125deg, rgba(230,57,70,.14), transparent 40%), var(--c-bg); }
.btn-primary { background: #e63946; color: #fff; clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%); border-radius: 0; }
.progress-fill { background: linear-gradient(90deg, #7a111a, #e63946); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 20px 36px; }

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

.titlebar { border-bottom: 3px dashed var(--c-accent); }
.pb-controls { border: 2px solid var(--c-text); border-radius: 0; box-shadow: 3px 3px var(--c-accent); }
.pb-controls .btn-play { border-radius: 3px; transform: rotate(-3deg); }
main.panel h1 { text-decoration: underline; text-decoration-thickness: 3px; text-decoration-color: var(--c-accent); text-underline-offset: 5px; }
```
