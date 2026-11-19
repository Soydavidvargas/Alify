---
id: vampire
name: Vampire Carmesí
description: Terciopelo negro con colmillos afilados y acentos rojo carmesí sangre.
relief: 3d
preview: ["#42212d", "#ff91a3", "#e4c498"]
colors:
  bg: "#42212d"
  panel: "rgba(220, 20, 60, 0.06)"
  panelStrong: "#42212d"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#ff91a3"
  accent2: "#e4c498"
  line: "rgba(220, 20, 60, 0.42)"
  playBg: "#ff91a3"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.63"
  wallpaperRatio: "1.50059"
  screen: "#341923"
  phosphor: "#ffe4d9"
  keyRadius: "4px"
  font: "Georgia, serif"
  radius: "6px"
floating:
  instrument: vampire
  width: 400
  height: 156
  shell: assets/fangs.svg
---

# Vampire Carmesí

```css
.app-shell { border: 2px solid #dc143c; box-shadow: inset 0 0 42px rgba(220,20,60,.24); background: radial-gradient(circle at 50% 0%, rgba(220,20,60,.22), transparent 55%), var(--c-bg); }
.sidebar, .panel { border: 1px solid rgba(220,20,60,.36); }
.btn-play { box-shadow: 0 0 16px rgba(220,20,60,.65); border: 1px solid #f8f0f2; }
.btn-primary { background: linear-gradient(180deg, #dc143c, #6e061a); color: #fff; border: 1px solid rgba(248,240,242,.45); }
.progress-fill { background: linear-gradient(90deg, #6e061a, #dc143c, #ff6b81); box-shadow: 0 0 8px #dc143c; }
.eq i { background: linear-gradient(#ff6b81, #8b001c); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 20px 28px 34px; }

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

.titlebar, .play-bar { border-block: 3px double var(--c-accent2); }
.pb-controls { border: 3px double var(--c-accent2); border-radius: 20px 20px 2px 2px; }
main.panel h1 { font-family: Georgia,serif; letter-spacing: .025em; }
.sidebar-extra { border-bottom: 1px solid var(--c-accent2); }
```
