import { Home } from 'lucide-react';
import { useT } from '../../i18n/i18n';

/**
 * Botón de "volver al inicio" siempre visible en la parte superior de las
 * pantallas internas (lección, práctica, progreso). Un solo toque al menú.
 */
export function HomeButton({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <button
      onClick={onClick}
      aria-label={t('nav.home')}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink/70 shadow-soft transition-colors hover:text-coral"
    >
      <Home className="h-5 w-5" />
    </button>
  );
}
