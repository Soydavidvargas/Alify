import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { IPlay } from "../icons";
import { toast, useLibrary } from "../library";
import { engine } from "../player";
import { fmtListenDuration, getTopSongs, type TrackStat, useWrappedStats } from "../stats";
import { wallpaperUrl, resolveActive, type ThemeDef } from "../theme-engine/themeLoader";

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(out + "…").width > maxWidth) {
    out = out.slice(0, -1);
  }
  return out + "…";
}

async function renderWrappedPng(
  theme: ThemeDef,
  userName: string,
  totalSeconds: number,
  top: TrackStat[],
  topTotalSeconds: number,
): Promise<void> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const p0 = theme.preview[0] ?? "#101012";
  const p1 = theme.preview[1] ?? "#27272A";
  const accent = theme.colors.accent?.startsWith("#") ? theme.colors.accent : (theme.preview[2] ?? "#FAFAFA");
  const accent2 = theme.colors.accent2?.startsWith("#") ? theme.colors.accent2 : p1;
  const textCol = theme.colors.text || "#FAFAFA";
  const mutedCol = theme.colors.muted || "#9CA3AF";
  const fontBase = theme.vars.font || "'Segoe UI', sans-serif";
  const radius = Math.min(28, Math.max(2, parseInt(theme.vars.radius ?? "14", 10) || 14));

  // Fondo según el tema elegido (degradado + textura previewImage si existe)
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, p0);
  bgGrad.addColorStop(0.55, p1);
  bgGrad.addColorStop(1, p0);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  const artwork = wallpaperUrl(theme) ?? theme.previewImage;
  const scene = artwork ? await loadImg(artwork) : null;
  if (scene) {
    const height = W * scene.naturalHeight / scene.naturalWidth;
    ctx.drawImage(scene, 0, 0, W, height);
    const fade = ctx.createLinearGradient(0, 0, 0, height);
    fade.addColorStop(0, "rgba(9,12,18,.82)");
    fade.addColorStop(.24, "rgba(9,12,18,.38)");
    fade.addColorStop(.40, "rgba(9,12,18,.04)");
    fade.addColorStop(1, "#101219");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, W, height);
    ctx.fillStyle = "#101219";
    ctx.fillRect(0, height - 1, W, H);
  } else {
    ctx.fillStyle = "rgba(10,10,14,.72)";
    ctx.fillRect(0, 0, W, H);
  }

  // Marco exterior del tema
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  roundRectPath(ctx, 36, 36, W - 72, H - 72, radius * 1.5);
  ctx.stroke();

  // Cabecera: icono Alify + título Wrapped + tema
  const icon = await loadImg("/alify-icon.png");
  if (icon) {
    ctx.save();
    roundRectPath(ctx, 76, 76, 72, 72, 16);
    ctx.clip();
    ctx.drawImage(icon, 76, 76, 72, 72);
    ctx.restore();
  }

  ctx.fillStyle = textCol;
  ctx.font = `800 44px ${fontBase}`;
  ctx.fillText("ALIFY WRAPPED", 168, 118);

  ctx.fillStyle = mutedCol;
  ctx.font = `600 22px ${fontBase}`;
  const subTitle = userName ? `${userName} · Tema ${theme.name}` : `Tema ${theme.name}`;
  ctx.fillText(fitText(ctx, subTitle, W - 248), 168, 150);

  // Tarjetas de tiempo total
  const drawStatCard = (x: number, y: number, w: number, h: number, label: string, val: string) => {
    ctx.save();
    ctx.fillStyle = "rgba(14,18,26,.88)";
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = mutedCol;
    ctx.font = `600 20px ${fontBase}`;
    ctx.fillText(label, x + 28, y + 46);
    ctx.fillStyle = accent;
    ctx.font = `800 42px ${fontBase}`;
    ctx.fillText(val, x + 28, y + 102);
    ctx.restore();
  };

  drawStatCard(76, 366, 448, 134, "TIEMPO TOTAL EN ALIFY", fmtListenDuration(totalSeconds));
  drawStatCard(556, 366, 448, 134, "TIEMPO EN TU TOP 5", fmtListenDuration(topTotalSeconds));

  // Sección Top 5
  ctx.fillStyle = textCol;
  ctx.font = `800 32px ${fontBase}`;
  ctx.fillText("TOP 5 CANCIONES MÁS ESCUCHADAS", 76, 557);

  const rowH = 116;
  const startY = 588;
  for (let i = 0; i < 5; i++) {
    const y = startY + i * (rowH + 18);
    ctx.save();
    ctx.fillStyle = i === 0 ? "rgba(255, 255, 255, 0.13)" : "rgba(255, 255, 255, 0.07)";
    roundRectPath(ctx, 76, y, W - 152, rowH, radius);
    ctx.fill();
    ctx.strokeStyle = i === 0 ? accent : "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = i === 0 ? 3 : 1.5;
    ctx.stroke();
    ctx.restore();

    const item = top[i];
    // Número de ranking
    ctx.fillStyle = i === 0 ? accent : mutedCol;
    ctx.font = `800 40px ${fontBase}`;
    ctx.fillText(`#${i + 1}`, 104, y + 88);

    if (!item) {
      ctx.fillStyle = mutedCol;
      ctx.font = `500 24px ${fontBase}`;
      ctx.fillText("Sin datos suficientes aún", 196, y + 84);
      continue;
    }

    // Portada de la canción
    if (item.cover) {
      const cov = await loadImg(item.cover);
      if (cov) {
        ctx.save();
        roundRectPath(ctx, 186, y + 6, 104, 104, Math.min(14, radius));
        ctx.clip();
        ctx.drawImage(cov, 186, y + 6, 104, 104);
        ctx.restore();
      }
    }

    // Título y artista
    ctx.fillStyle = textCol;
    ctx.font = `700 28px ${fontBase}`;
    ctx.fillText(fitText(ctx, item.title, 450), 316, y + 66);

    ctx.fillStyle = mutedCol;
    ctx.font = `500 22px ${fontBase}`;
    ctx.fillText(fitText(ctx, item.artist, 450), 316, y + 104);

    // Tiempo escuchado de esta canción
    const timeStr = fmtListenDuration(item.seconds);
    ctx.fillStyle = accent2 === p1 ? accent : accent2;
    ctx.font = `800 26px ${fontBase}`;
    const tw = ctx.measureText(timeStr).width;
    ctx.fillText(timeStr, W - 106 - tw, y + 72);

    ctx.fillStyle = mutedCol;
    ctx.font = `500 18px ${fontBase}`;
    const playsStr = `${item.plays} ${item.plays === 1 ? "reproducción" : "reproducciones"}`;
    const pw = ctx.measureText(playsStr).width;
    ctx.fillText(playsStr, W - 106 - pw, y + 104);
  }

  // Pie de página
  ctx.fillStyle = mutedCol;
  ctx.font = `600 20px ${fontBase}`;
  ctx.fillText("Alify · Tu música local gratis por siempre", 76, H - 72);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Alify-Wrapped-${theme.id}.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Imagen PNG descargada con el tema ${theme.name}`);
  }, "image/png");
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
