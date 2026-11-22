import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { IPlay } from "../icons";
import { toast, useLibrary } from "../library";
import { engine } from "../player";
import { fmtListenDuration, getTopSongs, type TrackStat, useWrappedStats } from "../stats";
import { resolveActive, type ThemeDef } from "../theme-engine/themeLoader";

import { wrappedPng } from "../core/wrappedPng";

async function renderWrappedPng(theme: ThemeDef, userName: string, totalSeconds: number, top: TrackStat[], topTotalSeconds: number) {
  const blob = await wrappedPng(theme,userName,totalSeconds,top,topTotalSeconds);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Alify-Wrapped-${theme.id}.png`;
  link.click();
  URL.revokeObjectURL(url);
  toast(`Imagen PNG descargada con el tema ${theme.name}`);
}

export function WrappedView() {
  const lib = useLibrary();
  const stats = useWrappedStats();
  const [exporting, setExporting] = useState(false);

  const activeTheme = resolveActive();
  const top5 = useMemo(() => getTopSongs(stats, lib.tracks, 5), [stats, lib.tracks]);
  const topTotalSeconds = useMemo(() => top5.reduce((acc, t) => acc + t.seconds, 0), [top5]);

  const playStatTrack = (stat: TrackStat) => {
    const idx = lib.tracks.findIndex((t) => t.id === stat.id);
    if (idx >= 0) {
      engine.setQueue(lib.tracks, idx);
    } else {
      toast("Esta canción ya no está en tu biblioteca actual.");
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest t-muted">Tus estadísticas locales · Tema {activeTheme.name}</p>
          <h1 className="text-3xl font-bold tracking-tight">Alify Wrapped</h1>
        </div>
        <button
          className="btn-primary"
          disabled={exporting}
          data-tip={`Descargar tarjeta PNG de tu Top 5 con el diseño del tema ${activeTheme.name}`}
          onClick={async () => {
            setExporting(true);
            await renderWrappedPng(activeTheme, lib.profile.name.trim(), stats.totalSeconds, top5, topTotalSeconds);
            setExporting(false);
          }}
        >
          {exporting ? "Generando PNG…" : "Descargar imagen PNG"}
        </button>
      </header>

      {/* Resumen de tiempos */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-wider t-muted">Tiempo total escuchado en Alify</p>
          <p className="mt-2 text-3xl font-extrabold t-accent">{fmtListenDuration(stats.totalSeconds)}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-wider t-muted">Tiempo acumulado en tu Top 5</p>
          <p className="mt-2 text-3xl font-extrabold">{fmtListenDuration(topTotalSeconds)}</p>
        </div>
      </div>

      {/* Tarjeta estilizada con el tema activo + Top 5 */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="panel relative overflow-hidden p-6"
        style={{
          backgroundImage: activeTheme.previewImage
            ? `linear-gradient(135deg, rgba(12,12,16,0.78), rgba(12,12,16,0.88)), url("${activeTheme.previewImage}")`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderColor: "var(--c-accent)",
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Top 5 canciones más escuchadas</h2>
          <span className="rounded-full border px-3 py-1 text-xs t-muted" style={{ borderColor: "var(--c-line)" }}>
            Diseño: {activeTheme.name}
          </span>
        </div>

        {!top5.length ? (
          <p className="py-8 text-sm t-muted">
            Reproduce canciones en Alify para empezar a registrar tu Top 5 y tus minutos escuchados.
          </p>
        ) : (
          <div className="space-y-2.5">
            {top5.map((t, i) => (
              <div
                key={t.id}
                onClick={() => playStatTrack(t)}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors hover:bg-white/10"
                style={{ borderColor: i === 0 ? "var(--c-accent)" : "var(--c-line)", background: "rgba(0,0,0,0.28)" }}
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className={`w-6 text-center text-lg font-extrabold ${i === 0 ? "t-accent" : "t-muted"}`}>
                    #{i + 1}
                  </span>
                  <div className="h-12 w-12 flex-none overflow-hidden rounded-lg border" style={{ borderColor: "var(--c-line)", background: "var(--c-panel-strong)" }}>
                    {t.cover && <img src={t.cover} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{t.title}</div>
                    <div className="truncate text-xs t-muted">
                      {t.artist} · {t.plays} {t.plays === 1 ? "reproducción" : "reproducciones"}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-bold tabular-nums t-accent">{fmtListenDuration(t.seconds)}</span>
                  <span className="icon-btn !h-8 !w-8" aria-hidden><IPlay width={16} height={16} /></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
