/**
 * Motor de audio Alify — Doble Deck (A/B) sobre Web Audio API.
 * Sin dependencias de Tauri (portable a Android).
 */

export const AUDIO_EXTENSIONS = ["mp3", "flac", "wav", "ogg", "m4a", "opus"] as const;

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: number;
  duration: number;
  src: string;
  cover?: string;
  lyrics?: string;
  path?: string;
  downloaded?: boolean;
}

export type RepeatMode = "off" | "all" | "one";
export type EqPresetId = "plano" | "bass" | "vocal" | "rock" | "club" | "pop" | "hipHop" | "jazz" | "custom";

export interface EqState {
  bass: number;
  mid: number;
  treble: number;
  preset: EqPresetId;
  spatial: boolean;
}

export const EQ_PRESETS: Record<Exclude<EqPresetId, "custom">, { label: string; bands: [number, number, number] }> = {
  plano: { label: "Plano (Default)", bands: [0, 0, 0] },
  bass: { label: "Bass Boost", bands: [7, 1, -1] },
  vocal: { label: "Vocal / Acústico", bands: [-2, 5, 3] },
  rock: { label: "Rock / Metal", bands: [5, -2, 6] },
  club: { label: "Electrónica / Club", bands: [6, 0, 5] },
  pop: { label: "Escuchar Pop", bands: [2, 2, 3] },
  hipHop: { label: "Escuchar Hip-hop", bands: [6, 1, 1] },
  jazz: { label: "Escuchar Jazz", bands: [2, 1, 2] },
};

export interface EngineState {
  track: Track | null;
  queue: Track[];
  queueIndex: number; // posición del track actual dentro de `queue` (orden original)
  upNext: Track | null;
  playing: boolean;
  position: number;
  duration: number;
  volume: number;
  rate: number;
  shuffle: boolean;
  repeat: RepeatMode;
  mix: boolean;
  mixSeconds: number;
  mixing: boolean;
  eq: EqState;
  sinkId: string;
}

