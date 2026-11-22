import { controlTransfer, transferInProgress, useLibrary } from "../library";

export function MigrationProgress({playlistId, all = false}: {playlistId?:string; all?:boolean}) {
  const { transfer } = useLibrary();
  if (!transfer || (!all && transfer.playlistId !== playlistId)) return null;
  const {mode,phase,title,percent,done,total,failed} = transfer;
  const active = transferInProgress(transfer);
  const trackLabel = phase === "metadata" ? "Buscando portada y letra" : phase === "download" ? "Descargando audio" : "Buscando el audio";
  const status = mode === "canceled" ? "Migración cancelada"
    : mode === "finished" ? "Migración finalizada"
    : mode === "paused" ? "Migración en pausa"
    : mode === "pausing" ? "Pausando la pista actual…"
    : mode === "canceling" ? "Cancelando la migración…" : trackLabel;
  return <section className="panel my-4 max-w-3xl space-y-3 p-4" aria-label="Progreso de migración">
    <p className="font-semibold" role="status">{status}</p>
    {active && <label className="block text-xs">
      <span className="block break-words">{title}{typeof percent === "number" ? ` · ${Math.floor(percent)} %` : ""}</span>
      <progress className="mt-1 w-full accent-[var(--c-accent)]" max={100}
        value={mode === "paused" ? 0 : percent ?? undefined}/>
    </label>}
    <label className="block text-xs">
      <span className="block">Total · {done} de {total} procesadas{failed ? ` · ${failed} sin audio` : ""}</span>
      <progress className="mt-1 w-full accent-[var(--c-accent)]" max={total} value={done}/>
    </label>
    {active ? <div className="flex flex-wrap gap-2">
      <button className="btn-ghost !py-1 text-xs" disabled={mode === "pausing" || mode === "canceling"}
        onClick={()=>void controlTransfer(mode === "paused" ? "resume" : "pause")}>{mode === "paused" ? "Reanudar" : "Pausar"}</button>
      <button className="btn-ghost !py-1 text-xs" disabled={mode === "canceling"} onClick={()=>void controlTransfer("cancel")}>Cancelar</button>
    </div> : <p className="text-xs t-muted">Las canciones guardadas están en tu biblioteca.</p>}
  </section>;
}
