import appIcon from "../../src-tauri/icons/icon.ico?url";
import type { CSSProperties, ReactNode } from "react";
import type { ThemeDef } from "../theme-engine/themeLoader";
import { IClose, IFloat, INext, IPause, IPlay, IPrev, IDice, IShuffle } from "../icons";
import "./instrument.css";

const shells = import.meta.glob("../themes/*/assets/instrument.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
type Action = "shuffle" | "random" | "prev" | "toggle" | "next" | "opacity" | "dock" | "main" | "close";

export function Instrument({ theme, title, artist, cover, playing, shuffle, progress = 45, opacity = 100, compact = false, onAction }: {
  theme: ThemeDef; title?: string; artist?: string; cover?: string | null; playing?: boolean; shuffle?: boolean;
  compact?: boolean; progress?: number; opacity?: number; onAction?: (action: Action) => void;
}) {
  const control = (action: Action, label: string, icon: ReactNode) => onAction
    ? <button type="button" aria-label={label} title={label} aria-pressed={action === "shuffle" ? !!shuffle : undefined} onClick={() => onAction(action)}>{icon}</button>
    : <span>{icon}</span>;
  const shell = shells[`../themes/${theme.floating.instrument}/assets/instrument.svg`];
  const showAppIcon = theme.id === "alify-original" && (compact || !cover);
  return <div className="instrument" data-layout={compact ? undefined : theme.vars.transportLayout} data-compact={compact} data-has-shell={!!shell} data-tauri-drag-region style={{
    "--trim": theme.colors.accent, "--ink": theme.colors.text, "--enamel": theme.colors.bg,
    "--secondary": theme.colors.accent2, fontFamily: theme.vars.font,
    "--device-radius": theme.vars.keyRadius, "--screen": theme.vars.screen, "--phosphor": theme.vars.phosphor,
    backgroundImage: shell ? `url("${shell}")` : undefined,
  } as CSSProperties}>
    {showAppIcon && <img className="instrument-app-icon" alt="" src={appIcon}/> }
    {!compact && cover && <img className="instrument-cover" alt="" src={cover}/>}
    <div className="instrument-tools">
      {compact ? control("dock", "Expandir reproductor", <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9V4h5m6 0h5v5M8 12l4 4 4-4"/></svg>) : <>
      {control("opacity", `Opacidad ${opacity}%`, `${opacity}%`)}
      {control("dock", "Minimizar arriba", "−")}
      {control("main", "Mostrar ventana principal", <IFloat/>)}
      {control("close", "Cerrar minirreproductor", <IClose/>)}
      </>}
    </div>
    <div className="instrument-display" data-tauri-drag-region>
      <strong data-tauri-drag-region>{title ?? theme.name}</strong><small data-tauri-drag-region>{artist ?? "Alify"}</small>
      <div className="instrument-meter" aria-hidden="true" data-playing={playing}><i/><i/><i/><i/><i/></div>
    </div>
    <div className="instrument-progress" aria-hidden="true"><i style={{width: `${progress}%`}}/></div>
    <div className="instrument-transport">
      {!compact && control("shuffle", "Reproducir al azar", <IShuffle/>)}
      {control("prev", "Pista anterior", <IPrev/>)}
      {control("toggle", playing ? "Pausa" : "Reproducir", playing ? <IPause/> : <IPlay/>)}{control("next", "Siguiente", <INext/>)}
      {!compact && control("random", "Cambiar canción al azar", <IDice/>)}
    </div>
  </div>;
}
