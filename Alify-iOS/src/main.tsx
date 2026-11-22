import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { App } from "./components/App";
import { engine } from "./player";
import { startMainBridge } from "./core/bridge";
import { applyPlatformAttributes } from "./utils/platform";
import { getLibraryTracks, initLibrary } from "./library";
import { startStatsTracker } from "./stats";
import { applyTheme, resolveActive } from "./theme-engine/themeLoader";
import { withDesktopVariant } from "./theme-engine/themeVariants";

if (import.meta.env.PROD) {
  window.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("keydown", (e) => {
    const k = e.key.toUpperCase();
    if (k === "F12" || (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(k)) || (e.ctrlKey && k === "U")) {
      e.preventDefault();
    }
  });
}

applyPlatformAttributes();
applyTheme(withDesktopVariant(resolveActive()));
startMainBridge(engine, getLibraryTracks);
startStatsTracker(engine);
void initLibrary();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

