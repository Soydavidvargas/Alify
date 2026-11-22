import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function MobileDialog({title, close, children}: {title:string; close:()=>void; children:ReactNode}) {
  const ref = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  useEffect(()=>{ ref.current?.showModal(); },[]);
  return createPortal(<dialog ref={ref} className="mobile-dialog" aria-label={title}
    onCancel={event=>{event.preventDefault(); close();}}
    onPointerDown={event=>{backdropPress.current = event.target === event.currentTarget;}}
    onPointerCancel={()=>{backdropPress.current = false;}}
    onClick={event=>{
      if (backdropPress.current && event.target === event.currentTarget) close();
      backdropPress.current = false;
    }}>
    <section>
      <h2>{title}</h2>
      {children}
      <button onClick={close}>Cerrar</button>
    </section>
  </dialog>,document.body);
}
