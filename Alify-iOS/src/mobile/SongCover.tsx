import { useEffect, useRef, useState } from "react";
import { device } from "./device";

export function SongCover({id, fallback}:{id:string; fallback:string|number}) {
  const [image,setImage] = useState("");
  const element = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    setImage("");
    if (!id || !element.current) return;
    let active = true;
    const observer = new IntersectionObserver(items => {
      if (!items.some(item=>item.isIntersecting)) return;
      observer.disconnect();
      void device<string>("coverThumb",{id}).then(value=>{if (active) setImage(value);}).catch(()=>{});
    });
    observer.observe(element.current);
    return ()=>{active=false;observer.disconnect();};
  },[id]);
  return <span className="song-cover" ref={element}>{image ? <img src={image} alt=""/> : fallback}</span>;
}
