import { Suspense } from 'react';
import { widgetRegistry, hasWidget } from './registry';

interface WidgetHostProps {
  name: string;
  props?: Record<string, unknown>;
  onInteraction?: (value: string) => void;
}

/**
 * Monta un widget del registry por nombre, con carga diferida (Suspense) y un
 * fallback claro si el nombre no existe (evita romper la lección entera).
 */
export function WidgetHost({ name, props, onInteraction }: WidgetHostProps) {
  if (!hasWidget(name)) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-coral-soft bg-white p-4 text-sm text-coral-deep">
        Widget desconocido: <code>{name}</code>
      </div>
    );
  }

  const Widget = widgetRegistry[name]!;

  return (
    <Suspense
      fallback={
        <div className="animate-pulse rounded-2xl bg-white/60 p-8 text-center text-ink/40 shadow-soft">
          Cargando widget…
        </div>
      }
    >
      <Widget {...props} onInteraction={onInteraction} />
    </Suspense>
  );
}
