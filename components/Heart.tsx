import { useId } from "react";
import styles from "./Heart.module.css";

/**
 * An anatomical heart: muscle, aorta and its three branches, the pulmonary
 * trunk, the superior vena cava, and the coronary arteries on the front.
 * It beats (lub-dub) when `beating` is true and sits still otherwise.
 */
export default function Heart({ size = 48, beating = false }: { size?: number; beating?: boolean }) {
  const id = useId().replace(/:/g, "");
  const g = (name: string) => `${name}-${id}`;
  return (
    <svg
      className={`${styles.heart} ${beating ? styles.beating : styles.still}`}
      viewBox="0 0 100 112"
      width={size}
      height={size * 1.12}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={g("muscle")} cx="38%" cy="38%" r="70%">
          <stop offset="0" stopColor="#e2685f" />
          <stop offset="0.45" stopColor="#b8323a" />
          <stop offset="1" stopColor="#5e0d16" />
        </radialGradient>
        <linearGradient id={g("aorta")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8f1b26" />
          <stop offset="0.45" stopColor="#d4545a" />
          <stop offset="1" stopColor="#7a1420" />
        </linearGradient>
        <linearGradient id={g("vein")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a3f78" />
          <stop offset="0.5" stopColor="#5b77b8" />
          <stop offset="1" stopColor="#24366a" />
        </linearGradient>
        <linearGradient id={g("pulm")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d5fa0" />
          <stop offset="0.5" stopColor="#9a86c4" />
          <stop offset="1" stopColor="#4b3f7c" />
        </linearGradient>
        <radialGradient id={g("shine")} cx="35%" cy="30%" r="40%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className={styles.pump}>
        {/* aorta: three branches, then the arch curving over and behind */}
        <path d="M45 15 L45 4 Q47 1 49 4 L49 15 Z" fill={`url(#${g("aorta")})`} />
        <path d="M53 13 L53 2 Q55 -1 57 2 L57 13 Z" fill={`url(#${g("aorta")})`} />
        <path d="M61 15 L62 5 Q64 2 66 5 L65 17 Z" fill={`url(#${g("aorta")})`} />
        <path
          d="M36 46 C35 24 41 12 55 12 C68 12 75 20 74 34 L65 35 C66 25 62 20 55 20 C47 20 45 28 45 46 Z"
          fill={`url(#${g("aorta")})`}
          stroke="#4a0a12"
          strokeWidth="0.8"
        />

        {/* superior vena cava, on the heart's right (your left) */}
        <path
          d="M21 50 L21 18 C21 13 32 13 32 18 L32 48 Z"
          fill={`url(#${g("vein")})`}
          stroke="#1b2850"
          strokeWidth="0.8"
        />

        {/* the muscle */}
        <path
          d="M30 42 C16 44 10 60 16 76 C22 92 46 106 72 110 C76 100 86 88 90 70 C94 52 86 40 72 37 C60 34 44 39 30 42 Z"
          fill={`url(#${g("muscle")})`}
          stroke="#3d0710"
          strokeWidth="1"
        />
        {/* right atrium bulge */}
        <path
          d="M24 46 C12 50 11 68 21 74 C25 66 28 54 24 46 Z"
          fill="#8d1d29"
          stroke="#3d0710"
          strokeWidth="0.7"
        />
        {/* left atrial appendage peeking out on the other side */}
        <path d="M80 42 C90 40 94 50 88 56 C86 50 83 46 80 42 Z" fill="#a32a33" stroke="#3d0710" strokeWidth="0.7" />

        {/* pulmonary trunk, in front, splitting at the top */}
        <path
          d="M46 54 C45 40 52 30 61 26 L70 22 C73 21 75 24 73 27 L66 31 C60 36 57 44 58 56 Z"
          fill={`url(#${g("pulm")})`}
          stroke="#2c2350"
          strokeWidth="0.8"
        />

        {/* fat in the groove between the chambers */}
        <path d="M24 60 C38 54 56 52 80 54" fill="none" stroke="#e8c27a" strokeOpacity="0.55" strokeWidth="2.2" />

        {/* coronary arteries */}
        <g fill="none" stroke="#6d0c17" strokeLinecap="round">
          <path d="M55 56 C53 70 58 88 70 106" strokeWidth="1.8" />
          <path d="M56 66 C62 70 68 72 76 74" strokeWidth="1.1" />
          <path d="M58 80 C64 84 70 86 78 86" strokeWidth="1" />
          <path d="M54 72 C48 76 44 82 42 90" strokeWidth="1" />
          <path d="M30 60 C26 70 28 82 36 92" strokeWidth="1.2" />
        </g>

        {/* a soft shine so it reads as round */}
        <ellipse cx="44" cy="66" rx="24" ry="18" fill={`url(#${g("shine")})`} />
      </g>
    </svg>
  );
}
