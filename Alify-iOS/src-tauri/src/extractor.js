(function() {
  if (window.__ALIFY_MIGRATOR__) return;
  window.__ALIFY_MIGRATOR__ = true;

  const collected = new Map();
  let autoScrolling = false;

  function clean(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function bgUrl(el) {
    if (!el) return null;
    const bg = el.style && el.style.backgroundImage ? el.style.backgroundImage : getComputedStyle(el).backgroundImage;
    if (!bg || bg === "none") return null;
    const m = /url\(["']?(https?:\/\/[^"')]+)["']?\)/i.exec(bg);
    return m ? m[1] : null;
  }

  function bestImg(root) {
    if (!root) return null;
    const imgs = root.querySelectorAll('img');
    for (let i = 0; i < imgs.length; i++) {
      const src = imgs[i].currentSrc || imgs[i].src || imgs[i].getAttribute('src') || "";
      if (src.startsWith('http') && !src.includes('data:image')) return src;
    }
    const sc = root.querySelector('.sc-artwork, [style*="background-image"]');
    const b = bgUrl(sc);
    if (b) return b;
    const srcEl = root.querySelector('picture source[srcset]');
    if (srcEl) {
      const srcset = srcEl.getAttribute('srcset') || "";
      const parts = srcset.split(',').map((p) => p.trim().split(' ')[0]).filter((u) => u.startsWith('http'));
      if (parts.length) return parts[parts.length - 1];
    }
    return null;
  }

  function addTrack(title, artist, album, coverUrl) {
    const t = clean(title);
    if (!t || t.length > 180) return;
    let a = clean(artist).replace(/\s+-\s+Topic$/i, "");
    if (!a) a = "Artista";
    const key = (a + "|" + t).toLowerCase();
    const existing = collected.get(key);
    if (!existing) {
      collected.set(key, { title: t, artist: a, album: clean(album), coverUrl: coverUrl || null });
    } else if (!existing.coverUrl && coverUrl) {
      existing.coverUrl = coverUrl;
    }
  }

  function scanDOM() {
    const host = location.hostname;

    // 1. Spotify Web Player
    if (host.includes('spotify.com')) {
      document.querySelectorAll('[data-testid="tracklist-row"], [role="row"]').forEach((row) => {
        const titleEl =
          row.querySelector('[data-testid="internal-track-link"] div') ||
          row.querySelector('a[href*="/track/"] div') ||
          row.querySelector('a[href*="/track/"]');
        if (!titleEl) return;
        const artistEls = row.querySelectorAll('a[href*="/artist/"]');
        const artist = Array.from(artistEls).map((a) => clean(a.textContent)).filter(Boolean).join(", ") ||
          clean((row.querySelector('span a') || {}).textContent);
        const albumEl = row.querySelector('a[href*="/album/"]');
        addTrack(titleEl.textContent, artist, albumEl ? albumEl.textContent : "", bestImg(row));
      });
    }

    // 2. YouTube Music & YouTube
    if (host.includes('youtube.com')) {
      document.querySelectorAll('ytmusic-responsive-list-item-renderer, ytmusic-player-queue-item').forEach((row) => {
        const titleEl =
          row.querySelector('.title-column yt-formatted-string a') ||
          row.querySelector('.title-column yt-formatted-string') ||
          row.querySelector('yt-formatted-string.title') ||
          row.querySelector('.song-title');
        if (!titleEl) return;
        const subs = row.querySelectorAll('.secondary-flex-columns yt-formatted-string, .byline yt-formatted-string, .subtitle yt-formatted-string');
        let artist = "";
        let album = "";
        if (subs.length > 0) {
          const parts = clean(subs[0].textContent).split('•').map(clean).filter(Boolean);
          artist = parts[0] || "";
          if (subs.length > 1) album = clean(subs[1].textContent);
          else if (parts.length > 1) album = parts[1];
        }
        addTrack(titleEl.textContent, artist, album, bestImg(row));
      });

      document.querySelectorAll('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer').forEach((row) => {
        const titleEl = row.querySelector('#video-title');
        if (!titleEl) return;
        const artistEl = row.querySelector('#channel-name a, #byline, .ytd-channel-name');
        addTrack(titleEl.textContent, artistEl ? artistEl.textContent : "", "", bestImg(row));
      });
    }

    // 3. SoundCloud
    if (host.includes('soundcloud.com')) {
      document.querySelectorAll('.soundList__item, .trackList__item, .badgeList__item, .systemPlaylistTrackList__item, .compactTrackList__item, .historicalList__item').forEach((row) => {
        const titleEl = row.querySelector('a.soundTitle__title, a.trackItem__trackTitle, .compactTrackListItem__trackTitle, a.audibleTile__heading');
        if (!titleEl) return;
        const artistEl = row.querySelector('a.soundTitle__username, a.trackItem__username, .compactTrackListItem__user, .audibleTile__usernameHeading');
        addTrack(titleEl.textContent, artistEl ? artistEl.textContent : "", "", bestImg(row));
      });
    }

    // 4. Deezer
    if (host.includes('deezer.com')) {
      document.querySelectorAll('[role="row"], .datagrid-row, [data-testid="tracklist-row"]').forEach((row) => {
        const titleEl = row.querySelector('[data-testid="title"], a[href*="/track/"], .cell-title a, [class*="TrackTitle"]');
        if (!titleEl) return;
        const artistEl = row.querySelector('[data-testid="artist"], a[href*="/artist/"], .cell-artist a');
        const albumEl = row.querySelector('a[href*="/album/"], .cell-album a');
        addTrack(titleEl.textContent, artistEl ? artistEl.textContent : "", albumEl ? albumEl.textContent : "", bestImg(row));
      });
    }

    // 5. Apple Music & Tidal & genérico
    if (host.includes('apple.com') || host.includes('tidal.com')) {
      document.querySelectorAll('.songs-list-row, [data-testid="track-lockup"], [data-test="tracklist-row"], [role="row"]').forEach((row) => {
        const titleEl = row.querySelector('.songs-list-row__song-name, [data-testid="track-title"], [data-test="table-cell-title"], a[href*="/track/"], a[href*="/song/"]');
        if (!titleEl) return;
        const artistEl = row.querySelector('.songs-list-row__by-line, [data-testid="track-lockup-subtitle"], [data-test="table-cell-artist"], a[href*="/artist/"]');
        const albumEl = row.querySelector('.songs-list-row__album-name, a[href*="/album/"]');
        addTrack(titleEl.textContent, artistEl ? artistEl.textContent : "", albumEl ? albumEl.textContent : "", bestImg(row));
      });
    }

    const countEl = document.getElementById('alify-mig-count');
    if (countEl) {
      countEl.textContent = collected.size + " canciones detectadas";
    }
  }

  function pagePlaylistName() {
    const h1 = document.querySelector('h1, [data-testid="entityTitle"] h1, ytmusic-detail-header-renderer yt-formatted-string.title, ytmusic-immersive-header-renderer yt-formatted-string.title, .soundTitle__title');
    const txt = clean(h1 ? h1.textContent : "");
    if (txt && txt.length < 80) return txt;
    return clean((document.title || "Mis canciones migradas").replace(/[-|•].*$/, "")) || "Mis canciones migradas";
  }

  function toBase64Utf8(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin);
  }

  function stepAutoScroll() {
    const candidates = [
      document.querySelector('[data-overlayscrollbars-viewport]'),
      document.querySelector('.Root__main-view .os-viewport'),
      document.querySelector('.main-view-container__scroll-node'),
      document.querySelector('#page_content'),
      document.querySelector('main'),
      document.scrollingElement,
      document.documentElement
    ];
    window.scrollBy({ top: 520, behavior: 'smooth' });
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (c && c.scrollHeight > c.clientHeight + 20) {
        c.scrollBy({ top: 520, behavior: 'smooth' });
      }
    }
  }

  // Construcción DOM pura sin innerHTML (compatible con Trusted Types de YouTube/Google)
  function mountHUD() {
    if (document.getElementById('alify-mig-hud')) return;
    const box = document.createElement('div');
    box.id = 'alify-mig-hud';
    box.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483647;background:rgba(16,16,18,0.95);color:#FAFAFA;border:1px solid rgba(255,255,255,0.18);border-radius:16px;padding:14px 16px;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,0.8);backdrop-filter:blur(24px);width:315px;';

    const top = document.createElement('div');
    top.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px';
    const strong = document.createElement('strong');
    strong.style.cssText = 'font-size:13px;letter-spacing:0.04em';
    strong.textContent = 'ALIFY · MIGRADOR';
    const count = document.createElement('span');
    count.id = 'alify-mig-count';
    count.style.cssText = 'font-size:11px;color:#9CA3AF';
    count.textContent = '0 canciones detectadas';
    top.appendChild(strong);
    top.appendChild(count);

    const warn = document.createElement('p');
    warn.style.cssText = 'margin:0 0 10px;font-size:11px;color:#9CA3AF;line-height:1.4;font-weight:600';
    warn.textContent = 'Debes navegar entre tus canciones, para escanear y poder migrar.';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px';

    const btnScroll = document.createElement('button');
    btnScroll.id = 'alify-mig-scroll';
    btnScroll.style.cssText = 'flex:1;background:rgba(255,255,255,0.08);color:#FAFAFA;border:1px solid rgba(255,255,255,0.14);border-radius:999px;padding:8px 10px;font-size:11px;cursor:pointer;font-weight:600';
    btnScroll.textContent = 'Auto-escanear lista';
    btnScroll.addEventListener('click', function() {
      autoScrolling = !autoScrolling;
      btnScroll.textContent = autoScrolling ? 'Detener escaneo' : 'Auto-escanear lista';
    });

    const btnSend = document.createElement('button');
    btnSend.id = 'alify-mig-send';
    btnSend.style.cssText = 'flex:1.2;background:#FAFAFA;color:#101012;border:0;border-radius:999px;padding:8px 12px;font-size:11px;cursor:pointer;font-weight:700';
    btnSend.textContent = 'Migrar y descargar';
    btnSend.addEventListener('click', function() {
      autoScrolling = false;
      scanDOM();
      const tracks = Array.from(collected.values());
      if (!tracks.length) {
        alert("Aún no se detectaron canciones en pantalla. Entra a 'Tus me gusta' o a una playlist y desplázate por tus canciones.");
        return;
      }
      btnSend.textContent = 'Enviando a Alify…';
      const payload = JSON.stringify({
        provider: location.hostname,
        name: pagePlaylistName(),
        tracks: tracks
      });
      const b64 = toBase64Utf8(payload);
      window.location.href = "https://alify-sync.local/import?data=" + encodeURIComponent(b64);
    });

    row.appendChild(btnScroll);
    row.appendChild(btnSend);
    box.appendChild(top);
    box.appendChild(warn);
    box.appendChild(row);
    document.body.appendChild(box);
  }

  if (window.__alifyPhoneReader) {
    window.__alifyReadTracks = () => {
      scanDOM();
      if (!collected.size && (/\/(track|song)\//.test(location.pathname) || location.pathname === '/watch')) {
        const meta = (selector) => document.querySelector(selector)?.content || '';
        const title = meta('meta[property="og:title"]') || document.querySelector('h1')?.textContent;
        const artist = meta('meta[itemprop="author"]') || document.querySelector('[itemprop="author"] [itemprop="name"]')?.content;
        addTrack(title, artist, '', meta('meta[property="og:image"]'));
      }
      return { name: pagePlaylistName(), tracks: Array.from(collected.values()) };
    };
    setInterval(scanDOM, 900);
    return;
  }

  setInterval(() => {
    if (document.body) {
      mountHUD();
      scanDOM();
      if (autoScrolling) {
        stepAutoScroll();
      }
    }
  }, 600);
})();
