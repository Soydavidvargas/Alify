import { invoke } from "@tauri-apps/api/core";

export const isIOS = import.meta.env.MODE === "ios";

export interface Song { id: string; title: string; artist: string; album: string; duration: number; path?: string }
export const device = <T,>(action: string, args: Record<string, unknown> = {}) => invoke<T>("device", { action, args });
