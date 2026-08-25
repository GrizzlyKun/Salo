import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { Lesson } from './schema';
import { isQuestion } from './schema';
import { StepRenderer } from './StepRenderer';
import { useLessonStore } from './useLessonStore';
import { Button } from '../components/ui/Button';
import { HomeButton } from '../components/ui/HomeButton';
import { Mascot } from '../design-system/Mascot';
import { randomCopy } from '../design-system/copy';
import { playComplete } from '../design-system/sound';
import { useT } from '../i18n/i18n';

interface LessonPlayerProps {
  lesson: Lesson;
  onExit?: () => void;
}

/**
 * Reproductor de lección. Flujo tipo conversación: los steps anteriores quedan
 * visibles arriba y cada nuevo step entra animado. "Continuar" se bloquea hasta
 * responder la pregunta activa.
 */
export function LessonPlayer({ lesson, onExit }: LessonPlayerProps) {
  const t = useT();
  const startLesson = useLessonStore((s) => s.startLesson);
  const completeStep = useLessonStore((s) => s.completeStep);
  const completeLesson = useLessonStore((s) => s.completeLesson);

  const [visibleCount, setVisibleCount] = useState(1);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);

  const activeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    startLesson(lesson.id);
    setVisibleCount(1);
    setSolvedIds(new Set());
    setFinished(false);
  }, [lesson.id, startLesson]);

  // Al avanzar, baja automáticamente al step recién revelado (respetando la
  // preferencia de menos movimiento). No hace scroll en el primer step.
  useEffect(() => {
    if (visibleCount <= 1) return;
    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const t = setTimeout(() => {
      activeRef.current?.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 80);
    return () => clearTimeout(t);
  }, [visibleCount]);

  const visibleSteps = lesson.steps.slice(0, visibleCount);
  const activeStep = lesson.steps[visibleCount - 1]!;
  const isLast = visibleCount >= lesson.steps.length;

  const activeBlocks =
    isQuestion(activeStep) && !solvedIds.has(activeStep.id);
  const canContinue = !activeBlocks;

  const markSolved = (id: string) =>
    setSolvedIds((prev) => new Set(prev).add(id));

  const advance = () => {
    completeStep(activeStep.id);
    if (isLast) {
      completeLesson(lesson.id, lesson.xp);
      setFinished(true);
      celebrate();
    } else {
      setVisibleCount((c) => c + 1);
    }
  };

  if (finished) {
    return <LessonComplete lesson={lesson} onExit={onExit} />;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-28 pt-6">
      <div className="flex items-center gap-3">
        <HomeButton onClick={() => onExit?.()} />
        <div className="flex-1">
          <ProgressBar current={visibleCount} total={lesson.steps.length} />
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-6">
        <AnimatePresence initial={false}>
          {visibleSteps.map((step, i) => (
            <motion.section
              key={step.id}
              ref={i === visibleCount - 1 ? activeRef : undefined}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={
                i === visibleCount - 1
                  ? 'scroll-mt-4 rounded-2xl bg-white/70 p-5 shadow-soft'
                  : 'opacity-70'
              }
            >
              <StepRenderer
                lessonId={lesson.id}
                step={step}
                solved={solvedIds.has(step.id)}
                onSolved={() => markSolved(step.id)}
              />
            </motion.section>
          ))}
        </AnimatePresence>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-black/5 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" onClick={onExit} className="text-sm">
            {t('nav.exit')}
          </Button>
          <Button onClick={advance} disabled={!canContinue}>
            {isLast ? t('nav.finish') : randomCopy.continue()}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-black/5">
      <motion.div
        className="h-full rounded-full bg-honey"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      />
    </div>
  );
}

function LessonComplete({
  lesson,
  onExit,
}: {
  lesson: Lesson;
  onExit?: () => void;
}) {
  const t = useT();
  const xp = useLessonStore((s) => s.xp);
  const streak = useLessonStore((s) => s.streak.count);
  const headline = useMemo(() => randomCopy.lessonComplete(), []);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Mascot mood="celebrating" size={120} />
      <h2 className="font-display text-2xl font-extrabold">{headline}</h2>
      <p className="text-ink/70">{lesson.title}</p>
      <div className="flex gap-4">
        <Stat label={t('complete.xpEarned')} value={`+${lesson.xp}`} />
        <Stat label={t('complete.xpTotal')} value={String(xp)} />
        <Stat label={t('complete.streak')} value={`${streak} 🔥`} />
      </div>
      <Button onClick={onExit} className="mt-2">
        {t('nav.back')}
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-soft">
      <p className="font-display text-xl font-extrabold text-coral">{value}</p>
      <p className="text-xs text-ink/60">{label}</p>
    </div>
  );
}

function celebrate() {
  playComplete();
  if (
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FF7A6B', '#3EC6C9', '#FFC94D'],
  });
}
