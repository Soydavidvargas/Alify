import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { AnimatePresence, motion } from "framer-motion";
import { isDesktop } from "../core/bridge";
import { downloadSingleSong, importFromLink, resolveAllMissing, toast, useLibrary } from "../library";

const PROVIDERS = [
  {
    id: "spotify",
    name: "Spotify",
    subtitle: "Tus me gusta, playlists privadas y álbumes",
    accent: "#1ed760",
  },
  {
    id: "ytmusic",
    name: "YouTube Music",
    subtitle: "Biblioteca, playlists y canciones que te gustan",
    accent: "#ff0033",
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    subtitle: "Likes, sets y pistas guardadas",
    accent: "#ff5500",
  },
  {
    id: "deezer",
    name: "Deezer",
    subtitle: "Favoritas y playlists de tu cuenta",
    accent: "#a238ff",
  },
  {
    id: "apple",
    name: "Apple Music",
    subtitle: "Canciones y listas de tu biblioteca",
    accent: "#fa243c",
  },
  {
    id: "tidal",
    name: "Tidal",
    subtitle: "Tracks, playlists y colección HiFi",
    accent: "#00ffff",
  },
] as const;

export function MigrateView({ onOpenPlaylist }: { onOpenPlaylist: (id: string) => void }) {
  const lib = useLibrary();
  const [tab, setTab] = useState<"account" | "free">("account");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [singleInput, setSingleInput] = useState("");
  const [singleBusy, setSingleBusy] = useState(false);

  // Cuando la ventana de login envía las canciones, llevamos al usuario directo a Inicio / Biblioteca
  useEffect(() => {
    if (!isDesktop()) return;
    const unsub = listen("alify:migrated-provider", () => {
      onOpenPlaylist("home");
    });
    return () => {
      void unsub.then((f) => f());
    };
  }, [onOpenPlaylist]);

  const openLogin = async (providerId: string) => {
    if (!isDesktop()) {
      toast("El inicio de sesión directo requiere la aplicación de escritorio.");
      return;
    }
    setOpeningId(providerId);
    try {
      await invoke("open_provider_login", { provider: providerId });
      toast("Inicia sesión en la ventana que se abrió y pulsa 'Migrar y descargar' abajo a la derecha.");
    } catch (e) {
      toast(String(e));
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest t-muted">Migración automática · Audio + Portada + Letra</p>
          <h1 className="text-3xl font-bold tracking-tight">Migrar canciones</h1>
        </div>
        <div className="flex gap-2 rounded-full border p-1" style={{ borderColor: "var(--c-line)", background: "var(--c-panel)" }}>
          <button
            className={tab === "account" ? "btn-primary !py-1.5 text-xs" : "btn-ghost !border-0 !bg-transparent !py-1.5 text-xs"}
            onClick={() => setTab("account")}
          >
            Iniciar Sesión (Mis Cuentas)
          </button>
          <button
            className={tab === "free" ? "btn-primary !py-1.5 text-xs" : "btn-ghost !border-0 !bg-transparent !py-1.5 text-xs"}
            onClick={() => setTab("free")}
          >
            Modo Gratis / Prueba (Enlace)
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {tab === "account" ? (
          <motion.section
            key="tab-account"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl space-y-4"
          >
            <div className="panel p-5">
              <h2 className="text-base font-semibold">Conecta tu reproductor con solo iniciar sesión</h2>
              <p className="mt-1 text-xs t-muted">
                Elige tu plataforma, inicia sesión normalmente y abre <strong>Tus me gusta</strong> o cualquier <strong>Playlist</strong>. Alify revisa tu lista, copia las canciones y descarga automáticamente cada audio junto con su portada y letra sincronizada.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {PROVIDERS.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--c-line)", background: "var(--c-panel)" }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="grid h-10 w-10 flex-none place-items-center rounded-full text-sm font-bold text-black"
                        style={{ background: p.accent }}
                        aria-hidden
                      >
                        {p.name[0]}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold">{p.name}</span>
                          {p.id === "spotify" && (
                            <span className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                              Migración recomendada
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[11px] t-muted">{p.subtitle}</div>
                      </div>
                    </div>
                    <button
                      className="btn-primary shrink-0 !px-3.5 !py-1.5 text-xs"
                      disabled={openingId === p.id}
                      onClick={() => void openLogin(p.id)}
                    >
                      {openingId === p.id ? "Abriendo…" : "Iniciar sesión"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="tab-free"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="grid max-w-3xl gap-5 md:grid-cols-2"
          >
            {/* Sección 1: Playlist o Álbum */}
            <div className="panel flex flex-col justify-between space-y-4 p-5">
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider t-muted">Playlist o Álbum</span>
                <h2 className="text-lg font-bold">Pegar enlace de playlist</h2>
                <p className="text-xs t-muted">
                  Pega la URL de cualquier playlist o álbum público de <strong>Spotify</strong>, <strong>YouTube Music</strong>, <strong>SoundCloud</strong> o <strong>Deezer</strong>. Alify revisa la lista, la copia y descarga automáticamente los audios con su portada y letra.
                </p>
                <input
                  className="input mt-2 w-full !rounded-lg"
                  type="url"
                  placeholder="https://open.spotify.com/playlist/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div>
                <button
                  className="btn-primary"
                  disabled={linkBusy || !url.trim()}
                  onClick={async () => {
                    setLinkBusy(true);
                    const id = await importFromLink(url);
                    setLinkBusy(false);
                    if (id) {
                      setUrl("");
                      void resolveAllMissing(id);
                      onOpenPlaylist(id);
                    }
                  }}
                >
                  {linkBusy ? "Revisando y copiando…" : "Revisar y descargar playlist"}
                </button>
              </div>
            </div>

            {/* Sección 2: Una sola canción */}
            <div className="panel flex flex-col justify-between space-y-4 p-5">
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider t-muted">Canción Individual</span>
                <h2 className="text-lg font-bold">Pegar una sola canción</h2>
                <p className="text-xs t-muted">
                  Pega el enlace de una canción (<strong>Spotify</strong>, <strong>YouTube</strong>, <strong>SoundCloud</strong>) o escribe <code>Artista - Canción</code>. Se descargará el audio, la portada del álbum y la letra sincronizada en tu biblioteca.
                </p>
                <input
                  className="input mt-2 w-full !rounded-lg"
                  type="text"
                  placeholder="https://open.spotify.com/track/... o Artista - Canción"
                  value={singleInput}
                  onChange={(e) => setSingleInput(e.target.value)}
                />
              </div>
              <div>
                <button
                  className="btn-primary"
                  disabled={singleBusy || !singleInput.trim()}
                  onClick={async () => {
                    setSingleBusy(true);
                    const ok = await downloadSingleSong(singleInput);
                    setSingleBusy(false);
                    if (ok) setSingleInput("");
                  }}
                >
                  {singleBusy ? "Descargando audio, portada y letra…" : "Descargar canción"}
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
