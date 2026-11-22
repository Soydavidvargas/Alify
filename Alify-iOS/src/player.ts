import { AudioEngine, EQ_PRESETS, type EqState } from "./core/audioEngine";
import { useSyncExternalStore } from "react";

export const engine = new AudioEngine();
try {
  const saved = JSON.parse(localStorage.getItem("alify.desktop.eq") || "null") as EqState | null;
  if (saved) {
    if (saved.preset !== "custom" && Object.hasOwn(EQ_PRESETS, saved.preset)) engine.setEqPreset(saved.preset);
    else for (const band of ["bass", "mid", "treble"] as const) {
      if (Number.isFinite(saved[band])) engine.setEqBand(band, saved[band]);
    }
    if (saved.spatial === true) engine.setSpatialAudio(true);
  }
} catch { /* Los ajustes locales pueden no estar disponibles. */ }
let savedEq = JSON.stringify(engine.getState().eq);
engine.subscribe(()=>{
  const eq = JSON.stringify(engine.getState().eq);
  if (savedEq === eq) return;
  savedEq = eq;
  try { localStorage.setItem("alify.desktop.eq", eq); } catch { /* Almacenamiento lleno o deshabilitado. */ }
});
export const useEngine = () => useSyncExternalStore(engine.subscribe, engine.getState);
