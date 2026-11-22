/**
 * Importador local de playlists (My Tune Music: .csv/.txt/.json, y .m3u/.m3u8)
 * con fuzzy matching contra la biblioteca local. 100% offline.
 */
import type { Track } from "./audioEngine";

export interface WantedTrack {
  title: string;
  artist?: string;
  album?: string;
  /** ruta/nombre de archivo (M3U) */
  path?: string;
  /** URL de portada extraída o consultada */
  coverUrl?: string;
  /** carátula en caché local (data URL o asset) */
  cover?: string;
  /** letra sincronizada (.lrc) descargada */
  lyrics?: string;
}

export interface MatchResult {
  wanted: WantedTrack;
  track: Track | null;
  score: number;
}

export interface ImportResult {
  name: string;
  matches: MatchResult[];
  tracks: Track[];
  missing: WantedTrack[];
}

// ---------- normalización y similitud ----------
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\((?:[^)]*)(?:feat|ft|remaster|remastered|live|version|edit|deluxe)[^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b(feat|ft)\.?\b.*$/, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshteinRatio(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

function tokenScore(a: string, b: string): number {
  const ta = new Set(a.split(" ").filter(Boolean));
  const tb = new Set(b.split(" ").filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  ta.forEach((t) => tb.has(t) && inter++);
  return inter / Math.min(ta.size, tb.size) * 0.5 + inter / Math.max(ta.size, tb.size) * 0.5;
}

export function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  return Math.max(levenshteinRatio(na, nb), tokenScore(na, nb) * 0.95);
}

const baseName = (p: string) =>
  normalize((p.split(/[\\/]/).pop() ?? p).replace(/\.[a-z0-9]{2,4}$/i, ""));

export function matchTrack(w: WantedTrack, library: Track[], threshold = 0.62): MatchResult {
  let best: Track | null = null;
  let bestScore = 0;
  const wantedFull = [w.artist, w.title].filter(Boolean).join(" ");
  const wp = w.path ? baseName(w.path) : "";

  for (const t of library) {
    let s = 0;
    if (wp) {
      const tp = t.path ? baseName(t.path) : "";
      if (tp && tp === wp) s = 1;
    }
    if (s < 1) {
      const titleS = similarity(w.title, t.title);
      const fullS = similarity(wantedFull, `${t.artist} ${t.title}`);
      const rev = similarity(wantedFull, `${t.title} ${t.artist}`);
      s = Math.max(fullS, rev);
      if (w.artist) {
        const artistS = similarity(w.artist, t.artist);
        s = Math.max(s, titleS * 0.75 + artistS * 0.25);
        if (artistS < 0.3) s *= 0.8; // mismo título pero otro artista
      } else {
        s = Math.max(s, titleS * 0.95);
      }
      if (wp) s = Math.max(s, similarity(wp, `${t.artist} ${t.title}`), similarity(wp, t.title));
    }
    if (s > bestScore) {
      bestScore = s;
      best = t;
    }
  }
  return bestScore >= threshold ? { wanted: w, track: best, score: bestScore } : { wanted: w, track: null, score: bestScore };
}

// ---------- parsers de formato ----------
export function parseCSV(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const first = clean.split(/\r?\n/, 1)[0] ?? "";
  const delim = [",", ";", "\t"].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (q) {
      if (c === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const TITLE_KEYS = ["title", "track", "track name", "trackname", "song", "song name", "name", "titulo", "título", "cancion", "canción"];
const ARTIST_KEYS = ["artist", "artists", "artist name", "artista", "artistas", "author"];
const ALBUM_KEYS = ["album", "álbum", "album name"];

function fromCSV(text: string): WantedTrack[] {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const find = (keys: string[]) => head.findIndex((h) => keys.includes(h));
  const ti = find(TITLE_KEYS);
  if (ti < 0) {
    // sin cabecera: columnas "título, artista" o "artista, título"
    return rows.map((r) => ({ title: (r[0] ?? "").trim(), artist: (r[1] ?? "").trim() || undefined })).filter((w) => w.title);
  }
  const ai = find(ARTIST_KEYS);
  const bi = find(ALBUM_KEYS);
  return rows
    .slice(1)
    .map((r) => ({
      title: (r[ti] ?? "").trim(),
      artist: ai >= 0 ? (r[ai] ?? "").split(/[;,]/)[0].trim() || undefined : undefined,
      album: bi >= 0 ? (r[bi] ?? "").trim() || undefined : undefined,
    }))
    .filter((w) => w.title);
}

function splitArtistTitle(line: string): WantedTrack {
  const m = /^(.+?)\s+[-–—]\s+(.+)$/.exec(line);
  // Convención "Artista - Título"; el matcher también prueba el orden inverso.
  return m ? { artist: m[1].trim(), title: m[2].trim() } : { title: line.trim() };
}

function fromTXT(text: string): WantedTrack[] {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*\d+[.)]\s+/, "").trim())
    .filter((l) => l && !l.startsWith("#"))
    .map(splitArtistTitle);
}

function strOf(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return strOf(v[0]);
  if (v && typeof v === "object") return strOf((v as Record<string, unknown>).name);
  return undefined;
}

function fromJSON(text: string): { name?: string; tracks: WantedTrack[] } {
  const data = JSON.parse(text.replace(/^\uFEFF/, ""));
  let name: string | undefined;
  let list: unknown[] = [];
  if (Array.isArray(data)) list = data;
  else if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    name = strOf(o.name) ?? strOf(o.title) ?? strOf(o.playlist);
    const arr = o.tracks ?? o.songs ?? o.items ?? o.playlist ?? (Array.isArray(o.playlists) ? (o.playlists[0] as Record<string, unknown>)?.tracks : undefined);
    if (Array.isArray(arr)) list = arr;
  }
  const tracks: WantedTrack[] = [];
  for (const it of list) {
    if (typeof it === "string") tracks.push(splitArtistTitle(it));
    else if (it && typeof it === "object") {
      const o = it as Record<string, unknown>;
      const inner = (o.track && typeof o.track === "object" ? o.track : o) as Record<string, unknown>;
      const title = strOf(inner.title) ?? strOf(inner.name) ?? strOf(inner.track) ?? strOf(inner.song);
      if (title) tracks.push({ title, artist: strOf(inner.artist) ?? strOf(inner.artists) ?? strOf(inner.author), album: strOf(inner.album) });
    }
  }
  return { name, tracks };
}

function fromM3U(text: string): WantedTrack[] {
  const out: WantedTrack[] = [];
  let info: WantedTrack | null = null;
  for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith("#EXTINF:")) {
      const comma = l.indexOf(",");
      info = comma >= 0 ? splitArtistTitle(l.slice(comma + 1)) : null;
    } else if (!l.startsWith("#")) {
      const decoded = (() => {
        try {
          return decodeURIComponent(l.replace(/^file:\/\/\/?/i, ""));
        } catch {
          return l;
        }
      })();
      const fallback = splitArtistTitle((decoded.split(/[\\/]/).pop() ?? decoded).replace(/\.[a-z0-9]{2,4}$/i, ""));
      out.push({ ...(info ?? fallback), title: (info ?? fallback).title, path: decoded });
      info = null;
    }
  }
  return out;
}

export function parseWanted(text: string, filename: string): { name: string; wanted: WantedTrack[] } {
  const ext = (filename.split(".").pop() ?? "").toLowerCase();
  const base = filename.replace(/\.[^.]+$/, "");
  switch (ext) {
    case "csv":
      return { name: base, wanted: fromCSV(text) };
    case "json": {
      const j = fromJSON(text);
      return { name: j.name ?? base, wanted: j.tracks };
    }
    case "m3u":
    case "m3u8":
      return { name: base, wanted: fromM3U(text) };
    default:
      return { name: base, wanted: fromTXT(text) };
  }
}

export function importPlaylist(text: string, filename: string, library: Track[]): ImportResult {
  const { name, wanted } = parseWanted(text, filename);
  const matches = wanted.map((w) => matchTrack(w, library));
  return {
    name,
    matches,
    tracks: matches.filter((m) => m.track).map((m) => m.track as Track),
    missing: matches.filter((m) => !m.track).map((m) => m.wanted),
  };
}
