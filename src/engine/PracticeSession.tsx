import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useContent, type LocatedQuestion } from '../content';
import { useLessonStore, selectDuePractice } from './useLessonStore';
import { createProblemGenerator, hasProblemTemplate } from './generate';
import { QuestionView } from './QuestionView';
import type { QuestionStep } from './schema';
import { Button } from '../components/ui/Button';
import { HomeButton } from '../components/ui/HomeButton';
import { Mascot } from '../design-system/Mascot';
import { randomCopy } from '../design-system/copy';
import { playComplete } from '../design-system/sound';
import { useT } from '../i18n/i18n';

/**
 * Modo práctica: repasa las preguntas que TOCAN hoy según la repetición
 * espaciada (cajas Leitner en el store). Acertar sube la pregunta de caja y la
 * aleja en el tiempo; fallar la reinicia. Errar no penaliza: te quedas en la
 * pregunta con feedback y pistas hasta resolverla, y solo entonces avanza.
 *
 * La cola se fija (snapshot) y se baraja al iniciar la sesión.
 */
export function PracticeSession({ onExit }: { onExit: () => void }) {
  const t = useT();
  const { locale, findQuestion } = useContent();
  // Snapshot al montar: la cola no cambia aunque el set de falladas se vacíe.
  const [queue] = useState<LocatedQuestion[]>(() => {
    const ids = selectDuePractice(useLessonStore.getState());
    return shuffle(ids)
      .map((id) => findQuestion(id))
      .filter((q): q is LocatedQuestion => q !== undefined);
  });

  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [finished, setFinished] = useState(false);

  const total = queue.length;
  const current = queue[index];

  // Si la pregunta tiene plantilla, muestra una VARIANTE nueva (mismo concepto,
  // números distintos). El repaso se agenda contra el id ORIGINAL.
  const presented: QuestionStep | null = useMemo(() => {
    if (!current) return null;
    const original = current.step;
    if (original.templateId && hasProblemTemplate(original.templateId)) {
      try {
        return createProblemGenerator(original.templateId, { locale }).next()
          .step;
      } catch {
        return original;
      }
    }
    return original;
  }, [current, locale]);

  if (total === 0) {
    return <PracticeEmpty onExit={onExit} />;
  }

  if (finished || !current || !presented) {
    return <PracticeDone reviewed={total} onExit={onExit} />;
  }

  const advance = () => {
    if (index + 1 >= total) {
      setFinished(true);
      celebrate();
    } else {
      setIndex((i) => i + 1);
      setSolved(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-28 pt-6">
      <div className="flex items-center gap-3">
        <HomeButton onClick={onExit} />
        <span className="flex-1 font-display text-sm font-bold uppercase tracking-wide text-ink/50">
          {t('practice.label')}
        </span>
        <span className="text-sm text-ink/50">
          {index + 1} / {total}
        </span>
      </div>
      <ProgressBar current={index + (solved ? 1 : 0)} total={total} />

      <div className="mt-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.section
            key={presented.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="rounded-2xl bg-white/70 p-5 shadow-soft"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/40">
              {t('practice.from')} {current.lessonTitle}
              {presented.id !== current.step.id && ` · ${t('practice.variant')}`}
            </p>
            <QuestionView
              lessonId={current.lessonId}
              step={presented}
              recordStepId={current.step.id}
              solved={solved}
              onSolved={() => setSolved(true)}
            />
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-black/5 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" onClick={onExit} className="text-sm">
            {t('nav.exit')}
          </Button>
          <Button onClick={advance} disabled={!solved}>
            {index + 1 >= total ? t('nav.finish') : randomCopy.continue()}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-black/5">
      <motion.div
        className="h-full rounded-full bg-turquoise"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      />
    </div>
  );
}

function PracticeEmpty({ onExit }: { onExit: () => void }) {
  const t = useT();
  return (
    <Centered>
      <Mascot mood="sleeping" size={110} />
      <h2 className="font-display text-2xl font-extrabold">
        {t('practice.emptyTitle')}
      </h2>
      <p className="max-w-xs text-ink/70">{t('practice.emptyDesc')}</p>
      <Button onClick={onExit} className="mt-2">
        {t('nav.back')}
      </Button>
    </Centered>
  );
}

function PracticeDone({
  reviewed,
  onExit,
}: {
  reviewed: number;
  onExit: () => void;
}) {
  const t = useT();
  const headline = useMemo(() => randomCopy.lessonComplete(), []);
  return (
    <Centered>
      <Mascot mood="celebrating" size={120} />
      <h2 className="font-display text-2xl font-extrabold">{headline}</h2>
      <p className="text-ink/70">{t('practice.doneReviewed', { n: reviewed })}</p>
      <Button onClick={onExit} className="mt-2">
        {t('nav.back')}
      </Button>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      {children}
    </div>
  );
}

function shuffle<T>(xs: readonly T[]): T[] {
  const arr = [...xs];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function celebrate() {
  playComplete();
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#3EC6C9', '#FFC94D', '#FF7A6B'],
  });
}
