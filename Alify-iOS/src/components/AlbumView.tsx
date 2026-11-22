import { useEffect, useMemo, useRef, useState } from "react";
import type { Track } from "../core/audioEngine";
import type { WantedTrack } from "../core/importer";
import { IHeart, IMore, IPencil, IPlay, IPlus, IShuffle, IShuffleAll } from "../icons";
import {
  addTrackToPlaylist,
  createPlaylist,
  discardMissingTrack,
  installYtDlp,
  linkMissingTrack,
  moveTrackToPlaylist,
  playAllSongsRandom,
  resolveAllMissing,
  resolveMissingTrack,
  removeDownloadedTrack,
  toggleFavorite,
  transferInProgress,
  updateCollectionMeta,
  useLibrary,
} from "../library";
import { engine, useEngine } from "../player";
import { fmtTime, fmtTotal } from "./TitleBar";
import { exportCompleteSong, TrackMetaModal } from "./TrackMetaModal";
import { exportForAndroid } from "./exportForAndroid";
import { MigrationProgress } from "./MigrationProgress";
import { isDesktop } from "../core/bridge";

export function TrackRow({ t, i, tracks, playlistId }: { t: Track; i: number; tracks: Track[]; playlistId?: string }) {
  const es = useEngine();
  const lib = useLibrary();
  const [menu, setMenu] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [selection, setSelection] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number>();
  const held = useRef(false);
  const origin = useRef({x:0,y:0});
  const active = es.track?.id === t.id;
  const clearHold = () => window.clearTimeout(holdTimer.current);
  useEffect(()=>clearHold,[]);
  useEffect(()=>{
    if (!menu) return;
    const outside = (event:PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
    };
    const escape = (event:KeyboardEvent) => { if (event.key === "Escape") setMenu(false); };
    document.addEventListener("pointerdown",outside);
    document.addEventListener("keydown",escape);
    return ()=>{
      document.removeEventListener("pointerdown",outside);
      document.removeEventListener("keydown",escape);
    };
  },[menu]);
  return (
    <>
      <div
        className={`row relative cursor-pointer transition-colors ${active ? "row-active" : ""}`}
        onContextMenu={event=>{event.preventDefault(); setMenu(true);}}
        onPointerDown={event=>{
          held.current = false;
          if (event.pointerType === "mouse" || (event.target instanceof Element && event.target.closest("button"))) return;
          origin.current = {x:event.clientX,y:event.clientY};
          holdTimer.current = window.setTimeout(()=>{held.current=true;setMenu(true);},520);
        }}
        onPointerMove={event=>{
          if (Math.hypot(event.clientX-origin.current.x,event.clientY-origin.current.y)>10) clearHold();
        }}
        onPointerUp={clearHold} onPointerCancel={clearHold} onPointerLeave={clearHold}
        onClick={() => { if (!held.current) engine.setQueue(tracks, i); }}
      >
        <button
          className="text-right text-xs t-muted"
          aria-label={`Reproducir ${t.title}`}
          onClick={(e) => {
            e.stopPropagation();
            engine.setQueue(tracks, i);
          }}
        >
          {active && es.playing ? <span className="eq on"><i /><i /><i /></span> : i + 1}
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 flex-none overflow-hidden rounded-md" style={{ background: "var(--c-panel-strong)", border: "1px solid var(--c-line)" }}>
            {t.cover && <img src={t.cover} alt="" className="h-full w-full object-cover" loading="lazy" />}
          </div>
          <div className="min-w-0">
            <div className="row-title truncate font-medium">{t.title}</div>
            <div className="truncate text-xs t-muted">{t.artist}</div>
          </div>
        </div>
        <span className="text-right text-xs t-muted">{fmtTime(t.duration)}</span>
        <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            className="icon-btn !h-7 !w-7"
            aria-label={`Más opciones de ${t.title}`}
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <IMore />
          </button>
          {menu && (
            <div role="menu" onClick={()=>setMenu(false)} className="panel absolute right-0 top-8 z-20 w-64 overflow-hidden py-1 text-sm shadow-2xl" style={{ background: "var(--c-bg)", backdropFilter: "blur(24px)", border: "1px solid var(--c-line)" }}>
              <button role="menuitem" className="nav-item w-full" onClick={() => engine.setQueue(tracks, i)}>Reproducir</button>
              <button role="menuitem" className="nav-item w-full" onClick={() => engine.addToQueue(t)}>Añadir a la cola</button>
              <button role="menuitem" className="nav-item w-full" onClick={() => engine.addToQueue(t,true)}>Reproducir después</button>
              <button role="menuitem" className="nav-item w-full" onClick={() => toggleFavorite(t.id)}>
                {lib.favorites.includes(t.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
              </button>
              <div className="my-1 border-t" style={{ borderColor: "var(--c-line)" }} />
              <button role="menuitem" className="nav-item w-full text-left" onClick={() => setMoveOpen(true)}>
                Mover canción
              </button>
              <button role="menuitem" className="nav-item w-full text-left" onClick={() => {setSelection([t.id]);setFilter("");setName("");setCreating(true);}}>
                Crear playlist con esta canción
              </button>
              <button role="menuitem" className="nav-item w-full text-left" onClick={() => setEditing(true)}>
                Editar metadatos / Buscar carátula y letra
              </button>
              <button role="menuitem" className="nav-item w-full text-left" onClick={() => void exportCompleteSong(t)}>
                Exportar canción completa
              </button>
              {isDesktop() && t.path && <button role="menuitem" className="nav-item w-full text-left" onClick={()=>void exportForAndroid(t.title,[t])}>Exportar canción para Android</button>}
              {t.downloaded && <button role="menuitem" className="nav-item w-full text-left" onClick={()=>setConfirmDelete(true)}>Eliminar canción descargada</button>}
            </div>
          )}
        </div>
      </div>
      {moveOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Mover canción a playlist"
          onClick={(e) => {
            e.stopPropagation();
            setMoveOpen(false);
          }}
        >
          <div
            className="panel w-full max-w-sm space-y-3 p-5 shadow-2xl"
            style={{ background: "var(--c-bg)", backdropFilter: "blur(28px)", border: "1px solid var(--c-line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold">Mover "{t.title}" a…</h2>
            {!lib.playlists.length ? (
              <p className="text-xs t-muted">Aún no tienes playlists. Crea una con "Crear playlist" en la barra lateral.</p>
            ) : (
              <div className="max-h-60 space-y-1.5 overflow-y-auto">
                {lib.playlists.map((pl) => (
                  <button
                    key={pl.id}
                    className="nav-item w-full justify-between text-xs"
                    onClick={() => {
                      moveTrackToPlaylist(t.id, pl.id, playlistId);
                      setMoveOpen(false);
                    }}
                  >
                    <span className="truncate font-medium">{pl.name}</span>
                    <span className="t-muted">{pl.trackIds.length} pistas</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <button className="btn-ghost !py-1 text-xs" onClick={() => setMoveOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      {editing && <TrackMetaModal track={t} onClose={() => setEditing(false)} />}
      {confirmDelete && <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-label="Eliminar canción">
        <section className="panel w-full max-w-sm space-y-3 p-5" style={{background:"var(--c-bg)"}}>
          <h2 className="font-bold">Eliminar «{t.title}»</h2>
          <p className="text-sm t-muted">Se borrará el archivo del equipo y se quitará de la biblioteca y de todas sus playlists.</p>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" disabled={deleting} onClick={()=>setConfirmDelete(false)}>Cancelar</button>
            <button className="btn-primary" disabled={deleting} onClick={async()=>{
              setDeleting(true);
              try { await removeDownloadedTrack(t); setConfirmDelete(false); }
              finally { setDeleting(false); }
            }}>{deleting ? "Eliminando…" : "Eliminar canción"}</button>
          </div>
        </section>
      </div>}
      {creating && <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-label="Crear playlist">
        <form className="panel w-full max-w-md space-y-3 p-5" style={{background:"var(--c-bg)"}} onSubmit={event=>{
          event.preventDefault();
          if (!name.trim() || !selection.length) return;
          createPlaylist(name,selection);
          setCreating(false);
        }}>
          <h2 className="font-bold">Crear playlist con esta canción</h2>
          <label className="block text-xs">Nombre<input autoFocus className="input mt-1 block w-full" maxLength={80} value={name} onChange={event=>setName(event.target.value)}/></label>
          <input className="input w-full" type="search" aria-label="Buscar canciones" placeholder="Buscar canciones" value={filter} onChange={event=>setFilter(event.target.value)}/>
          <div className="max-h-[30dvh] space-y-2 overflow-auto">
            {lib.tracks.filter(track=>`${track.title} ${track.artist}`.toLowerCase().includes(filter.trim().toLowerCase())).map(track=>
              <label key={track.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selection.includes(track.id)}
                onChange={event=>setSelection(ids=>event.target.checked ? [...ids,track.id] : ids.filter(id=>id!==track.id))}/>
                <span>{track.title} <span className="t-muted">· {track.artist}</span></span>
              </label>)}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={()=>setCreating(false)}>Cancelar</button>
            <button className="btn-primary" disabled={!name.trim() || !selection.length}>Guardar playlist</button>
          </div>
        </form>
      </div>}
    </>
  );
}

export function TrackList({ tracks, all, playlistId }: { tracks: Track[]; all?: Track[]; playlistId?: string }) {
  return (
    <div role="list">
      {tracks.map((t) => (
        <TrackRow key={t.id} t={t} i={(all ?? tracks).indexOf(t)} tracks={all ?? tracks} playlistId={playlistId} />
      ))}
    </div>
  );
}

function MissingRow({ w, idx, playlistId }: { w: WantedTrack; idx: number; playlistId: string }) {
  const lib = useLibrary();
  const [over, setOver] = useState(false);
  const busy = transferInProgress(lib.transfer);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && !busy) linkMissingTrack(playlistId, idx, f);
      }}
      className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2 text-xs transition-colors"
      style={{
        borderColor: over ? "var(--c-accent)" : "var(--c-line)",
        background: over ? "var(--c-panel-strong)" : "transparent",
        opacity: over || busy ? 1 : 0.78,
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-9 w-9 flex-none overflow-hidden rounded" style={{ background: "var(--c-panel-strong)" }}>
          {w.cover && <img src={w.cover} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0">
          <div className="truncate font-medium">{w.title}</div>
          <div className="truncate t-muted">{w.artist ?? "Artista desconocido"}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden rounded-full border px-2.5 py-0.5 text-[11px] t-muted sm:inline" style={{ borderColor: "var(--c-line)" }}>
          {over ? "Suelta para vincular" : "Falta audio · suelta .mp3/.flac"}
        </span>
        <button
          className="btn-ghost !py-1 !px-3 text-[11px]"
          disabled={busy}
          onClick={() => void resolveMissingTrack(playlistId, idx)}
        >
          Descargar
        </button>
        <button className="btn-ghost !py-1 !px-3 text-[11px]" disabled={busy}
          aria-label={`Quitar ${w.title} de pendientes`} onClick={()=>discardMissingTrack(playlistId,idx)}>Quitar</button>
      </div>
    </div>
  );
}

export function AlbumView({
  title,
  subtitle,
  tracks,
  playlistId,
  collectionId,
  customIcon,
  missing,
}: {
  title: string;
  subtitle?: string;
  tracks: Track[];
  playlistId?: string;
  collectionId?: string;
  customIcon?: string;
  missing?: WantedTrack[];
}) {
  const lib = useLibrary();
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [addFilter, setAddFilter] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState(title);
  const [draftIcon, setDraftIcon] = useState<string | undefined>(customIcon);
  const iconInput = useRef<HTMLInputElement>(null);
  const targetId = collectionId ?? playlistId ?? "home";
  async function exportCollection() {
    setExporting(true);
    try {
      await exportForAndroid(title,tracks);
    }
    finally { setExporting(false); }
  }

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? tracks.filter((t) => `${t.title} ${t.artist}`.toLowerCase().includes(n)) : tracks;
  }, [q, tracks]);
  const artists = [...new Set(tracks.map((t) => t.artist))];
  const year = tracks.find((t) => t.year)?.year;
  const total = tracks.reduce((a, t) => a + t.duration, 0);
  const cover = customIcon ?? tracks.find((t) => t.cover)?.cover;
  return (
    <div className="h-full overflow-y-auto p-6">
      <header className="flex flex-wrap items-end gap-6">
        <div
          className="group relative h-44 w-44 flex-none overflow-hidden shadow-2xl"
          style={{ borderRadius: "var(--v-radius)", background: "var(--c-panel-strong)", border: "1px solid var(--c-line)" }}
        >
          {cover && <img src={cover} alt={`Portada de ${title}`} className="h-full w-full object-cover" />}
          <button
            className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Cambiar icono y nombre"
            title="Cambiar icono y nombre"
            onClick={() => {
              setDraftName(title);
              setDraftIcon(customIcon);
              setEditOpen(true);
            }}
          >
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
              <IPencil width={14} height={14} /> Editar
            </span>
          </button>
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest t-muted">Álbum / Lista</p>
          <div className="flex items-center gap-2.5">
            <h1 className="truncate text-4xl font-bold">{title}</h1>
            <button
              className="icon-btn !h-8 !w-8 shrink-0"
              aria-label={`Cambiar nombre o icono de ${title}`}
              title="Cambiar nombre e icono"
              onClick={() => {
                setDraftName(title);
                setDraftIcon(customIcon);
                setEditOpen(true);
              }}
            >
              <IPencil width={16} height={16} />
            </button>
          </div>
          <p className="mt-1 text-sm t-muted">
            {subtitle ?? (artists.length > 2 ? "Varios artistas" : artists.join(", "))}
            {year ? ` · ${year}` : ""} · {tracks.length} pistas · {fmtTotal(total)}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button className="btn-ghost" disabled={exporting || !tracks.some(track=>track.path)} onClick={()=>void exportCollection()}>
              {exporting ? "Exportando…" : "Exportar para Android"}
            </button>
            <button className="btn-primary" disabled={!tracks.length} onClick={() => { engine.setShuffle(false); engine.setQueue(tracks, 0); }}>
              <IPlay /> Play all
            </button>
            <button className="btn-ghost" disabled={!tracks.length} onClick={() => { engine.setShuffle(true); engine.setQueue(tracks, Math.floor(Math.random() * tracks.length)); }} title="Aleatorio en esta lista">
              <IShuffle /> Aleatorio
            </button>
            <button
              className="btn-ghost"
              disabled={!lib.tracks.length}
              onClick={() => playAllSongsRandom()}
              title="Reproducir todas las canciones de todas las playlists y biblioteca en aleatorio"
            >
              <IShuffleAll /> Aleatorio Todo
            </button>
            {playlistId && (
              <button className="btn-ghost" onClick={() => setAddOpen(true)}>
                <IPlus width={16} height={16} /> Agregar canciones de biblioteca
              </button>
            )}
            {playlistId && !!missing?.length && (
              <button className="btn-primary" disabled={transferInProgress(lib.transfer)} onClick={() => void resolveAllMissing(playlistId)}>
                Resolver y descargar canciones faltantes ({missing.length})
              </button>
            )}
            {playlistId && !!missing?.length && lib.ytDlpReady === false && (
              <button className="btn-ghost" onClick={() => void installYtDlp()}>
                Instalar yt-dlp (1 clic)
              </button>
            )}
            <input className="input w-52" type="search" placeholder="Buscar en el álbum" aria-label="Buscar en el álbum" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </header>
      <MigrationProgress playlistId={playlistId} all={collectionId === "home"}/>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Personalizar lista">
          <div className="panel w-full max-w-md space-y-4 p-5 shadow-2xl" style={{ background: "var(--c-bg)", backdropFilter: "blur(28px)", border: "1px solid var(--c-line)" }}>
            <h2 className="text-base font-bold">Personalizar nombre e icono</h2>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 flex-none overflow-hidden rounded-xl border" style={{ borderColor: "var(--c-line)", background: "var(--c-panel-strong)" }}>
                {(draftIcon ?? cover) && <img src={draftIcon ?? cover} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-col gap-2 text-xs">
                <button className="btn-ghost !py-1.5" onClick={() => iconInput.current?.click()}>
                  Elegir icono desde tu dispositivo
                </button>
                {draftIcon && (
                  <button className="btn-ghost !py-1 text-xs" onClick={() => setDraftIcon(undefined)}>
                    Restaurar icono por defecto
                  </button>
                )}
                <input
                  ref={iconInput}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => typeof reader.result === "string" && setDraftIcon(reader.result);
                    reader.readAsDataURL(f);
                  }}
                />
              </div>
            </div>
            <label className="flex flex-col gap-1 text-xs">
              <span className="t-muted">Nombre</span>
              <input
                autoFocus
                className="input !rounded-lg"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setEditOpen(false)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={() => {
                  updateCollectionMeta(targetId, { name: draftName, icon: draftIcon });
                  setEditOpen(false);
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-6">
        {shown.length ? <TrackList tracks={shown} all={tracks} playlistId={collectionId === "home" ? undefined : playlistId} /> : !missing?.length && <p className="t-muted">Sin canciones. Agrega una carpeta en Configuración.</p>}
      </div>

      {addOpen && playlistId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Agregar canciones de biblioteca">
          <div className="panel flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden p-5 shadow-2xl" style={{ background: "var(--c-bg)", backdropFilter: "blur(28px)", border: "1px solid var(--c-line)" }}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Agregar canciones de tu biblioteca</h2>
              <button className="icon-btn !h-7 !w-7" onClick={() => setAddOpen(false)}>✕</button>
            </div>
            <input
              autoFocus
              className="input mb-3 w-full !rounded-lg"
              type="search"
              placeholder="Buscar canción o artista..."
              value={addFilter}
              onChange={(e) => setAddFilter(e.target.value)}
            />
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
              {lib.tracks
                .filter((t) => `${t.title} ${t.artist}`.toLowerCase().includes(addFilter.trim().toLowerCase()))
                .map((t) => {
                  const already = tracks.some((x) => x.id === t.id);
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--c-line)" }}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="h-8 w-8 flex-none overflow-hidden rounded" style={{ background: "var(--c-panel-strong)" }}>
                          {t.cover && <img src={t.cover} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{t.title}</div>
                          <div className="truncate t-muted">{t.artist}</div>
                        </div>
                      </div>
                      <button
                        className={already ? "btn-ghost !py-1 !px-3 text-[11px]" : "btn-primary !py-1 !px-3 text-[11px]"}
                        disabled={already}
                        onClick={() => addTrackToPlaylist(playlistId, t.id)}
                      >
                        {already ? "Agregada" : "Agregar"}
                      </button>
                    </div>
                  );
                })}
              {!lib.tracks.length && <p className="py-6 text-center text-xs t-muted">No hay canciones en tu biblioteca.</p>}
            </div>
          </div>
        </div>
      )}
      {playlistId && !!missing?.length && (
        <section className="mt-6 space-y-2" aria-label="Pistas pendientes de archivo local">
          <h2 className="text-xs font-semibold uppercase tracking-wider t-muted">Pendientes ({missing.length}) · Arrastra un archivo local encima</h2>
          {missing.map((w, idx) => (
            <MissingRow key={`${w.title}-${idx}`} w={w} idx={idx} playlistId={playlistId} />
          ))}
        </section>
      )}
    </div>
  );
}

export function FavMark({ id }: { id: string }) {
  const lib = useLibrary();
  const on = lib.favorites.includes(id);
  return (
    <button className="icon-btn !h-8 !w-8" aria-label={on ? "Quitar de favoritos" : "Añadir a favoritos"} aria-pressed={on} onClick={() => toggleFavorite(id)}>
      <IHeart width={18} height={18} filled={on} />
    </button>
  );
}
