import { useEffect, useRef, type ReactNode } from "react";

export function SongActionButton({ label, play, menu, children }: {
  label: string; play: () => void; menu: () => void; children: ReactNode;
}) {
  const timer = useRef<number>();
  const origin = useRef({x:0,y:0});
  const held = useRef(false);
  const stop = () => window.clearTimeout(timer.current);
  useEffect(()=>stop,[]);
  function open() {
    stop();
    if (held.current) return;
    held.current = true;
    menu();
  }
  return <button className="song" aria-label={label} aria-haspopup="dialog"
    onPointerDown={event=>{
      if (event.button !== 0) return;
      held.current = false;
      origin.current = {x:event.clientX,y:event.clientY};
      timer.current = window.setTimeout(open, 520);
    }}
    onPointerMove={event=>{
      if (Math.hypot(event.clientX-origin.current.x,event.clientY-origin.current.y)>10) stop();
    }}
    onPointerCancel={stop} onPointerUp={stop} onPointerLeave={stop}
    onContextMenu={event=>{event.preventDefault(); if (event.button === 2) held.current = false; open();}}
    onClick={event=>{
      if (held.current && event.detail !== 0) { event.preventDefault(); held.current=false; return; }
      held.current=false;
      play();
    }}>{children}</button>;
}
