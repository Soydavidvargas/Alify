import { getCurrentWindow } from "@tauri-apps/api/window";
import { isDesktop } from "../core/bridge";
import { IClose, IMax, IMin } from "../icons";

export const fmtTime = (s: number): string => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export const fmtTotal = (s: number): string => {
  const m = Math.round(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
};

export function TitleBar() {
  const w = () => (isDesktop() ? getCurrentWindow() : null);
  return (
    <div className="drag titlebar flex h-9 flex-none items-center justify-between pl-3" data-tauri-drag-region>
      <div className="flex items-center gap-2" data-tauri-drag-region>
        <img src="/alify-icon.png" alt="" className="h-5 w-5 rounded object-contain" data-tauri-drag-region />
        <span className="text-xs font-semibold tracking-[0.2em] t-muted" data-tauri-drag-region>
          ALIFY
        </span>
      </div>
      <div className="no-drag flex">
        <button className="icon-btn !h-9 !w-11 !rounded-none" aria-label="Minimizar" onClick={() => w()?.minimize()}>
          <IMin />
        </button>
        <button className="icon-btn !h-9 !w-11 !rounded-none" aria-label="Maximizar o restaurar" onClick={() => w()?.toggleMaximize()}>
          <IMax />
        </button>
        <button
          className="icon-btn !h-9 !w-11 !rounded-none hover:!bg-red-600 hover:!text-white"
          aria-label="Cerrar"
          onClick={() => w()?.close()}
        >
          <IClose />
        </button>
      </div>
    </div>
  );
}

