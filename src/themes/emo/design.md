---
id: emo
name: Emo 2006
description: Negro medianoche, ajedrezado blanco/negro y magenta eléctrico nostálgico.
relief: 2d
preview: ["#372436", "#ff87c1", "#f2dce6"]
colors:
  bg: "#372436"
  panel: "rgba(255, 255, 255, 0.04)"
  panelStrong: "#372436"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#ff87c1"
  accent2: "#f2dce6"
  line: "rgba(255, 46, 147, 0.35)"
  playBg: "#ff87c1"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.63"
  wallpaperRatio: "1.50059"
  screen: "#f4d9de"
  phosphor: "#352129"
  keyRadius: "0"
  font: "'Courier New', monospace"
  radius: "6px"
floating:
  instrument: emo
  width: 400
  height: 156
  shell: assets/emo-heart.svg
---

# Emo 2006

```css
.app-shell { border: 2px solid #ff2e93; background: linear-gradient(135deg, rgba(255,46,147,.12), transparent 55%), var(--c-bg); }
.sidebar { background-image: repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 12px, transparent 12px 24px); }
.btn-primary { background: #ff2e93; color: #fff; }
.progress-fill { background: linear-gradient(90deg, #ff2e93, #ffffff); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 24px 32px; }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: repeating-conic-gradient(#ffffff0a 0 25%,transparent 0 50%) 0 0/12px 12px, var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: repeating-conic-gradient(#ffffff0a 0 25%,transparent 0 50%) 0 0/12px 12px, var(--c-bg);
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
