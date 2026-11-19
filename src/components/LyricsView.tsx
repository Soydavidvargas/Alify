import { vocalOnsetDetector } from "../core/vocalOnset";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { activeLineIndex, parseLyrics } from "../core/lyricsParser";
import { IClose, INext, IPause, IPlay, IPrev } from "../icons";
import { engine, useEngine } from "../player";

function hdCover(src?: string): string | undefined {
  if (!src) return undefined;
  if (src.includes("ab67616d00004851")) return src.replace("ab67616d00004851", "ab67616d0000b273");
  if (src.includes("ab67616d00001e02")) return src.replace("ab67616d00001e02", "ab67616d0000b273");
  if (src.includes("googleusercontent.com") && src.includes("=w")) return src.replace(/=w\d+-h\d+[^&]*/i, "=w1200-h1200-l90-rj");
  return src;
}

export function LyricsView({
  fullscreen,
  onExitLyrics,
  onToggleFullscreen,
  onGoToMigrate,
}: {
  fullscreen: boolean;
  onExitLyrics: () => void;
  onToggleFullscreen: () => void;
  onGoToMigrate: () => void;
}) {
  const es = useEngine();
  const t = es.track;
  const coverSrc = hdCover(t?.cover);
  const parsed = useMemo(() => parseLyrics(t?.lyrics), [t?.id, t?.lyrics]);
  const trackId = t?.id;
  const firstVerse = parsed.synced ? parsed.lines.find(line => line.text)?.time : undefined;
  const alignment = useRef<{ lyrics: typeof parsed; shift: number }>();
  const pausedPosition = es.playing ? undefined : es.position;
  const [highlight, setHighlight] = useState<{ lyrics: typeof parsed; index: number }>();
  const active = highlight?.lyrics === parsed ? highlight.index : -1;

  useEffect(() => {
    if (!trackId || !parsed.synced) return;
    const expected = firstVerse === undefined ? undefined : Math.max(0, firstVerse);
    const initial = engine.lyricPosition(trackId);
    const canListen = es.playing && expected !== undefined && initial !== undefined &&
      initial <= expected + .25 && alignment.current?.lyrics !== parsed;
    const input = canListen ? engine.observeLyricAudio() : undefined;
    let detect = input ? vocalOnsetDetector(input.analyser, input.sampleRate) : undefined;
    let frame = 0;
    let previous: number | undefined;
    const update = () => {
      const position = engine.lyricPosition(trackId);
      if (detect && position !== undefined && expected !== undefined) {
        if (position > expected + 6) detect = undefined;
        else if (position >= Math.max(0, expected - 2)) {
          const onset = detect(position);
          if (onset !== undefined) {
            alignment.current = { lyrics: parsed, shift: onset - firstVerse! };
            detect = undefined;
          }
        }
        if (!detect) input?.dispose();
      }
      const shift = alignment.current?.lyrics === parsed ? alignment.current.shift : 0;
      const waitingForVoice = !!detect && expected !== undefined && position !== undefined && position >= expected;
      const index = position === undefined || waitingForVoice ? -1 : activeLineIndex(parsed.lines, position - shift);
      if (index !== previous) {
        previous = index;
        setHighlight({ lyrics: parsed, index });
      }
      if (es.playing) frame = requestAnimationFrame(update);
    };
    update();
    return () => {
      cancelAnimationFrame(frame);
      if (detect) input?.dispose();
    };
  }, [trackId, parsed, firstVerse, es.playing, pausedPosition]);
  const box = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLButtonElement | HTMLParagraphElement | null)[]>([]);

  // Ghost HUD en pantalla completa: se oculta tras 2s sin mover el ratón
  const [hudVisible, setHudVisible] = useState(false);
  const [hudExpanded, setHudExpanded] = useState(false);
  const idleTimer = useRef<number | undefined>();

  const bumpHud = () => {
    setHudVisible(true);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      setHudVisible(false);
      setHudExpanded(false);
    }, 2000);
  };

  useEffect(() => {
    if (!fullscreen) {
      window.clearTimeout(idleTimer.current);
      setHudVisible(false);
      setHudExpanded(false);
    }
    return () => window.clearTimeout(idleTimer.current);
  }, [fullscreen]);

  // Auto-scroll suave tipo Spotify: mantiene la línea activa centrada.
  useEffect(() => {
    const c = box.current;
    const el = refs.current[active];
    if (!c || !el || active < 0) return;
    c.scrollTo({ top: el.offsetTop - c.clientHeight / 2 + el.clientHeight / 2, behavior: "smooth" });
  }, [active, t?.id]);

  return (
    <div
      className="relative flex h-full min-h-0 overflow-hidden"
      onMouseMove={fullscreen ? bumpHud : undefined}
      style={fullscreen ? { background: "#0b0b0d" } : undefined}
    >
      {/* Fondo blur dinámico en máxima calidad (sin pixelado ni banding) */}
      {coverSrc && (
        <>
          <img
            src={coverSrc}
            alt=""
            aria-hidden
            className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${fullscreen ? "opacity-60" : "opacity-25"}`}
            style={{
              imageRendering: "auto",
              transform: "scale(1.22) translateZ(0)",
              filter: "blur(64px) saturate(145%) brightness(0.48)",
              willChange: "transform, opacity",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: fullscreen
                ? "radial-gradient(circle at 50% 45%, transparent 25%, rgba(8, 8, 10, 0.72) 100%)"
                : "radial-gradient(circle at 35% 50%, transparent 30%, rgba(12, 12, 14, 0.45) 100%)",
            }}
          />
        </>
      )}

      {/* Botones discretos en modo normal (no fullscreen) */}
      {!fullscreen && (
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <button
            className="btn-ghost !py-1.5 text-xs backdrop-blur-md"
            onClick={onToggleFullscreen}
            title="Pantalla completa cinematográfica"
          >
            Pantalla completa
          </button>
          <button
            className="icon-btn !h-8 !w-8 backdrop-blur-md"
            aria-label="Salir del modo letra (Esc)"
            title="Salir del modo letra (Esc)"
            onClick={onExitLyrics}
          >
            <IClose />
          </button>
        </div>
      )}

      <aside className="relative z-[1] flex w-2/5 flex-none flex-col items-center justify-center gap-5 p-8">
        <div className="relative flex w-full max-w-xs items-center justify-center">
          {/* Halo luminoso animado detrás de la portada */}
          {coverSrc && (
            <motion.div
              aria-hidden
              animate={
                es.playing
                  ? { scale: [0.96, 1.08, 0.96], opacity: [0.35, 0.65, 0.35] }
                  : { scale: 0.96, opacity: 0.2 }
              }
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-2 -z-10 overflow-hidden rounded-3xl blur-2xl"
            >
              <img src={coverSrc} alt="" className="h-full w-full object-cover" style={{ imageRendering: "auto" }} />
            </motion.div>
          )}
          <AnimatePresence>
            <motion.div
              key={t?.id ?? "empty-cover"}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{
                opacity: 1,
                scale: es.playing ? [1, 1.025, 1] : 1,
                y: es.playing ? [0, -6, 0] : 0,
              }}
              transition={
                es.playing
                  ? {
                      opacity: { duration: 0.3 },
                      scale: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                      y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                    }
                  : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
              }
              className="grid aspect-square w-full place-items-center overflow-hidden shadow-2xl"
              style={{ borderRadius: "var(--v-radius)", background: "var(--c-panel-strong)", border: "1px solid var(--c-line)" }}
            >
              {coverSrc ? (
                <img src={coverSrc} alt={`Portada de ${t?.title ?? ""}`} className="h-full w-full object-cover" style={{ imageRendering: "auto" }} />
              ) : (
                <span className="text-6xl t-muted" aria-hidden>♪</span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">{t?.title ?? "Nada en reproducción"}</h2>
          <p className="mt-1 t-muted">{t?.artist}</p>
        </div>
      </aside>

      <section
        ref={box}
        data-no-tooltip="true"
        className="relative z-[1] min-w-0 flex-1 overflow-y-auto px-8 py-[30vh]"
        aria-label="Letra de la canción"
        aria-live="off"
      >
        {!parsed.lines.length && (
          <div className="max-w-lg space-y-4">
            <p className="text-lg leading-relaxed t-muted">
              Disculpa, en este modo no pudimos detectar la letra. Te recomendamos escanearla con una migración.
            </p>
            <button className="btn-primary" data-tip="Abrir la vista de migración para escanear tus canciones con letra" onClick={onGoToMigrate}>
              Ir a migrar con mis cuentas
            </button>
          </div>
        )}
        {parsed.lines.map((l, i) =>
          parsed.synced ? (
            <button
              key={i}
              ref={(el) => (refs.current[i] = el)}
              onClick={() => engine.seek(l.time + (alignment.current?.lyrics === parsed ? alignment.current.shift : 0))}
              className="lyric-line-btn block w-full origin-left text-left text-3xl font-bold leading-snug "
              style={{ padding: "6px 0", opacity: i === active ? 1 : 0.34, transform: i === active ? "scale(1.03)" : "scale(1)", color: i === active ? "var(--c-text)" : "var(--c-muted)" }}
              aria-current={i === active ? "true" : undefined}
            >
              {l.text || "♪"}
            </button>
          ) : (
            <p key={i} ref={(el) => (refs.current[i] = el)} className="py-1 text-xl">
              {l.text || "\u00a0"}
            </p>
          ),
        )}
      </section>

      {/* Controles fantasma (Auto-hide HUD en pantalla completa) */}
      <AnimatePresence>
        {fullscreen && hudVisible && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2"
            onMouseMove={bumpHud}
          >
            {!hudExpanded ? (
              <button
                className="rounded-full border px-4 py-1.5 text-xs font-medium backdrop-blur-xl transition-colors"
                style={{ background: "rgba(16,16,18,0.65)", borderColor: "rgba(255,255,255,0.12)", color: "#FAFAFA" }}
                onClick={() => setHudExpanded(true)}
              >
                Controles
              </button>
            ) : (
              <div
                className="flex items-center gap-2 rounded-full border px-4 py-2 shadow-2xl backdrop-blur-2xl"
                style={{ background: "rgba(16,16,18,0.78)", borderColor: "rgba(255,255,255,0.12)", color: "#FAFAFA" }}
              >
                <button className="icon-btn" aria-label="Anterior" onClick={() => engine.prev()}><IPrev /></button>
                <button className="btn-play !h-10 !w-10" aria-label={es.playing ? "Pausa" : "Reproducir"} onClick={() => engine.toggle()}>
                  {es.playing ? <IPause width={18} height={18} /> : <IPlay width={18} height={18} />}
                </button>
                <button className="icon-btn" aria-label="Siguiente" onClick={() => engine.next()}><INext /></button>
                <span className="mx-1 h-4 w-px bg-white/15" />
                <button className="btn-ghost !py-1 text-xs" onClick={onToggleFullscreen}>Salir (Esc)</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
