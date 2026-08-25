import { AnimatePresence, motion } from 'framer-motion';
import { MathText } from './MathText';
import { Mascot, type MascotMood } from '../../design-system/Mascot';

interface FeedbackCardProps {
  status: 'correct' | 'incorrect' | null;
  headline: string;
  explanation: string;
}

/**
 * Tarjeta de feedback que acompaña a la mascota. El "por qué" siempre presente:
 * nunca solo "bien/mal". Colores suaves, nada de rojo agresivo.
 */
export function FeedbackCard({
  status,
  headline,
  explanation,
}: FeedbackCardProps) {
  const mood: MascotMood =
    status === 'correct'
      ? 'celebrating'
      : status === 'incorrect'
        ? 'encouraging'
        : 'neutral';

  return (
    <AnimatePresence>
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className={`flex items-start gap-3 rounded-2xl p-4 shadow-soft ${
            status === 'correct'
              ? 'bg-turquoise-soft/40'
              : 'bg-coral-soft/40'
          }`}
          role="status"
          aria-live="polite"
        >
          <Mascot mood={mood} size={56} className="shrink-0" />
          <div>
            <p className="font-display font-bold text-lg">{headline}</p>
            <p className="text-ink/80 mt-0.5">
              <MathText>{explanation}</MathText>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
