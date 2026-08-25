import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { MathText } from './MathText';
import { Button } from './Button';
import { randomCopy } from '../../design-system/copy';

interface HintRevealProps {
  hints: string[];
  revealed: number;
  onReveal: () => void;
}

/**
 * Pistas de revelado progresivo: cada pulsación muestra una más.
 * Errar cuesta cero, así que animamos a pedir ayuda sin penalización.
 */
export function HintReveal({ hints, revealed, onReveal }: HintRevealProps) {
  if (hints.length === 0) return null;
  const hasMore = revealed < hints.length;

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {hints.slice(0, revealed).map((hint, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex gap-2 rounded-2xl bg-honey-soft/50 p-3 text-sm"
          >
            <Lightbulb className="h-4 w-4 shrink-0 text-honey-deep" />
            <MathText>{hint}</MathText>
          </motion.div>
        ))}
      </AnimatePresence>

      {hasMore && (
        <Button
          variant="ghost"
          onClick={onReveal}
          className="text-sm text-honey-deep"
        >
          <span className="inline-flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4" />
            {randomCopy.hintButton()}
            <span className="opacity-60">
              ({revealed}/{hints.length})
            </span>
          </span>
        </Button>
      )}
    </div>
  );
}
