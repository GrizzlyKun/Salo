import type { WidgetProps } from './types';

/**
 * Modelo de áreas genérico. Dibuja un rectángulo partido por segmentos en el
 * lado superior (`top`, anchos) y el lado izquierdo (`side`, altos), y etiqueta
 * cada celda. Visualiza la propiedad distributiva y los productos notables:
 *
 *   (x+3)(x+2)  →  top=[x,3]  side=[x,2]  →  celdas x², 3x, 2x, 6
 *
 * Es puramente expositivo (no emite interacción). Las etiquetas de celda las da
 * el autor para poder escribir álgebra correcta ("x²", "3x", …).
 *
 * Props:
 *   top   { label, size }[]   segmentos horizontales (factores del ancho)
 *   side  { label, size }[]   segmentos verticales (factores del alto)
 *   cells string[][]          etiquetas [fila=side][columna=top] (opcional)
 */
export default function AreaModel(props: WidgetProps) {
  const top = (props.top as Segment[] | undefined) ?? [];
  const side = (props.side as Segment[] | undefined) ?? [];
  const cells = props.cells as string[][] | undefined;

  if (top.length === 0 || side.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-coral-soft bg-white p-4 text-sm text-coral-deep">
        area-model necesita <code>top</code> y <code>side</code>.
      </div>
    );
  }

  const unit = 34; // px por unidad de longitud
  const labelPad = 30; // espacio para etiquetas de factores
  const totalW = sum(top.map((s) => s.size));
  const totalH = sum(side.map((s) => s.size));
  const gridW = totalW * unit;
  const gridH = totalH * unit;
  const ox = labelPad;
  const oy = labelPad;
  const vbW = gridW + labelPad + 12;
  const vbH = gridH + labelPad + 12;

  // Colores suaves por celda (cuadrados de la diagonal más marcados).
  const tint = (r: number, c: number) =>
    r === c ? '#9EE5E6' : (r + c) % 2 === 0 ? '#FFE29E' : '#FFB4A9';

  // Posiciones acumuladas de los cortes.
  const colX = prefix(top.map((s) => s.size)).map((v) => ox + v * unit);
  const rowY = prefix(side.map((s) => s.size)).map((v) => oy + v * unit);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="mx-auto block w-full max-w-sm"
        role="img"
        aria-label="Modelo de áreas"
      >
        {/* celdas */}
        {side.map((s, r) =>
          top.map((t, c) => {
            const x = colX[c]!;
            const y = rowY[r]!;
            const w = t.size * unit;
            const h = s.size * unit;
            const label = cells?.[r]?.[c];
            return (
              <g key={`${r}-${c}`}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={tint(r, c)}
                  stroke="#3B3A4A"
                  strokeWidth={1.5}
                />
                {label && (
                  <text
                    x={x + w / 2}
                    y={y + h / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={16}
                    fontWeight={700}
                    fill="#3B3A4A"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          }),
        )}

        {/* etiquetas de los factores arriba */}
        {top.map((t, c) => (
          <text
            key={`top-${c}`}
            x={colX[c]! + (t.size * unit) / 2}
            y={oy - 10}
            textAnchor="middle"
            fontSize={15}
            fontWeight={700}
            fill="#E85C4A"
          >
            {t.label}
          </text>
        ))}

        {/* etiquetas de los factores a la izquierda */}
        {side.map((s, r) => (
          <text
            key={`side-${r}`}
            x={ox - 10}
            y={rowY[r]! + (s.size * unit) / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={700}
            fill="#2A9A9D"
          >
            {s.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

interface Segment {
  label: string;
  size: number;
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

/** Sumas parciales SIN incluir el elemento actual: [0, a, a+b, …]. */
function prefix(xs: number[]): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const x of xs) {
    out.push(acc);
    acc += x;
  }
  return out;
}
