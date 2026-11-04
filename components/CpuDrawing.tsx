import { BODY, PINS, PIN_TIP, TRACES, VIEW } from "@/lib/cpu";
import styles from "./CpuCursor.module.css";

/** The CPU chip and its circuit traces. The traces show when a parent has the "active" class. */
export default function CpuDrawing({ size }: { size: number }) {
  const h = VIEW / 2;
  return (
    <svg className={styles.drawing} viewBox={`${-h} ${-h} ${VIEW} ${VIEW}`} width={size} height={size}>
      <g className={styles.traces}>
        {TRACES.map((t, i) => (
          <polyline key={i} pathLength={1} points={t.points.map((p) => p.join(",")).join(" ")} />
        ))}
      </g>
      <g className={styles.pads}>
        {TRACES.map((t, i) => {
          const [x, y] = t.points[t.points.length - 1];
          if (t.end === "dot") return <circle key={i} cx={x} cy={y} r={1.9} className={styles.fill} />;
          if (t.end === "ring") return <circle key={i} cx={x} cy={y} r={2.4} className={styles.ring} />;
          // a tiny component, turned to run along its trace
          const [px] = t.points[t.points.length - 2];
          const vertical = px === x;
          return (
            <rect
              key={i}
              x={x - (vertical ? 1.6 : 3)}
              y={y - (vertical ? 3 : 1.6)}
              width={vertical ? 3.2 : 6}
              height={vertical ? 6 : 3.2}
              rx={0.6}
              className={styles.fill}
            />
          );
        })}
      </g>
      <g className={styles.chip}>
        {PINS.map((p) => (
          <g key={p}>
            <rect x={p - 1.1} y={-PIN_TIP} width={2.2} height={PIN_TIP - BODY + 1} />
            <rect x={p - 1.1} y={BODY - 1} width={2.2} height={PIN_TIP - BODY + 1} />
            <rect x={-PIN_TIP} y={p - 1.1} width={PIN_TIP - BODY + 1} height={2.2} />
            <rect x={BODY - 1} y={p - 1.1} width={PIN_TIP - BODY + 1} height={2.2} />
          </g>
        ))}
        <rect className={styles.body} x={-BODY} y={-BODY} width={BODY * 2} height={BODY * 2} rx={1.6} />
        <rect className={styles.die} x={-7.5} y={-7.5} width={15} height={15} rx={0.6} />
        <circle className={styles.mark} cx={-4.6} cy={-4.6} r={1} />
      </g>
    </svg>
  );
}
