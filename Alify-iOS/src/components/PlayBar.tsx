import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AnimatePresence, motion } from "framer-motion";
import { EQ_PRESETS, type EqPresetId } from "../core/audioEngine";
import { isDesktop } from "../core/bridge";
import { IEq, IFloat, IMic, INext, IPause, IPlay, IPrev, IQueue, IRepeat, IShuffle, IShuffleAll, IVolume } from "../icons";
import { playAllSongsRandom, toast } from "../library";
import { engine, useEngine } from "../player";
import { isMobile } from "../utils/platform";
import { FavMark } from "./AlbumView";
import { toggleMini } from "./MiniPlayer";
import { fmtTime } from "./TitleBar";

export function PlayBar({ lyrics, toggleLyrics }: { lyrics: boolean; toggleLyrics: () => void }) {
  const s = useEngine();
  const [queue, setQueue] = useState(false);
  const [eqOpen, setEqOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const t = s.track;
  const pct = s.duration ? (s.position / s.duration) * 100 : 0;
  const volPct = Math.round(s.volume * 100);
  const boosted = volPct > 100;

  const refreshOutputs = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setOutputs(list.filter((d) => d.kind === "audiooutput"));
    } catch {
      setOutputs([]);
    }
  };

  useEffect(() => {
    if (audioOpen) void refreshOutputs();
  }, [audioOpen]);

  const seekFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    engine.seek(((e.clientX - r.left) / r.width) * s.duration);
  };

  return (
    <footer className="play-bar relative flex h-24 flex-none items-center gap-4 border-t px-4" data-playing={s.playing ? "true" : "false"} style={{ borderColor: "var(--c-line)" }}>
      {/* Izquierda */}
      <div className="flex w-1/4 min-w-0 items-center gap-3">
        <div className="pb-cover h-14 w-14 flex-none overflow-hidden" style={{ borderRadius: "calc(var(--v-radius) / 2)", background: "var(--c-panel-strong)" }}>
          {t?.cover && <img src={t.cover} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{t?.title ?? "Alify"}</div>
          <div className="truncate text-xs t-muted">{t?.artist ?? "Elige una canción"}</div>
        </div>
        {t && <FavMark id={t.id} />}
      </div>

      {/* Centro */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
        <div className="pb-controls flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.06 }} className="icon-btn pb-shuffle" aria-label="Aleatorio en lista actual" data-tip="Aleatorio: mezcla las canciones de la lista actual sin repetir" aria-pressed={s.shuffle} onClick={() => engine.setShuffle(!s.shuffle)}><IShuffle /></motion.button>
          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.06 }} className="icon-btn" aria-label="Aleatorio Global: reproducir todas las canciones" data-tip="Aleatorio Todo: reproduce al azar todas las canciones de todas tus playlists y biblioteca" onClick={() => playAllSongsRandom()}><IShuffleAll /></motion.button>
          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.06 }} className="icon-btn pb-prev" aria-label="Anterior" data-tip="Canción anterior (o reiniciar la actual)" onClick={() => engine.prev()}><IPrev /></motion.button>
          <motion.button whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.06 }} transition={{ type: "spring", stiffness: 420, damping: 24 }} className="btn-play pb-play" aria-label={s.playing ? "Pausa" : "Reproducir"} data-tip={s.playing ? "Pausar reproducción (Espacio)" : "Iniciar reproducción (Espacio)"} onClick={() => engine.toggle()}>
            {s.playing ? <IPause width={22} height={22} /> : <IPlay width={22} height={22} />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.06 }} className="icon-btn pb-next" aria-label="Siguiente" data-tip="Saltar a la siguiente canción" onClick={() => engine.next()}><INext /></motion.button>
          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.06 }} className="icon-btn pb-repeat relative" aria-label={`Repetir: ${s.repeat === "off" ? "desactivado" : s.repeat === "all" ? "todo" : "una"}`} data-tip={`Modo repetición: ${s.repeat === "all" ? "continuar toda la lista" : s.repeat === "one" ? "repetir esta canción" : "desactivado"}`} aria-pressed={s.repeat !== "off"} onClick={() => engine.cycleRepeat()}>
            <IRepeat />
            {s.repeat === "one" && <span className="absolute right-1 top-0 text-[9px] font-bold">1</span>}
          </motion.button>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 text-[11px] t-muted">
          <span className="w-9 text-right tabular-nums">{fmtTime(s.position)}</span>
          <div
            className="progress-track"
            role="slider"
            tabIndex={0}
            aria-label="Progreso"
            aria-valuemin={0}
            aria-valuemax={Math.round(s.duration)}
            aria-valuenow={Math.round(s.position)}
            onClick={seekFromEvent}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") engine.seek(s.position + 5);
              if (e.key === "ArrowLeft") engine.seek(s.position - 5);
            }}
          >
            <div className="progress-fill transition-[width] duration-150" style={{ width: `${pct}%` }} />
          </div>
          <span className="w-9 tabular-nums">{fmtTime(s.duration)}</span>
        </div>
      </div>

      {/* Derecha */}
      <div className="flex w-1/3 min-w-0 items-center justify-end gap-2.5 text-xs">
        <label className="flex items-center gap-1">
          <button className="icon-btn !h-8 !w-auto px-2 text-xs font-bold" role="switch" aria-checked={s.mix} aria-pressed={s.mix} data-tip={`Modo MIX: mezcla suavemente ${s.mixSeconds}s antes de terminar cada canción`} onClick={() => engine.setMix(!s.mix)}>MIX</button>
          <input className="input !w-12 !px-1.5 !py-1 text-center" type="number" min={1} max={30} value={s.mixSeconds} aria-label="Segundos de mezcla" onChange={(e) => engine.setMixSeconds(Number(e.target.value))} />
          <span className="t-muted">s</span>
        </label>
        <label className="hidden items-center gap-1.5 xl:flex" title="Velocidad de reproducción (doble clic para 1.0x)">
          <span className="w-9 text-right tabular-nums t-muted">{s.rate.toFixed(2)}x</span>
          <input type="range" min={0.5} max={2} step={0.05} value={s.rate} aria-label="Velocidad de reproducción" className="w-16 accent-[var(--c-accent)]" onChange={(e) => engine.setRate(Number(e.target.value))} onDoubleClick={() => engine.setRate(1)} />
        </label>
        <div className="flex items-center gap-1.5">
          <button
            className="icon-btn !h-7 !w-7"
            aria-label="Dispositivo de salida de audio y boost"
            data-tip="Cambiar dispositivo de salida de audio y ajustar boost hasta 300%"
            aria-pressed={audioOpen}
            onClick={() => {
              setEqOpen(false);
              setQueue(false);
              setAudioOpen(!audioOpen);
            }}
          >
            <IVolume width={17} height={17} />
          </button>
          <input
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={s.volume}
            aria-label="Volumen (hasta 300% boost)"
            className="w-16 accent-[var(--c-accent)]"
            onChange={(e) => engine.setVolume(Number(e.target.value))}
            onDoubleClick={() => engine.setVolume(1)}
          />
          <span
            className={`w-10 text-right tabular-nums font-semibold ${boosted ? "text-amber-400" : "t-muted"}`}
          >
            {volPct}%
          </span>
        </div>
        <button className="icon-btn" aria-label="Ecualizador" data-tip="Ecualizador, ajustes rápidos y sonido 8D" aria-pressed={eqOpen} onClick={() => { setAudioOpen(false); setQueue(false); setEqOpen(!eqOpen); }}><IEq width={18} height={18} /></button>
        <button className="icon-btn" aria-label="Letras" data-tip="Modo Letra sincronizada (oculta el menú lateral para mayor inmersión)" aria-pressed={lyrics} onClick={toggleLyrics}><IMic /></button>
        <button className="icon-btn" aria-label="Cola de reproducción" data-tip="Ver y saltar a las canciones en la cola de reproducción" aria-pressed={queue} onClick={() => { setAudioOpen(false); setEqOpen(false); setQueue(!queue); }}><IQueue /></button>
        <button className="icon-btn" aria-label={isMobile ? "Mini reproductor flotante" : "Abrir ventana flotante"} data-tip="Abrir o cerrar el reproductor flotante siempre visible" disabled={!isDesktop() && !isMobile} onClick={() => (isMobile ? toggleMini() : invoke("toggle_floating"))}><IFloat /></button>
      </div>

      {/* Popover Salida de Audio & Boost */}
      <AnimatePresence>
        {audioOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="panel absolute bottom-24 right-28 z-30 w-80 space-y-3 p-4 shadow-2xl"
            style={{ background: "var(--c-bg)", backdropFilter: "blur(28px) saturate(140%)", border: "1px solid var(--c-line)" }}
            role="dialog"
            aria-label="Volumen y salida de audio"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider t-muted">Volumen y Boost</span>
              <span className={`text-xs font-bold tabular-nums ${boosted ? "text-amber-400" : ""}`}>{volPct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={0.05}
              value={s.volume}
              aria-label="Volumen y Boost hasta 300%"
              className="w-full accent-[var(--c-accent)]"
              onChange={(e) => engine.setVolume(Number(e.target.value))}
            />
            {boosted && (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-[11px] leading-snug text-amber-200">
                ⚠ <strong>Advertencia ({volPct}%):</strong> El boost por encima de 100 % puede causar distorsión y dañar tus parlantes o tu audición.
              </p>
            )}

            <div className="border-t pt-3" style={{ borderColor: "var(--c-line)" }}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider t-muted">Dispositivo de salida</span>
                <button className="btn-ghost !px-2 !py-0.5 text-[11px]" onClick={() => void refreshOutputs()}>
                  Actualizar
                </button>
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {outputs.map((d, idx) => (
                  <button
                    key={d.deviceId || idx}
                    className="nav-item w-full text-left text-xs"
                    aria-current={s.sinkId === d.deviceId ? "true" : undefined}
                    onClick={async () => {
                      const ok = await engine.setAudioOutput(d.deviceId);
                      if (!ok) toast("No se pudo cambiar al dispositivo seleccionado.");
                    }}
                  >
                    <span className="truncate">{d.label || `Salida de audio ${idx + 1}`}</span>
                  </button>
                ))}
                {!outputs.length && <p className="text-xs t-muted">Usando salida predeterminada del sistema.</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popover Ecualizador 3 bandas */}
      <AnimatePresence>
        {eqOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="panel absolute bottom-24 right-16 z-30 max-h-[calc(100dvh-7rem)] w-80 max-w-[calc(100vw-5rem)] space-y-3 overflow-y-auto p-4 shadow-2xl"
            style={{ background: "var(--c-bg)", backdropFilter: "blur(28px) saturate(140%)", border: "1px solid var(--c-line)" }}
            role="dialog"
            aria-label="Ecualizador de audio"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider t-muted">Ecualizador</span>
              <select
                aria-label="Ajustes rápidos del ecualizador"
                disabled={!s.playing}
                className="input !rounded-lg !px-2 !py-1 text-xs"
                value={s.eq.preset}
                onChange={(e) => {
                  const id = e.target.value as EqPresetId;
                  if (id !== "custom") engine.setEqPreset(id);
                }}
              >
                {Object.entries(EQ_PRESETS).map(([id, p]) => (
                  <option key={id} value={id} style={{ background: "#101012", color: "#FAFAFA" }}>{p.label}</option>
                ))}
                <option value="custom" disabled style={{ background: "#101012", color: "#9CA3AF" }}>Personalizado</option>
              </select>
            </div>
            <p className="text-xs t-muted">{s.playing ? "Los ajustes se aplican también a las siguientes canciones." : "Reproduce una canción para ajustar el audio."}</p>
            {(
              [
                ["bass", "Graves (100 Hz)", s.eq.bass, "Controlan el peso del bombo y el bajo. Bájales si el sonido retumba."],
                ["mid", "Medios (1 kHz)", s.eq.mid, "Dan presencia a voces, guitarras y piano."],
                ["treble", "Agudos (8 kHz)", s.eq.treble, "Resaltan platillos y detalles. Bájales si las eses molestan."],
              ] as const
            ).map(([band, label, val, help]) => (
              <label key={band} className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="t-muted">{label}</span>
                  <span className="tabular-nums font-medium">{val > 0 ? `+${val}` : val} dB</span>
                </div>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={val}
                  aria-label={label}
                  aria-describedby={`desktop-eq-${band}`}
                  disabled={!s.playing}
                  className="w-full accent-[var(--c-accent)]"
                  onChange={(e) => engine.setEqBand(band, Number(e.target.value))}
                />
                <span id={`desktop-eq-${band}`} className="t-muted">{help}</span>
              </label>
            ))}
            <div className="flex flex-wrap gap-2">
              <button className="btn-ghost !py-1" disabled={!s.playing} aria-pressed={s.eq.spatial}
                onClick={()=>engine.setSpatialAudio(!s.eq.spatial)}>{s.eq.spatial ? "Desactivar Sonidos 8D" : "Activar Sonidos 8D"}</button>
              <button className="btn-ghost !py-1" disabled={!s.playing} onClick={()=>engine.restoreAudio()}>Restaurar</button>
            </div>
            <p className="text-xs t-muted">El 8D mueve el sonido entre ambos lados. Se percibe mejor con auriculares estéreo.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popover Cola */}
      <AnimatePresence>
        {queue && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="panel absolute bottom-24 right-4 z-30 max-h-80 w-80 overflow-y-auto p-2 shadow-2xl"
            style={{ background: "var(--c-bg)", backdropFilter: "blur(28px) saturate(140%)", border: "1px solid var(--c-line)" }}
            role="dialog"
            aria-label="Cola"
          >
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider t-muted">En cola ({s.queue.length})</p>
            {s.upNext && <p className="border-b px-2 pb-2 text-xs" style={{borderColor:"var(--c-line)"}}>
              <span className="t-muted">A continuación · </span>{s.upNext.title}
            </p>}
            {s.queue.map((q, i) => (
              <button key={`${q.id}-${i}`} className="nav-item w-full" aria-current={i === s.queueIndex ? "true" : undefined} onClick={() => engine.playQueueIndex(i)}>
                <span className="truncate">{q.title} <span className="t-muted">· {q.artist}</span></span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
