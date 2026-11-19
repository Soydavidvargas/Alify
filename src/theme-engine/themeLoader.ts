/**
 * Motor de temas: lee `design.md` (YAML frontmatter + Markdown con bloques ```css)
 * e inyecta variables CSS, relieve 2D/3D y máscaras SVG en la ventana actual
 * (principal o flotante). Cada ventana lo ejecuta de forma independiente.
 */
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export interface FloatingSpec {
  width: number;
  height: number;
  /** ruta relativa a la carpeta del tema, p.ej. assets/shell.svg (silueta + fondo) */
  shell?: string;
  instrument?: string;
}

export interface ThemeDef {
  id: string;
  name: string;
  description: string;
  relief: "2d" | "3d";
  colors: Record<string, string>;
  vars: Record<string, string>;
  preview: string[];
  previewImage?: string;
  wallpaper?: string;
  floating: FloatingSpec;
  css: string;
  raw: string;
  custom?: boolean;
}

const rawThemes = import.meta.glob("../themes/*/design.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const rawAssets = import.meta.glob("../themes/*/assets/*.svg", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const wallpapers = import.meta.glob("../themes/*/assets/wallpaper.webp", { query: "?url", import: "default", eager: true }) as Record<string, string>;
export const wallpaperUrl = (t: ThemeDef) => wallpapers[`../themes/${t.wallpaper ?? t.id}/assets/wallpaper.webp`];
const rawPreviews = import.meta.glob("../themes/*/preview.{png,webp,jpg,svg}", { query: "?url", import: "default", eager: true }) as Record<string, string>;

const KEY_ACTIVE = "alify.theme";
const KEY_CUSTOM = "alify.customThemes";
const DEFAULT_ID = "minimalista";

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const toStr = (v: unknown) => (v === undefined || v === null ? "" : String(v));

export function parseDesignMd(raw: string): ThemeDef {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw.replace(/^\uFEFF/, ""));
  if (!m) throw new Error("design.md inválido: falta el frontmatter YAML (--- ... ---)");
  const fm = (parseYaml(m[1]) ?? {}) as Record<string, any>;
  const body = m[2];
  const css = [...body.matchAll(/```css\r?\n([\s\S]*?)```/g)].map((x) => x[1]).join("\n");
  const entries = (o: unknown) => Object.fromEntries(Object.entries((o ?? {}) as Record<string, unknown>).map(([k, v]) => [k, toStr(v)]));
  if (!fm.id) throw new Error("design.md inválido: falta `id`");
  const id = String(fm.id);
  const previewImage = Object.entries(rawPreviews).find(([k]) => k.startsWith(`../themes/${id}/`))?.[1];
  const shell = fm.floating_bg_image ? String(fm.floating_bg_image) : fm.floating?.shell ? String(fm.floating.shell) : undefined;
  return {
    id,
    name: String(fm.name ?? id),
    description: String(fm.description ?? ""),
    relief: String(fm.relief ?? "2d").toLowerCase() === "3d" ? "3d" : "2d",
    colors: entries(fm.colors),
    vars: entries(fm.vars),
    preview: Array.isArray(fm.preview) ? fm.preview.map(String) : [],
    previewImage,
    wallpaper: String(fm.wallpaper ?? id),
    floating: {
      width: Number(fm.floating?.width ?? 380),
      height: Number(fm.floating?.height ?? 130),
      shell,
      instrument: fm.floating?.instrument,
    },
    css,
    raw,
  };
}

export function serializeDesignMd(t: ThemeDef): string {
  const fm: Record<string, unknown> = {
    id: t.id,
    name: t.name,
    description: t.description,
    relief: t.relief,
    preview: t.preview.length ? t.preview : [t.colors.bg ?? "#0b1437", t.colors.accent ?? "#6c8cff", t.colors.text ?? "#e7ecff"],
    wallpaper: t.wallpaper,
    colors: t.colors,
    vars: t.vars,
    floating: t.floating,
  };
  return `---\n${stringifyYaml(fm).trim()}\n---\n\n# ${t.name}\n\n\`\`\`css\n${t.css.trim()}\n\`\`\`\n`;
}

