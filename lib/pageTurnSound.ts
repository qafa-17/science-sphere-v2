// A page-turn "swish", made with code instead of a sound file.
// It's a short burst of noise shaped like paper moving through the air,
// so there's no audio file to license or download.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  // browsers start audio paused until the visitor interacts with the page
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function playPageTurn() {
  const audio = getContext();
  if (!audio) return;

  const now = audio.currentTime;
  const length = 0.45; // seconds

  // white noise
  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * length), audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = audio.createBufferSource();
  noise.buffer = buffer;

  // sweep a band-pass filter downwards: that's the "swish"
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(3200, now);
  filter.frequency.exponentialRampToValueAtTime(700, now + length);

  // fade in fast, fade out slowly
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + length);

  noise.connect(filter).connect(gain).connect(audio.destination);
  noise.start(now);
  noise.stop(now + length);
}
