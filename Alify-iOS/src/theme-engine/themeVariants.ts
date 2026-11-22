import type { ThemeDef } from "./themeLoader";

export const variants = [
  { name: "Original", accent: "", surface: "" },
  { name: "Glaciar", accent: "#8CDAFF", surface: "#12283B" },
  { name: "Cobre", accent: "#FFC38E", surface: "#38231F" },
  { name: "Amatista", accent: "#DBB4FF", surface: "#2D2141" },
  { name: "Jade", accent: "#94F3BA", surface: "#17352C" },
  { name: "Rojo", accent: "#FF8282", surface: "#3B171E" },
  { name: "Azul", accent: "#86A8FF", surface: "#172548" },
  { name: "Amarillo", accent: "#FFE369", surface: "#3B3016" },
  { name: "Verde", accent: "#93EB71", surface: "#1D351B" },
  { name: "Cian", accent: "#65EFF4", surface: "#123337" },
  { name: "Magenta", accent: "#FF8CDD", surface: "#3B1D36" },
  { name: "Naranja", accent: "#FFAC64", surface: "#40251B" },
  { name: "Blanco y negro", accent: "#F2F2F2", surface: "#202020" },
] as const;

export type Variant = typeof variants[number];

// Dominant colors sampled from the original widget artwork.
const widgetBaseColors: Record<string, string> = {
  "alify-original": "#1E2337", alternativo: "#8A715B", deathcore: "#4B4F37", disco: "#383147",
  dub: "#464030", emo: "#864F6B", "frutiger-aero": "#61BDDC", gotico: "#54435B",
  grunge: "#474030", "hip-hop": "#2A2E33", hipster: "#946D4C", jazz: "#483A2E",
  kpop: "#976D98", "liquid-base": "#384562", "metalcore-gotico": "#6A4751", minimalista: "#546463",
  "post-hardcore": "#74574C", punk: "#6A483E", ravers: "#423954", "retro-videojuego": "#425D56",
  rockabilly: "#463034", shoegaze: "#383246", ska: "#252822", "soft-living": "#81886D",
  softcore: "#8A6F88", synthwave: "#63436D", vampire: "#5E3943", vintage: "#7D5737",
  y2k: "#263152", zombie: "#6C734A",
};

function rgb(hex: string) {
  return [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
}

function hue(channels: number[]) {
  const [r, g, b] = channels;
  return Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b);
}

export function widgetTint(accent: string, theme: ThemeDef): number[] {
  const luminance = [.213, .715, .072];
  const target = rgb(accent);
  if (target.every(channel => channel === target[0])) {
    return luminance.concat(0, 0, luminance, 0, 0, luminance, 0, 0, 0, 0, 0, 1, 0);
  }
  const source = widgetBaseColors[theme.id] || theme.colors.accent;
  const origin = rgb(/^#[0-9a-f]{6}$/i.test(source) ? source : "#7580af");
  const angle = hue(target) - hue(origin);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const cross = [[-.213, -.715, .928], [.143, .140, -.283], [-.787, .715, .072]];
  const brightness = target.reduce((sum, channel, index) => sum + channel * luminance[index], 0);
  return target.flatMap((channel, row) => [
    ...luminance.map((weight, col) => {
      const identity = row === col ? 1 : 0;
      const rotated = weight + (identity - weight) * cosine + cross[row][col] * sine;
      return .84 * rotated + .16 * identity + .26 * (channel - brightness) * weight;
    }),
    0, 0,
  ]).concat(0, 0, 0, 1, 0);
}

export function readVariants(): Record<string, number> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem("phone.themeVariants") || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter(([, index]) => Number.isInteger(index) && variants[index]));
  } catch {
    return {};
  }
}

export function withVariant(theme: ThemeDef, variant: Variant): ThemeDef {
  if (!variant.accent) return theme;
  return {
    ...theme,
    colors: { ...theme.colors, accent: variant.accent, playBg: variant.accent, playFg: "#101118" },
    vars: { ...theme.vars, mobileSurface: variant.surface },
  };
}

const desktopKey = "alify.desktop.themeVariants";

export function desktopVariant(id: string): number {
  try {
    const index: unknown = JSON.parse(localStorage.getItem(desktopKey) || "{}")[id];
    return typeof index === "number" && Number.isInteger(index) && variants[index] ? index : 0;
  } catch {
    return 0;
  }
}

export function saveDesktopVariant(id: string, index: number): void {
  const saved: unknown = JSON.parse(localStorage.getItem(desktopKey) || "{}");
  localStorage.setItem(desktopKey, JSON.stringify({ ...(saved && typeof saved === "object" ? saved : {}), [id]: index }));
}

export function withDesktopVariant(theme: ThemeDef, index = desktopVariant(theme.id)): ThemeDef {
  const variant = variants[index];
  if (!variant?.accent) return theme;
  const { accent, surface } = variant;
  return {
    ...theme,
    preview: [surface, accent],
    colors: {
      ...theme.colors, accent, accent2: accent, bg: surface, panel: surface, panelStrong: `color-mix(in srgb, ${surface} 80%, white)`,
      floatBg: surface, text: "#FAFAFC", muted: "#DEDEE7", line: "#FFFFFF42", playBg: accent, playFg: "#101118",
    },
    vars: { ...theme.vars, screen: surface, phosphor: "#FAFAFC", lyricsTint: accent },
    shellTint: widgetTint(accent, theme),
  };
}
