import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { WidgetProps } from './types';

/**
 * Recta numérica genérica y reutilizable (fracciones, desigualdades, valor
 * absoluto…). Un solo widget cubre muchos usos según sus props:
 *
 *   min, max        rango de la recta
 *   step            separación entre marcas (por defecto 1)
 *   labels          mapa opcional { valor: "etiqueta" } — p. ej. fracciones
 *   points          puntos fijos [{ value, label?, color? }]
 *   interval        intervalo sombreado { from, to, open? }
 *   interactive     si es true, el usuario coloca un marcador y se emite su
 *                   valor (respuesta de una pregunta manipulable)
 *   initial         posición inicial del marcador interactivo
 *
 * El marcador se ajusta a la marca más cercana y es manejable por teclado.
 */
export default function NumberLine(props: WidgetProps) {
  const min = num(props.min, 0);
  const max = num(props.max, 10);
  const step = Math.max(num(props.step, 1), 1e-6);
  const interactive = props.interactive === true;
  const labels = (props.labels as Record<string, string> | undefined) ?? {};
  const points = (props.points as PointSpec[] | undefined) ?? [];
  const interval = props.interval as IntervalSpec | undefined;
  const onInteraction = props.onInteraction;

  const ticks = useMemo(() => buildTicks(min, max, step), [min, max, step]);
  const [marker, setMarker] = useState(() =>
    snap(num(props.initial, min), min, max, step),
  );

  useEffect(() => {
    if (interactive) onInteraction?.(format(marker));
  }, [marker, interactive, onInteraction]);

  // Geometría
  const W = 640;
  const H = 120;
  const padX = 32;
  const axisY = 64;
  const toX = (v: number) =>
    padX + ((v - min) / (max - min)) * (W - padX * 2);

  const moveMarker = (dir: -1 | 1) =>
    setMarker((m) => snap(m + dir * step, min, max, step));

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role={interactive ? 'slider' : 'img'}
        aria-label="Recta numérica"
        aria-valuemin={interactive ? min : undefined}
        aria-valuemax={interactive ? max : undefined}
        aria-valuenow={interactive ? marker : undefined}
        tabIndex={interactive ? 0 : -1}
        onKeyDown={(e) => {
          if (!interactive) return;
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            moveMarker(1);
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            moveMarker(-1);
          }
        }}
      >
        {/* intervalo sombreado */}
        {interval && (
          <rect
            x={toX(Math.min(interval.from, interval.to))}
            y={axisY - 8}
            width={Math.abs(toX(interval.to) - toX(interval.from))}
            height={16}
            fill="#9EE5E6"
            opacity={0.6}
            rx={4}
          />
        )}

        {/* eje */}
        <line
          x1={padX}
          y1={axisY}
          x2={W - padX}
          y2={axisY}
          stroke="#3B3A4A"
          strokeWidth={2}
        />
        {/* flechas */}
        <Arrow x={padX} y={axisY} dir={-1} />
        <Arrow x={W - padX} y={axisY} dir={1} />

        {/* marcas + etiquetas */}
        {ticks.map((t) => {
          const x = toX(t);
          const label = labels[format(t)] ?? format(t);
          return (
            <g key={t}>
              <line
                x1={x}
                y1={axisY - 6}
                x2={x}
                y2={axisY + 6}
                stroke="#3B3A4A"
                strokeWidth={1.5}
              />
              <text
                x={x}
                y={axisY + 24}
                textAnchor="middle"
                fontSize={13}
                fill="#3B3A4A"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* extremos del intervalo. Solo se dibuja el círculo cuando el
            extremo cae DENTRO de la recta; si llega al borde es un rayo
            (x>2, x≤1…) y se deja fluir hacia la flecha. */}
        {interval && (
          <>
            {interval.from > min && (
              <IntervalEnd
                cx={toX(interval.from)}
                cy={axisY}
                open={interval.openFrom ?? interval.open}
              />
            )}
            {interval.to < max && (
              <IntervalEnd
                cx={toX(interval.to)}
                cy={axisY}
                open={interval.openTo ?? interval.open}
              />
            )}
          </>
        )}

        {/* puntos fijos */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={toX(p.value)}
              cy={axisY}
              r={7}
              fill={p.color ?? '#FF7A6B'}
              stroke="white"
              strokeWidth={2}
            />
            {p.label && (
              <text
                x={toX(p.value)}
                y={axisY - 16}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill="#3B3A4A"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}

        {/* marcador interactivo */}
        {interactive && (
          <>
            {ticks.map((t) => (
              <circle
                key={`hit-${t}`}
                cx={toX(t)}
                cy={axisY}
                r={14}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => setMarker(t)}
              />
            ))}
            <motion.circle
              animate={{ cx: toX(marker) }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              cy={axisY}
              r={10}
              fill="#FFC94D"
              stroke="#E8A92E"
              strokeWidth={3}
            />
          </>
        )}
      </svg>

      {interactive && (
        <p className="mt-1 text-center text-sm text-ink/60">
          Elegido: <b>{labels[format(marker)] ?? format(marker)}</b>
        </p>
      )}
    </div>
  );
}

interface PointSpec {
  value: number;
  label?: string;
  color?: string;
}
interface IntervalSpec {
  from: number;
  to: number;
  /** Abre ambos extremos (círculo hueco). Se puede afinar por extremo. */
  open?: boolean;
  openFrom?: boolean;
  openTo?: boolean;
}

function Arrow({ x, y, dir }: { x: number; y: number; dir: -1 | 1 }) {
  const d = 8 * dir;
  return (
    <polygon
      points={`${x + d},${y - 5} ${x + d},${y + 5} ${x + d + d},${y}`}
      fill="#3B3A4A"
    />
  );
}

function IntervalEnd({
  cx,
  cy,
  open,
}: {
  cx: number;
  cy: number;
  open?: boolean;
}) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={open ? 'white' : '#2A9A9D'}
      stroke="#2A9A9D"
      strokeWidth={2}
    />
  );
}

function buildTicks(min: number, max: number, step: number): number[] {
  const ticks: number[] = [];
  // Redondeo para evitar acumulación de error en floats.
  const decimals = decimalsOf(step);
  for (let v = min; v <= max + 1e-9; v += step) {
    ticks.push(round(v, decimals));
  }
  return ticks;
}

function snap(v: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, v));
  const snapped = min + Math.round((clamped - min) / step) * step;
  return round(Math.min(max, Math.max(min, snapped)), decimalsOf(step));
}

function decimalsOf(step: number): number {
  const s = String(step);
  return s.includes('.') ? s.split('.')[1]!.length : 0;
}
function round(v: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}
function format(v: number): string {
  return String(round(v, 6));
}
function num(raw: unknown, fallback: number): number {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback;
}
