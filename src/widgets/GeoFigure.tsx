import type { WidgetProps } from './types';

/**
 * Figura geométrica genérica (expositiva).
 *
 *   shape "rectangle"      → rectángulo a×b con lados etiquetados y, opcional,
 *                            rejilla de cuadrados unidad (para descubrir que el
 *                            área = base × altura contando cuadros).
 *   shape "right-triangle" → triángulo rectángulo de catetos a y b, con marca de
 *                            ángulo recto y, opcional, etiqueta de hipotenusa
 *                            (para áreas y el teorema de Pitágoras).
 *
 * Props: shape, a, b, labels{a,b,c}, grid, fill, hypotenuse.
 */
export default function GeoFigure(props: WidgetProps) {
  const shape = (props.shape as string) ?? 'rectangle';
  const a = clampPos(props.a, 4);
  const b = clampPos(props.b, 3);
  const labels = (props.labels as Record<string, string> | undefined) ?? {};
  const grid = props.grid === true;
  const fill = props.fill !== false;
  const hypotenuse = props.hypotenuse === true;

  const unit = 40;
  const pad = 34;
  const w = a * unit;
  const h = b * unit;
  const vbW = w + pad * 2;
  const vbH = h + pad * 2;
  const ox = pad;
  const oy = pad;
  const labelA = labels.a ?? String(a);
  const labelB = labels.b ?? String(b);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="mx-auto block w-full max-w-sm"
        role="img"
        aria-label={
          shape === 'right-triangle'
            ? `Triángulo rectángulo de catetos ${a} y ${b}`
            : `Rectángulo de ${a} por ${b}`
        }
      >
        {shape === 'right-triangle' ? (
          <RightTriangle
            ox={ox}
            oy={oy}
            w={w}
            h={h}
            unit={unit}
            fill={fill}
            labelA={labelA}
            labelB={labelB}
            hypLabel={hypotenuse ? (labels.c ?? 'c') : undefined}
          />
        ) : (
          <Rectangle
            ox={ox}
            oy={oy}
            w={w}
            h={h}
            unit={unit}
            grid={grid}
            fill={fill}
            aCount={a}
            bCount={b}
            labelA={labelA}
            labelB={labelB}
          />
        )}
      </svg>
    </div>
  );
}

function Rectangle({
  ox,
  oy,
  w,
  h,
  unit,
  grid,
  fill,
  aCount,
  bCount,
  labelA,
  labelB,
}: {
  ox: number;
  oy: number;
  w: number;
  h: number;
  unit: number;
  grid: boolean;
  fill: boolean;
  aCount: number;
  bCount: number;
  labelA: string;
  labelB: string;
}) {
  const lines = [];
  if (grid) {
    for (let i = 1; i < aCount; i++) {
      lines.push(
        <line
          key={`v${i}`}
          x1={ox + i * unit}
          y1={oy}
          x2={ox + i * unit}
          y2={oy + h}
          stroke="#2A9A9D"
          strokeWidth={1}
          opacity={0.4}
        />,
      );
    }
    for (let j = 1; j < bCount; j++) {
      lines.push(
        <line
          key={`h${j}`}
          x1={ox}
          y1={oy + j * unit}
          x2={ox + w}
          y2={oy + j * unit}
          stroke="#2A9A9D"
          strokeWidth={1}
          opacity={0.4}
        />,
      );
    }
  }
  return (
    <>
      <rect
        x={ox}
        y={oy}
        width={w}
        height={h}
        fill={fill ? '#9EE5E6' : 'none'}
        fillOpacity={0.5}
        stroke="#2A9A9D"
        strokeWidth={2.5}
      />
      {lines}
      <SideLabel x={ox + w / 2} y={oy + h + 20} text={labelA} color="#E85C4A" />
      <SideLabel
        x={ox - 16}
        y={oy + h / 2}
        text={labelB}
        color="#2A9A9D"
        vertical
      />
    </>
  );
}

function RightTriangle({
  ox,
  oy,
  w,
  h,
  unit,
  fill,
  labelA,
  labelB,
  hypLabel,
}: {
  ox: number;
  oy: number;
  w: number;
  h: number;
  unit: number;
  fill: boolean;
  labelA: string;
  labelB: string;
  hypLabel?: string;
}) {
  // Ángulo recto abajo-izquierda. Cateto b vertical, cateto a horizontal.
  const p1 = `${ox},${oy + h}`; // esquina del ángulo recto
  const p2 = `${ox + w},${oy + h}`; // extremo del cateto horizontal (a)
  const p3 = `${ox},${oy}`; // extremo del cateto vertical (b)
  const m = Math.min(unit * 0.35, 16); // tamaño de la marca de ángulo recto
  return (
    <>
      <polygon
        points={`${p1} ${p2} ${p3}`}
        fill={fill ? '#FFE29E' : 'none'}
        fillOpacity={0.6}
        stroke="#E8A92E"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* marca de ángulo recto */}
      <path
        d={`M ${ox + m} ${oy + h} L ${ox + m} ${oy + h - m} L ${ox} ${oy + h - m}`}
        fill="none"
        stroke="#3B3A4A"
        strokeWidth={1.5}
      />
      <SideLabel x={ox + w / 2} y={oy + h + 20} text={labelA} color="#E85C4A" />
      <SideLabel
        x={ox - 16}
        y={oy + h / 2}
        text={labelB}
        color="#2A9A9D"
        vertical
      />
      {hypLabel && (
        <SideLabel
          x={ox + w / 2 + 12}
          y={oy + h / 2 - 8}
          text={hypLabel}
          color="#E85C4A"
        />
      )}
    </>
  );
}

function SideLabel({
  x,
  y,
  text,
  color,
  vertical,
}: {
  x: number;
  y: number;
  text: string;
  color: string;
  vertical?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={15}
      fontWeight={700}
      fill={color}
      transform={vertical ? `rotate(-90 ${x} ${y})` : undefined}
    >
      {text}
    </text>
  );
}

function clampPos(raw: unknown, fallback: number): number {
  const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback;
  return Math.min(10, Math.max(1, n));
}
