import { lazy, type LazyExoticComponent, type ComponentType } from 'react';
import type { WidgetProps } from './types';

/**
 * Registry de widgets: nombre → componente lazy.
 *
 * Cada widget vive en su propio archivo y se carga bajo demanda (presupuesto
 * de rendimiento para gama baja). Añadir un widget = una línea aquí.
 */
export const widgetRegistry: Record<
  string,
  LazyExoticComponent<ComponentType<WidgetProps>>
> = {
  'square-difference': lazy(() => import('./SquareDifference')),
  'number-line': lazy(() => import('./NumberLine')),
  'area-model': lazy(() => import('./AreaModel')),
  'geo-figure': lazy(() => import('./GeoFigure')),
};

export type WidgetName = keyof typeof widgetRegistry;

export function hasWidget(name: string): boolean {
  return name in widgetRegistry;
}
