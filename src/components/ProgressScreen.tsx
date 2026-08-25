import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Star, Target, BookCheck, Repeat } from 'lucide-react';
import { useContent } from '../content';
import {
  useLessonStore,
  selectDuePractice,
} from '../engine/useLessonStore';
import { Mascot } from '../design-system/Mascot';
import { Button } from './ui/Button';
import { useT } from '../i18n/i18n';

/**
 * Pantalla de progreso: racha, XP, avance del curso, precisión y estado del
 * repaso espaciado. Sin IA ni cálculos pesados — todo sale del store local.
 */
export function ProgressScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { lessonCount } = useContent();
  const xp = useLessonStore((s) => s.xp);
  const streak = useLessonStore((s) => s.streak);
  const completed = useLessonStore((s) => s.completedLessonIds);
  const attempts = useLessonStore((s) => s.attempts);
  const reviews = useLessonStore((s) => s.reviews);
  const dueToday = useLessonStore((s) => selectDuePractice(s).length);

  const totalLessons = lessonCount;
  const doneLessons = completed.length;
  const lessonPct = totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0;

  const answered = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const accuracy = answered ? Math.round((correct / answered) * 100) : null;

  const inReview = Object.keys(reviews).length;
  const activeToday = streak.lastActiveDay === todayISO();

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-8">
      <header className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={onBack}
          aria-label={t('nav.back')}
          className="px-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-2xl font-extrabold">
          {t('progress.title')}
        </h1>
      </header>

      {/* Racha destacada */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 flex items-center gap-4 rounded-2xl bg-white p-5 shadow-soft"
      >
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-honey-soft">
          <Flame className="h-8 w-8 text-honey-deep" />
        </div>
        <div className="flex-1">
          <p className="font-display text-3xl font-extrabold">
            {streak.count}{' '}
            <span className="text-lg font-bold text-ink/60">
              {t('progress.days')}
            </span>
          </p>
          <p className="text-sm text-ink/60">
            {streak.count === 0
              ? t('progress.streakZero')
              : activeToday
                ? t('progress.streakActive')
                : t('progress.streakReturn')}
          </p>
        </div>
      </motion.section>

      {/* Métricas */}
      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Star className="h-5 w-5" />}
          value={String(xp)}
          label={t('progress.xpTotal')}
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          value={accuracy === null ? '—' : `${accuracy}%`}
          label={t('progress.accuracy')}
        />
        <StatCard
          icon={<Repeat className="h-5 w-5" />}
          value={String(dueToday)}
          label={t('progress.reviewsToday')}
        />
      </section>

      {/* Avance del curso */}
      <section className="mt-4 rounded-2xl bg-white p-5 shadow-soft">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 font-display font-bold">
            <BookCheck className="h-5 w-5 text-turquoise-deep" />
            {t('progress.lessons')}
          </span>
          <span className="text-sm text-ink/60">
            {doneLessons} / {totalLessons}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-black/5">
          <motion.div
            className="h-full rounded-full bg-turquoise"
            initial={{ width: 0 }}
            animate={{ width: `${lessonPct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        <p className="mt-2 text-sm text-ink/60">
          {inReview === 0
            ? t('progress.inReviewNone')
            : t('progress.inReview', { n: inReview })}
        </p>
      </section>

      {answered === 0 && (
        <div className="mt-8 flex flex-col items-center gap-2 text-center text-ink/50">
          <Mascot mood="encouraging" size={90} />
          <p>{t('progress.noAnswers')}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-soft">
      <div className="mx-auto mb-1 grid h-9 w-9 place-items-center rounded-full bg-cream text-coral">
        {icon}
      </div>
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-ink/60">{label}</p>
    </div>
  );
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
