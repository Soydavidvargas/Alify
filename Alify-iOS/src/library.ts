/** Estado de biblioteca, playlists y favoritos (persistente en localStorage; sin red). */
import { useSyncExternalStore } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Track } from "./core/audioEngine";
import { placeholderCover } from "./core/demoTracks";
import { importPlaylist, matchTrack, type WantedTrack } from "./core/importer";
import { isDesktop } from "./core/bridge";
import { engine } from "./player";

export interface Playlist {
  id: string;
  name: string;
  icon?: string;
  trackIds: string[];
  missing?: WantedTrack[];
}

export interface CollectionMeta {
  name: string;
  icon?: string;
}

export interface UserProfile {
  name: string;
  avatar?: string;
  autostart: boolean;
  autoplayRandom: boolean;
}

interface LibState {
  scanned: Track[];
  tracks: Track[];
  playlists: Playlist[];
  favorites: string[];
  libraryMeta: CollectionMeta;
  likesMeta: CollectionMeta;
  profile: UserProfile;
  folder: string | null;
  scanning: boolean;
  ytDlpReady: boolean | null;
  transfer?: TransferState;
  toast: string | null;
}

interface RawMeta {
  path: string;
  title: string;
  artist: string;
  album: string;
  year?: number;
  duration: number;
  cover?: string;
  lyrics?: string;
  downloaded?: boolean;
}

interface TransferState {
  playlistId?: string;
  title: string;
  phase: "search" | "download" | "metadata";
  percent?: number | null;
  done: number;
  total: number;
  failed: number;
  mode: "running" | "pausing" | "paused" | "canceling" | "canceled" | "finished";
}

const read = <T,>(k: string, d: T): T => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? "") as T;
  } catch {
    return d;
  }
};

let state: LibState = {
  scanned: [],
  tracks: [],
  playlists: read<Playlist[]>("alify.playlists", []),
  favorites: read<string[]>("alify.favorites", []),
  libraryMeta: read<CollectionMeta>("alify.libraryMeta", { name: "Mi biblioteca" }),
  likesMeta: read<CollectionMeta>("alify.likesMeta", { name: "Me gustas" }),
  profile: read<UserProfile>("alify.profile", {
    name: "",
    avatar: undefined,
    autostart: false,
    autoplayRandom: false,
  }),
  folder: localStorage.getItem("alify.folder"),
  scanning: false,
  ytDlpReady: null,
  toast: null,
};
const subs = new Set<() => void>();
function set(p: Partial<LibState>) {
  state = { ...state, ...p };
  state.tracks = state.scanned;
  subs.forEach((f) => f());
}
export const useLibrary = (): LibState => useSyncExternalStore((l) => (subs.add(l), () => subs.delete(l)), () => state);
export const getLibraryTracks = (): Track[] => state.tracks;
const removedDownloads = new Set<string>();

let toastTimer: number | undefined;
export function toast(msg: string): void {
  set({ toast: msg });
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => set({ toast: null }), 6000);
}

const persist = () => {
  try {
    localStorage.setItem("alify.favorites", JSON.stringify(state.favorites));
    localStorage.setItem("alify.libraryMeta", JSON.stringify(state.libraryMeta));
    localStorage.setItem("alify.likesMeta", JSON.stringify(state.likesMeta));
    localStorage.setItem("alify.profile", JSON.stringify(state.profile));
    const slim = state.playlists.map((p) => ({
      ...p,
      missing: p.missing?.map((m) => ({
        title: m.title,
        artist: m.artist,
        album: m.album,
        path: m.path,
        coverUrl: m.coverUrl,
      })),
    }));
    localStorage.setItem("alify.playlists", JSON.stringify(slim));
  } catch {
    /* evita QuotaExceededError */
  }
};

interface ResolvedEvent {
  playlistId?: string;
  missingIndex?: number;
  path: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover?: string;
  lyrics?: string;
}