export function bundledThemes(): ThemeDef[] {
  const list: ThemeDef[] = [];
  for (const raw of Object.values(rawThemes)) {
    try {
      list.push(parseDesignMd(raw));
    } catch (e) {
      console.error(e);
    }
  }
  const order = [
    "alify-original",
    "minimalista",
    "liquid-base",
    "frutiger-aero",
    "y2k",
    "metalcore-gotico",
    "retro-videojuego",
    "alternativo",
    "punk",
    "softcore",
    "soft-living",
    "emo",
    "post-hardcore",
    "deathcore",
    "hipster",
    "ravers",
    "gotico",
    "vampire",
    "zombie",
    "kpop",
    "vintage",
    "synthwave",
  ];
  return list.sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
}

export function customThemes(): ThemeDef[] {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY_CUSTOM) ?? "[]") as string[];
    return arr.map((r) => ({ ...parseDesignMd(r), custom: true }));
  } catch {
    return [];
  }
}

export function allThemes(): ThemeDef[] {
  const custom = customThemes();
  const ids = new Set(custom.map((c) => c.id));
  return [...bundledThemes().filter((b) => !ids.has(b.id)), ...custom];
}

export function saveCustomTheme(raw: string): ThemeDef {
  const t = parseDesignMd(raw);
  const others = customThemes().filter((c) => c.id !== t.id).map((c) => c.raw);
  localStorage.setItem(KEY_CUSTOM, JSON.stringify([...others, raw]));
  return { ...t, custom: true };
}

export function deleteCustomTheme(id: string): void {
  localStorage.setItem(KEY_CUSTOM, JSON.stringify(customThemes().filter((c) => c.id !== id).map((c) => c.raw)));
}

export function getActiveId(): string {
  return localStorage.getItem(KEY_ACTIVE) ?? DEFAULT_ID;
}
export function setActiveId(id: string): void {
  localStorage.setItem(KEY_ACTIVE, id);
}

export function resolveActive(): ThemeDef {
  const id = getActiveId();
  const all = allThemes();
  return all.find((t) => t.id === id) ?? all.find((t) => t.id === DEFAULT_ID) ?? all[0];
}

// ---------- inyección ----------
let applied: string[] = [];

function svgUrl(svg: string): string {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export function applyTheme(theme: ThemeDef | string): ThemeDef {
  const t = typeof theme === "string" ? parseDesignMd(theme) : theme;
  const root = document.documentElement;
  applied.forEach((k) => root.style.removeProperty(k));
  applied = [];
  const set = (k: string, v: string) => {
    root.style.setProperty(k, v);
    applied.push(k);
  };
  Object.entries(t.colors).forEach(([k, v]) => set(`--c-${kebab(k)}`, v));
  Object.entries(t.vars).forEach(([k, v]) => set(`--v-${kebab(k)}`, v));

  const prefix = `../themes/${t.id}/assets/`;
  for (const [path, svg] of Object.entries(rawAssets)) {
    if (path.startsWith(prefix)) {
      const name = path.slice(prefix.length).replace(/\.svg$/i, "");
      set(`--asset-${kebab(name)}`, svgUrl(svg));
    }
  }

  const shellSvg = t.floating.shell ? rawAssets[`../themes/${t.id}/${t.floating.shell}`] : undefined;
  if (shellSvg) {
    set("--shell-image", svgUrl(shellSvg));
    set("--shell-mask", svgUrl(shellSvg));
  } else {
    set("--shell-image", "none");
    set("--shell-mask", "none");
  }
  const wallpaper = wallpaperUrl(t);
  root.toggleAttribute("data-wallpaper", !!wallpaper);
  if (wallpaper) set("--theme-wallpaper", `url("${wallpaper}")`);
  root.dataset.theme = t.id;
  root.dataset.relief = t.relief;

  let style = document.getElementById("alify-theme-css") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "alify-theme-css";
    document.head.appendChild(style);
  }
  style.textContent = t.css;
  return t;
}
