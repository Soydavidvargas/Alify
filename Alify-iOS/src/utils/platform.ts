/**
 * Detección de plataforma. Único punto de verdad para decidir el "form factor":
 *  - desktop (Windows): sidebar lateral + ventana flotante nativa (segunda ventana Tauri)
 *  - mobile  (Android): barra inferior táctil + Mini-Player flotante arrastrable dentro de la app
 *
 * Funciona hoy en Windows y en el navegador; en Android funcionará al ejecutar `tauri android init`
 * sin tocar más código (Tauri móvil expone __TAURI_INTERNALS__ y el UA contiene "Android").
 */

export type Os = "windows" | "android" | "ios" | "macos" | "linux" | "web";
export type FormFactor = "desktop" | "mobile";

const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

export const isTauri = (): boolean => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

function detectOs(): Os {
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Windows/i.test(ua)) return "windows";
  if (/Mac OS X/i.test(ua)) return "macos";
  if (/Linux/i.test(ua)) return "linux";
  return "web";
}

export const os: Os = detectOs();
export const isAndroid = os === "android";
export const isMobile = os === "android" || os === "ios";
export const isWindows = os === "windows";

/** Escritorio nativo: Tauri + no móvil. Habilita segunda ventana, Acrylic, selector de carpetas Rust, etc. */
export const isDesktopApp = (): boolean => isTauri() && !isMobile;

/** Mini-Player flotante dentro de la app (en móvil reemplaza a la ventana flotante nativa). */
export const useInAppMiniPlayer = (): boolean => isMobile;

export const formFactor = (): FormFactor => (isMobile || (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse) and (max-width: 820px)").matches) ? "mobile" : "desktop");

/** Marca <html data-os data-form> para que los CSS adapten el layout (ver index.css). */
export function applyPlatformAttributes(): void {
  const root = document.documentElement;
  root.dataset.os = os;
  root.dataset.form = formFactor();
}