function acceptResolved(p: ResolvedEvent, wanted?: WantedTrack) {
  removedDownloads.delete(p.path);
  const track: Track = {
    id: p.path, path: p.path, src: convertFileSrc(p.path), title: p.title, artist: p.artist, album: p.album,
    duration: p.duration, cover: p.cover ?? placeholderCover(p.title), lyrics: p.lyrics, downloaded: true,
  };
  const playlists = state.playlists.map(pl=>{
    if (pl.id !== p.playlistId) return pl;
    const idx = pl.missing?.findIndex(item=>item.title === wanted?.title && item.artist === wanted?.artist) ?? -1;
    return {
      ...pl,
      missing: pl.missing?.filter((_, i)=>i !== idx),
      trackIds: pl.trackIds.includes(track.id) ? pl.trackIds : [...pl.trackIds, track.id],
    };
  });
  set({ scanned: [...state.scanned.filter(t=>t.id !== track.id), track], playlists });
  persist();
}

export async function initLibrary(): Promise<void> {
  if (isDesktop()) {
    void invoke<boolean>("check_yt_dlp").then((ok) => set({ ytDlpReady: ok })).catch(() => {});
    void listen<{
      provider: string;
      name: string;
      tracks: { title: string; artist: string; album: string; coverUrl?: string }[];
    }>("alify:migrated-provider", (e) => {
      const p = e.payload;
      void importSpotifySource(p.name || "Mis canciones", p.tracks, "local");
    });
    void listen<{ id:string; phase:TransferState["phase"]; percent?:number|null }>("alify:transfer-progress", ({payload}) => {
      if (payload.id === activeTransfer?.attempt && state.transfer?.mode === "running")
        updateTransfer({phase:payload.phase, percent:payload.percent});
    });
    if (state.folder) {
      await scanFolder(state.folder);
    } else {
      await scanFolder("", true);
    }
    state.playlists.forEach((pl) => {
      if (pl.missing?.length) void enrichMissingInBackground(pl.id);
    });
    if (state.profile.autostart && state.profile.autoplayRandom && state.tracks.length > 0) {
      playAllSongsRandom();
    }
  }
}

export function playAllSongsRandom(): void {
  const all = state.tracks;
  if (!all.length) {
    toast("No hay canciones en tu biblioteca para reproducir.");
    return;
  }
  engine.setShuffle(true);
  engine.setQueue(all, Math.floor(Math.random() * all.length), true);
  toast(`Reproduciendo todas las canciones en aleatorio (${all.length} pistas)`);
}

export function updateProfile(patch: Partial<UserProfile>): void {
  const next = { ...state.profile, ...patch };
  if (!next.autostart) next.autoplayRandom = false;
  set({ profile: next });
  persist();
  if (patch.autostart !== undefined && isDesktop()) {
    void invoke("set_autostart", { enabled: next.autostart }).catch(() => {});
  }
}

export function updateCollectionMeta(targetId: string, patch: { name?: string; icon?: string }): void {
  if (targetId === "home") {
    set({
      libraryMeta: {
        name: patch.name?.trim() || state.libraryMeta.name,
        icon: patch.icon !== undefined ? patch.icon : state.libraryMeta.icon,
      },
    });
  } else if (targetId === "likes") {
    set({
      likesMeta: {
        name: patch.name?.trim() || state.likesMeta.name,
        icon: patch.icon !== undefined ? patch.icon : state.likesMeta.icon,
      },
    });
  } else {
    set({
      playlists: state.playlists.map((p) =>
        p.id === targetId
          ? {
              ...p,
              name: patch.name?.trim() || p.name,
              icon: patch.icon !== undefined ? patch.icon : p.icon,
            }
          : p,
      ),
    });
  }
  persist();
  toast("Actualizado correctamente.");
}

export async function deleteAllDownloadedSongs(): Promise<void> {
  if (activeTransfer) { toast("Cancela o termina la migración antes de borrar toda la biblioteca."); return; }
  engine.clear();
  await new Promise((r) => setTimeout(r, 80));
  if (isDesktop()) {
    await invoke("delete_all_downloaded_songs").catch(() => {});
  }
  localStorage.removeItem("alify.folder");
  set({
    scanned: [],
    playlists: [],
    favorites: [],
    folder: null,
  });
  persist();
  toast("Se borraron todas las canciones descargadas y las listas.");
}

