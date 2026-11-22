import { useEffect, useMemo, useRef, useState } from "react";
import { matchTrack, normalize, parseWanted, type WantedTrack } from "../core/importer";
import { SongCover } from "./SongCover";
import { SongActionButton } from "./SongActionButton";
import { MobileDialog } from "./MobileDialog";
import { device, isIOS, type Song } from "./device";
import { IPencil, IPlay, IUpload } from "../icons";

interface Entry extends WantedTrack { id?: string; source?: string; error?: string; durationMs?: number }
interface Collection { key: string; name: string; entries: Entry[]; kind?: "local" | "online"; cover?: string }
interface Selection { name: string; tracks: Entry[] }
export interface SongMenu { song: Song; from?: string }
type Picked = { song: Song } | { filename: string; text: string };
type CoverSource = {url:string; width?:number; height?:number; maxWidth?:number; maxHeight?:number};
type SpotifyTrack = {
  title?: string; name?: string; subtitle?: string; artists?: {name:string}[];
  duration?: number;
  coverArt?: {sources?: CoverSource[]}; visualIdentity?: {image?: CoverSource[]};
};
const storage = "phone.migrated.v1";
const providers = [
  ["YouTube Music","https://music.youtube.com/library/playlists"],
  ["SoundCloud","https://soundcloud.com/you/likes"],["Deezer","https://www.deezer.com/"],
  ["Apple Music","https://music.apple.com/"],["Tidal","https://listen.tidal.com/my-collection/tracks"],
];
const https = (s?: string) => s?.startsWith("https://");
function restored(): Collection[] {
  try { const items = JSON.parse(localStorage.getItem(storage) || "[]"); return Array.isArray(items) ? items : []; } catch { return []; }
}
function durationMatches(recording: number, expected = 0) {
  return !expected || Math.abs(recording - expected) <= Math.max(15000, expected * .15);
}
function fromFile(text: string, filename: string, base?: string): Selection {
  if (/^#EXT-X-/m.test(text)) throw Error("Ese enlace es una transmisión HLS. Selecciona una playlist de canciones.");
  const {name,wanted} = parseWanted(text,filename);
  return {name,tracks:wanted.map(w => {
    let source = w.path;
    if (base && source) source = new URL(source,base).href;
    return {...w,source:https(source) ? source : undefined};
  })};
}
async function provider(url: string) {
  const read = await device<Selection | null>("provider",{url});
  if (!read) return null;
  return {name:String(read.name || "Playlist"),tracks:read.tracks.filter(t=>typeof t.title === "string" && t.title.trim()).map(t=>({
    title:t.title,artist:typeof t.artist === "string" && t.artist !== "Artista" ? t.artist : "",
    album:typeof t.album === "string" ? t.album : "",coverUrl:typeof t.coverUrl === "string" ? t.coverUrl : undefined,
    source:typeof t.source === "string" && https(t.source) ? t.source : undefined,
  }))};
}
async function online(input: string): Promise<Selection | null> {
  const raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) return fromFile(raw,"Canciones.txt");
  const u = new URL(raw);
  if (u.protocol !== "https:") throw Error("Usa un enlace HTTPS.");
  const filename = decodeURIComponent(u.pathname.split("/").pop() || "Audio");
  if (/\.(m3u8?|csv|txt)$/i.test(filename)) return fromFile(await device<string>("remoteList",{url:raw}), filename, raw);
  if (u.hostname === "archive.org" && /^\/(details|download)\/[^/]+\/?$/.test(u.pathname)) return device<Selection>("archiveList",{url:raw});
  if (u.hostname === "open.spotify.com") {
    const match = u.pathname.match(/\/(playlist|album|track)\/([a-zA-Z0-9]+)/);
    if (match) {
      try {
        const html = await device<string>("remoteList",{url:"https://open.spotify.com/embed/"+match[1]+"/"+match[2]});
        const node = html.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
        const props = node && JSON.parse(node[1]).props.pageProps;
        const entity = props?.state?.data?.entity ?? props?.entity;
        const rows = match[1] === "track" ? [entity] : entity?.trackList;
        if (rows?.length) {
          const tracks: Entry[] = rows.flatMap((t: SpotifyTrack) => {
            const title = t?.title || t?.name;
            return title ? [{title,artist:t.artists?.map(a=>a.name).join(", ") || t.subtitle,
              durationMs:typeof t.duration === "number" && t.duration > 0 ? t.duration : undefined,
              coverUrl:bestCover(t.coverArt?.sources || t.visualIdentity?.image)}] : [];
          });
          if (tracks.length) return {name:entity.name || entity.title || "Spotify",tracks};
        }
      } catch { /* The provider may require a public playlist. */ }
    }
  }
  if (u.hostname === "open.spotify.com") throw Error("Spotify no devolvió una lista pública. Comparte una canción o una playlist que se pueda abrir sin iniciar sesión.");
  if (providers.some(([,link])=>new URL(link).hostname === u.hostname) ||
      ["youtu.be","youtube.com","www.youtube.com","m.youtube.com","www.soundcloud.com","m.soundcloud.com","deezer.com","tidal.com"].includes(u.hostname)) return provider(raw);
  return {name:filename.replace(/\.[^.]+$/,""),tracks:[{title:filename.replace(/\.[^.]+$/,""),source:raw}]};
}
function bestCover(sources?: CoverSource[]) {
  const size = (source: CoverSource) => source.width || source.maxWidth || source.height || source.maxHeight || 0;
  return [...(sources || [])].filter(source=>https(source.url)).sort((a,b)=>size(b)-size(a))[0]?.url;
}
export function Migration({ songs, play, onSong, onLinked, onBusy, scan, scanning, incoming, onConsumed, collectionsOnly, songMenu, onSongMenu, onNotice, onDeleted }: {
  songs: Song[]; play:(q:Song[],i:number)=>void; onSong:(s:Song)=>void; onLinked:(ids:string[])=>void; onBusy:(busy:boolean)=>void;
  scan:()=>Promise<void>; scanning:boolean; incoming:string|undefined; onConsumed:()=>void; collectionsOnly:boolean;
  songMenu:SongMenu|null; onSongMenu:(menu:SongMenu|null)=>void; onNotice:(text:string)=>void;
  onDeleted:(id:string)=>void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [lists,setLists] = useState<Collection[]>(restored);
  const latest = useRef(lists);
  const pendingWrite = useRef(Promise.resolve());
  const [ready,setReady] = useState(false);
  const [selected,setSelected] = useState("");
  const [busy,setBusy] = useState(false);
  const locked = useRef(false);
  const stop = useRef(false);
  const paused = useRef(false);
  const wake = useRef<()=>void>();
  const activeTransfer = useRef("");
  const [pausedUI,setPausedUI] = useState(false);
  const [cancelUI,setCancelUI] = useState(false);
  const interruptedAttempt = useRef("");
  const [progress,setProgress] = useState("");
  const [trackPercent,setTrackPercent] = useState<number>();
  const [transferId,setTransferId] = useState("");
  const [phase,setPhase] = useState("");
  const [totalProgress,setTotalProgress] = useState<{done:number; total:number; phase:"audio"|"metadata"|"local"}>();
  const [finished,setFinished] = useState("");
  const [copyingFolder,setCopyingFolder] = useState(false);
  const [error,setError] = useState("");
  const [menuPage,setMenuPage] = useState<"actions"|"move"|"create"|"delete">("actions");
  const [menuBusy,setMenuBusy] = useState(false);
  const [playlistName,setPlaylistName] = useState("");
  const [playlistSearch,setPlaylistSearch] = useState("");
  const [playlistTracks,setPlaylistTracks] = useState<string[]>([]);
  const [playlistEdit,setPlaylistEdit] = useState<{key:string; name:string; cover:string}>();
  const [editBusy,setEditBusy] = useState(false);
  const [editError,setEditError] = useState("");
  const byId = useMemo(()=>new Map(songs.map(s=>[s.id,s])),[songs]);
  const [kind,setKind] = useState<"all"|"local"|"online">("all");
  const visible = lists.filter(list => collectionsOnly
    ? kind === "all" || (list.kind || "online") === kind
    : list.entries.some(entry => entry.id && byId.has(entry.id)));
  const list = visible.find(l=>l.key===selected) || visible[0];
  const queue = useMemo(()=>list?.entries.flatMap(e=>byId.get(e.id || "") || []) || [],[list,byId]);
  const candidates = useMemo(()=>songs.map(s=>({...s,src:s.id})),[songs]);
  useEffect(() => {
    let mounted = true;
    void device<string | null>("migrationState").then(raw => {
      if (!mounted || !raw) return;
      const saved: unknown = JSON.parse(raw);
      if (Array.isArray(saved)) {
        latest.current = saved;
        setLists(saved);
      }
    }).catch(e => { if (mounted) setError(String(e)); })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  },[]);
  useEffect(() => {
    onLinked(lists.flatMap(list => list.entries.flatMap(entry => entry.id ? [entry.id] : [])));
  }, [lists,onLinked]);
  useEffect(() => {
    if (!transferId) return;
    let active = true;
    async function updateTransfer() {
      const state = await device<{id:string; phase:string; percent:number; title?:string; index?:number; total?:number} | null>("transferProgress").catch(()=>null);
      if (!active || state?.id !== transferId) return;
      setPhase(state.phase);
      setTrackPercent(state.percent >= 0 ? Math.min(100, state.percent) : undefined);
      if (state.phase === "copying" && state.index !== undefined && state.total) {
        setProgress(`${state.index + 1} / ${state.total} · ${state.title || "Audio"}`);
        setTotalProgress({done:state.index,total:state.total,phase:"local"});
      }
    }
    const timer = window.setInterval(()=>void updateTransfer(), 300);
    void updateTransfer();
    return () => { active = false; window.clearInterval(timer); };
  },[transferId]);
  function writeLists(update:(previous: Collection[])=>Collection[]) {
    const write = pendingWrite.current.then(async ()=>{
      const items = update(latest.current);
      await device("migrationState",{data:JSON.stringify(items)});
      latest.current=items; setLists(items);
    });
    pendingWrite.current = write.catch(()=>{});
    return write;
  }
  async function persist(change: Collection) {
    await writeLists(previous=>[change,...previous.filter(l=>l.key!==change.key)]);
  }
  useEffect(()=>{
    if (!songMenu) return;
    setMenuPage("actions"); setPlaylistName(""); setPlaylistSearch(""); setPlaylistTracks([songMenu.song.id]);
  },[songMenu]);
  function entryOf(song: Song): Entry {
    return {id:song.id,title:song.title,artist:song.artist,durationMs:song.duration};
  }
  async function menuAction(action:()=>Promise<void>) {
    if (busy || menuBusy) return;
    setMenuBusy(true);
    try { await action(); onSongMenu(null); }
    catch(e) { onNotice(String(e)); onSongMenu(null); }
    finally { setMenuBusy(false); }
  }
  async function moveSong(target: Collection, menu: SongMenu) {
    const item = latest.current.find(l=>l.key===menu.from)?.entries.find(e=>e.id===menu.song.id) || entryOf(menu.song);
    await writeLists(previous=>previous.map(l=>{
      if (l.key===target.key && !l.entries.some(e=>e.id===menu.song.id)) return {...l,entries:[...l.entries,item]};
      if (l.key===menu.from) return {...l,entries:l.entries.filter(e=>e.id!==menu.song.id)};
      return l;
    }));
    setSelected(target.key);
    onNotice(`Canción guardada en ${target.name}.`);
  }
  async function createPlaylist() {
    const entries = playlistTracks.flatMap(id=>{ const song=byId.get(id); return song ? [entryOf(song)] : []; });
    if (!playlistName.trim() || !entries.length) return;
    const key = crypto.getRandomValues(new Uint32Array(4)).join("-");
    await persist({key,name:playlistName.trim(),entries,kind:"local"});
    setSelected(key);
    setKind("all");
    onNotice("Playlist creada.");
  }
  async function deleteSong(song: Song) {
    const deleted = await device<number>("deleteSongs",{ids:[song.id]});
    if (!deleted) { onNotice("No se eliminó la canción."); return; }
    onDeleted(song.id);
    await writeLists(previous=>previous.map(l=>({...l,entries:l.entries.filter(e=>e.id!==song.id)})));
    onNotice("Canción eliminada.");
  }
  async function pickPlaylistCover() {
    setEditBusy(true); setEditError("");
    try {
      const cover = await device<string|null>("profilePhoto",{maxSize:384});
      if (cover) setPlaylistEdit(draft=>draft ? {...draft,cover} : draft);
    } catch(e) { setEditError(String(e)); }
    finally { setEditBusy(false); }
  }
  async function savePlaylistEdit() {
    if (!playlistEdit || !playlistEdit.name.trim() || editBusy || busy) return;
    const {key,name,cover} = playlistEdit;
    setEditBusy(true); setEditError("");
    try {
      await writeLists(previous=>previous.map(list=>list.key===key
        ? {...list,name:name.trim(),cover:cover || undefined} : list));
      setPlaylistEdit(undefined);
      onNotice("Playlist actualizada.");
    } catch(e) { setEditError(String(e)); }
    finally { setEditBusy(false); }
  }
  function changeTransfer(mode:"pause"|"resume"|"cancel") {
    paused.current = mode === "pause";
    setPausedUI(paused.current);
    if (mode === "cancel") { stop.current = true; setCancelUI(true); }
    if (activeTransfer.current) {
      if (mode !== "resume") interruptedAttempt.current = activeTransfer.current;
      void device("interruptTransfer",{requestId:activeTransfer.current,mode}).catch(e=>setError(String(e)));
    }
    if (!paused.current) wake.current?.();
  }
  async function waitUntilRunning() {
    if (paused.current && !stop.current) await new Promise<void>(resolve=>{wake.current=resolve;});
    wake.current=undefined;
    return !stop.current;
  }
  async function run(f:()=>Promise<void>) {
    if (locked.current || !ready || menuBusy) return;
    locked.current=true; setBusy(true); onBusy(true); setError(""); setTotalProgress(undefined);
    setTrackPercent(undefined); setPhase(""); setFinished(""); stop.current=false; paused.current=false; setPausedUI(false); setCancelUI(false);
    try { await f(); } catch(e) { setError(e instanceof Error ? e.message : String(e)); }
    finally {
      locked.current=false; setBusy(false); onBusy(false); setProgress(""); setTransferId(""); setCopyingFolder(false);
      activeTransfer.current=""; interruptedAttempt.current="";
    }
  }
  async function resolve(original: Collection, download: boolean) {
    const entries = original.entries.map(e=>({...e}));
    const artworkCounts = new Map<string,number>();
    for (const entry of entries) {
      if (entry.coverUrl) artworkCounts.set(entry.coverUrl,(artworkCounts.get(entry.coverUrl) || 0)+1);
    }
    const audio: Entry[] = [];
    let unavailable = 0;
    const exact = new Map<string,typeof candidates>();
    for (const track of candidates) {
      const key = normalize(track.title)+"|"+normalize(track.artist);
      const matches = exact.get(key) || [];
      matches.push(track);
      exact.set(key,matches);
    }
    for (let i=0;i<entries.length && !stop.current;i++) {
      if (!await waitUntilRunning()) break;
      const e = entries[i];
      setTotalProgress({done:i,total:entries.length,phase:download ? "audio" : "local"});
      setTrackPercent(undefined);
      setPhase("searching");
      if (e.id && byId.has(e.id)) { audio.push(e); continue; }
      setProgress((i+1)+" / "+entries.length+" · "+e.title);
      e.id=undefined; e.error=undefined;
      const exactMatch = exact.get(normalize(e.title)+"|"+normalize(e.artist || ""))?.find(track=>durationMatches(track.duration,e.durationMs));
      const match = !e.source && (exactMatch || (!download ? matchTrack(e,candidates,.78).track : undefined));
      if (match) e.id=match.id;
      else if (download) {
        while (await waitUntilRunning()) {
          const requestId = original.key + ":" + i + ":" + crypto.getRandomValues(new Uint32Array(1))[0];
          activeTransfer.current=requestId;
          setTransferId(requestId);
          try {
            const saved = await device<Song>("saveAudio",{title:e.title, artist:e.artist || "", url:e.source || "", durationMs:e.durationMs || 0, requestId});
            onSong(saved); e.id=saved.id;
            break;
          } catch(ex) {
            if (stop.current) break;
            if (interruptedAttempt.current !== requestId) { e.error=String(ex); break; }
          } finally { activeTransfer.current=""; setTransferId(""); }
        }
      }
      if (e.id) {
        const coverUrl = e.coverUrl && artworkCounts.get(e.coverUrl) === 1 ? e.coverUrl : undefined;
        audio.push({...e,coverUrl});
        await persist({...original,entries:[...audio]});
      } else if (!stop.current) unavailable++;
      if (!download && i%20===0) await new Promise(r=>setTimeout(r,0));
    }
    if (download) {
      for (let index=0; index<audio.length && !stop.current; index++) {
        if (!await waitUntilRunning()) break;
        const entry = audio[index];
        setTotalProgress({done:index,total:audio.length,phase:"metadata"});
        setTrackPercent(undefined);
        setPhase("enriching");
        if (!entry.artist && !entry.coverUrl) continue;
        setProgress("Letras y portadas " + (index+1) + " / " + audio.length + " · " + entry.title);
        await device("enrichMigration",{id:entry.id,title:entry.title,artist:entry.artist || "",cover:entry.coverUrl || ""}).catch(()=>{});
      }
    }
    if (!audio.length && !stop.current) setError("No se encontró audio completo disponible para esta lista.");
    else if (unavailable) setError(unavailable + " pistas sin audio disponible se omitieron.");
    if (!stop.current && audio.length) setFinished(`Proceso completado · ${audio.length} de ${entries.length} canciones guardadas`);
  }
  const overall = totalProgress && Math.floor(totalProgress.phase === "metadata"
    ? 85 + 15 * totalProgress.done / totalProgress.total
    : (totalProgress.done + (trackPercent || 0) / 100) / totalProgress.total * (totalProgress.phase === "audio" ? 85 : 100));
  async function add(selection: Selection | null, download: boolean) {
    if (!selection || stop.current) return;
    if (!selection.tracks.length) throw Error("La lista no contiene canciones.");
    const item: Collection = {key:crypto.getRandomValues(new Uint32Array(4)).join("-"),name:selection.name,kind:download ? "online" : "local",entries:selection.tracks};
    setSelected(item.key);
    await resolve(item,download);
  }
  useEffect(()=>{
    if (!incoming || busy || scanning || !ready) return;
    onConsumed();
    void run(async()=>add(await online(incoming),true));
  },[incoming,busy,scanning,ready,onConsumed]);

  function pick() { return run(async()=>{
    const picked=await device<Picked|null>("pickList");
    if (!picked) return;
    if ("song" in picked) {
      const s=picked.song; onSong(s);
      const item: Collection={key:crypto.getRandomValues(new Uint32Array(4)).join("-"),name:s.title,kind:"local",entries:[{title:s.title,artist:s.artist,id:s.id}]};
      setSelected(item.key); await persist(item);
    } else await add(fromFile(picked.text,picked.filename),false);
  }); }
  async function pickFolder() {
    await run(async()=>{
      const requestId = crypto.getRandomValues(new Uint32Array(4)).join("-");
      heading.current?.scrollIntoView({block:"start"});
      setCopyingFolder(true);
      activeTransfer.current=requestId;
      setTransferId(requestId);
      const imported = await device<{name:string;songs:Song[];failed:number}|null>("pickFolder",{requestId});
      if (!imported) return;
      if (!imported.songs.length) {
        if (stop.current) return;
        throw Error("No se pudieron importar audios de la carpeta.");
      }
      imported.songs.forEach(onSong);
      const item: Collection = {key:crypto.getRandomValues(new Uint32Array(4)).join("-"),name:imported.name,kind:"local",
        entries:imported.songs.map(song=>({id:song.id,title:song.title,artist:song.artist}))};
      setSelected(item.key); await persist(item);
      if (!stop.current) setFinished(`Importación completada · ${imported.songs.length} audios guardados`);
      if (imported.failed) setError(imported.failed+" archivos no se pudieron importar.");
    });
  }
  return <div className="migration"><h1 ref={heading}>{collectionsOnly ? "Tus playlists" : "Migrar canciones"}</h1>
    {busy && <div className="migration-status" role="status">
      {cancelUI ? "Cancelando migración…" : pausedUI ? "Migración en pausa" : progress || "Preparando la migración…"}
      <div className="migration-progress">
        {totalProgress && <label>{phase === "saving" ? "Verificando y guardando" : phase === "copying" ? "Copia del archivo" : phase === "downloading" ? "Descarga de la canción" :
          phase === "enriching" ? "Buscando portada y letra" : "Buscando la canción"}
          {trackPercent !== undefined && (phase === "downloading" || phase === "copying") && ` · ${Math.floor(trackPercent)} %`}
          <progress max={100} value={trackPercent}/>
        </label>}
        <label>Progreso total{overall !== undefined && ` · ${overall} %`}<progress max={100} value={overall}/></label>
      </div>
      {(progress || (!copyingFolder && totalProgress)) && !cancelUI && <div className="actions">
        <button onClick={()=>changeTransfer(pausedUI ? "resume" : "pause")}>{pausedUI ? "Reanudar" : "Pausar"}</button>
        <button onClick={()=>changeTransfer("cancel")}>Cancelar</button>
      </div>}
    </div>}
    {!busy && cancelUI && <p className="migration-status" role="status">Migración cancelada. Las canciones guardadas siguen disponibles.</p>}
    {!busy && finished && <div className="migration-status migration-progress" role="status">
      {finished}<progress aria-label="Progreso total" max={100} value={100}/>
    </div>}
    {error && <p className="migration-status" role="alert">{error}</p>}
    {!collectionsOnly && <>
    {!isIOS && <><section><h2>Migrar desde otra app</h2>
    <p>Abre una canción o playlist y elige <strong>Compartir → Alify</strong>. La descarga empieza al volver. Las pistas guardadas aparecen en tu Biblioteca y en Playlists.</p>
    <p>Después de descargar las canciones, Alify busca las portadas y las letras disponibles. Las migraciones largas pueden calentar el teléfono mientras trabajan.</p>
    <details><summary>Abrir reproductor</summary>
      <div className="actions">{[["spotify","Spotify"],["youtube","YouTube Music"],["soundcloud","SoundCloud"],["deezer","Deezer"],["apple","Apple Music"],["tidal","Tidal"]].map(([id,name])=><button key={id} disabled={busy} onClick={()=>void run(()=>device("openPlayer",{id}))}>{name}</button>)}</div>
      <details><summary>Abrir en el navegador</summary><div className="actions">{[["Spotify","https://open.spotify.com/"],...providers].map(([name,url])=><button disabled={busy} key={name} onClick={()=>void run(()=>device("browserPlayer",{url}))}>{name}</button>)}</div></details>
    </details></section>
    <section><h2>Escanear audios del teléfono</h2>
    <button disabled={busy || scanning} onClick={()=>void scan()}>{scanning ? "Buscando…" : "Escanear el teléfono"}</button></section></>}
    <section>
    <h2>Importar manualmente</h2>
    <div className="actions">
      <button disabled={busy} onClick={()=>void pickFolder()}><IUpload/> Elegir carpeta</button>
      <button disabled={busy} onClick={()=>void pick()}><IUpload/> Elegir audio o lista</button>
    </div>
    <details><summary>Importar desde Alify para Windows</summary><p>Usa <strong>Exportar para Android</strong> en Windows, copia la carpeta al teléfono y selecciónala aquí para conservar el orden, las letras disponibles y las portadas incrustadas.</p></details>
    </section></>}
    {collectionsOnly && <div className="actions">{([["all","Todas"],["local","Importadas"],["online","Migradas"]] as const).filter(([id]) => !isIOS || id !== "online").map(([id,label])=>
      <button key={id} aria-pressed={kind===id} onClick={()=>{setKind(id);}}>{label}</button>)}</div>}
    {collectionsOnly && !list && <p>Las playlists que importes o migres aparecerán aquí.</p>}
    {list && <><div className="collection-heading">
      {list.cover && collectionsOnly ? <span className="song-cover"><img src={list.cover} alt=""/></span> : <SongCover id={queue[0]?.id || ""} fallback="♪"/>}
      <h2>{collectionsOnly ? list.name : "Mis migraciones"}</h2>
      {collectionsOnly && <button aria-label={`Editar playlist ${list.name}`} disabled={busy || !ready}
        onClick={()=>{setEditError("");setPlaylistEdit({key:list.key,name:list.name,cover:list.cover || ""});}}><IPencil/></button>}
      </div>
      <select aria-label="Elegir playlist" value={list.key} disabled={busy} onChange={e=>{setSelected(e.target.value);}}>{visible.map(l=><option key={l.key} value={l.key}>{l.name}</option>)}</select>
      <p>{queue.length} con audio</p>
      <button disabled={!queue.length} onClick={()=>play(queue,0)}><IPlay/> Reproducir lista</button>
      <ol>{queue.map((song,index)=><li key={song.id+"-"+index}><SongActionButton label={"Reproducir "+song.title} play={()=>play(queue,index)}
        menu={()=>{if (!busy) onSongMenu({song,from:list.key});}}>
        <SongCover id={song.id} fallback="♪"/><span><strong>{song.title}</strong><small>{song.artist}</small></span>
      </SongActionButton></li>)}</ol></>}
    {playlistEdit && <MobileDialog title="Editar playlist" close={()=>{if(!editBusy)setPlaylistEdit(undefined);}}>
      <form className="song-menu" onSubmit={event=>{event.preventDefault();void savePlaylistEdit();}}>
        <label>Nombre de la playlist<input className="search" maxLength={80} value={playlistEdit.name}
          onChange={event=>setPlaylistEdit({...playlistEdit,name:event.target.value})}/></label>
        {playlistEdit.cover && <span className="song-cover playlist-cover-preview"><img src={playlistEdit.cover} alt="Portada de la playlist"/></span>}
        <div className="actions"><button type="button" disabled={editBusy} onClick={()=>void pickPlaylistCover()}>Cambiar portada</button>
          {playlistEdit.cover && <button type="button" disabled={editBusy} onClick={()=>setPlaylistEdit({...playlistEdit,cover:""})}>Quitar portada</button>}</div>
        {editError && <p role="alert">{editError}</p>}
        <button className="primary" disabled={busy || editBusy || !playlistEdit.name.trim()}>Guardar cambios</button>
      </form>
    </MobileDialog>}
    {songMenu && <MobileDialog title={songMenu.song.title} close={()=>{if (!menuBusy) onSongMenu(null);}}>
      {menuPage === "actions" && <div className="song-menu">
        <button disabled={busy || menuBusy} onClick={()=>void menuAction(async()=>{
          await device("control",{command:"playNext",song:songMenu.song}); onNotice("Canción agregada a la cola.");
        })}>Reproducir después</button>
        <button disabled={busy || menuBusy} onClick={()=>setMenuPage("move")}>Mover canción de playlist</button>
        <button disabled={busy || menuBusy} onClick={()=>setMenuPage("create")}>Crear playlist con esta canción</button>
        <button disabled={busy || menuBusy} onClick={()=>setMenuPage("delete")}>Eliminar canción</button>
      </div>}
      {menuPage === "delete" && <>
        <p>Se eliminará el archivo del dispositivo y de sus playlists.</p>
        <button disabled={menuBusy} onClick={()=>void menuAction(()=>deleteSong(songMenu.song))}>Confirmar eliminación</button>
      </>}
      {menuPage === "move" && <div className="song-menu">
        {lists.filter(l=>l.key!==songMenu.from).map(target=><button key={target.key} disabled={menuBusy}
          onClick={()=>void menuAction(()=>moveSong(target,songMenu))}>{target.name}</button>)}
        {!lists.some(l=>l.key!==songMenu.from) && <p>Crea una playlist para guardar esta canción.</p>}
      </div>}
      {menuPage === "create" && <form className="song-menu" onSubmit={event=>{event.preventDefault(); void menuAction(createPlaylist);}}>
        <input className="search" aria-label="Nombre de la playlist" placeholder="Nombre de la playlist" maxLength={80}
          value={playlistName} onChange={event=>setPlaylistName(event.target.value)}/>
        <input className="search" aria-label="Buscar canciones para la playlist" placeholder="Buscar canciones"
          value={playlistSearch} onChange={event=>setPlaylistSearch(event.target.value)}/>
        <div className="playlist-song-options">
          {songs.filter(song=>normalize(song.title+" "+song.artist).includes(normalize(playlistSearch))).map(song=>(
            <label key={song.id}><input type="checkbox" checked={playlistTracks.includes(song.id)}
              onChange={event=>setPlaylistTracks(ids=>event.target.checked ? [...ids,song.id] : ids.filter(id=>id!==song.id))}/>
              <span>{song.title}<small>{song.artist}</small></span>
            </label>
          ))}
        </div>
        <button className="primary" disabled={menuBusy || !playlistName.trim() || !playlistTracks.length}>Guardar playlist</button>
      </form>}
    </MobileDialog>}
  </div>;
}
