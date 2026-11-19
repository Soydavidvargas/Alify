---
id: hipster
name: Hipster Café
description: Marrón kraft, ámbar tostado y verde petróleo con marco tipo Polaroid.
relief: 2d
preview: ["#49392e", "#f3cb95", "#91c5af"]
colors:
  bg: "#49392e"
  panel: "rgba(255, 240, 218, 0.06)"
  panelStrong: "#49392e"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#f3cb95"
  accent2: "#91c5af"
  line: "rgba(217, 155, 67, 0.30)"
  playBg: "#f3cb95"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.63"
  wallpaperRatio: "1.50059"
  screen: "#e5ceb2"
  phosphor: "#383026"
  keyRadius: "3px"
  font: "Georgia, serif"
  radius: "10px"
floating:
  instrument: hipster
  width: 400
  height: 156
  shell: assets/polaroid.svg
---

# Hipster Café

```css
.app-shell { border: 1px solid rgba(217,155,67,.42); }
.btn-primary { background: #d99b43; color: #241b13; }
.progress-fill { background: linear-gradient(90deg, #2a9d8f, #d99b43); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 24px 28px 34px; }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: repeating-linear-gradient(3deg,transparent 0 8px,#ffffff09 9px 10px), var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: repeating-linear-gradient(3deg,transparent 0 8px,#ffffff09 9px 10px), var(--c-bg);
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
.pb-controls { background: var(--v-screen); border: 3px double var(--c-accent2); }
.pb-controls .icon-btn { color: var(--v-phosphor); }
.pb-controls .icon-btn[aria-pressed=true] { outline: 2px solid var(--v-phosphor); outline-offset: -4px; }
main.panel h1 { font-family: Georgia,serif; }
.progress-track { border: 1px solid var(--c-line); }
```