export async function scanFolder(dir: string, silent = false): Promise<void> {
  const starting = new Set(state.scanned.map(track=>track.id));
  set({ scanning: true });
  try {
    const raw = await invoke<RawMeta[]>("scan_folder", { dir });
    const baseRaw = dir ? await invoke<RawMeta[]>("scan_folder", { dir: "" }).catch(() => [] as RawMeta[]) : [];
    const seen = new Set<string>();
    const merged: RawMeta[] = [];
    for (const item of [...raw, ...baseRaw]) {
      if (!seen.has(item.path)) {
        seen.add(item.path);
        merged.push(item);
      }
    }
    const scanned: Track[] = merged.filter(m=>!removedDownloads.has(m.path)).map((m) => ({
      id: m.path,
      path: m.path,
      src: convertFileSrc(m.path),
      title: m.title,
      artist: m.artist,
      album: m.album,
      year: m.year,
      duration: m.duration,
      cover: m.cover ?? placeholderCover(m.title),
      lyrics: m.lyrics,
      downloaded: m.downloaded,
    }));
    if (dir) localStorage.setItem("alify.folder", dir);
    const scannedIds = new Set(scanned.map(track=>track.id));
    const recent = state.scanned.filter(track=>!starting.has(track.id) && !scannedIds.has(track.id));
    set({ scanned:[...scanned,...recent], folder: dir || state.folder, scanning: false });
    if (!silent) toast(`${scanned.length} canciones cargadas`);
  } catch (e) {
    set({ scanning: false });
    if (!silent) toast(`No se pudo leer la carpeta: ${String(e)}`);
  }
}

export async function pickFolder(): Promise<void> {
  if (!isDesktop()) {
    toast("Selector de carpetas disponible solo en la app de escritorio.");
    return;
  }
  const { open } = await import("@tauri-apps/plugin-dialog");
  const dir = await open({ directory: true, multiple: false, title: "Carpeta de música" });
  if (typeof dir === "string") await scanFolder(dir);
}

export function toggleFavorite(id: string): void {
  const f = state.favorites.includes(id) ? state.favorites.filter((x) => x !== id) : [...state.favorites, id];
  set({ favorites: f });
  persist();
}

async function enrichMissingInBackground(playlistId: string): Promise<void> {
  if (!isDesktop()) return;
  const pl = state.playlists.find((p) => p.id === playlistId);
  if (!pl?.missing?.length) return;
  for (let i = 0; i < pl.missing.length; i++) {
    const w = pl.missing[i];
    try {
      const res = await invoke<{ coverPath?: string; coverData?: string; lyrics?: string }>("enrich_wanted_track", {
        title: w.title,
        artist: w.artist ?? "",
        coverUrl: w.coverUrl ?? null,
      });
      const cover = res.coverData ?? (res.coverPath ? convertFileSrc(res.coverPath) : undefined);
      const nextPlaylists = state.playlists.map((p) => {
        if (p.id !== playlistId || !p.missing) return p;
        const copy = p.missing.slice();
        const wanted = copy.findIndex(item=>item.title === w.title && item.artist === w.artist);
        if (wanted >= 0) copy[wanted] = { ...copy[wanted], cover: cover ?? copy[wanted].cover, lyrics: res.lyrics ?? copy[wanted].lyrics };
        return { ...p, missing: copy };
      });
      set({ playlists: nextPlaylists });
    } catch {
      /* continúa con la siguiente */
    }
  }
  persist();
}

export async function importFromFile(file: File): Promise<string | null> {
  const text = await file.text();
  try {
    const r = importPlaylist(text, file.name, state.tracks);
    if (!r.matches.length) {
      toast(`"${r.name}": no se encontraron canciones en el archivo.`);
      return null;
    }
    const id = `pl-${Date.now()}`;
    set({
      playlists: [
        ...state.playlists,
        { id, name: r.name, trackIds: r.tracks.map((t) => t.id), missing: r.missing },
      ],
    });
    persist();
    void enrichMissingInBackground(id);
    toast(
      `"${r.name}": ${r.tracks.length} de ${r.matches.length} encontradas.` +
        (r.missing.length ? ` ${r.missing.length} pendientes de audio.` : ""),
    );
    return id;
  } catch (e) {
    toast(`Archivo no válido: ${String(e)}`);
    return null;
  }
}

