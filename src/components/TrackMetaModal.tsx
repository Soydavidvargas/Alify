import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Track } from "../core/audioEngine";
import { isDesktop } from "../core/bridge";
import { toast, updateTrack } from "../library";

export async function exportCompleteSong(t: Track): Promise<void> {
  if (!isDesktop() || !t.path) {
    toast("Solo se pueden exportar archivos locales desde la app de escritorio.");
    return;
  }
  const { open } = await import("@tauri-apps/plugin-dialog");
  const destDir = await open({ directory: true, multiple: false, title: "Carpeta destino para exportar" });
  if (typeof destDir !== "string") return;
  try {
    const out = await invoke<string>("export_song", {
      src: t.path,
      destDir,
      title: t.title,
      artist: t.artist,
      album: t.album,
      year: t.year ?? null,
      cover: t.cover ?? null,
      lyrics: t.lyrics ?? null,
    });
    toast(`Canción exportada con metadatos en: ${out}`);
  } catch (e) {
    toast(`Error al exportar: ${String(e)}`);
  }
}

export function TrackMetaModal({ track, onClose }: { track: Track; onClose: () => void }) {
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [album, setAlbum] = useState(track.album);
  const [year, setYear] = useState(track.year ? String(track.year) : "");
  const [cover, setCover] = useState(track.cover ?? "");
  const [lyrics, setLyrics] = useState(track.lyrics ?? "");
  const [busy, setBusy] = useState<"cover" | "lyrics" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const imgInput = useRef<HTMLInputElement>(null);

  const findCover = async () => {
    if (!isDesktop()) return setMsg("Disponible solo en escritorio.");
    setBusy("cover");
    setMsg(null);
    try {
      const dataUrl = await invoke<string>("search_cover", { title, artist, album });
      setCover(dataUrl);
      setMsg("Carátula encontrada en Cover Art Archive.");
    } catch (e) {
      setMsg(String(e));
    } finally {
      setBusy(null);
    }
  };

  const findLyrics = async () => {
    if (!isDesktop()) return setMsg("Disponible solo en escritorio.");
    setBusy("lyrics");
    setMsg(null);
    try {
      const res = await invoke<{ synced: boolean; text: string }>("search_lyrics", {
        title,
        artist,
        album,
        duration: track.duration,
      });
      setLyrics(res.text);
      setMsg(res.synced ? "Letra sincronizada (.lrc) encontrada en LRCLIB." : "Letra encontrada en LRCLIB.");
    } catch (e) {
      setMsg(String(e));
    } finally {
      setBusy(null);
    }
  };

  const save = () => {
    const parsedYear = parseInt(year, 10);
    const patch: Partial<Track> = {
      title: title.trim() || track.title,
      artist: artist.trim() || track.artist,
      album: album.trim() || track.album,
      year: isFinite(parsedYear) ? parsedYear : undefined,
      cover: cover || undefined,
      lyrics: lyrics || undefined,
    };
    updateTrack(track.id, patch);
    toast("Metadatos actualizados.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Editar metadatos">
      <div className="panel flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden shadow-2xl" style={{ background: "var(--c-bg)", backdropFilter: "blur(28px)", border: "1px solid var(--c-line)" }}>
        <header className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "var(--c-line)" }}>
          <h2 className="text-base font-bold">Editar metadatos · Carátula y Letra</h2>
          <button className="icon-btn !h-8 !w-8" aria-label="Cerrar" onClick={onClose}>✕</button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 text-xs">
          {msg && <p className="rounded bg-white/10 px-3 py-2 text-xs">{msg}</p>}

          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="h-32 w-32 overflow-hidden rounded-lg border" style={{ borderColor: "var(--c-line)", background: "var(--c-panel-strong)" }}>
                {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
              </div>
              <button className="btn-ghost !py-1 text-[11px]" onClick={() => imgInput.current?.click()}>Imagen local</button>
              <button className="btn-ghost !py-1 text-[11px]" disabled={busy !== null} onClick={findCover}>
                {busy === "cover" ? "Buscando…" : "Cover Art Archive"}
              </button>
              <input
                ref={imgInput}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => typeof reader.result === "string" && setCover(reader.result);
                  reader.readAsDataURL(f);
                }}
              />
            </div>

            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="t-muted">Título</span>
                <input className="input !rounded-lg" value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="t-muted">Artista</span>
                <input className="input !rounded-lg" value={artist} onChange={(e) => setArtist(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="t-muted">Álbum</span>
                <input className="input !rounded-lg" value={album} onChange={(e) => setAlbum(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="t-muted">Año</span>
                <input className="input !rounded-lg" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
              </label>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="t-muted">Letra (.lrc sincronizada o texto plano)</span>
              <button className="btn-ghost !py-1 text-[11px]" disabled={busy !== null} onClick={findLyrics}>
                {busy === "lyrics" ? "Buscando…" : "Buscar en LRCLIB"}
              </button>
            </div>
            <textarea
              className="input h-44 w-full resize-y !rounded-lg font-mono text-[11px]"
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="[00:12.00] Verso sincronizado..."
            />
          </div>
        </div>

        <footer className="flex items-center justify-between border-t px-5 py-3" style={{ borderColor: "var(--c-line)" }}>
          <button
            className="btn-ghost"
            onClick={() => void exportCompleteSong({ ...track, title, artist, album, year: parseInt(year, 10) || undefined, cover: cover || undefined, lyrics: lyrics || undefined })}
          >
            Exportar canción completa
          </button>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Guardar cambios</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
