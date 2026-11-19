import { IHeart, IHome, IList, IMigrate, IPalette, IPlus, ISearch, ISettings, IWrapped } from "../icons";
import { createPlaylist, deletePlaylist, useLibrary } from "../library";

export type View = "home" | "likes" | "search" | "migrate" | "wrapped" | "themes" | "settings" | `playlist:${string}`;

export function Sidebar({ view, setView }: { view: View; setView: (v: View) => void }) {
  const lib = useLibrary();

  const item = (v: View, icon: JSX.Element, label: string) => (
    <button className="nav-item w-full" aria-current={view === v ? "page" : undefined} onClick={() => setView(v)}>
      {icon}
      <span className="hidden truncate lg:inline">{label}</span>
    </button>
  );

  const thumb = (src: string | undefined, fallback: JSX.Element) =>
    src ? <img src={src} alt="" className="h-5 w-5 flex-none rounded object-cover" /> : fallback;

  return (
    <nav className="sidebar flex w-14 flex-none flex-col gap-1 p-2 lg:w-56" aria-label="Navegación principal">
      {/* Perfil del usuario */}
      <button
        className="nav-item mb-1 w-full"
        onClick={() => setView("settings")}
        title="Editar perfil en Configuración"
      >
        <div
          className="grid h-6 w-6 flex-none place-items-center overflow-hidden rounded-full border text-[11px] font-bold"
          style={{ borderColor: "var(--c-line)", background: "var(--c-panel-strong)" }}
        >
          {lib.profile.avatar ? (
            <img src={lib.profile.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            (lib.profile.name.trim()[0] ?? "A").toUpperCase()
          )}
        </div>
        <span className="hidden truncate font-medium lg:inline">
          {lib.profile.name.trim() || "Configurar perfil"}
        </span>
      </button>

      {item("home", thumb(lib.libraryMeta.icon, <IHome />), lib.libraryMeta.name)}
      {item("search", <ISearch />, "Buscador")}
      {item("migrate", <IMigrate />, "Migrar canciones")}
      <button
        className="nav-item w-full"
        onClick={() => {
          const id = createPlaylist();
          setView(`playlist:${id}`);
        }}
        title="Crear una nueva playlist debajo de Me gustas"
      >
        <IPlus />
        <span className="hidden truncate lg:inline">Crear playlist</span>
      </button>

      <div className="sidebar-extra mt-3 flex items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider t-muted">
        <span className="hidden lg:inline">Playlists</span>
        <IList className="lg:hidden" />
      </div>
      <div className="sidebar-extra min-h-0 flex-1 overflow-y-auto">
        {/* Playlist fija: Me gustas */}
        <button
          className="nav-item w-full"
          aria-current={view === "likes" ? "page" : undefined}
          onClick={() => setView("likes")}
        >
          {thumb(lib.likesMeta.icon, <IHeart filled />)}
          <span className="hidden truncate lg:inline">
            {lib.likesMeta.name} ({lib.favorites.length})
          </span>
        </button>

        {lib.playlists.map((p) => (
          <div key={p.id} className="group flex items-center">
            <button
              className="nav-item min-w-0 flex-1"
              aria-current={view === `playlist:${p.id}` ? "page" : undefined}
              onClick={() => setView(`playlist:${p.id}`)}
            >
              {thumb(p.icon, <IList />)}
              <span className="hidden truncate lg:inline">{p.name}</span>
            </button>
            <button
              className="icon-btn hidden !h-7 !w-7 group-hover:lg:inline-grid"
              aria-label={`Eliminar playlist ${p.name}`}
              onClick={() => deletePlaylist(p.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {item("wrapped", <IWrapped />, "Wrapped")}
      {item("themes", <IPalette />, "Diseños / Temas")}
      {item("settings", <ISettings />, "Configuración")}
    </nav>
  );
}
