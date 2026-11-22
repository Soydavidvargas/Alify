import { useEffect, useState } from "react";
import { device, isIOS, type Song } from "./device";

export const profileName = () => localStorage.getItem("phone.profile.name") || "";
export const profilePhoto = () => localStorage.getItem("phone.profile.photo") || "";

export function Profile({name,photo,onName,onPhoto,blocked,songs,refresh}:{
  name:string; photo:string; onName:(value:string)=>void; onPhoto:(value:string)=>void;
  blocked:boolean; songs:Song[]; refresh:()=>Promise<void>;
}) {
  const [draft,setDraft] = useState(name);
  const [busy,setBusy] = useState(false);
  const [confirm,setConfirm] = useState(false);
  const [message,setMessage] = useState("");
  const [reminder,setReminder] = useState<boolean>();
  const [savingReminder,setSavingReminder] = useState(false);
  useEffect(() => {
    void device<boolean>("reminder").then(setReminder).catch(error=>setMessage(String(error)));
  },[]);
  async function changeReminder(enabled:boolean) {
    setSavingReminder(true); setMessage("");
    try {
      const active = await device<boolean>("reminder",{enabled});
      setReminder(active);
      if (enabled && !active) setMessage(isIOS ? "Permite las notificaciones de Alify en Ajustes del iPhone." : "Permite las notificaciones de Alify en los ajustes de Android.");
    } catch (error) { setMessage(String(error)); }
    finally { setSavingReminder(false); }
  }
  function savePhoto(value:string) {
    localStorage.setItem("phone.profile.photo",value);
    onPhoto(value);
  }
  async function pickPhoto() {
    setBusy(true); setMessage("");
    try {
      const image = await device<string|null>("profilePhoto");
      if (image) savePhoto(image);
    } catch (error) { setMessage(String(error)); }
    finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setConfirm(false); setMessage("");
    try {
      const count = await device<number>("deleteSongs",{ids:songs.map(song=>song.id)});
      setMessage(`${count} archivos eliminados de ${songs.length}.`);
    } catch (error) { setMessage(String(error)); }
    finally { await refresh(); setBusy(false); }
  }
  return <section className="profile"><h1>Mi perfil</h1>
    <div className="profile-photo">{photo ? <img src={photo} alt="Foto de perfil"/> : <span>{name.slice(0,1).toUpperCase() || "A"}</span>}</div>
    <div className="actions"><button onClick={()=>void pickPhoto()} disabled={busy}>Cambiar foto</button>
      {photo && <button disabled={busy} onClick={()=>savePhoto("")}>Quitar foto</button>}</div>
    <form onSubmit={event=>{
      event.preventDefault();
      const value = draft.trim();
      localStorage.setItem("phone.profile.name",value); onName(value); setMessage("Nombre guardado.");
    }}>
      <label>Nombre<input className="search" maxLength={40} value={draft} onChange={event=>setDraft(event.target.value)}/></label>
      <button className="primary">Guardar nombre</button>
    </form>
    <label className="switch">
      <input type="checkbox" checked={reminder ?? false} disabled={reminder === undefined || savingReminder}
        onChange={event=>void changeReminder(event.target.checked)}/>
      Recordarme escuchar música después de una semana sin usar Alify
    </label>
    <h2>Almacenamiento</h2>
    <button className="danger" disabled={blocked || busy || !songs.length} onClick={()=>setConfirm(true)}>Eliminar todas las canciones</button>
    {confirm && <div role="alert"><p>{isIOS ? `Se eliminarán de Alify ${songs.length} audios importados. Los originales de Archivos se conservarán.` : `Se eliminarán del teléfono ${songs.length} archivos de audio detectados por Alify, incluidos los importados y las descargas.`}</p>
      <div className="actions"><button onClick={()=>setConfirm(false)}>Cancelar</button>
        <button className="danger" disabled={blocked || busy} onClick={()=>void remove()}>Continuar con la eliminación</button></div>
    </div>}
    {message && <p role="status">{message}</p>}
  </section>;
}