/** Fisher-Yates in-place sobre una copia. */
export function fisherYates<T>(items: readonly T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * True Shuffle con memoria de sesión: cada ciclo recorre TODAS las pistas
 * exactamente una vez; el primero del ciclo nuevo nunca repite al último reproducido.
 */
export class ShuffleBag {
  private order: number[] = [];

  /** Reinicia el orden con `current` primero y el resto barajado. */
  reset(length: number, current: number): void {
    const rest = fisherYates(Array.from({ length }, (_, i) => i).filter((i) => i !== current));
    this.order = current >= 0 && current < length ? [current, ...rest] : rest;
  }

  /** Añade un nuevo ciclo completo evitando repetir `last` al principio. */
  appendCycle(length: number, last: number): void {
    let batch = fisherYates(Array.from({ length }, (_, i) => i));
    if (length > 1 && batch[0] === last) {
      const k = 1 + Math.floor(Math.random() * (length - 1));
      [batch[0], batch[k]] = [batch[k], batch[0]];
    }
    this.order.push(...batch);
  }

  setSequential(length: number): void {
    this.order = Array.from({ length }, (_, i) => i);
  }
  appendSequential(length: number): void {
    this.order.push(...Array.from({ length }, (_, i) => i));
  }
  push(idx: number): void {
    this.order.push(idx);
  }
  insert(at: number, idx: number): void {
    this.order.splice(at, 0, idx);
  }
  get length(): number {
    return this.order.length;
  }
  at(pos: number): number {
    return this.order[pos];
  }
  indexOf(trackIdx: number, from = 0): number {
    return this.order.indexOf(trackIdx, from);
  }
  retain(indexes: Map<number, number>, currentPos: number): number {
    let pos = -1;
    this.order = this.order.flatMap((index, oldPos) => {
      const mapped = indexes.get(index);
      if (mapped === undefined) return [];
      if (oldPos <= currentPos) pos++;
      return [mapped];
    });
    return pos;
  }
}

interface Deck {
  el: HTMLAudioElement;
  gain: GainNode;
  source: MediaElementAudioSourceNode;
  track: Track | null;
}

type Listener = () => void;

export class AudioEngine {
  private ctx: AudioContext;
  private eqBass: BiquadFilterNode;
  private eqMid: BiquadFilterNode;
  private eqTreble: BiquadFilterNode;
  private master: GainNode;
  private panner: StereoPannerNode;
  private orbit?: OscillatorNode;
  private orbitDepth: GainNode;
  private decks: [Deck, Deck];
  private active = 0;
  private queue: Track[] = [];
  private order = new ShuffleBag();
  private pos = -1; // posición dentro de `order`
  private mixState: { pos: number; endAt: number } | null = null;
  private listeners = new Set<Listener>();
  private timer: number | undefined;
  private lastEmit = 0;

  private volume = 0.8;
  private rate = 1;
  private shuffle = false;
  private repeat: RepeatMode = "all";
  private mix = false;
  private mixSeconds = 12;
  private playing = false;
  private eq: EqState = { bass: 0, mid: 0, treble: 0, preset: "plano", spatial: false };
  private sinkId = "default";
  private snapshot: EngineState;

  constructor() {
    this.ctx = new AudioContext();
    this.eqBass = this.ctx.createBiquadFilter();
    this.eqBass.type = "lowshelf";
    this.eqBass.frequency.value = 100;

    this.eqMid = this.ctx.createBiquadFilter();
    this.eqMid.type = "peaking";
    this.eqMid.frequency.value = 1000;
    this.eqMid.Q.value = 1;

    this.eqTreble = this.ctx.createBiquadFilter();
    this.eqTreble.type = "highshelf";
    this.eqTreble.frequency.value = 8000;

    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.panner = this.ctx.createStereoPanner();
    this.orbitDepth = this.ctx.createGain();
    this.orbitDepth.gain.value = 0;
    this.orbitDepth.connect(this.panner.pan);

    this.eqBass.connect(this.eqMid);
    this.eqMid.connect(this.eqTreble);
    this.eqTreble.connect(this.master);
    this.panner.connect(this.master);
    this.master.connect(this.ctx.destination);

    this.decks = [this.makeDeck(), this.makeDeck()];
    this.snapshot = this.build();
    this.timer = window.setInterval(() => this.tick(), 100);
  }

  // ---------- suscripción (compatible con useSyncExternalStore) ----------
  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  getState = (): EngineState => this.snapshot;

  private emit(): void {
    this.snapshot = this.build();
    this.listeners.forEach((l) => l());
  }

  private build(): EngineState {
    const d = this.decks ? this.decks[this.active] : null;
    const track = d?.track ?? null;
    const dur = d && isFinite(d.el.duration) && d.el.duration > 0 ? d.el.duration : track?.duration ?? 0;
    return {
      track,
      queue: this.queue,
      queueIndex: this.pos >= 0 && this.order.length ? this.order.at(this.pos) : -1,
      upNext: this.repeat === "one" ? track
        : this.queue[this.order.at(this.pos + 1)] ?? (this.repeat === "all" && !this.shuffle ? this.queue[0] ?? null : null),
      playing: this.playing,
      position: d?.el.currentTime ?? 0,
      duration: dur,
      volume: this.volume,
      rate: this.rate,
      shuffle: this.shuffle,
      repeat: this.repeat,
      mix: this.mix,
      mixSeconds: this.mixSeconds,
      mixing: this.mixState !== null,
      eq: { ...this.eq },
      sinkId: this.sinkId,
    };
  }

  // ---------- decks ----------
  private makeDeck(): Deck {
    const el = new Audio();
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    const source = this.ctx.createMediaElementSource(el);
    source.connect(gain);
    gain.connect(this.eqBass);
    const deck: Deck = { el, gain, source, track: null };
    el.addEventListener("ended", () => this.onEnded(deck));
    el.addEventListener("error", () => {
      if (deck === this.decks[this.active]) {
        if (this.queue.length > 1 && this.nextPos() >= 0) {
          this.next(true);
        } else {
          this.playing = false;
          this.emit();
        }
      }
    });
    el.addEventListener("loadedmetadata", () => this.emit());
    return deck;
  }

  private load(deck: Deck, track: Track): void {
    deck.track = track;
    deck.el.src = track.src;
    deck.el.defaultPlaybackRate = this.rate;
    deck.el.playbackRate = this.rate;
  }

  private setGain(deck: Deck, v: number): void {
    const g = deck.gain.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setValueAtTime(v, this.ctx.currentTime);
  }

  // ---------- cola ----------
  private rebuildOrder(current: number): void {
    if (this.shuffle) {
      this.order.reset(this.queue.length, current);
      this.pos = 0;
    } else {
      this.order.setSequential(this.queue.length);
      this.pos = current;
    }
  }

  /** Orden lineal que se agrega cuando se acaba el ciclo y repeat = all. */
  private appendCycle(): void {
    const n = this.queue.length;
    const last = this.order.at(this.order.length - 1);
    if (this.shuffle) this.order.appendCycle(n, last);
    else this.order.appendSequential(n);
  }

  private nextPos(): number {
    if (!this.queue.length) return -1;
    if (this.pos + 1 < this.order.length) return this.pos + 1;
    if (this.repeat === "all") {
      this.appendCycle();
      return this.pos + 1;
    }
    return -1;
  }

  setQueue(tracks: Track[], startIndex = 0, autoplay = true): void {
    this.cancelMix();
    this.queue = tracks;
    if (!tracks.length) {
      this.stop();
      return;
    }
    this.rebuildOrder(Math.min(Math.max(startIndex, 0), tracks.length - 1));
    void this.playPos(this.pos, autoplay);
  }

  addToQueue(track: Track, playNext = false): void {
    if (!this.queue.length) {
      this.setQueue([track]);
      return;
    }
    this.queue = [...this.queue, track];
    const idx = this.queue.length - 1;
    if (playNext) {
      this.cancelMix();
      this.order.insert(this.pos + 1, idx);
    } else if (this.shuffle) {
      // inserta en una posición aleatoria de lo que falta por sonar
      const at = this.pos + 1 + Math.floor(Math.random() * (this.order.length - this.pos));
      this.order.insert(at, idx);
    } else {
      this.order.push(idx);
    }
    this.emit();
  }

  /** Salta a la pista `queueIndex` de la cola (orden original). */
  playQueueIndex(queueIndex: number): void {
    this.cancelMix();
    let p = this.order.indexOf(queueIndex, Math.max(this.pos, 0));
    if (p < 0) p = this.order.indexOf(queueIndex);
    if (p < 0) return;
    this.pos = p;
    void this.playPos(p, true);
  }

  private async playPos(p: number, autoplay: boolean): Promise<void> {
    this.cancelMix();
    const track = this.queue[this.order.at(p)];
    if (!track) return;
    const deck = this.decks[this.active];
    const other = this.decks[1 - this.active];
    other.el.pause();
    this.setGain(other, 0);
    this.load(deck, track);
    this.setGain(deck, 1);
    this.pos = p;
    if (autoplay) await this.play();
    else {
      this.playing = false;
      this.emit();
    }
  }

  // ---------- transporte ----------
  async play(): Promise<void> {
    if (!this.decks[this.active].track) return;
    if (this.ctx.state !== "running") await this.ctx.resume();
    try {
      await this.decks[this.active].el.play();
      if (this.mixState) await this.decks[1 - this.active].el.play();
      this.playing = true;
    } catch {
      this.playing = false;
    }
    this.emit();
  }

  pause(): void {
    if (this.mixState) this.finishMix();
    this.decks.forEach((d) => d.el.pause());
    this.playing = false;
    this.emit();
  }

  toggle(): void {
    if (this.playing) this.pause();
    else void this.play();
  }

  stop(): void {
    this.cancelMix();
    this.decks.forEach((d) => {
      d.el.pause();
      d.el.currentTime = 0;
    });
    this.playing = false;
    this.emit();
  }

  clear(): void {
    this.cancelMix();
    this.decks.forEach((d) => {
      d.el.pause();
      d.track = null;
      d.el.removeAttribute("src");
      d.el.load();
    });
    this.queue = [];
    this.order.reset(0, -1);
    this.pos = -1;
    this.playing = false;
    this.emit();
  }

  playRandomTrack(): void {
    const current = this.decks[this.active].track?.id;
    const candidates = this.queue.flatMap((track, index) => track.id !== current ? [index] : []);
    if (candidates.length) {
      this.playQueueIndex(candidates[Math.floor(Math.random() * candidates.length)]);
    } else if (this.queue.length) {
      this.playQueueIndex(0);
    }
  }

  next(auto = false): void {
    if (this.mixState) this.finishMix();
    if (auto && this.repeat === "one") {
      const el = this.decks[this.active].el;
      el.currentTime = 0;
      void this.play();
      return;
    }
    const np = this.nextPos();
    if (np < 0) {
      this.stop();
      return;
    }
    void this.playPos(np, true);
  }

  prev(): void {
    if (this.mixState) this.finishMix();
    const el = this.decks[this.active].el;
    if (el.currentTime > 3 || this.pos <= 0) {
      el.currentTime = 0;
      this.emit();
      return;
    }
    void this.playPos(this.pos - 1, true);
  }

  seek(seconds: number): void {
    if (this.mixState) this.finishMix();
    const el = this.decks[this.active].el;
    el.currentTime = Math.max(0, Math.min(seconds, isFinite(el.duration) ? el.duration : seconds));
    this.emit();
  }

  // ---------- ajustes ----------
  setVolume(v: number): void {
    this.volume = Math.min(3, Math.max(0, v));
    this.master.gain.value = this.volume;
    this.emit();
  }
  async setAudioOutput(sinkId: string): Promise<boolean> {
    const ctxWithSink = this.ctx as unknown as { setSinkId?: (id: string) => Promise<void> };
    if (typeof ctxWithSink.setSinkId !== "function") return false;
    try {
      await ctxWithSink.setSinkId(sinkId === "default" ? "" : sinkId);
      this.sinkId = sinkId;
      this.emit();
      return true;
    } catch {
      return false;
    }
  }
  setRate(r: number): void {
    this.rate = Math.min(2, Math.max(0.5, r));
    this.decks.forEach((d) => {
      d.el.defaultPlaybackRate = this.rate;
      d.el.playbackRate = this.rate;
    });
    this.emit();
  }
  setShuffle(on: boolean): void {
    if (on === this.shuffle) return;
    this.shuffle = on;
    if (this.queue.length) {
      const cur = this.pos >= 0 ? this.order.at(this.pos) : 0;
      this.rebuildOrder(cur);
    }
    this.emit();
  }
  setRepeat(r: RepeatMode): void {
    this.repeat = r;
    this.emit();
  }
  cycleRepeat(): void {
    this.setRepeat(this.repeat === "off" ? "all" : this.repeat === "all" ? "one" : "off");
  }
  setMix(on: boolean): void {
    this.mix = on;
    if (!on) this.cancelMix();
    this.emit();
  }
  setMixSeconds(s: number): void {
    this.mixSeconds = Math.min(30, Math.max(1, Math.round(s) || 12));
    this.emit();
  }

  // ---------- ecualizador ----------
  setEqBand(band: "bass" | "mid" | "treble", db: number): void {
    const v = Math.min(12, Math.max(-12, db));
    this.eq = { ...this.eq, [band]: v, preset: "custom" };
    if (band === "bass") this.eqBass.gain.value = v;
    else if (band === "mid") this.eqMid.gain.value = v;
    else this.eqTreble.gain.value = v;
    this.emit();
  }

  setEqPreset(id: Exclude<EqPresetId, "custom">): void {
    const [b, m, t] = EQ_PRESETS[id].bands;
    this.eq = { ...this.eq, bass: b, mid: m, treble: t, preset: id };
    this.eqBass.gain.value = b;
    this.eqMid.gain.value = m;
    this.eqTreble.gain.value = t;
    this.emit();
  }

  setSpatialAudio(enabled: boolean): void {
    if (this.eq.spatial === enabled) return;
    this.eq = { ...this.eq, spatial: enabled };
    if (enabled) {
      this.eqTreble.disconnect(this.master);
      this.eqTreble.connect(this.panner);
      const orbit = this.ctx.createOscillator();
      orbit.frequency.value = 1 / 9;
      orbit.connect(this.orbitDepth);
      orbit.start();
      this.orbit = orbit;
      this.orbitDepth.gain.setTargetAtTime(0.85, this.ctx.currentTime, 0.12);
    } else {
      this.eqTreble.disconnect(this.panner);
      this.eqTreble.connect(this.master);
      this.orbitDepth.gain.setTargetAtTime(0, this.ctx.currentTime, 0.06);
      this.orbit?.stop();
      this.orbit?.disconnect();
      this.orbit = undefined;
    }
    this.emit();
  }

  restoreAudio(): void {
    this.setSpatialAudio(false);
    this.setEqPreset("plano");
  }

  removeTrack(id: string): void {
    if (!this.queue.some(track=>track.id === id)) return;
    const current = this.decks[this.active].track;
    const indexes = new Map<number, number>();
    const tracks = this.queue.filter((track,index)=>{
      if (track.id === id) return false;
      indexes.set(index,indexes.size);
      return true;
    });
    if (!current || current.id === id) {
      this.clear();
      if (tracks.length) this.setQueue(tracks, 0, false);
      return;
    }
    this.cancelMix();
    const standby = this.decks[1 - this.active];
    if (standby.track?.id === id) {
      standby.track = null;
      standby.el.removeAttribute("src");
      standby.el.load();
    }
    this.queue = tracks;
    this.pos = this.order.retain(indexes,this.pos);
    this.emit();
  }

  updateTrackMeta(id: string, patch: Partial<Track>): void {
    this.queue = this.queue.map((t) => (t.id === id ? { ...t, ...patch } : t));
    this.decks.forEach((d) => {
      if (d.track?.id === id) d.track = { ...d.track, ...patch };
    });
    this.emit();
  }

  // ---------- modo MIX ----------
  observeLyricAudio() {
    const deck = this.decks[this.active];
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0;
    deck.source.connect(analyser);
    return {
      analyser,
      sampleRate: this.ctx.sampleRate,
      dispose: () => deck.source.disconnect(analyser),
    };
  }

  /** Reloj del audio, independiente de la frecuencia de actualización de la interfaz. */
  lyricPosition(trackId: string): number | undefined {
    const deck = this.decks[this.active];
    return deck.track?.id === trackId ? deck.el.currentTime : undefined;
  }

  private tick(): void {
    const deck = this.decks[this.active];
    if (this.playing && deck.track) {
      const dur = deck.el.duration;
      if (this.mix && !this.mixState && this.repeat !== "one" && isFinite(dur) && dur > 0) {
        const remaining = (dur - deck.el.currentTime) / this.rate;
        if (remaining <= this.mixSeconds && remaining > 0.3) {
          const np = this.nextPos();
          if (np >= 0) this.startMix(np, remaining);
        }
      }
      if (this.mixState && this.ctx.currentTime >= this.mixState.endAt) this.finishMix();
    }
    const now = performance.now();
    if (now - this.lastEmit > 200) {
      this.lastEmit = now;
      this.emit();
    }
  }

  /** Crossfade LINEAL: deck activo 1→0, deck entrante 0→1 durante `dur` segundos. */
  private startMix(np: number, dur: number): void {
    const track = this.queue[this.order.at(np)];
    if (!track) return;
    const cur = this.decks[this.active];
    const inc = this.decks[1 - this.active];
    this.load(inc, track);
    const t = this.ctx.currentTime;
    inc.gain.gain.cancelScheduledValues(t);
    inc.gain.gain.setValueAtTime(0, t);
    inc.gain.gain.linearRampToValueAtTime(1, t + dur);
    cur.gain.gain.cancelScheduledValues(t);
    cur.gain.gain.setValueAtTime(1, t);
    cur.gain.gain.linearRampToValueAtTime(0, t + dur);
    void inc.el.play();
    this.mixState = { pos: np, endAt: t + dur };
    this.emit();
  }

  private finishMix(): void {
    if (!this.mixState) return;
    const old = this.decks[this.active];
    const inc = this.decks[1 - this.active];
    old.el.pause();
    this.setGain(old, 0);
    this.setGain(inc, 1);
    this.active = 1 - this.active;
    this.pos = this.mixState.pos;
    this.mixState = null;
    this.emit();
  }

  private cancelMix(): void {
    if (!this.mixState) return;
    const inc = this.decks[1 - this.active];
    inc.el.pause();
    this.setGain(inc, 0);
    this.setGain(this.decks[this.active], 1);
    this.mixState = null;
  }

  private onEnded(deck: Deck): void {
    if (deck !== this.decks[this.active]) return;
    if (this.mixState) {
      this.finishMix();
      return;
    }
    this.next(true);
  }

  destroy(): void {
    window.clearInterval(this.timer);
    this.decks.forEach((d) => d.el.pause());
    void this.ctx.close();
  }
}

