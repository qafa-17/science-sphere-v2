// The page-turn sound, played each time a page flips in the reader.
// The sound file is public/sounds/page-flip.mp3; swap that file to change it.

const SRC = "/sounds/page-flip.mp3";

let ctx: AudioContext | null = null;
let sound: AudioBuffer | null = null;
let loading: Promise<void> | null = null;

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
    loading = fetch(SRC)
      .then((r) => r.arrayBuffer())
      .then((data) => audio.decodeAudioData(data))
      .then((buffer) => {
        sound = buffer;
      })
      .catch(() => {
        loading = null; // try again next flip
      });
  }
  return loading;
}

/** Get the sound ready ahead of the first flip (call when the reader opens). */
export function preloadPageTurn() {
  const audio = getContext();
  if (audio) void load(audio);
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
