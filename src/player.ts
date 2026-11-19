import { AudioEngine } from "./core/audioEngine";
import { useSyncExternalStore } from "react";

export const engine = new AudioEngine();
export const useEngine = () => useSyncExternalStore(engine.subscribe, engine.getState);
