import { useEffect, useState } from "react";
import { type ThemeDef } from "../theme-engine/themeLoader";
import { fmtListenDuration, type TrackStat } from "../stats";
import { wrappedPng } from "../core/wrappedPng";
import { device, type Song } from "./device";
import { SongCover } from "./SongCover";

export function MobileWrapped({theme,name,songs,play}:{theme:ThemeDef;name:string;songs:Song[];play:(songs:Song[],index:number)=>void}) {
  const [stats,setStats] = useState<TrackStat[]>([]);
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState("");
  useEffect(()=>{
    const refresh = () => void device<Record<string,TrackStat>>("wrapped")
      .then(rows=>setStats(Object.values(rows))).catch(error=>setMessage(String(error)));
    refresh();
    const timer = window.setInterval(refresh,6000);
    return ()=>window.clearInterval(timer);
  },[]);
  const total = stats.reduce((sum,row)=>sum+row.seconds,0);
  const top = [...stats].filter(row=>row.seconds>0).sort((a,b)=>b.seconds-a.seconds).slice(0,5);
  async function save() {
    setMessage(""); setSaving(true);
    try {
      const artwork = await Promise.all(top.map(async row=>({...row,cover:await device<string>("coverThumb",{id:row.id}).catch(()=>"")})));
      const blob = await wrappedPng(theme,name || "Alify",total,artwork,top.reduce((sum,row)=>sum+row.seconds,0));
      const png = await new Promise<string>((resolve,reject)=>{
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = ()=>resolve(String(reader.result).split(",")[1]);
        reader.readAsDataURL(blob);
      });
      if (await device<boolean>("saveWrapped",{png})) setMessage("Tarjeta PNG guardada.");
    } catch(error) { setMessage(String(error)); }
    finally { setSaving(false); }
  }
  return <section className="mobile-wrapped">
    <div className="wrapped-hero"><h1>Alify Wrapped</h1><strong>{fmtListenDuration(total)}</strong><small>Tiempo de escucha</small></div>
    <h2>Tus 5 más escuchadas</h2>
    {top.length ? <ol>{top.map(row=>{
      const index = songs.findIndex(song=>song.id===row.id);
      return <li key={row.id}><button className="song" disabled={index<0} onClick={()=>play(songs,index)}>
        <SongCover id={row.id} fallback="♪"/><span><strong>{row.title}</strong><small>{row.artist}</small></span><time>{fmtListenDuration(row.seconds)}</time>
      </button></li>;
    })}</ol> : <p>Reproduce música para empezar a crear tu resumen.</p>}
    <button className="primary" disabled={!top.length || saving} onClick={()=>void save()}>Guardar tarjeta PNG</button>
    {message && <p role="status">{message}</p>}
  </section>;
}
