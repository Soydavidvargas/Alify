/** Sincronización ventana principal ↔ flotante mediante eventos locales de Tauri. */
import { useEffect, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import type { AudioEngine, Track } from "./audioEngine";

import { isDesktopApp } from "../utils/platform";

/** Escritorio nativo (Tauri, no móvil). En Android no existe la ventana flotante nativa. */
export const isDesktop = isDesktopApp;

export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  cover?: string;
}
export interface TickInfo {
  playing: boolean;
  shuffle: boolean;
  position: number;
  duration: number;
}
export type FloatCmd = "toggle" | "next" | "prev" | "seek0" | "shuffle" | "random";

const toInfo = (t: Track | null): TrackInfo | null => (t ? { id: t.id, title: t.title, artist: t.artist, cover: t.cover } : null);

/** Ventana principal: publica estado y atiende comandos de la flotante. */
export function startMainBridge(engine: AudioEngine, getFallbackTracks?: () => Track[]): () => void {
  if (!isDesktop()) return () => {};
  let lastId: string | null | undefined;
  const ensureQueue = (): boolean => {
    if (engine.getState().queue.length > 0) return true;
    const all = getFallbackTracks?.() ?? [];
    if (!all.length) return false;
    engine.setQueue(all, Math.floor(Math.random() * all.length), false);
    return true;
  };
  const publishTrack = () => {
    const s = engine.getState();
    lastId = s.track?.id ?? null;
    void emit("alify:track", toInfo(s.track));
  };
  const unsub = engine.subscribe(() => {
    const s = engine.getState();
    if ((s.track?.id ?? null) !== lastId) publishTrack();
    const tick: TickInfo = { playing: s.playing, shuffle: s.shuffle, position: s.position, duration: s.duration };
    void emit("alify:tick", tick);
  });
  const offs: Promise<() => void>[] = [
    listen("alify:hello", () => {
      publishTrack();
      const s = engine.getState();
      void emit("alify:tick", { playing: s.playing, shuffle: s.shuffle, position: s.position, duration: s.duration } satisfies TickInfo);
    }),
    listen<FloatCmd>("alify:cmd", (e) => {
      if (e.payload === "toggle") {
        if (ensureQueue()) engine.toggle();
      } else if (e.payload === "next") {
        if (ensureQueue()) engine.next();
      } else if (e.payload === "prev") {
        if (ensureQueue()) engine.prev();
      } else if (e.payload === "shuffle") {
        const wasQueueEmpty = engine.getState().queue.length === 0;
        if (!ensureQueue()) return;
        const nextShuffle = wasQueueEmpty ? true : !engine.getState().shuffle;
        engine.setShuffle(nextShuffle);
        if (nextShuffle && !engine.getState().playing) {
          engine.playRandomTrack();
        }
      } else if (e.payload === "random") {
        if (!ensureQueue()) return;
        engine.setShuffle(true);
        engine.playRandomTrack();
      } else if (e.payload === "seek0") {
        engine.seek(0);
      }
    }),
  ];
  return () => {
    unsub();
    offs.forEach((p) => p.then((f) => f()));
  };
}

export function sendCmd(cmd: FloatCmd): void {
  void emit("alify:cmd", cmd);
}

export function broadcastTheme(raw: string): void {
  if (isDesktop()) void emit("alify:theme", raw);
}

/** Ventana flotante: recibe pista y progreso. */
export function useFloatingState(): { track: TrackInfo | null; tick: TickInfo } {
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [tick, setTick] = useState<TickInfo>({ playing: false, shuffle: false, position: 0, duration: 0 });
  useEffect(() => {
    const offs = [listen<TrackInfo | null>("alify:track", (e) => setTrack(e.payload)), listen<TickInfo>("alify:tick", (e) => setTick(e.payload))];
    void Promise.all(offs).then(() => emit("alify:hello"));
    return () => offs.forEach((p) => p.then((f) => f()));
  }, []);
  return { track, tick };
}
