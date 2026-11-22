import { useEffect, useRef, useState } from "react";
import { device } from "./device";

type EqualizerState = { playing:boolean; spatial:boolean } & (
  { available:false } | { available:true; min:number; max:number; bands:{hz:number; level:number}[] }
);
type Adjustment = {band:number; level:number} | {levels:number[]} | {spatial:boolean} | {restore:true};

const ranges = [
  { upTo:100, name:"Subgraves", help:"Dan peso al bombo y a las notas más profundas. Bájales si retumba.", center:60 },
  { upTo:300, name:"Graves", help:"Dan cuerpo al bajo y calidez a la mezcla. Bájales si tapan la voz.", center:230 },
  { upTo:650, name:"Medios bajos", help:"Dan cuerpo a las voces y guitarras. Bájales si suena encerrado.", center:450 },
  { upTo:1800, name:"Medios", help:"Ayudan a distinguir las voces, las guitarras y el piano.", center:910 },
  { upTo:4500, name:"Medios altos", help:"Resaltan consonantes y ataques. Bájales si el sonido se vuelve áspero.", center:3600 },
  { upTo:8000, name:"Agudos", help:"Acentúan platillos y detalles finos. Bájales si las eses molestan.", center:6200 },
  { upTo:Infinity, name:"Brillo", help:"Añade aire a las voces y brillo a los platillos.", center:14000 },
];
const presets = [
  { name:"Escuchar Pop", help:"Voces claras y un poco más de brillo.", gains:[2,1,0,2,2,2,3] },
  { name:"Escuchar Rock", help:"Bombo firme y guitarras con más presencia.", gains:[4,3,0,1,3,3,2] },
  { name:"Escuchar Hip-hop", help:"Bajo profundo con las voces al frente.", gains:[5,3,-1,1,2,0,1] },
  { name:"Escuchar Electrónica", help:"Más impacto en el bajo y detalle en los agudos.", gains:[5,3,-2,-1,1,3,4] },
  { name:"Escuchar Jazz", help:"Más cuerpo en los instrumentos y aire en los platillos.", gains:[2,2,1,1,0,1,2] },
  { name:"Resaltar voces", help:"Menos retumbe y más claridad en las palabras.", gains:[-3,-2,0,3,4,1,0] },
];

function presetLevel(hz:number, gains:number[]) {
  const next = ranges.findIndex(range=>hz <= range.center);
  if (next === -1) return gains[gains.length-1]*100;
  if (next === 0) return gains[0]*100;
  const low = ranges[next-1].center;
  const ratio = Math.log(hz / low) / Math.log(ranges[next].center / low);
  return Math.round((gains[next-1] + ratio*(gains[next]-gains[next-1]))*2)*50;
}

export function Equalizer({track,playing}: {track:string; playing:boolean}) {
  const [state,setState] = useState<EqualizerState>();
  const [showPresets,setShowPresets] = useState(false);
  const [preset,setPreset] = useState("");
  const [error,setError] = useState("");
  const version = useRef(0);
  useEffect(()=>{
    const request = ++version.current;
    void device<EqualizerState>("control",{command:"equalizer"}).then(result=>{
      if (version.current===request) setState(result);
    }).catch(e=>{if (version.current===request) setError(String(e));});
    return ()=>{ version.current++; };
  },[track,playing]);
  const canAdjust = !!state?.playing && playing;
  const canTune = canAdjust && !!state?.available;
  function adjust(action:Adjustment) {
    const request = ++version.current;
    setError("");
    void device<EqualizerState>("control",{command:"equalizer",...action}).then(result=>{
      if (version.current===request) setState(result);
    }).catch(e=>{if (version.current===request) setError(String(e));});
  }
  return <>
    <p>Los ajustes se aplican a todas las canciones. Reproduce una canción para modificarlos.</p>
    {!canAdjust && <p role="status">{state ? "Inicia o reanuda la reproducción para editar." : "Cargando ecualizador…"}</p>}
    <div className="actions equalizer-actions">
      <button aria-expanded={showPresets} disabled={!canTune} onClick={()=>setShowPresets(!showPresets)}>Ajustes rápidos</button>
      <button aria-pressed={state?.spatial ?? false} disabled={!canAdjust} onClick={()=>adjust({spatial:!state?.spatial})}>
        {state?.spatial ? "Desactivar Sonidos 8D" : "Activar Sonidos 8D"}
      </button>
      <button disabled={!canAdjust} onClick={()=>{adjust({restore:true});setPreset("");}}>Restaurar</button>
    </div>
    <p className="equalizer-note">El efecto 8D mueve el sonido suavemente entre los lados. Se percibe mejor con auriculares estéreo. Restaurar devuelve las bandas a cero y desactiva el 8D.</p>
    {showPresets && <div className="song-menu eq-presets" role="group" aria-label="Ajustes rápidos">
      {presets.map(option=><button key={option.name} aria-pressed={preset===option.name} disabled={!canTune} onClick={()=>{
        if (!state?.available) return;
        const {min,max,bands} = state;
        const levels = bands.map(({hz})=>Math.max(min,Math.min(max,presetLevel(hz,option.gains))));
        adjust({levels}); setPreset(option.name);
      }}><span><strong>{option.name}</strong><small>{option.help}</small></span></button>)}
    </div>}
    {state?.available && <div className="equalizer-bands">
      {state.bands.map((band,index)=>{
        const range = ranges.find(item=>band.hz < item.upTo) || ranges[ranges.length-1];
        const freq = band.hz < 1000 ? `${band.hz} Hz` : `${band.hz / 1000} kHz`;
        const gain = band.level / 100;
        return <label key={index}><strong>{range.name} <small>{freq}</small></strong><span>{gain > 0 ? "+" : ""}{gain} dB</span>
          <small id={`eq-help-${index}`}>{range.help}</small>
          <input type="range" aria-label={`${range.name}, ${freq}`} aria-describedby={`eq-help-${index}`}
            min={state.min} max={state.max} step={50} value={band.level} disabled={!canTune}
            onChange={event=>{
              const level = Number(event.target.value);
              setState({...state,bands:state.bands.map((row,i)=>i===index ? {...row,level} : row)});
              adjust({band:index,level}); setPreset("");
            }}/>
        </label>;
      })}
    </div>}
    {state && !state.available && <p>Las bandas de frecuencia no están disponibles para esta reproducción.</p>}
    {error && <p role="alert">{error}</p>}
  </>;
}
