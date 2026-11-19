/**
 * Estadísticas locales de escucha (100% en localStorage del dispositivo, cero red).
 */
import { useSyncExternalStore } from "react";
import type { AudioEngine, Track } from "./core/audioEngine";

export interface TrackStat {
  id: string;
  title: string;
  artist: string;
  cover?: string;
  seconds: number;
  plays: number;
}

export interface WrappedStats {
  totalSeconds: number;
  tracks: Record<string, TrackStat>;
}

const KEY = "alify.wrappedStats";

function loadStats(): WrappedStats {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "");
    if (raw && typeof raw.totalSeconds === "number" && raw.tracks && typeof raw.tracks === "object") {
      return raw as WrappedStats;
    }
  } catch {
    /* ignore */
  }
  return { totalSeconds: 0, tracks: {} };
}

let stats: WrappedStats = loadStats();
const subs = new Set<() => void>();

function emit() {
  subs.forEach((f) => f());
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

export const useWrappedStats = (): WrappedStats =>
  useSyncExternalStore((l) => (subs.add(l), () => subs.delete(l)), () => stats);

export function getTopSongs(s: WrappedStats, liveTracks: Track[], limit = 5): TrackStat[] {
  const byId = new Map(liveTracks.map((t) => [t.id, t]));
  return Object.values(s.tracks)
    .filter((t) => t.seconds > 0)
    .map((t) => {
      const live = byId.get(t.id);
      return live
        ? { ...t, title: live.title, artist: live.artist, cover: live.cover ?? t.cover }
        : t;
    })
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, limit);
}

export function fmtListenDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min ${rem} s`;
  return `${rem} s`;
}

export function startStatsTracker(engine: AudioEngine): () => void {
  let lastTrackId: string | null = null;
  let lastTick = performance.now();
  let saveCounter = 0;

  const timer = window.setInterval(() => {
    const now = performance.now();
    const dt = Math.min(2, Math.max(0, (now - lastTick) / 1000));
    lastTick = now;

    const es = engine.getState();
    const t = es.track;
    if (!es.playing || !t) return;

    const isNewPlay = t.id !== lastTrackId;
    if (isNewPlay) lastTrackId = t.id;

    const prev = stats.tracks[t.id];
    const nextTrack: TrackStat = {
      id: t.id,
      title: t.title,
      artist: t.artist,
      cover: t.cover ?? prev?.cover,
      seconds: (prev?.seconds ?? 0) + dt,
      plays: (prev?.plays ?? 0) + (isNewPlay ? 1 : 0),
    };

    stats = {
      totalSeconds: stats.totalSeconds + dt,
      tracks: {
        ...stats.tracks,
        [t.id]: nextTrack,
      },
    };
    emit();

    saveCounter++;
    if (saveCounter >= 5 || isNewPlay) {
      saveCounter = 0;
      save();
    }
  }, 1000);

  return () => {
    window.clearInterval(timer);
    save();
  };
}
