import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { isDesktop } from "../core/bridge";
import { deleteAllDownloadedSongs, pickFolder, updateProfile, useLibrary } from "../library";
import { engine } from "../player";
import { AlbumView, TrackList } from "./AlbumView";
import { LyricsView } from "./LyricsView";
import { MigrateView } from "./MigrateView";
import { MiniPlayer } from "./MiniPlayer";
import { PlayBar } from "./PlayBar";
import { Sidebar, type View } from "./Sidebar";
import { ThemesView } from "./ThemesView";
import { TitleBar } from "./TitleBar";
import { WrappedView } from "./WrappedView";

const GREETINGS = [
  (n: string) => `Escuchemos música juntos, ${n}`,
  (n: string) => `Qué bueno verte hoy, ${n} · Escuchemos música juntos`,
  (n: string) => `Tu música está lista, ${n} · Escuchemos música juntos`,
  (n: string) => `Sube el volumen, ${n} · Escuchemos música juntos`,
  (n: string) => `Todo suena mejor contigo, ${n} · Escuchemos música juntos`,
];

function nextSessionGreeting(name: string): string {
  const raw = parseInt(localStorage.getItem("alify.greetingIdx") ?? "0", 10) || 0;
  localStorage.setItem("alify.greetingIdx", String((raw + 1) % GREETINGS.length));
  return GREETINGS[raw % GREETINGS.length](name);
}

