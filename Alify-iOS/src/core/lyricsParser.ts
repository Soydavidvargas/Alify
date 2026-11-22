/** Parser de letras: .lrc sincronizado, letras ID3 (USLT con marcas) y texto plano. */

export interface LyricLine {
  /** segundos; -1 si la letra no está sincronizada */
  time: number;
  text: string;
}

export interface ParsedLyrics {
  synced: boolean;
  lines: LyricLine[];
  meta: Record<string, string>;
}

const TS = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
const META = /^\[([a-zA-Z#]+):(.*)\]$/;

function toSeconds(m: string, s: string, f?: string): number {
  const frac = f ? parseInt(f, 10) / Math.pow(10, f.length) : 0;
  return parseInt(m, 10) * 60 + parseInt(s, 10) + frac;
}

export function parseLyrics(raw: string | undefined | null): ParsedLyrics {
  const empty: ParsedLyrics = { synced: false, lines: [], meta: {} };
  if (!raw || !raw.trim()) return empty;
  const text = raw.replace(/^\uFEFF/, "");
  const meta: Record<string, string> = {};
  const lines: LyricLine[] = [];
  let anySync = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const mm = META.exec(line);
    if (mm && !/^\d/.test(mm[1])) {
      meta[mm[1].toLowerCase()] = mm[2].trim();
      continue;
    }
    const stamps: number[] = [];
    TS.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = TS.exec(line))) stamps.push(toSeconds(m[1], m[2], m[3]));
    // quita marcas de tiempo y marcas de palabra enhanced <mm:ss.xx>
    const content = line.replace(TS, "").replace(/<\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?>/g, "").trim();
    if (stamps.length) {
      anySync = true;
      for (const t of stamps) lines.push({ time: t, text: content });
    } else {
      lines.push({ time: -1, text: content });
    }
  }

  if (anySync) {
    const offset = (parseInt(meta.offset, 10) || 0) / 1000;
    const synced = lines.filter((line) => line.time >= 0)
      .map((line) => ({ ...line, time: line.time - offset }))
      .sort((a, b) => a.time - b.time);
    return { synced: true, lines: synced, meta };
  }
  return { synced: false, lines, meta };
}

/** Índice de la línea activa para el instante `t` (búsqueda binaria). -1 antes de la primera. */
export function activeLineIndex(lines: LyricLine[], t: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}
