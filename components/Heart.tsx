import styles from "./Heart.module.css";

/**
 * An anatomical heart in black-ink line art: the chambers drawn as separate
 * pieces, with ink and bubbles showing through the cracks between them, plus
 * the aorta, vena cava and pulmonary trunk on top. It beats (lub-dub) when
 * `beating` is true and sits still and faded when it isn't.
 * Its two colours come from --heart-ink and --heart-paper.
 */
export default function Heart({ size = 48, beating = false }: { size?: number; beating?: boolean }) {
  return (
    <svg
      className={`${styles.heart} ${beating ? styles.beating : styles.still}`}
      viewBox="0 0 200 244"
      width={size}
      height={size * 1.22}
      aria-hidden="true"
    >
      <g className={styles.pump} strokeLinejoin="round" strokeLinecap="round">
        {/* ink that shows through the cracks */}
        <path className={styles.ink} d="M46 100 C24 118 24 168 44 194 C64 220 102 238 134 242 C158 230 180 198 184 160 C188 126 178 102 152 95 C120 87 74 88 46 100 Z"/>
        {/* bubbles floating in the ink */}
        <g className={styles.paper} strokeWidth="1.8">
          <path d="M66 166 c4 -5 12 -3 10 3 c-2 5 -9 5 -10 -3 z"/>
          <path d="M80 174 c2 -3 6 -2 5 1 c-1 3 -5 3 -5 -1 z"/>
          <path d="M138 150 c3 -4 10 -2 8 3 c-1 4 -8 4 -8 -3 z"/>
          <path d="M152 156 c2 -2 5 -1 4 2 c-1 2 -4 2 -4 -2 z"/>
          <path d="M110 206 c3 -4 9 -2 8 2 c-1 4 -7 4 -8 -2 z"/>
          <path d="M98 216 c2 -2 5 -1 4 2 c-1 2 -4 2 -4 -2 z"/>
          <path d="M68 116 c2 -3 7 -2 6 2 c-1 3 -5 3 -6 -2 z"/>
          <path d="M150 116 c2 -3 6 -2 5 2 c-1 3 -5 2 -5 -2 z"/>
        </g>
      
        {/* the chambers, as separate wavy-edged pieces */}
        <g className={styles.paper} strokeWidth="3.6">
          {/* right atrium */}
          <path d="M46 108 C32 124 30 152 40 172 C46 170 50 166 52 160 C56 166 60 160 60 152 C64 138 62 124 66 112 C60 106 52 104 46 108 Z"/>
          {/* upper middle */}
          <path d="M76 104 C94 98 112 96 130 98 C134 100 138 98 142 100 C140 112 144 124 138 134 C130 132 124 138 116 138 C106 140 100 146 90 146 C84 148 80 154 76 152 C78 140 72 132 76 120 C74 114 76 108 76 104 Z"/>
          {/* left atrium, lumpy */}
          <path d="M156 104 C170 108 180 124 176 140 C180 148 172 154 164 150 C158 154 150 150 152 142 C146 136 152 128 150 120 C150 112 152 106 156 104 Z"/>
          {/* right ventricle */}
          <path d="M46 186 C50 180 58 182 62 176 C74 168 86 172 96 164 C112 156 126 160 140 154 C152 152 162 160 174 158 C172 168 164 176 154 178 C146 186 136 184 128 190 C120 196 118 204 110 202 C104 210 100 220 92 222 C72 214 54 202 46 186 Z"/>
          {/* left ventricle and apex */}
          <path d="M104 232 C108 222 118 220 122 210 C130 202 142 204 150 194 C160 190 168 186 176 172 C172 200 158 222 136 236 C126 240 112 238 104 232 Z"/>
        </g>
        {/* contour lines and pores */}
        <g className={styles.line} strokeWidth="1.8">
          <path d="M42 130 C38 142 39 154 43 162"/>
          <path d="M84 112 C98 106 114 104 128 106"/>
          <path d="M86 138 C94 134 102 130 110 130"/>
          <path d="M168 120 C172 128 172 136 168 142"/>
          <path d="M58 194 C72 184 90 180 104 174"/>
          <path d="M66 204 C72 206 78 210 82 214"/>
          <path d="M122 226 C138 222 152 214 162 200"/>
          <path d="M132 170 C140 168 148 166 156 166"/>
        </g>
        <g className={styles.ink}>
          <circle cx="52" cy="122" r="1.4"/><circle cx="50" cy="148" r="1.4"/><circle cx="96" cy="122" r="1.4"/>
          <circle cx="124" cy="120" r="1.4"/><circle cx="162" cy="130" r="1.4"/><circle cx="98" cy="186" r="1.4"/>
          <circle cx="80" cy="196" r="1.4"/><circle cx="146" cy="222" r="1.4"/><circle cx="118" cy="176" r="1.4"/>
        </g>
      
        {/* aorta: three branches curling up, and the arch */}
        <g className={styles.paper} strokeWidth="3.6">
          <path d="M95 44 C92 36 86 28 84 20 C82 14 90 10 93 16 C96 24 102 30 106 38 Z"/>
          <path d="M112 36 C112 28 110 20 111 12 C112 6 121 6 121 12 C121 20 122 28 122 37 Z"/>
          <path d="M132 42 C136 34 140 28 144 20 C147 14 155 19 152 25 C148 32 144 40 141 48 Z"/>
          <path d="M86 114 C84 98 86 82 84 68 C84 46 98 33 117 33 C136 33 150 46 149 66 C148 76 150 86 148 96 C144 98 140 98 136 96 C136 86 138 76 136 66 C136 54 128 46 117 46 C106 46 98 54 98 66 C98 82 100 98 98 114 Z"/>
        </g>
        <path className={styles.line} strokeWidth="1.8" d="M91 104 C90 92 91 80 90 68 C91 54 101 41 117 40"/>
        <path className={styles.line} strokeWidth="1.8" d="M143 62 C143 70 144 78 143 86"/>
      
        {/* superior vena cava, a little bent */}
        <path className={styles.paper} strokeWidth="3.6" d="M58 118 C56 98 58 76 54 56 C52 48 72 46 74 54 C76 74 74 94 78 112 Z"/>
        <ellipse cx="64" cy="52" rx="10" ry="4.2" className={styles.paper} strokeWidth="3" transform="rotate(-6 64 52)"/>
        <path className={styles.line} strokeWidth="1.8" d="M63 104 C62 90 63 76 60 62"/>
      
        {/* pulmonary trunk, sweeping up and right, forked */}
        <path className={styles.paper} strokeWidth="3.6" d="M100 140 C98 120 110 104 130 98 C142 94 152 92 160 88 C166 84 176 88 172 96 C178 98 182 104 178 110 C174 114 170 112 166 110 C158 112 150 114 142 118 C128 124 118 132 116 146 Z"/>
        <path className={styles.line} strokeWidth="1.8" d="M108 132 C110 118 122 108 138 104 C146 102 154 100 160 98"/>
        <path className={styles.line} strokeWidth="1.8" d="M170 96 C172 100 172 104 170 106"/>
      
        {/* drips */}
        <g className={styles.ink}>
          <path d="M124 68 c-3 6 -4 10 0 11 c4 -1 3 -5 0 -11 z"/>
          <circle cx="123" cy="59" r="1.6"/>
          <path d="M30 184 c-2 4 -3 7 0 8 c3 -1 2 -4 0 -8 z"/>
          <circle cx="190" cy="164" r="2"/>
          <circle cx="26" cy="200" r="1.5"/>
          <circle cx="188" cy="176" r="1.2"/>
          <path d="M182 136 c-2 4 -3 7 0 8 c3 -1 2 -4 0 -8 z"/>
        </g>
      </g>
    </svg>
  );
}
