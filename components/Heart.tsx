import type { CSSProperties } from "react";
import { useId } from "react";
import styles from "./Heart.module.css";

/** How far (in drawing units) each piece pulls in when the heart closes up. */
const IN = 4.5;
/** Each piece's direction away from the middle of the heart. */
const piece = (x: number, y: number) => {
  const l = Math.hypot(x, y);
  return { "--ix": `${((-x / l) * IN).toFixed(2)}px`, "--iy": `${((-y / l) * IN).toFixed(2)}px` } as CSSProperties;
};

/**
 * An anatomical heart in coloured ink. The chambers are separate pieces: while
 * the office is open they pull together (the black cracks between them vanish)
 * and spring apart again (the black shows) in a lub-dub rhythm. While it's
 * closed the heart sits still, apart, and a little faded.
 */
export default function Heart({ size = 48, beating = false }: { size?: number; beating?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const url = (name: string) => `url(#${name}-${id})`;
  const gid = (name: string) => `${name}-${id}`;

  return (
    <svg
      className={`${styles.heart} ${beating ? styles.beating : styles.still}`}
      viewBox="0 0 200 244"
      width={size}
      height={size * 1.22}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={gid("muscle")} gradientUnits="userSpaceOnUse" cx="78" cy="130" r="130">
          <stop offset="0" stopColor="#ec8a84" />
          <stop offset="0.4" stopColor="#c0414a" />
          <stop offset="1" stopColor="#6e111c" />
        </radialGradient>
        <linearGradient id={gid("artery")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9b2430" />
          <stop offset="0.45" stopColor="#df6168" />
          <stop offset="1" stopColor="#841a26" />
        </linearGradient>
        <linearGradient id={gid("vein")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2f4682" />
          <stop offset="0.5" stopColor="#6c88c8" />
          <stop offset="1" stopColor="#2a3c70" />
        </linearGradient>
        <linearGradient id={gid("pulm")} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#5a4b94" />
          <stop offset="0.5" stopColor="#9d8bd0" />
          <stop offset="1" stopColor="#4d4084" />
        </linearGradient>
      </defs>

      <g className={styles.drawing} strokeLinejoin="round" strokeLinecap="round">
        {/* the ink behind the pieces: it shows in the cracks when they pull apart */}
        <g className={styles.inkLayer}>
          <path
            className={styles.ink}
            d="M46 100 C24 118 24 168 44 194 C64 220 102 238 134 242 C158 230 180 198 184 160 C188 126 178 102 152 95 C120 87 74 88 46 100 Z"
          />
          <g className={styles.bubble} strokeWidth="1.8">
            <path d="M66 166 c4 -5 12 -3 10 3 c-2 5 -9 5 -10 -3 z" />
            <path d="M80 174 c2 -3 6 -2 5 1 c-1 3 -5 3 -5 -1 z" />
            <path d="M138 150 c3 -4 10 -2 8 3 c-1 4 -8 4 -8 -3 z" />
            <path d="M152 156 c2 -2 5 -1 4 2 c-1 2 -4 2 -4 -2 z" />
            <path d="M110 206 c3 -4 9 -2 8 2 c-1 4 -7 4 -8 -2 z" />
            <path d="M98 216 c2 -2 5 -1 4 2 c-1 2 -4 2 -4 -2 z" />
            <path d="M68 116 c2 -3 7 -2 6 2 c-1 3 -5 3 -6 -2 z" />
            <path d="M150 116 c2 -3 6 -2 5 2 c-1 3 -5 2 -5 -2 z" />
          </g>
        </g>

        {/* right atrium */}
        <g className={styles.piece} style={piece(-0.9, -0.43)}>
          <path
            className={styles.muscle}
            fill={url("muscle")}
            d="M46 108 C32 124 30 152 40 172 C46 170 50 166 52 160 C56 166 60 160 60 152 C64 138 62 124 66 112 C60 106 52 104 46 108 Z"
          />
          <path className={styles.line} d="M42 130 C38 142 39 154 43 162" />
          <circle className={styles.pore} cx="52" cy="122" r="1.4" />
          <circle className={styles.pore} cx="50" cy="148" r="1.4" />
        </g>

        {/* upper middle */}
        <g className={styles.piece} style={piece(0, -1)}>
          <path
            className={styles.muscle}
            fill={url("muscle")}
            d="M76 104 C94 98 112 96 130 98 C134 100 138 98 142 100 C140 112 144 124 138 134 C130 132 124 138 116 138 C106 140 100 146 90 146 C84 148 80 154 76 152 C78 140 72 132 76 120 C74 114 76 108 76 104 Z"
          />
          <path className={styles.line} d="M86 138 C94 134 102 130 110 130" />
          <circle className={styles.pore} cx="96" cy="122" r="1.4" />
          <circle className={styles.pore} cx="124" cy="120" r="1.4" />
        </g>

        {/* left atrium */}
        <g className={styles.piece} style={piece(0.83, -0.56)}>
          <path
            className={styles.muscle}
            fill={url("muscle")}
            d="M156 104 C170 108 180 124 176 140 C180 148 172 154 164 150 C158 154 150 150 152 142 C146 136 152 128 150 120 C150 112 152 106 156 104 Z"
          />
          <path className={styles.line} d="M168 120 C172 128 172 136 168 142" />
          <circle className={styles.pore} cx="162" cy="130" r="1.4" />
        </g>

        {/* right ventricle */}
        <g className={styles.piece} style={piece(-0.34, 0.94)}>
          <path
            className={styles.muscle}
            fill={url("muscle")}
            d="M46 186 C50 180 58 182 62 176 C74 168 86 172 96 164 C112 156 126 160 140 154 C152 152 162 160 174 158 C172 168 164 176 154 178 C146 186 136 184 128 190 C120 196 118 204 110 202 C104 210 100 220 92 222 C72 214 54 202 46 186 Z"
          />
          <path className={styles.line} d="M58 194 C72 184 90 180 104 174" />
          <path className={styles.line} d="M66 204 C72 206 78 210 82 214" />
          <path className={styles.line} d="M132 170 C140 168 148 166 156 166" />
          <circle className={styles.pore} cx="98" cy="186" r="1.4" />
          <circle className={styles.pore} cx="80" cy="196" r="1.4" />
          <circle className={styles.pore} cx="118" cy="176" r="1.4" />
        </g>

        {/* left ventricle, down to the apex */}
        <g className={styles.piece} style={piece(0.59, 0.81)}>
          <path
            className={styles.muscle}
            fill={url("muscle")}
            d="M104 232 C108 222 118 220 122 210 C130 202 142 204 150 194 C160 190 168 186 176 172 C172 200 158 222 136 236 C126 240 112 238 104 232 Z"
          />
          <path className={styles.line} d="M122 226 C138 222 152 214 162 200" />
          <circle className={styles.pore} cx="146" cy="222" r="1.4" />
        </g>

        {/* the great vessels move as one */}
        <g className={styles.piece} style={piece(0, -0.6)}>
          {/* aorta: three branches and the arch */}
          <g className={styles.vessel} fill={url("artery")}>
            <path d="M95 44 C92 36 86 28 84 20 C82 14 90 10 93 16 C96 24 102 30 106 38 Z" />
            <path d="M112 36 C112 28 110 20 111 12 C112 6 121 6 121 12 C121 20 122 28 122 37 Z" />
            <path d="M132 42 C136 34 140 28 144 20 C147 14 155 19 152 25 C148 32 144 40 141 48 Z" />
            <path d="M86 114 C84 98 86 82 84 68 C84 46 98 33 117 33 C136 33 150 46 149 66 C148 76 150 86 148 96 C144 98 140 98 136 96 C136 86 138 76 136 66 C136 54 128 46 117 46 C106 46 98 54 98 66 C98 82 100 98 98 114 Z" />
          </g>
          <path className={styles.line} d="M91 104 C90 92 91 80 90 68 C91 54 101 41 117 40" />
          <path className={styles.line} d="M143 62 C143 70 144 78 143 86" />

          {/* superior vena cava */}
          <path className={styles.vessel} fill={url("vein")} d="M58 118 C56 98 58 76 54 56 C52 48 72 46 74 54 C76 74 74 94 78 112 Z" />
          <ellipse className={styles.opening} cx="64" cy="52" rx="10" ry="4.2" transform="rotate(-6 64 52)" />
          <path className={styles.line} d="M63 104 C62 90 63 76 60 62" />

          {/* pulmonary trunk */}
          <path
            className={styles.vessel}
            fill={url("pulm")}
            d="M100 140 C98 120 110 104 130 98 C142 94 152 92 160 88 C166 84 176 88 172 96 C178 98 182 104 178 110 C174 114 170 112 166 110 C158 112 150 114 142 118 C128 124 118 132 116 146 Z"
          />
          <path className={styles.line} d="M108 132 C110 118 122 108 138 104 C146 102 154 100 160 98" />
          <path className={styles.line} d="M170 96 C172 100 172 104 170 106" />
        </g>

        {/* drips */}
        <g className={styles.drips}>
          <path d="M124 68 c-3 6 -4 10 0 11 c4 -1 3 -5 0 -11 z" />
          <circle cx="123" cy="59" r="1.6" />
          <path d="M30 184 c-2 4 -3 7 0 8 c3 -1 2 -4 0 -8 z" />
          <circle cx="190" cy="164" r="2" />
          <circle cx="26" cy="200" r="1.5" />
          <circle cx="188" cy="176" r="1.2" />
          <path d="M182 136 c-2 4 -3 7 0 8 c3 -1 2 -4 0 -8 z" />
        </g>
      </g>
    </svg>
  );
}
