import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Infinity as InfinityIcon, ChevronRight } from 'lucide-react';
import {
  problemTemplates,
  createProblemGenerator,
  type GeneratedProblem,
  type Difficulty,
} from './generate';
import { QuestionView } from './QuestionView';
import { Button } from '../components/ui/Button';
import { randomCopy } from '../design-system/copy';
import { useT, useLocale } from '../i18n/i18n';

/**
 * Práctica infinita: elige un tipo de problema y resuelve ejercicios generados
 * sin fin (con anti-repetición). No otorga XP ni alimenta el repaso espaciado
 * — es entrenamiento libre. Reutiliza `QuestionView` con `persist={false}`.
 */
export function InfinitePractice({ onExit }: { onExit: () => void }) {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('media');

  if (!templateId) {
    return (
      <Picker
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        onPick={setTemplateId}
        onExit={onExit}
      />
    );
  }

  return (
    <Session
      key={`${templateId}-${difficulty}`}
      templateId={templateId}
      difficulty={difficulty}
      onExit={() => setTemplateId(null)}
    />
  );
}

function Picker({
  difficulty,
  onDifficulty,
  onPick,
  onExit,
}: {
  difficulty: Difficulty;
  onDifficulty: (d: Difficulty) => void;
  onPick: (id: string) => void;
  onExit: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  // Agrupa por habilidad (en el idioma activo).
  const bySkill = useMemo(() => {
    const map = new Map<string, typeof problemTemplates>();
    for (const tpl of problemTemplates) {
      const skill = tpl.skill[locale];
      const list = map.get(skill) ?? [];
      list.push(tpl);
      map.set(skill, list);
    }
    return [...map.entries()];
  }, [locale]);

  const levels: { id: Difficulty; label: string }[] = [
    { id: 'facil', label: t('infinite.easy') },
    { id: 'media', label: t('infinite.medium') },
    { id: 'dificil', label: t('infinite.hard') },
  ];

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-coral text-white">
          <InfinityIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            {t('home.infiniteTitle')}
          </h1>
          <p className="text-sm text-ink/60">{t('infinite.subtitle')}</p>
        </div>
      </header>

      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold text-ink/60">
          {t('infinite.difficulty')}
        </p>
        <div className="flex gap-2">
          {levels.map((l) => (
            <button
              key={l.id}
              onClick={() => onDifficulty(l.id)}
              className={`rounded-full px-4 py-2 font-display text-sm font-bold shadow-soft transition-colors ${
                difficulty === l.id
                  ? 'bg-turquoise text-white'
                  : 'bg-white text-ink hover:bg-black/5'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {bySkill.map(([skill, list]) => (
        <section key={skill} className="mb-6">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink/50">
            {skill}
          </h2>
          <ol className="space-y-2">
            {list.map((tpl) => (
              <li key={tpl.id}>
                <button
                  onClick={() => onPick(tpl.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-4 text-left shadow-soft transition-shadow hover:shadow-pop"
                >
                  <span className="font-display font-bold">
                    {tpl.title[locale]}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-ink/40" />
                </button>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <div className="mt-8 text-center">
        <Button variant="ghost" onClick={onExit} className="text-sm">
          {t('nav.back')}
        </Button>
      </div>
    </div>
  );
}

function Session({
  templateId,
  difficulty,
  onExit,
}: {
  templateId: string;
  difficulty: Difficulty;
  onExit: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const generator = useRef(
    createProblemGenerator(templateId, { difficulty, locale }),
  ).current;

  const [problem, setProblem] = useState<GeneratedProblem>(() =>
    generator.next(),
  );
  const [solved, setSolved] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const next = () => {
    if (solved) setCorrectCount((n) => n + 1);
    setProblem(generator.next());
    setSolved(false);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-28 pt-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-ink/50">
          <InfinityIcon className="h-4 w-4" /> {t('practice.label')}
        </span>
        <span className="text-sm text-ink/50">
          {t('infinite.solved', { n: correctCount })}
        </span>
      </div>

      <div className="mt-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.section
            key={problem.step.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="rounded-2xl bg-white/70 p-5 shadow-soft"
          >
            <QuestionView
              lessonId={`practica-${templateId}`}
              step={problem.step}
              solved={solved}
              onSolved={() => setSolved(true)}
              persist={false}
            />
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-black/5 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" onClick={onExit} className="text-sm">
            {t('nav.changeType')}
          </Button>
          <Button onClick={next} disabled={!solved}>
            {randomCopy.continue()}
          </Button>
        </div>
      </div>
    </div>
  );
}
