import { useRef, useState, useSyncExternalStore } from "react";
import { INext, IPause, IPlay, IPrev, IDice, IShuffle } from "../icons";
import { getLibraryTracks, playAllSongsRandom } from "../library";
import { engine, useEngine } from "../player";

/** Mini-Player flotante arrastrable dentro de la app (Android). En Windows se usa la ventana nativa. */
let visible = false;
const subs = new Set<() => void>();
export const toggleMini = (): void => {
  visible = !visible;
  subs.forEach((f) => f());
};
const useVisible = () => useSyncExternalStore((l) => (subs.add(l), () => subs.delete(l)), () => visible);

export function MiniPlayer() {
  const show = useVisible();
  const s = useEngine();
  const [pos, setPos] = useState({ x: 12, y: 120 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  if (!show) return null;
  const t = s.track;
  return (
    <div
      className="float-shell mini-player fixed z-50 !h-auto !w-[min(92vw,340px)] touch-none rounded-2xl shadow-2xl"
      style={{ left: pos.x, top: pos.y, background: "var(--c-bg)", border: "1px solid var(--c-line)", backdropFilter: "blur(18px)", WebkitAppRegion: "no-drag" } as React.CSSProperties}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        setPos({
          x: Math.min(Math.max(0, e.clientX - drag.current.dx), window.innerWidth - 120),
          y: Math.min(Math.max(0, e.clientY - drag.current.dy), window.innerHeight - 80),
        });
      }}
      onPointerUp={() => (drag.current = null)}
      role="region"
      aria-label="Mini reproductor flotante"
    >
      {t?.cover && <img className="fl-cover !h-12 !w-12" src={t.cover} alt="" />}
      <div className="fl-info min-w-0 flex-1">
        <div className="fl-title">{t?.title ?? "Alify"}</div>
        <div className="fl-artist">{t?.artist ?? "Sin reproducción"}</div>
      </div>
      <div className="fl-controls flex-wrap">
        <button
          className="fl-shuffle"
          aria-label="Reproducir al azar"
          title="Reproducir al azar"
          aria-pressed={s.shuffle}
          onClick={() => {
            if (!s.queue.length) {
              playAllSongsRandom();
              return;
            }
            const next = !s.shuffle;
            engine.setShuffle(next);
            if (next && !s.playing) engine.playRandomTrack();
          }}
        >
          <IShuffle width={15} height={15} />
        </button>
        <button
          className="fl-random"
          aria-label="Cambiar canción al azar"
          title="Cambiar canción al azar"
          onClick={() => {
            if (!s.queue.length) {
              playAllSongsRandom();
              return;
            }
            engine.setShuffle(true);
            engine.playRandomTrack();
          }}
        >
          <IDice width={15} height={15} />
        </button>
        <button
          className="fl-prev"
          aria-label="Anterior"
          onClick={() => {
            if (!s.queue.length && getLibraryTracks().length) playAllSongsRandom();
            else engine.prev();
          }}
        >
          <IPrev width={16} height={16} />
        </button>
        <button
          className="fl-play"
          aria-label={s.playing ? "Pausa" : "Reproducir"}
          onClick={() => {
            if (!s.queue.length && getLibraryTracks().length) playAllSongsRandom();
            else engine.toggle();
          }}
        >
          {s.playing ? <IPause width={18} height={18} /> : <IPlay width={18} height={18} />}
        </button>
        <button
          className="fl-next"
          aria-label="Siguiente"
          onClick={() => {
            if (!s.queue.length && getLibraryTracks().length) playAllSongsRandom();
            else engine.next();
          }}
        >
          <INext width={16} height={16} />
        </button>
      </div>
      <button className="fl-win ml-1 text-xs t-muted" aria-label="Cerrar mini reproductor" onClick={toggleMini}>✕</button>
    </div>
  );
}
