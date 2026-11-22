/** Estimación local de voz cantada sobre una mezcla, cerca de la primera marca LRC. */
export function vocalOnsetDetector(analyser: AnalyserNode, sampleRate: number) {
  const spectrum = new Float32Array(analyser.frequencyBinCount);
  const binWidth = sampleRate / analyser.fftSize;
  let previous = -Infinity;
  let start: number | undefined;

  return (position: number): number | undefined => {
    if (position - previous < .055 && position >= previous) return;
    if (position < previous || position - previous > .32) start = undefined;
    previous = position;
    analyser.getFloatFrequencyData(spectrum);
    let best = 0;
    for (let pitch = 100; pitch < 490; pitch *= 1.025) {
      let harmonics = 0;
      for (let frequency = pitch * 2; frequency < 3000; frequency += pitch) {
        if (frequency < 420) continue;
        const bin = Math.round(frequency / binWidth);
        const peak = Math.max(spectrum[bin - 1], spectrum[bin], spectrum[bin + 1]);
        const gap = Math.round(pitch / (2 * binWidth));
        if (peak > -67 && peak - Math.max(spectrum[bin - gap], spectrum[bin + gap]) > 9) harmonics++;
      }
      best = Math.max(best, harmonics);
    }
    if (best < 5) {
      start = undefined;
      return;
    }
    start ??= position;
    if (position - start >= .22) return Math.max(0, start - analyser.fftSize / (2 * sampleRate));
  };
}
