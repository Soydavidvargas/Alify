---
id: kpop
name: K-Pop Holográfico
description: Pastel holográfico rosa, lavanda y cielo con stickers brillantes e iconos redondos.
relief: 3d
preview: ["#513753", "#ffb7e6", "#acede9"]
colors:
  bg: "#513753"
  panel: "rgba(255, 255, 255, 0.18)"
  panelStrong: "#513753"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#ffb7e6"
  accent2: "#acede9"
  line: "rgba(255, 255, 255, 0.52)"
  playBg: "#ffb7e6"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.64"
  wallpaperRatio: "1.50059"
  screen: "#f9dce8"
  phosphor: "#50233d"
  keyRadius: "18px"
  font: "'Trebuchet MS', sans-serif"
  radius: "24px"
floating:
  instrument: kpop
  width: 400
  height: 156
  shell: assets/lightstick.svg
---

# K-Pop Holográfico

```css
.app-shell { border: 2px solid rgba(255,255,255,.72); background: linear-gradient(135deg, rgba(255,112,184,.34), rgba(181,148,255,.32), rgba(123,227,255,.32)); box-shadow: inset 0 0 40px rgba(255,255,255,.22); }
.sidebar, .panel { border: 1px solid rgba(255,255,255,.52); box-shadow: 0 6px 20px rgba(80,20,90,.22); }
.btn-play, .pb-prev, .pb-next { border-radius: 999px !important; border: 2px solid #fff !important; box-shadow: 0 4px 12px rgba(255,112,184,.45); }
.btn-primary { background: linear-gradient(90deg, #ff70b8, #a78bfa, #7be3ff); color: #fff; border: 1px solid #fff; }
.progress-fill { background: linear-gradient(90deg, #ff70b8, #ffd6ec, #7be3ff); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 22px 46px; color: #3a1d47; }
.fl-artist, .fl-win button { color: #5b2e6e; }

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