export async function importFromLink(url: string): Promise<string | null> {
  try {
    const res = await invoke<{
      name: string;
      coverUrl?: string;
      tracks: { title: string; artist: string; coverUrl?: string }[];
    }>("fetch_playlist_link", { url });
    const matches = res.tracks.map((w) => matchTrack(w, state.tracks));
    const found = matches.filter((m) => m.track).map((m) => m.track as Track);
    const missing = matches
      .filter((m) => !m.track)
      .map((m) => ({ ...m.wanted, cover: m.wanted.cover ?? m.wanted.coverUrl }));
    const id = `pl-${Date.now()}`;
    set({
      playlists: [
        ...state.playlists,
        { id, name: res.name, trackIds: found.map((t) => t.id), missing },
      ],
    });
    persist();
    toast(
      `"${res.name}": ${found.length} de ${matches.length} en tu biblioteca.` +
        (missing.length ? ` ${missing.length} pendientes de audio.` : ""),
    );
    return id;
  } catch (e) {
    toast(`No se pudo importar el enlace: ${String(e)}`);
    return null;
  }
}

export async function importSpotifySource(
  name: string,
  items: { title: string; artist: string; album: string; coverUrl?: string; previewUrl?: string }[],
  mode: "local" | "stream",
): Promise<string> {
  const id = `pl-${Date.now()}`;
  const foundIds: string[] = [];
  const missing: WantedTrack[] = [];
  const streamTracks: Track[] = [];

  for (const it of items) {
    const m = matchTrack({ title: it.title, artist: it.artist, album: it.album, coverUrl: it.coverUrl }, state.tracks);
    if (m.track) {
      foundIds.push(m.track.id);
    } else if (mode === "stream" && it.previewUrl) {
      const sid = `sp-${Date.now()}-${streamTracks.length}`;
      streamTracks.push({
        id: sid,
        title: it.title,
        artist: it.artist,
        album: it.album || name,
        duration: 30,
        src: it.previewUrl,
        cover: it.coverUrl ?? placeholderCover(it.title),
      });
      foundIds.push(sid);
    } else {
      missing.push({
        title: it.title,
        artist: it.artist,
        album: it.album,
        coverUrl: it.coverUrl,
        cover: it.coverUrl,
      });
    }
  }

  set({
    scanned: streamTracks.length ? [...state.scanned, ...streamTracks] : state.scanned,
    playlists: [...state.playlists, { id, name, trackIds: foundIds, missing }],
  });
  persist();
  if (mode === "stream" && missing.length) void enrichMissingInBackground(id);
  if (mode === "local" && missing.length) {
    void resolveAllMissing(id);
  }
  toast(
    `"${name}": ${foundIds.length} listas · ${missing.length} por resolver.` +
      (mode === "stream" ? " (Modo Streaming: MIX y EQ aplican solo a pistas locales)" : ""),
  );
  return id;
}

export async function installYtDlp(): Promise<boolean> {
  toast("Descargando yt-dlp.exe oficial en %LOCALAPPDATA%\\Alify\\bin…");
  try {
    await invoke<string>("install_yt_dlp");
    set({ ytDlpReady: true });
    toast("yt-dlp listo. Ya puedes resolver y descargar canciones.");
    return true;
  } catch (e) {
    toast(`No se pudo descargar yt-dlp: ${String(e)}`);
    return false;
  }
}

type TransferTask = { title:string; wanted?:WantedTrack; run:(id:string)=>Promise<ResolvedEvent> };
interface ActiveTransfer { attempt?:string; intent:"run"|"pause"|"cancel"; wake?:()=>void }
let activeTransfer: ActiveTransfer | undefined;
export const transferInProgress = (job?:TransferState) =>
  !!job && job.mode !== "finished" && job.mode !== "canceled";
