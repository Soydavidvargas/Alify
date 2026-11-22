import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Track } from "../core/audioEngine";
import { toast } from "../library";

export async function exportForAndroid(name:string, tracks:Track[]): Promise<void> {
  const local = tracks.flatMap(({path,title,artist,album,lyrics,cover}) => path
    ? [{path,title,artist,album,lyrics,cover:cover?.startsWith("data:image/") && !cover.startsWith("data:image/svg") ? cover : undefined}]
    : []);
  if (!local.length) return;
  try {
    const folder = await open({directory:true,title:"Destino de la carpeta para Android"});
    if (typeof folder !== "string") return;
    const result = await invoke<{path:string;exported:number;failed:number}>("export_android_playlist",
      {destDir:folder,name,tracks:local});
    const skipped = result.failed + tracks.length - local.length;
    toast(`${result.exported} audios listos · ${skipped} sin exportar · ${result.path}`);
  } catch (error) { toast(String(error)); }
}
