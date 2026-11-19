import { Instrument } from "./components/Instrument";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import "./index.css";
import { sendCmd, useFloatingState } from "./core/bridge";
import { IClose, IFloat, INext, IPause, IPlay, IPrev, IDice, IShuffle } from "./icons";
import { applyTheme, resolveActive, type ThemeDef } from "./theme-engine/themeLoader";

async function resizeFor(t: ThemeDef) {
  try {
    await getCurrentWindow().setSize(new LogicalSize(t.floating.width, t.floating.height));
  } catch {
    /* ejecutándose fuera de Tauri */
  }
}

const OPACITIES = [1, 0.6, 0.25] as const;

function Floating() {
  const { track, tick } = useFloatingState();
  const [theme, setTheme] = useState<ThemeDef>(() => resolveActive());
  const [opIdx, setOpIdx] = useState(0);
  const [docked, setDocked] = useState(false);

  const busy = useRef(false);
  const isDocked = useRef(false);
  const [dockError, setDockError] = useState("");

  useEffect(() => {
    let current = resolveActive();
    const apply = (incoming: ThemeDef | string) => {
      const next = applyTheme(incoming);
      setTheme(next);
      if (!busy.current && !isDocked.current &&
          (current.floating.width !== next.floating.width || current.floating.height !== next.floating.height)) {
        void resizeFor(next);
      }
      current = next;
    };
    apply(current);
    void resizeFor(current);
    const off = listen<string>("alify:theme", (e) => apply(e.payload));
    const onStorage = () => apply(resolveActive());
    window.addEventListener("storage", onStorage);
    return () => {
      off.then((f) => f());
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggleDock = async () => {
    if (busy.current) return;
    busy.current = true;
    const next = !isDocked.current;
    setDockError("");
    try {
      await invoke("dock_floating", { docked: next });
      isDocked.current = next;
      setDocked(next);
    } catch {
      setDockError("No se pudo ajustar la ventana.");
    } finally {
      busy.current = false;
    }
  };

  const pct = tick.duration ? (tick.position / tick.duration) * 100 : 0;
  const opacity = OPACITIES[opIdx];
  const useInstrument = !!theme.floating.instrument || theme.id === "alify-original";

  if (docked) {
    return (
      <div className="instrument-stage live compact-stage" aria-label="Reproductor compacto">
        <Instrument compact theme={theme} title={track?.title} artist={track?.artist}
          playing={tick.playing} progress={pct} onAction={action => {
            if (action === "dock") void toggleDock();
            else if (action === "toggle" || action === "next" || action === "prev") sendCmd(action);
          }}/>
        {dockError && <small role="alert">{dockError}</small>}
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.div
          key={theme.id}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={useInstrument ? "h-screen w-screen" : "float-root group"}
          data-playing={tick.playing ? "true" : "false"}
        >
          {useInstrument ? <div className="instrument-stage live">
            <Instrument theme={theme} title={track?.title} artist={track?.artist ?? "Sin reproducción"} cover={track?.cover}
              playing={tick.playing} shuffle={tick.shuffle} progress={pct} opacity={Math.round(opacity * 100)} onAction={action => {
                switch (action) {
                  case "opacity": setOpIdx(i => (i + 1) % OPACITIES.length); break;
                  case "dock": void toggleDock(); break;
                  case "main": void invoke("focus_main"); break;
                  case "close": void invoke("hide_floating"); break;
                  default: sendCmd(action);
                }
              }}/>
          </div> : <div className="float-shell" data-tauri-drag-region data-playing={tick.playing ? "true" : "false"}>
            <div className="fl-top">
              <div className="fl-win">
                <button
                  aria-label={`Opacidad ${Math.round(opacity * 100)}%`}
                  title={`Opacidad: ${Math.round(opacity * 100)}%`}
                  onClick={() => setOpIdx((opIdx + 1) % OPACITIES.length)}
                  className="text-[10px] font-bold"
                >
                  {Math.round(opacity * 100)}%
                </button>
                <button aria-label="Minimizar arriba" title="Minimizar arriba" onClick={() => void toggleDock()}>
                  _
                </button>
                <button aria-label="Mostrar ventana principal" title="Ventana principal" onClick={() => invoke("focus_main")}>
                  <IFloat width={13} height={13} />
                </button>
                <button aria-label="Cerrar reproductor flotante" title="Cerrar" onClick={() => invoke("hide_floating")}>
                  <IClose />
                </button>
              </div>
            </div>
            <div className="fl-screen" data-tauri-drag-region>
              {track?.cover && <img className="fl-cover" src={track.cover} alt="" />}
              <div className="fl-info" data-tauri-drag-region>
                <div className="fl-title">{track?.title ?? "Alify"}</div>
                <div className="fl-artist">{track?.artist ?? "Sin reproducción"}</div>
                <span className={`eq ${tick.playing ? "on" : ""}`} aria-hidden><i /><i /><i /><i /><i /></span>
              </div>
            </div>
            <div className="fl-progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
            <div className="fl-controls">
              <button className="fl-shuffle" aria-label="Reproducir al azar" title="Reproducir al azar" aria-pressed={tick.shuffle} onClick={() => sendCmd("shuffle")}><IShuffle width={15} height={15} /></button>
              <button className="fl-random" aria-label="Cambiar canción al azar" title="Cambiar canción al azar" onClick={() => sendCmd("random")}><IDice width={15} height={15} /></button>
              <button className="fl-prev" aria-label="Anterior" onClick={() => sendCmd("prev")}><IPrev width={16} height={16} /></button>
              <button className="fl-play" aria-label={tick.playing ? "Pausa" : "Reproducir"} onClick={() => sendCmd("toggle")}>{tick.playing ? <IPause width={18} height={18} /> : <IPlay width={18} height={18} />}</button>
              <button className="fl-next" aria-label="Siguiente" onClick={() => sendCmd("next")}><INext width={16} height={16} /></button>
            </div>
          </div>}
        </motion.div>
      </AnimatePresence>
      {dockError && <small className="float-error" role="alert">{dockError}</small>}
      {(["North", "South", "West", "East", "NorthWest", "NorthEast", "SouthWest", "SouthEast"] as const).map(edge =>
        <div key={edge} aria-hidden="true" className="resize-edge" data-edge={edge} onPointerDown={event => {
          if (event.button === 0) void getCurrentWindow().startResizeDragging(edge);
        }}/>
      )}
    </MotionConfig>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Floating />);