const playlistInTransfer = (id:string) => state.transfer?.playlistId === id && transferInProgress(state.transfer);

function updateTransfer(patch: Partial<TransferState>) {
  if (state.transfer) set({transfer:{...state.transfer,...patch}});
}

export async function controlTransfer(action:"pause"|"resume"|"cancel") {
  const active = activeTransfer;
  if (!active || active.intent === "cancel") return;
  if (action === "resume") {
    active.intent = "run";
    updateTransfer({mode:"running",phase:"search",percent:undefined});
    active.wake?.();
  } else {
    active.intent = action;
    updateTransfer({mode:action === "pause" ? (active.attempt ? "pausing" : "paused") : "canceling"});
    active.wake?.();
    if (active.attempt) {
      try { await invoke("interrupt_audio_transfer",{requestId:active.attempt}); }
      catch (error) { toast(String(error)); }
    }
  }
}

async function runTransfers(tasks: TransferTask[], playlistId?:string): Promise<boolean> {
  if (!isDesktop() || !tasks.length) return false;
  if (activeTransfer) { toast("Ya hay una migración en curso."); return false; }
  const active: ActiveTransfer = {intent:"run"};
  activeTransfer = active;
  set({transfer:{playlistId,title:tasks[0].title,phase:"search",done:0,total:tasks.length,failed:0,mode:"running"}});
  let done = 0;
  let failed = 0;
  try {
    for (const task of tasks) {
      let complete = false;
      while (!complete) {
        if (active.intent === "pause") {
          updateTransfer({mode:"paused",percent:undefined});
          await new Promise<void>(resolve=>{active.wake=resolve;});
          active.wake=undefined;
        }
        if (active.intent === "cancel") return false;
        updateTransfer({title:task.title,phase:"search",percent:undefined,mode:"running"});
        const requestId = crypto.randomUUID();
        active.attempt = requestId;
        try {
          await invoke("start_audio_transfer",{requestId});
          if (active.intent !== "run") await invoke("interrupt_audio_transfer",{requestId});
          const result = await task.run(requestId);
          acceptResolved(result, task.wanted);
          complete = true;
        } catch (error) {
          if (active.intent !== "run" || String(error).includes("ALIFY_TRANSFER_INTERRUPTED")) continue;
          failed++;
          complete = true;
          toast(`No se pudo descargar "${task.title}": ${String(error)}`);
        } finally {
          active.attempt = undefined;
        }
      }
      done++;
      updateTransfer({done,failed});
    }
    return failed === 0 && active.intent !== "cancel";
  } finally {
    activeTransfer = undefined;
    updateTransfer({mode:active.intent === "cancel" ? "canceled" : "finished",percent:undefined});
  }
}

export function downloadSingleSong(input: string): Promise<boolean> {
  return runTransfers([{title:input.trim(),run:requestId=>invoke<ResolvedEvent>("resolve_single_song",{input,requestId})}]);
}

function playlistTask(playlistId:string, album:string, wanted:WantedTrack): TransferTask {
  return {title:wanted.title,wanted,run:requestId=>{
    const pending = state.playlists.find(p=>p.id===playlistId)?.missing ?? [];
    const row = pending.find(item=>item.title===wanted.title && item.artist===wanted.artist) ?? wanted;
    return invoke<ResolvedEvent>("resolve_track_audio",{
      playlistId, title:row.title, artist:row.artist ?? "", album,
      coverUrl:row.coverUrl ?? null, lyrics:row.lyrics ?? null, requestId,
    });
  }};
}

export async function resolveMissingTrack(playlistId: string, missingIndex: number): Promise<void> {
  const playlist = state.playlists.find(p=>p.id===playlistId);
  const wanted = playlist?.missing?.[missingIndex];
  if (wanted) await runTransfers([playlistTask(playlistId,playlist.name,wanted)],playlistId);
}

export async function resolveAllMissing(playlistId: string): Promise<void> {
  const playlist = state.playlists.find(p=>p.id===playlistId);
  if (playlist?.missing?.length) await runTransfers(playlist.missing.map(wanted=>playlistTask(playlistId,playlist.name,wanted)),playlistId);
}

