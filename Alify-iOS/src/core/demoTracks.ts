/** Portada SVG de respaldo para pistas sin carátula incrustada. */
export function placeholderCover(seed: string, a = "#27272A", b = "#101012"): string {
  const initial = (seed.trim()[0] ?? "♪").toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='200' height='200' fill='url(#g)'/><circle cx='150' cy='50' r='60' fill='white' fill-opacity='.08'/><text x='100' y='128' font-family='Segoe UI,sans-serif' font-size='96' font-weight='700' text-anchor='middle' fill='white' fill-opacity='.85'>${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
