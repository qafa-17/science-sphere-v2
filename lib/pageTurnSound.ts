// The page-turn sound, played each time a page flips in the reader.
// The sound file is public/sounds/page-flip.mp3; swap that file to change it.

const SRC = "/sounds/page-flip.mp3";

let ctx: AudioContext | null = null;
let sound: AudioBuffer | null = null;
let loading: Promise<void> | null = null;
let fetched: Promise<ArrayBuffer> | null = null; // the file, downloaded ahead of time

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

/** Fetch and decode the sound once, so every flip plays straight away. */
function load(audio: AudioContext) {
  if (!loading) {
    loading = (fetched ?? fetch(SRC).then((r) => r.arrayBuffer()))
      .then((data) => audio.decodeAudioData(data.slice(0)))
      .then((buffer) => {
        sound = buffer;
      })
      .catch(() => {
        loading = null; // try again next flip
        fetched = null;
      });
  }
  return loading;
}

/**
 * Phones (iPhones especially) keep sound locked until the visitor touches the
 * page, and only unlock it if that happens inside the touch itself. The flip
 * happens a moment later, outside the touch, so on its own it stays silent.
 * This unlocks sound on the very first touch, click or key press.
 */
let unlocked = false;
function unlock() {
  if (unlocked) return;
  const audio = getContext();
  if (!audio) return;
  void load(audio);
  // playing a moment of silence inside the touch is what tells the phone it's allowed
  const silence = audio.createBufferSource();
  silence.buffer = audio.createBuffer(1, 1, audio.sampleRate);
  silence.connect(audio.destination);
  silence.start();
  void audio.resume().then(() => {
    if (audio.state === "running") {
      unlocked = true;
      for (const type of UNLOCK_EVENTS) window.removeEventListener(type, unlock, true);
    }
  });
}
const UNLOCK_EVENTS = ["touchstart", "touchend", "pointerdown", "keydown", "click"] as const;

/** Get the sound ready ahead of the first flip (call when the reader opens). */
export function preloadPageTurn() {
  if (typeof window === "undefined") return;
  // fetch the file now, but leave starting the sound to the visitor's first touch
  fetched ??= fetch(SRC).then((r) => r.arrayBuffer());
  if (!unlocked) for (const type of UNLOCK_EVENTS) window.addEventListener(type, unlock, true);
}

export function playPageTurn() {
  const audio = getContext();
  if (!audio) return;
  const play = () => {
    if (!sound) return;
    // a new source each time, so quick flips can overlap
    const source = audio.createBufferSource();
    source.buffer = sound;
    source.connect(audio.destination);
    source.start();
  };
  if (sound) play();
  else void load(audio).then(play);
}