function ButtonTooltip() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number; side: "left" | "right" } | null>(null);

  useEffect(() => {
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest("button, [role='button'], [role='switch']") as HTMLElement | null;
      if (!btn || btn.classList.contains("lyric-line-btn") || btn.closest("[data-no-tooltip='true']")) {
        setTip(null);
        return;
      }
      if (btn.getAttribute("title")) {
        btn.setAttribute("data-tip", btn.getAttribute("title")!);
        btn.removeAttribute("title");
      }
      const text =
        btn.getAttribute("data-tip") ||
        btn.getAttribute("aria-label") ||
        (btn.textContent ? btn.textContent.trim() : "");
      if (!text) {
        setTip(null);
        return;
      }
      const r = btn.getBoundingClientRect();
      const onRightHalf = r.left + r.width / 2 > window.innerWidth / 2;
      const side = onRightHalf ? "left" : "right";
      const x = onRightHalf ? r.left - 8 : r.right + 8;
      const y = Math.min(Math.max(r.top + r.height / 2, 24), window.innerHeight - 24);
      setTip({ text, x, y, side });
    };
    const onOut = (e: MouseEvent) => {
      const rel = e.relatedTarget as HTMLElement | null;
      if (!rel || !rel.closest?.("button, [role='button'], [role='switch']")) {
        setTip(null);
      }
    };
    const onDown = () => setTip(null);
    window.addEventListener("mouseover", onOver, true);
    window.addEventListener("mouseout", onOut, true);
    window.addEventListener("mousedown", onDown, true);
    return () => {
      window.removeEventListener("mouseover", onOver, true);
      window.removeEventListener("mouseout", onOut, true);
      window.removeEventListener("mousedown", onDown, true);
    };
  }, []);

  return (
    <AnimatePresence>
      {tip && (
        <motion.div
          key={tip.text}
          initial={{ opacity: 0, scale: 0.95, x: tip.side === "left" ? 4 : -4 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed z-[90] max-w-xs rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-medium leading-tight shadow-2xl"
          style={{
            left: tip.x,
            top: tip.y,
            transform: `translate(${tip.side === "left" ? "-100%" : "0"}, -50%)`,
            background: "rgba(16, 16, 18, 0.94)",
            borderColor: "rgba(255, 255, 255, 0.14)",
            color: "#FAFAFA",
            backdropFilter: "blur(20px)",
          }}
          role="tooltip"
        >
          {tip.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SkeletonLoader() {
  return (
    <div className="flex h-full flex-col p-2">
      <div className="mb-2 flex h-8 items-center justify-between px-3">
        <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
        <div className="flex gap-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-3 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-2">
        <div className="panel flex w-56 flex-col gap-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-6 w-6 animate-pulse rounded-md bg-white/10" />
              <div className="h-3 flex-1 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
        <div className="panel flex-1 space-y-6 p-6">
          <div className="flex items-end gap-6">
            <div className="h-44 w-44 animate-pulse rounded-xl bg-white/10" />
            <div className="space-y-3">
              <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-9 w-64 animate-pulse rounded bg-white/15" />
              <div className="h-3 w-44 animate-pulse rounded bg-white/10" />
              <div className="flex gap-2 pt-2">
                <div className="h-9 w-28 animate-pulse rounded-full bg-white/15" />
                <div className="h-9 w-28 animate-pulse rounded-full bg-white/10" />
              </div>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2">
                <div className="h-10 w-10 animate-pulse rounded-md bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-48 animate-pulse rounded bg-white/15" />
                  <div className="h-2.5 w-32 animate-pulse rounded bg-white/10" />
                </div>
                <div className="h-3 w-10 animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex h-20 items-center justify-between border-t border-white/10 px-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-lg bg-white/10" />
          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-white/15" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/15" />
        <div className="h-3 w-36 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}

function Search() {
  const lib = useLibrary();
  const [q, setQ] = useState("");
  const res = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? lib.tracks.filter((t) => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(n)) : [];
  }, [q, lib.tracks]);
  return (
    <div className="h-full overflow-y-auto p-6">
      <input autoFocus className="input w-full max-w-xl" type="search" placeholder="¿Qué quieres escuchar?" aria-label="Buscar en la biblioteca" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-4">{q ? <TrackList tracks={res} /> : <p className="t-muted">Busca por título, artista o álbum.</p>}</div>
    </div>
  );
}

function Settings() {
  const lib = useLibrary();
  const avatarInput = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="mb-5 text-3xl font-bold">Configuración</h1>

      <div className="max-w-xl space-y-4">
        {/* 1. Foto de perfil y Nombre */}
        <section className="panel space-y-4 p-5">
          <h2 className="font-semibold">Perfil</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div
              className="grid h-20 w-20 flex-none place-items-center overflow-hidden rounded-full border text-2xl font-bold"
              style={{ borderColor: "var(--c-line)", background: "var(--c-panel-strong)" }}
            >
              {lib.profile.avatar ? (
                <img src={lib.profile.avatar} alt="Foto de perfil" className="h-full w-full object-cover" />
              ) : (
                (lib.profile.name.trim()[0] ?? "A").toUpperCase()
              )}
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <button className="btn-ghost !py-1.5" onClick={() => avatarInput.current?.click()}>
                Elegir foto de perfil desde tu dispositivo
              </button>
              {lib.profile.avatar && (
                <button className="btn-ghost !py-1" onClick={() => updateProfile({ avatar: undefined })}>
                  Quitar foto
                </button>
              )}
              <input
                ref={avatarInput}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => typeof reader.result === "string" && updateProfile({ avatar: reader.result });
                  reader.readAsDataURL(f);
                }}
              />
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-xs">
            <span className="t-muted">Tu nombre</span>
            <input
              className="input !rounded-lg"
              placeholder="Escribe tu nombre..."
              value={lib.profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
            />
          </label>
        </section>

        {/* 2. Inicio automático al prender el dispositivo */}
        <section className="panel space-y-4 p-5">
          <h2 className="font-semibold">Inicio del sistema</h2>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>Iniciar Alify cuando prendas tu dispositivo</span>
            <div className="flex gap-1.5">
              <button
                className={lib.profile.autostart ? "btn-primary !px-4 !py-1 text-xs" : "btn-ghost !px-4 !py-1 text-xs"}
                onClick={() => updateProfile({ autostart: true })}
              >
                Sí
              </button>
              <button
                className={!lib.profile.autostart ? "btn-primary !px-4 !py-1 text-xs" : "btn-ghost !px-4 !py-1 text-xs"}
                onClick={() => updateProfile({ autostart: false })}
              >
                No
              </button>
            </div>
          </div>

          {lib.profile.autostart && (
            <div className="flex items-center justify-between gap-4 border-t pt-3 text-sm" style={{ borderColor: "var(--c-line)" }}>
              <span>Reproducir música aleatoria cuando se inicie</span>
              <div className="flex gap-1.5">
                <button
                  className={lib.profile.autoplayRandom ? "btn-primary !px-4 !py-1 text-xs" : "btn-ghost !px-4 !py-1 text-xs"}
                  onClick={() => updateProfile({ autoplayRandom: true })}
                >
                  Sí
                </button>
                <button
                  className={!lib.profile.autoplayRandom ? "btn-primary !px-4 !py-1 text-xs" : "btn-ghost !px-4 !py-1 text-xs"}
                  onClick={() => updateProfile({ autoplayRandom: false })}
                >
                  No
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. Biblioteca y Borrar todas las canciones descargadas */}
        <section className="panel space-y-3 p-5">
          <h2 className="font-semibold">Biblioteca y descargas</h2>
          <p className="text-sm t-muted">
            {lib.folder ?? "Carpeta por defecto (%USERPROFILE%\\Music\\Alify)"} · {lib.scanned.length} canciones
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" disabled={lib.scanning} onClick={pickFolder}>
              {lib.scanning ? "Escaneando…" : "Elegir carpeta de música"}
            </button>
            <button
              className="btn-ghost !border-red-500/40 !text-red-300 hover:!bg-red-500/20"
              onClick={() => setConfirmDelete(true)}
            >
              Borrar todas las canciones descargadas
            </button>
          </div>
        </section>
      </div>

      {/* Modal de alerta para confirmar borrado */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label="Confirmar borrado">
          <div className="panel w-full max-w-md space-y-4 p-5 shadow-2xl" style={{ background: "var(--c-bg)", backdropFilter: "blur(28px)", border: "1px solid var(--c-line)" }}>
            <h3 className="text-lg font-bold">¿Deseas borrar todas las canciones descargadas?</h3>
            <p className="text-xs t-muted">
              Esta acción eliminará todas las canciones descargadas en <code>Music\Alify</code> y vaciará tus listas y favoritos. No se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>
                No, cancelar
              </button>
              <button
                className="btn-primary !bg-red-600 !text-white"
                onClick={async () => {
                  setConfirmDelete(false);
                  await deleteAllDownloadedSongs();
                }}
              >
                Sí, borrar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  const lib = useLibrary();
  const [view, setView] = useState<View>("home");
  const [lyrics, setLyrics] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Secuencia de inicio: brand -> greeting -> skeleton -> ready
  const [bootStage, setBootStage] = useState<"brand" | "greeting" | "skeleton" | "ready">("brand");
  const [greetingText] = useState(() => {
    const n = lib.profile.name.trim();
    return n ? nextSessionGreeting(n) : "Escuchemos música juntos";
  });

  useEffect(() => {
    const t1 = window.setTimeout(() => setBootStage("greeting"), 1800);
    const t2 = window.setTimeout(() => setBootStage("skeleton"), 4400);
    const t3 = window.setTimeout(() => setBootStage("ready"), 7400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const toggleFullscreen = async (next?: boolean) => {
    const target = next ?? !fullscreen;
    setFullscreen(target);
    if (isDesktop()) {
      try {
        await getCurrentWindow().setFullscreen(target);
      } catch {
        /* ignore */
      }
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen) void toggleFullscreen(false);
        else if (lyrics) setLyrics(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, lyrics]);

  const activeKey = lyrics ? "lyrics" : view;
  const main = (() => {
    if (lyrics) {
      return (
        <LyricsView
          fullscreen={fullscreen}
          onExitLyrics={() => {
            if (fullscreen) void toggleFullscreen(false);
            setLyrics(false);
          }}
          onToggleFullscreen={() => void toggleFullscreen()}
          onGoToMigrate={() => {
            if (fullscreen) void toggleFullscreen(false);
            setLyrics(false);
            setView("migrate");
          }}
        />
      );
    }
    if (view === "likes") {
      const liked = lib.tracks.filter((t) => lib.favorites.includes(t.id));
      return (
        <AlbumView
          title={lib.likesMeta.name}
          subtitle="Canciones que te gustan"
          tracks={liked}
          collectionId="likes"
          customIcon={lib.likesMeta.icon}
        />
      );
    }
    if (view === "search") return <Search />;
    if (view === "migrate") {
      return (
        <MigrateView
          onOpenPlaylist={(id) => {
            setView(id === "home" ? "home" : `playlist:${id}`);
          }}
        />
      );
    }
    if (view === "wrapped") return <WrappedView />;
    if (view === "themes") return <ThemesView />;
    if (view === "settings") return <Settings />;
    if (view.startsWith("playlist:")) {
      const p = lib.playlists.find((x) => `playlist:${x.id}` === view);
      const tracks = (p?.trackIds ?? []).map((id) => lib.tracks.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => !!t);
      return (
        <AlbumView
          title={p?.name ?? "Playlist"}
          subtitle="Playlist importada"
          tracks={tracks}
          playlistId={p?.id}
          collectionId={p?.id}
          customIcon={p?.icon}
          missing={p?.missing}
        />
      );
    }
    const firstPendingPl = lib.playlists.find((p) => p.missing && p.missing.length > 0);
    return (
      <AlbumView
        title={lib.libraryMeta.name}
        tracks={lib.tracks}
        collectionId="home"
        customIcon={lib.libraryMeta.icon}
        playlistId={firstPendingPl?.id}
        missing={firstPendingPl?.missing}
      />
    );
  })();

  const immersiveFull = lyrics && fullscreen;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="app-shell relative flex h-full flex-col"
        style={immersiveFull ? { borderRadius: 0, border: 0 } : undefined}
        onKeyDown={(e) => {
          const tag = (e.target as HTMLElement).tagName;
          if (e.code === "Space" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "BUTTON") {
            e.preventDefault();
            engine.toggle();
          }
        }}
        tabIndex={-1}
      >
        <div className="app-wallpaper" aria-hidden="true"><i /></div>
        <AnimatePresence>
          {bootStage !== "ready" && (
            <motion.div
              key="skeleton-bg"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-40 flex flex-col"
              style={{ background: "#0e0e11" }}
            >
              <SkeletonLoader />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {(bootStage === "brand" || bootStage === "greeting") && (
            <motion.div
              key={bootStage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-50 flex flex-col"
              style={{ background: "#0e0e11" }}
            >
              {bootStage === "brand" && (
                <div className="grid flex-1 place-items-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center"
                  >
                    <img src="/alify-icon.png" alt="Alify" className="mx-auto mb-4 h-20 w-20 rounded-2xl object-contain shadow-2xl" />
                    <div className="text-5xl font-extrabold tracking-[0.28em]">ALIFY</div>
                    <p className="mt-2 text-xs uppercase tracking-widest t-muted">Música local por siempre</p>
                  </motion.div>
                </div>
              )}

              {bootStage === "greeting" && (
                <div className="grid flex-1 place-items-center px-6">
                  <motion.div
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    {lib.profile.avatar && (
                      <img src={lib.profile.avatar} alt="" className="h-16 w-16 rounded-full border object-cover shadow-xl" style={{ borderColor: "var(--c-line)" }} />
                    )}
                    <h2 className="text-2xl font-bold tracking-tight">{greetingText}</h2>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!immersiveFull && <TitleBar />}
        <div className={`app-body flex min-h-0 flex-1 ${immersiveFull ? "p-0" : "gap-2 px-2 pb-2"}`}>
          <AnimatePresence initial={false}>
            {!lyrics && !immersiveFull && (
              <motion.div
                key="sidebar-wrap"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-0 flex-none overflow-hidden"
              >
                <Sidebar
                  view={view}
                  setView={(v) => {
                    setLyrics(false);
                    setView(v);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <main className="panel min-w-0 flex-1 overflow-hidden" style={immersiveFull ? { borderRadius: 0, border: 0 } : undefined}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                {main}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <MiniPlayer />
        <ButtonTooltip />
        {!immersiveFull && (
          <PlayBar
            lyrics={lyrics}
            toggleLyrics={() => {
              if (lyrics && fullscreen) void toggleFullscreen(false);
              setLyrics(!lyrics);
            }}
          />
        )}

        {lib.toast && (
          <div role="status" className="panel fixed bottom-28 left-1/2 z-50 max-w-lg -translate-x-1/2 px-4 py-3 text-sm shadow-2xl" style={{ background: "var(--c-bg)", backdropFilter: "blur(24px)", border: "1px solid var(--c-line)" }}>
            {lib.toast}
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