export function discardMissingTrack(playlistId:string, index:number): void {
  if (playlistInTransfer(playlistId)) return;
  set({playlists:state.playlists.map(pl=>pl.id===playlistId
    ? {...pl,missing:pl.missing?.filter((_,i)=>i!==index)} : pl)});
  persist();
}

export async function removeDownloadedTrack(track:Track): Promise<boolean> {
  if (!track.path || !track.downloaded || !isDesktop()) return false;
  engine.removeTrack(track.id);
  try {
    await invoke("delete_downloaded_song",{path:track.path});
    removedDownloads.add(track.path);
    set({
      scanned: state.scanned.filter(t=>t.id!==track.id),
      favorites: state.favorites.filter(id=>id!==track.id),
      playlists: state.playlists.map(pl=>({...pl,trackIds:pl.trackIds.filter(id=>id!==track.id)})),
    });
    persist();
    toast("Canción eliminada.");
    return true;
  } catch (error) {
    toast(`No se pudo eliminar la canción: ${String(error)}`);
    return false;
  }
}

export function linkMissingTrack(playlistId: string, missingIndex: number, file: File): void {
  if (playlistInTransfer(playlistId)) return;
  const pl = state.playlists.find((p) => p.id === playlistId);
  const wanted = pl?.missing?.[missingIndex];
  if (!pl || !wanted) return;
  const id = `drop-${Date.now()}-${file.name}`;
  const track: Track = {
    id,
    title: wanted.title,
    artist: wanted.artist ?? "Artista desconocido",
    album: wanted.album ?? pl.name,
    duration: 0,
    src: URL.createObjectURL(file),
    cover: placeholderCover(wanted.title),
  };
  const nextMissing = (pl.missing ?? []).filter((_, idx) => idx !== missingIndex);
  const nextPlaylists = state.playlists.map((p) =>
    p.id === playlistId ? { ...p, trackIds: [...p.trackIds, id], missing: nextMissing } : p,
  );
  set({ scanned: [...state.scanned, track], playlists: nextPlaylists });
  persist();
  toast(`Vinculado "${track.title}" con ${file.name}`);
}

export function updateTrack(id: string, patch: Partial<Track>): void {
  const upd = (list: Track[]) => list.map((t) => (t.id === id ? { ...t, ...patch } : t));
  set({ scanned: upd(state.scanned) });
  engine.updateTrackMeta(id, patch);
}

export function deletePlaylist(id: string): void {
  if (playlistInTransfer(id)) { toast("Cancela o termina la migración de esta playlist antes de eliminarla."); return; }
  set({ playlists: state.playlists.filter((p) => p.id !== id) });
  persist();
}

export function createPlaylist(name?: string, trackIds: string[] = []): string {
  const id = `pl-${crypto.randomUUID()}`;
  const title = name?.trim() || `Mi playlist ${state.playlists.length + 1}`;
  // Se inserta al inicio para aparecer justo debajo de "Me gustas"
  set({ playlists: [{ id, name: title, trackIds: [...new Set(trackIds)] }, ...state.playlists] });
  persist();
  toast(`Playlist "${title}" creada`);
  return id;
}

export function addTrackToPlaylist(playlistId: string, trackId: string): void {
  set({
    playlists: state.playlists.map((p) =>
      p.id === playlistId && !p.trackIds.includes(trackId)
        ? { ...p, trackIds: [...p.trackIds, trackId] }
        : p,
    ),
  });
  persist();
}

export function moveTrackToPlaylist(trackId: string, targetPlaylistId: string, sourcePlaylistId?: string): void {
  const target = state.playlists.find((p) => p.id === targetPlaylistId);
  if (!target) return;
  set({
    playlists: state.playlists.map((p) => {
      if (p.id === targetPlaylistId) {
        return p.trackIds.includes(trackId) ? p : { ...p, trackIds: [...p.trackIds, trackId] };
      }
      if (sourcePlaylistId && p.id === sourcePlaylistId) {
        return { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) };
      }
      return p;
    }),
  });
  persist();
  toast(`Canción movida a "${target.name}"`);
}
