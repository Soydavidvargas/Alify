import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
  ...p,
});
const stroke = (p: SVGProps<SVGSVGElement>) => ({
  ...base(p),
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

type P = SVGProps<SVGSVGElement>;
export const IPlay = (p: P) => (<svg {...base(p)}><path d="M8 5v14l11-7z" /></svg>);
export const IPause = (p: P) => (<svg {...base(p)}><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>);
export const INext = (p: P) => (<svg {...base(p)}><path d="M6 5l9 7-9 7zM17 5h2v14h-2z" /></svg>);
export const IPrev = (p: P) => (<svg {...base(p)}><path d="M18 5l-9 7 9 7zM5 5h2v14H5z" /></svg>);
export const IDice = (p: P) => (<svg {...stroke(p)}><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 7h1m4 5h1m4 5h1" strokeWidth="3"/></svg>);
export const IShuffle = (p: P) => (<svg {...stroke(p)}><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>);
export const IRepeat = (p: P) => (<svg {...stroke(p)}><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" /></svg>);
export const IHeart = (p: P & { filled?: boolean }) => { const { filled, ...r } = p; return (<svg {...stroke(r)} fill={filled ? "currentColor" : "none"}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" /></svg>); };
export const IQueue = (p: P) => (<svg {...stroke(p)}><path d="M3 6h13M3 12h13M3 18h9M18 14v6l4-3z" /></svg>);
export const IVolume = (p: P) => (<svg {...stroke(p)}><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>);
export const IHome = (p: P) => (<svg {...stroke(p)}><path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z" /></svg>);
export const ISearch = (p: P) => (<svg {...stroke(p)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>);
export const IList = (p: P) => (<svg {...stroke(p)}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>);
export const IPalette = (p: P) => (<svg {...stroke(p)}><path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A3.6 3.6 0 0 0 21 11c0-4.4-4-8-9-8z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10.5" cy="7" r="1" /><circle cx="15.5" cy="7.5" r="1" /></svg>);
export const ISettings = (p: P) => (<svg {...stroke(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>);
export const IFloat = (p: P) => (<svg {...stroke(p)}><rect x="3" y="4" width="18" height="14" rx="2" /><rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" /></svg>);
export const IMin = (p: P) => (<svg {...stroke({ ...p, width: 14, height: 14 })}><path d="M5 12h14" /></svg>);
export const IMax = (p: P) => (<svg {...stroke({ ...p, width: 14, height: 14 })}><rect x="5" y="5" width="14" height="14" rx="1" /></svg>);
export const IClose = (p: P) => (<svg {...stroke({ ...p, width: 14, height: 14 })}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IPlus = (p: P) => (<svg {...stroke(p)}><path d="M12 5v14M5 12h14" /></svg>);
export const IMore = (p: P) => (<svg {...base(p)}><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>);
export const IMic = (p: P) => (<svg {...stroke(p)}><path d="M4 8h10M4 12h7M4 16h10M18 6v9a2.5 2.5 0 1 1-2-2.4" /></svg>);
export const IUpload = (p: P) => (<svg {...stroke(p)}><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>);
export const IEq = (p: P) => (<svg {...stroke(p)}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>);
export const IMigrate = (p: P) => (<svg {...stroke(p)}><path d="M17 8l4 4-4 4M3 12h18M7 16l-4-4 4-4" /></svg>);
export const IPencil = (p: P) => (<svg {...stroke(p)}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>);
export const IShuffleAll = (p: P) => (<svg {...stroke(p)}><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /><circle cx="12" cy="12" r="9" strokeDasharray="3 3" /></svg>);
export const IWrapped = (p: P) => (<svg {...stroke(p)}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>);
