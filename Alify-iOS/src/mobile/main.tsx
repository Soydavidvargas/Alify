import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { device, isIOS, type Song } from "./device";
import { SongCover } from "./SongCover";
import { Profile, profileName, profilePhoto } from "./Profile";
import { Migration, type SongMenu } from "./Migration";
import { SongActionButton } from "./SongActionButton";
import { MobileDialog } from "./MobileDialog";
import { Equalizer } from "./Equalizer";
import { MobileWrapped } from "./MobileWrapped";
import { activeLineIndex, parseLyrics } from "../core/lyricsParser";
import { allThemes, applyTheme, setActiveId, wallpaperUrl } from "../theme-engine/themeLoader";
import { IPlay, IPause, INext, IPrev, IShuffle, IDice, IHome, IList, IPalette, IMic, IFloat, IHeart, IMax, IClose, IMigrate, IPencil, IQueue, IEq } from "../icons";
import { readVariants, variants, widgetTint, withVariant } from "../theme-engine/themeVariants";
import "./phone.css";
import logo from "../../public/alify-icon.png";

interface Status { id: string; playing: boolean; position: number; shuffle: boolean; error: string }
type Page = "library" | "device" | "favorites" | "collections" | "lyrics" | "themes" | "migration" | "profile" | "wrapped";
const themes = allThemes();
const widgetArt = import.meta.glob("../../src-tauri/gen/android/app/src/main/assets/instruments/*.webp", {
  eager: true, query: "?url", import: "default",
}) as Record<string, string>;
const iosWidgetArt = import.meta.glob("../../src-tauri/ios/Widget/Skins/*.webp", {
  eager: true, query: "?url", import: "default",
}) as Record<string, string>;
const clock = (ms: number) => Math.floor(ms / 60000) + ":" + String(Math.floor(ms / 1000) % 60).padStart(2, "0");
function savedIds(): string[] {
  try { return JSON.parse(localStorage.getItem("phone.saved") || "[]"); } catch { return []; }
}
function Phone() {
  const [page, setPage] = useState<Page>("library");
  const [incoming,setIncoming] = useState<string[]>([]);
  const consumeShare = useCallback(()=>setIncoming(queue=>queue.slice(1)),[]);
  const [songs, setSongs] = useState<Song[]>([]);
  const removed = useRef(new Set<string>());
  const [saved, setSaved] = useState<string[]>(savedIds);
  const [linked, setLinked] = useState<string[]>([]);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [songMenu, setSongMenu] = useState<SongMenu|null>(null);
  const [playerPanel, setPlayerPanel] = useState<"queue"|"equalizer">();
  const [upcoming,setUpcoming] = useState<{title:string;artist:string}[]>([]);
  const [starting, setStarting] = useState(true);
  const [skeleton,setSkeleton] = useState(true);
  const [openingThemes,setOpeningThemes] = useState(false);
  const [name,setName] = useState(profileName);
  const [photo,setPhoto] = useState(profilePhoto);
  const [global, setGlobal] = useState(localStorage.getItem("phone.global") === "true");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(80);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState("");
  const [scanError, setScanError] = useState("");
  const [skin, setSkin] = useState(localStorage.getItem("alify.theme") || "alify-original");
  const theme = themes.find(t => t.id === skin) || themes[0];
  const [palettes, setPalettes] = useState(readVariants);
  const [appearanceReady, setAppearanceReady] = useState(false);
  const [editing, setEditing] = useState("");
  const variant = variants[palettes[theme.id]] || variants[0];
  const [status, setStatus] = useState<Status>({id:"", playing:false, position:0, shuffle:false, error:""});
  const [cover, setCover] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [full, setFull] = useState(false);
  const [hud, setHud] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const activeLine = useRef<HTMLParagraphElement>(null);
  const byId = useMemo(() => new Map(songs.map(s => [s.id,s])), [songs]);
  const song = byId.get(status.id);
  const selected = useMemo(() => new Set(saved), [saved]);
  const library = useMemo(() => {
    const ids = new Set([...saved,...linked]);
    return songs.filter(t => ids.has(t.id));
  }, [songs,saved,linked]);
  const favorites = useMemo(()=>songs.filter(song=>selected.has(song.id)),[songs,selected]);
  const source = page === "device" ? songs : page === "favorites" ? favorites : library;
  const filtered = useMemo(() => source.filter(t => (t.title + " " + t.artist).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [source,query]);
  const parsed = useMemo(() => parseLyrics(lyrics), [lyrics]);
  const line = parsed.synced ? activeLineIndex(parsed.lines, status.position / 1000) : -1;
  const report = (e: unknown) => setNotice(String((e as {message?: string})?.message || e));
  const scan = useCallback(async () => {
    setBusy(true); setScanError("");
    try { setSongs((await device<Song[]>("scan")).filter(song=>!removed.current.has(song.id))); }
    catch(e) { setScanError(String(e)); }
    finally { setBusy(false); setStarting(false); }
  }, []);
  useEffect(() => { void scan(); }, [scan]);
  useEffect(()=>{
    if (starting) return;
    const timer = window.setTimeout(()=>setSkeleton(false),3000);
    return ()=>window.clearTimeout(timer);
  },[starting]);
  useEffect(()=>{
    if (!openingThemes) return;
    const timer = window.setTimeout(()=>setOpeningThemes(false),750);
    return ()=>window.clearTimeout(timer);
  },[openingThemes]);
  useEffect(()=>{
    if (isIOS) return;
    const check = () => {
      if (document.hidden) return;
      void device<string|null>("sharedLink").then(link=>{
        if (link) { setIncoming(queue=>[...queue,link]); setFull(false); setOpeningThemes(false); setPage("migration"); }
      }).catch(()=>{});
    };
    check();
    const timer = window.setInterval(check,1200);
    return ()=>window.clearInterval(timer);
  },[]);
  useEffect(() => {
    let disposed = false;
    let refresh: ReturnType<typeof setTimeout>;
    async function poll() {
      if (!document.hidden) {
        try {
          const s = await device<Status>("status");
          if (!disposed) setStatus(old => old.id === s.id && old.playing === s.playing && old.position === s.position &&
            old.shuffle === s.shuffle && old.error === s.error ? old : s);
        }
        catch(e) { if (!disposed) report(e); }
      }
      if (!disposed) refresh = setTimeout(poll, document.hidden ? 1200 : 400);
    }
    void poll();
    return () => { disposed = true; clearTimeout(refresh); };
  }, []);
  useEffect(() => {
    let mounted = true;
    void device<{skin:string; palettes?:Record<string,number>}>("theme").then(saved => {
      if (!mounted) return;
      if (themes.some(t => t.id === saved.skin)) setSkin(saved.skin);
      if (saved.palettes) setPalettes(saved.palettes);
    }).catch(e => { if (mounted) report(e); })
      .finally(() => { if (mounted) setAppearanceReady(true); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!appearanceReady) return;
    const appearance = withVariant(theme, variant);
    applyTheme(appearance);
    setActiveId(theme.id);
    void device("theme", {skin:theme.id, palettes, accent:appearance.colors.accent, customPalette:!!variant.accent,
      widgetMatrix: variant.accent ? widgetTint(variant.accent, theme) : [],
      headerColor: appearance.vars.mobileSurface || "#18191e"}).catch(report);
  }, [theme,palettes,variant,appearanceReady]);
  useEffect(() => {
    let current = true;
    setCover(""); setLyrics("");
    if (status.id) {
      const imported = localStorage.getItem("lyrics." + status.id);
      if (imported) setLyrics(imported);
      type Art = {cover?: string; lyrics?: string};
      void Promise.all([device<Art>("artwork",{id:status.id}).catch(():Art=>({})),
        device<Art>("migrationExtras",{id:status.id}).catch(():Art=>({}))]).then(([meta, extra]) => {
        if (current) { setCover(extra.cover || meta.cover || ""); setLyrics(localStorage.getItem("lyrics." + status.id) || meta.lyrics || extra.lyrics || ""); }
      }).catch(() => {});
    }
    return () => { current = false; };
  }, [status.id]);
  useEffect(() => { activeLine.current?.scrollIntoView({block:"center", behavior:"smooth"}); }, [line,page,full]);
  useEffect(() => { void device("fullscreen", {enabled:full}).catch(report); }, [full]);
  useEffect(() => { const back = () => { setFull(false); setHud(false); }; window.addEventListener("popstate", back); return () => window.removeEventListener("popstate",back); }, []);
  const go = (next: Page) => { setOpeningThemes(next === "themes" && page !== next); setPage(next); setQuery(""); setLimit(80); setNotice(""); };
  const command = (command: string, args: Record<string, unknown> = {}) => { void device("control",{command,...args}).catch(report); };
  useEffect(()=>{
    if (playerPanel !== "queue") return;
    let active = true;
    void device<typeof upcoming>("control",{command:"upcoming"}).then(data=>{if(active)setUpcoming(data);}).catch(report);
    return ()=>{active=false;};
  },[playerPanel,status.id,status.shuffle]);
  useEffect(() => {
    function shortcut(e: KeyboardEvent) {
      if (e.code !== "Space" || !status.id || e.repeat || (e.target instanceof Element && e.target.closest("button,input,textarea,select"))) return;
      e.preventDefault();
      void device("control", {command:"toggle"}).catch(report);
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [status.id]);
  const play = (queue: Song[], index: number) => { if (queue.length) command("queue",{queue,index}); };
  const toggleSaved = (id: string) => {
    const next = selected.has(id) ? saved.filter(x => x !== id) : [...saved,id];
    localStorage.setItem("phone.saved",JSON.stringify(next)); setSaved(next);
  };
  function removeSong(id:string) {
    removed.current.add(id);
    setSongs(old=>old.filter(song=>song.id!==id));
    const next = saved.filter(savedId=>savedId!==id);
    setSaved(next);
    localStorage.setItem("phone.saved",JSON.stringify(next));
    localStorage.removeItem("lyrics."+id);
  }
  const toggleGlobal = () => { localStorage.setItem("phone.global",String(!global)); setGlobal(!global); };
  const pin = async () => {
    if (isIOS) {
      setNotice("Mantén pulsada la pantalla de inicio del iPhone, toca Editar → Añadir widget y busca Alify.");
      return;
    }
    try { if (!await device<boolean>("pin")) setNotice("Mantén pulsado el escritorio de Android, abre Widgets y selecciona Alify."); } catch(e) { report(e); } };
  const importLyrics = async () => {
    if (!song) return;
    try {
      const text = await device<string | null>("pickLyrics");
      if (text === null) return;
      localStorage.setItem("lyrics." + song.id, text);
      setLyrics(text);
    } catch (error) { report(error); }
  };
  const enterFull = () => { history.pushState({lyrics:true},"","#letra"); setHud(false); setFull(true); };
  const reveal = () => { clearTimeout(timer.current); setHud(true); timer.current = setTimeout(() => setHud(false), 4500); };
  const canvas = <div className="canvas" style={{backgroundImage:"url(" + (cover || wallpaperUrl(theme)) + ")"}}>
    <div className="sleeve">{cover ? <img src={cover} alt="Portada de la canción"/> : <div className="record" aria-hidden="true"/>}</div>
    <div className="caption"><small>ALIFY / EN REPRODUCCIÓN</small><h2>{song?.title || "Alify"}</h2><span>{song?.artist || "Música local"}</span></div>
  </div>;
  const transport = <div className="transport">
    <button aria-label="Ver cola de reproducción" disabled={!song} onClick={()=>{setUpcoming([]); setPlayerPanel("queue");}}><IQueue/></button>
    <button aria-label="Reproducción aleatoria" aria-pressed={status.shuffle} disabled={!song} onClick={() => command("shuffle")}><IShuffle/></button>
    <button aria-label="Anterior" disabled={!song} onClick={() => command("previous")}><IPrev/></button>
    <button className="primary play" aria-label={status.playing ? "Pausar" : "Reproducir"} disabled={!song} onClick={() => command("toggle")}>{status.playing ? <IPause/> : <IPlay/>}</button>
    <button aria-label="Siguiente" disabled={!song} onClick={() => command("next")}><INext/></button>
    <button aria-label="Cambiar canción al azar" disabled={!song} onClick={() => command("random")}><IDice/></button>
    {!isIOS && <button aria-label="Ecualizador" disabled={!song} onClick={()=>setPlayerPanel("equalizer")}><IEq/></button>}
  </div>;
  const lines = <div className="verses" aria-label="Letra de la canción">{parsed.lines.length ? parsed.lines.map((l,i) =>
    <p key={i} className={line === i ? "current" : ""} ref={line === i ? activeLine : null}>{l.text || " "}</p>) :
    <p>{song ? "Esta canción aún no tiene letra." : "Elige una canción para ver su letra."}</p>}</div>;
  if (starting) return <div className="startup" role="status"><img alt="" src={logo}/><strong>Alify</strong><p>Buscando música en el dispositivo…</p><progress aria-label="Cargando biblioteca"/></div>;
  if (skeleton) return <div className="skeleton-page" role="status" aria-label="Preparando Alify"><b>Alify</b><div/><i/><i/><i/></div>;
  return <>{openingThemes && <div className="startup" role="status"><img alt="" src={logo}/><strong>Alify</strong><p>Cargando temas y diseños…</p><progress aria-label="Cargando temas y diseños"/></div>}{full && <main className="full-lyrics" onClick={reveal} onKeyDown={reveal} tabIndex={0} aria-label="Letra a pantalla completa. Toca para ver los controles.">
    {lines}{hud && <div className="full-controls">{transport}<button onClick={e => {e.stopPropagation(); history.back();}}><IClose/> Salir de pantalla completa</button></div>}
  </main>}<div className={isIOS ? "phone ios-phone" : "phone"} style={full || openingThemes ? {display:"none"} : undefined}><header><b>Alify</b><button className="profile-link" aria-label="Abrir perfil" onClick={() => go("profile")}>{photo && <img alt="" src={photo}/>}<span>{name || "Perfil"}</span></button><button aria-label="Añadir widget a la pantalla de inicio" onClick={() => void pin()}><IFloat/> Widget</button></header>
    <main hidden={page !== "migration" && page !== "collections"}>
      {page === "collections" && <div className="actions"><button onClick={()=>go("favorites")}><IHeart/> Canciones que me gustan</button><button onClick={()=>go("device")}><IList/> Audios del dispositivo</button><button onClick={()=>go("migration")}><IMigrate/> Importar o migrar</button></div>}
      <Migration collectionsOnly={page === "collections"} incoming={incoming[0]} onConsumed={consumeShare} scan={scan} scanning={busy} onLinked={setLinked} onBusy={setMigrationBusy} songs={songs} play={play} onSong={s => setSongs(old => old.some(t => t.id === s.id) ? old : [...old,s])}
        songMenu={songMenu} onSongMenu={setSongMenu} onNotice={setNotice} onDeleted={removeSong}/>
    </main>
    <main key={page} hidden={page === "migration" || page === "collections"}>
    {(page === "library" || page === "device" || page === "favorites") && <>
      {page === "library" && canvas}
      <h1>{page === "device" ? "Audios del dispositivo" : page === "favorites" ? "Canciones que me gustan" : "Mi biblioteca"}</h1>
      {page === "device" ? <>
        <p>{busy ? "Buscando audios…" : songs.length + " audios encontrados"}</p>
        <label className="switch"><input type="checkbox" checked={global} onChange={toggleGlobal}/> ¿Esta playlist podrá estar en las reproducciones globales automáticamente?</label>
        <button disabled={busy} onClick={() => isIOS ? go("migration") : void scan()}>{isIOS ? "Importar desde Archivos" : "Volver a buscar"}</button>
      </> : <div className="actions"><button className="primary" disabled={!(global ? songs : library).length} onClick={() => { const q = global ? songs : library; play(q, Math.floor(Math.random()*q.length)); }}><IShuffle/> Reproducción global</button>
      <button onClick={() => go("device")}><IList/> Audios del dispositivo</button>{!isIOS && <button onClick={()=>go("wrapped")}>Wrapped</button>}</div>}
      {scanError && <p role="alert">{scanError}</p>}
      {source.length > 0 && <input className="search" aria-label="Buscar por canción o artista" placeholder="Buscar canción o artista" value={query} onChange={e => {setQuery(e.target.value);setLimit(80);}}/>}
      {!filtered.length && <p>{query ? "Sin coincidencias." : page === "library" ? "Guarda canciones con el corazón desde Audios del dispositivo." : !busy && !scanError ? (isIOS ? "Importa tus audios desde Archivos." : "Android aún no ha encontrado archivos de audio compartidos.") : ""}</p>}
      <ul>{filtered.slice(0,limit).map((t,i) => <li key={t.id}><SongActionButton label={"Reproducir " + t.title} play={()=>play(filtered,i)}
        menu={()=>{if(!migrationBusy)setSongMenu({song:t});}}>
        <SongCover id={t.id} fallback={t.id === status.id ? "♪" : i+1}/><span><strong>{t.title}</strong><small>{t.artist}</small></span>
        <time>{clock(t.duration)}</time></SongActionButton><button aria-label={(selected.has(t.id) ? "Quitar de" : "Guardar en") + " mi biblioteca: " + t.title} aria-pressed={selected.has(t.id)} onClick={() => toggleSaved(t.id)}><IHeart filled={selected.has(t.id)}/></button></li>)}</ul>
      {filtered.length > limit && <button onClick={() => setLimit(limit+80)}>Ver más canciones</button>}
    </>}
    {page === "lyrics" && !full && <section className="lyric-page">{canvas}<div className="lyric-tools"><h1>Letra</h1>{isIOS && song && <button onClick={()=>void importLyrics()}>Importar letra LRC</button>}
      <button aria-label="Letra a pantalla completa" onClick={enterFull}><IMax/> Pantalla completa</button></div>{lines}</section>}
    {page === "wrapped" && <MobileWrapped theme={theme} name={name} songs={songs} play={play}/>}
    {page === "profile" && <Profile name={name} photo={photo} onName={setName} onPhoto={setPhoto}
      blocked={busy || migrationBusy} songs={songs} refresh={scan} />}
    {page === "themes" && <>
      <h1>Temas y diseños</h1>
      <svg aria-hidden="true" width="0" height="0" style={{position:"absolute"}}>
        <defs>{themes.map(t => {
          const option = variants[palettes[t.id]] || variants[0];
          return option.accent && <filter key={t.id} id={`widget-${t.id}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={widgetTint(option.accent, t).join(" ")}/>
          </filter>;
        })}</defs>
      </svg>
      <div className="skins">{themes.map(t => {
        const option = variants[palettes[t.id]] || variants[0];
        const art = isIOS ? iosWidgetArt[`../../src-tauri/ios/Widget/Skins/${t.id}.webp`] : widgetArt[`../../src-tauri/gen/android/app/src/main/assets/instruments/${t.id}.webp`];
        return <article className="skin-card" key={t.id}>
          <button className="skin-choice" aria-pressed={theme.id === t.id} onClick={() => setSkin(t.id)}>
            <div className="theme-phone-preview" aria-hidden="true" style={{background:option.surface || t.colors.bg}}>
              {art && <img className="widget-preview-art" alt="" loading="lazy" src={art}
                style={option.accent ? {filter:`url(#widget-${t.id})`} : undefined}/>}
              {t.id === "alify-original" && <img className="widget-preview-logo" alt="" src={logo}/>}
            </div>
            <strong>{t.name}</strong>
            {t.id === "alify-original" && <small>Diseño Alify original</small>}
          </button>
          <button className="skin-edit" aria-label={`Editar colores de ${t.name}`} aria-expanded={editing === t.id} onClick={() => setEditing(editing === t.id ? "" : t.id)}>
            <IPencil width={17} height={17}/><span>{option.name}</span>
          </button>
          {editing === t.id && <div className="skin-variants" role="group" aria-label={`Variantes de ${t.name}`}>
            {variants.map((item,index) => <button key={item.name} aria-pressed={option === item} onClick={() => {
              const next = {...palettes,[t.id]:index};
              localStorage.setItem("phone.themeVariants",JSON.stringify(next));
              setPalettes(next);
              setSkin(t.id);
            }}><span style={{background:item.accent || t.colors.accent}}/>{item.name}</button>)}
          </div>}
        </article>;
      })}</div>
    </>}
    </main>
    {(notice || status.error) && <aside role="status">{notice || status.error}{notice && <button aria-label="Cerrar aviso" onClick={() => setNotice("")}><IClose/></button>}</aside>}
    {song && <footer><button className="now" onClick={() => go("lyrics")}><strong>{song.title}</strong><small>{song.artist}</small></button>
      <input aria-label="Posición en la canción" type="range" min={0} max={song.duration || 1} value={Math.min(status.position,song.duration)} onChange={e => command("seek",{position:Number(e.target.value)})}/>{transport}</footer>}
    <nav>{([["library","Biblioteca",IHome],["collections","Playlists",IList],["migration","Migrar",IMigrate],["lyrics","Letra",IMic],["themes","Diseños",IPalette]] as const).map(([key,label,Icon]) =>
      <button key={key} aria-current={key === page ? "page" : undefined} onClick={() => go(key)}><Icon/>{label}</button>)}</nav>
  </div>
  {playerPanel && <MobileDialog title={playerPanel==="queue" ? "Cola de reproducción" : "Ecualizador"} close={()=>setPlayerPanel(undefined)}>
    {playerPanel==="queue" ? <>
      {song && <p>En reproducción · {song.title}</p>}
      {upcoming.length ? <ol className="upcoming-tracks">{upcoming.map((row,i)=><li key={i}>
        <strong>{row.title}</strong><small>{row.artist}</small>
      </li>)}</ol> : <p>No hay más canciones en la cola.</p>}
    </> : <Equalizer track={status.id} playing={status.playing}/>}
  </MobileDialog>}
  </>;
}
createRoot(document.getElementById("root")!).render(<Phone/>);
