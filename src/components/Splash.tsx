import { motion } from 'framer-motion';
import { Mascot } from '../design-system/Mascot';
import { APP_NAME, useT } from '../i18n/i18n';

/**
 * Pantalla de bienvenida que aparece ~2s al abrir la app: muestra el nombre y
 * la mascota. Puramente estética; el contenido ya está cargado detrás.
 */
export function Splash() {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 grid place-items-center bg-cream"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <Mascot mood="celebrating" size={110} />
        </motion.div>
        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="font-display text-5xl font-extrabold text-ink"
        >
          {APP_NAME}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-ink/60"
        >
          {t('app.tagline')}
        </motion.p>
      </div>
    </motion.div>
  );
}
