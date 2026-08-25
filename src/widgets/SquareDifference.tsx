import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { WidgetProps } from './types';
import { Button } from '../components/ui/Button';

/**
 * Diferencia de cuadrados: $a^2 - b^2 = (a+b)(a-b)$.
 *
 * Se parte de un cuadrado de lado $a$ al que se le quita un cuadrado de lado
 * $b$ en una esquina. La figura restante (área $a^2-b^2$) se recompone en un
 * rectángulo de lados $(a+b)$ y $(a-b)$ — misma área, forma nueva.
 *
 * Piezas:
 *   P: rectángulo ancho $(a-b)$, alto $a$   (columna izquierda)
 *   Q: rectángulo ancho $b$,     alto $(a-b)$ (arriba a la derecha)
 * Al recomponer, P se tumba (ancho $a$, alto $a-b$) y Q se coloca a su lado:
 * juntas miden $(a+b) \times (a-b)$.
 */
export default function SquareDifference(props: WidgetProps) {
  const initialA = clampInt(props.a, 3, 8, 6);
  const initialB = clampInt(props.b, 1, initialA - 1, 3);

  const [a, setA] = useState(initialA);
  const [b, setB] = useState(Math.min(initialB, initialA - 1));
  const [rearranged, setRearranged] = useState(false);

  const onInteraction = props.onInteraction;

  // Emite el área (respuesta determinista para preguntas manipulables).
  useEffect(() => {
    onInteraction?.(String(a * a - b * b));
  }, [a, b, onInteraction]);

  const unit = 26; // px por unidad de longitud
  const pad = 16;
  const labelSpace = 22;
  const maxW = (a + b) * unit; // el rectángulo es el estado más ancho
  const maxH = a * unit;
  const vbW = maxW + pad * 2 + labelSpace;
  const vbH = maxH + pad * 2 + labelSpace;

  // Geometría de las piezas en unidades (origen arriba-izquierda).
  const square = {
    P: { x: 0, y: 0, w: a - b, h: a },
    Q: { x: a - b, y: 0, w: b, h: a - b },
    // hueco (cuadrado b² retirado) abajo a la derecha
    hole: { x: a - b, y: a - b, w: b, h: b },
  };
  const rect = {
    P: { x: 0, y: 0, w: a, h: a - b },
    Q: { x: a, y: 0, w: b, h: a - b },
  };

  const layout = rearranged ? rect : square;
  const spring = { type: 'spring' as const, stiffness: 120, damping: 18 };

  const toPx = (v: number) => v * unit;
  const ox = pad + labelSpace;
  const oy = pad;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="mx-auto block w-full max-w-md"
        role="img"
        aria-label={`Cuadrado de lado ${a} menos cuadrado de lado ${b}`}
      >
        <g transform={`translate(${ox} ${oy})`}>
          {/* hueco b² (solo visible en el estado cuadrado) */}
          <motion.rect
            animate={{ opacity: rearranged ? 0 : 1 }}
            x={toPx(square.hole.x)}
            y={toPx(square.hole.y)}
            width={toPx(square.hole.w)}
            height={toPx(square.hole.h)}
            fill="#FDF8F3"
            stroke="#FFB4A9"
            strokeDasharray="4 4"
          />

          {/* Pieza P (turquesa) */}
          <motion.rect
            animate={{
              x: toPx(layout.P.x),
              y: toPx(layout.P.y),
              width: toPx(layout.P.w),
              height: toPx(layout.P.h),
            }}
            transition={spring}
            rx={6}
            fill="#9EE5E6"
            stroke="#2A9A9D"
            strokeWidth={2}
          />

          {/* Pieza Q (coral) */}
          <motion.rect
            animate={{
              x: toPx(layout.Q.x),
              y: toPx(layout.Q.y),
              width: toPx(layout.Q.w),
              height: toPx(layout.Q.h),
            }}
            transition={spring}
            rx={6}
            fill="#FFB4A9"
            stroke="#E85C4A"
            strokeWidth={2}
          />
        </g>
      </svg>

      <p className="mt-2 text-center font-display text-lg">
        {rearranged ? (
          <span>
            área <b>({a}+{b})({a}−{b})</b> = {a * a - b * b}
          </span>
        ) : (
          <span>
            área <b>
              {a}² − {b}²
            </b>{' '}
            = {a * a - b * b}
          </span>
        )}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Slider
          label={`a = ${a}`}
          min={2}
          max={8}
          value={a}
          onChange={(next) => {
            setA(next);
            if (b >= next) setB(next - 1);
          }}
        />
        <Slider
          label={`b = ${b}`}
          min={1}
          max={Math.max(1, a - 1)}
          value={b}
          onChange={setB}
        />
      </div>

      <div className="mt-3 flex justify-center">
        <Button variant="secondary" onClick={() => setRearranged((r) => !r)}>
          {rearranged ? 'Volver al cuadrado' : 'Reorganizar en rectángulo'}
        </Button>
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-coral"
      />
    </label>
  );
}

function clampInt(
  raw: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = typeof raw === 'number' ? Math.round(raw) : fallback;
  return Math.min(max, Math.max(min, n));
}
