---
id: vintage
name: Vintage Radio
description: Madera nogal cálida, latón dorado y dial analógico de radio clásica.
relief: 3d
preview: ["#4f392a", "#f2cb8f", "#caa287"]
colors:
  bg: "#4f392a"
  panel: "rgba(246, 234, 212, 0.06)"
  panelStrong: "#4f392a"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#f2cb8f"
  accent2: "#caa287"
  line: "rgba(212, 163, 89, 0.40)"
  playBg: "#f2cb8f"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.63"
  wallpaperRatio: "1.50059"
  screen: "#e8c98c"
  phosphor: "#362a20"
  keyRadius: "3px"
  font: "Georgia, serif"
  radius: "12px"
floating:
  instrument: vintage
  width: 400
  height: 156
  shell: assets/radio.svg
---

# Vintage Radio

```css
.app-shell { border: 3px solid #d4a359; box-shadow: inset 0 0 36px rgba(0,0,0,.6); background: linear-gradient(180deg, rgba(92,50,24,.78), rgba(38,20,10,.92)); }
.sidebar, .panel { border: 1px solid rgba(212,163,89,.36); box-shadow: inset 0 1px 0 rgba(255,225,175,.15); }
.btn-play { border: 2px solid #f6ead4; box-shadow: 0 3px 8px rgba(0,0,0,.55); }
.btn-primary { background: linear-gradient(180deg, #e7bf76, #b58034); color: #241207; }
.progress-track { height: 10px; background: #231208; border: 1px solid #d4a359; }
.progress-fill { background: repeating-linear-gradient(90deg, #f6ead4 0 2px, #d4a359 2px 10px); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 26px 34px; }

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
