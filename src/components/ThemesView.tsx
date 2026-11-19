import { Instrument } from "./Instrument";
import { useRef, useState } from "react";
import { broadcastTheme } from "../core/bridge";
import {
  allThemes,
  wallpaperUrl,
  applyTheme,
  deleteCustomTheme,
  getActiveId,
  saveCustomTheme,
  serializeDesignMd,
  setActiveId,
  type ThemeDef,
} from "../theme-engine/themeLoader";

function downloadTheme(t: ThemeDef) {
  const blob = new Blob([t.raw || serializeDesignMd(t)], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${t.id || "tema-alify"}.design.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Card({ t, active, onApply, onExport, onDelete }: { t: ThemeDef; active: boolean; onApply: () => void; onExport: () => void; onDelete?: () => void }) {
  const [a, b] = [t.preview[0] ?? "#101012", t.preview[1] ?? "#27272A"];
  return (
    <article className="panel flex flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-0.5" style={{ border: active ? "2px solid var(--c-accent)" : "1px solid var(--c-line)" }}>
      <div className="theme-art relative flex h-40 items-center justify-center overflow-hidden px-2" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
        {wallpaperUrl(t) && <img className="theme-art-scene" src={wallpaperUrl(t)} loading="lazy" alt="" />}
        {t.floating.instrument ? <div className="theme-art-device instrument-stage" aria-hidden="true"><Instrument theme={t}/></div> : !wallpaperUrl(t) && t.previewImage && <img src={t.previewImage} alt={`Vista previa de ${t.name}`} className="h-full w-full object-contain" loading="lazy" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {t.id === "alify-original" && !t.custom && <span className="self-start rounded-full border px-2 py-0.5 text-xs font-medium" style={{ borderColor: "var(--c-line)" }}>Diseño Alify original</span>}
        <h3 className="font-semibold">{t.name}{t.custom ? " (personal)" : ""}</h3>
        <p className="flex-1 text-xs t-muted">{t.description}</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary !px-3.5 !py-1.5" disabled={active} onClick={onApply}>{active ? "Activo" : "Aplicar"}</button>
          <button className="btn-ghost !px-3 !py-1.5" onClick={onExport} title="Exportar design.md">Exportar</button>
          {onDelete && <button className="btn-ghost !px-3 !py-1.5" onClick={onDelete}>Eliminar</button>}
        </div>
      </div>
    </article>
  );
}

export function ThemesView() {
  const [themes, setThemes] = useState(allThemes());
  const [activeId, setActive] = useState(getActiveId());
  const [err, setErr] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const apply = (t: ThemeDef) => {
    applyTheme(t);
    setActiveId(t.id);
    setActive(t.id);
    broadcastTheme(t.raw);
  };
  const refresh = () => setThemes(allThemes());

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-3xl font-bold">Diseños y Temas Camaleónicos</h1>
          <p className="text-xs t-muted">{themes.length} temas disponibles · 100% CSS3 + SVG local</p>
        </div>
        <button className="btn-ghost" onClick={() => file.current?.click()}>Importar tema</button>
        <input
          ref={file}
          type="file"
          hidden
          accept=".md,.txt"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              const t = saveCustomTheme(await f.text());
              refresh();
              apply(t);
              setErr(null);
            } catch (x) {
              setErr(String(x instanceof Error ? x.message : x));
            }
          }}
        />
      </div>
      {err && <p role="alert" className="mt-3 text-sm text-red-400">{err}</p>}

      <div className="mt-6 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
        {themes.map((t) => (
          <Card
            key={t.id}
            t={t}
            active={activeId === t.id}
            onApply={() => apply(t)}
            onExport={() => downloadTheme(t)}
            onDelete={t.custom ? () => { deleteCustomTheme(t.id); refresh(); } : undefined}
          />
        ))}
      </div>

    </div>
  );
}
