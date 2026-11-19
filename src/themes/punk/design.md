---
id: punk
name: Punk Zine
description: Collage fanzine de alto contraste en negro, magenta ácido y amarillo neón.
relief: 2d
preview: ["#372323", "#ff795c", "#ffdc75"]
colors:
  bg: "#372323"
  panel: "rgba(255, 255, 255, 0.04)"
  panelStrong: "#372323"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#ff795c"
  accent2: "#ffdc75"
  line: "rgba(245, 230, 66, 0.45)"
  playBg: "#ff795c"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.64"
  wallpaperRatio: "1.50059"
  screen: "#e9dfb6"
  phosphor: "#201e17"
  keyRadius: "0"
  font: "'Courier New', monospace"
  radius: "2px"
floating:
  instrument: punk
  width: 400
  height: 156
  shell: assets/punk-badge.svg
---

# Punk Zine

```css
.app-shell { border: 3px solid #ff1e7a; box-shadow: inset 0 0 0 2px #f5e642; }
.sidebar, .panel { border: 2px solid #f5e642; box-shadow: 4px 4px 0 #ff1e7a; }
.btn-play { border: 2px solid #111; box-shadow: 3px 3px 0 #ff1e7a; }
.btn-primary { background: #ff1e7a; color: #fff; border: 2px solid #f5e642; box-shadow: 3px 3px 0 #f5e642; text-transform: uppercase; }
.progress-fill { background: repeating-linear-gradient(-45deg, #ff1e7a 0 8px, #f5e642 8px 16px); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 20px 30px; }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: repeating-linear-gradient(128deg,transparent 0 9px,#ffffff09 9px 11px), var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: repeating-linear-gradient(128deg,transparent 0 9px,#ffffff09 9px 11px), var(--c-bg);
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
