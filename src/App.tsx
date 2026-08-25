import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Flame,
  Infinity as InfinityIcon,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useContent } from './content';
import type { Lesson } from './engine/schema';
import { useLessonStore, selectDuePractice } from './engine/useLessonStore';
import { Mascot } from './design-system/Mascot';
import { isMuted, setMuted } from './design-system/sound';
import { Button } from './components/ui/Button';
import { CourseMap } from './components/CourseMap';
import { ProgressScreen } from './components/ProgressScreen';
import { Splash } from './components/Splash';
import { APP_NAME, useLocale, useT } from './i18n/i18n';

// El reproductor y la práctica (con ellos mathjs + KaTeX) se cargan solo al
// entrar: el mapa de curso inicial no los necesita.
const LessonPlayer = lazy(() =>
  import('./engine/LessonPlayer').then((m) => ({ default: m.LessonPlayer })),
);
const PracticeSession = lazy(() =>
  import('./engine/PracticeSession').then((m) => ({
    default: m.PracticeSession,
  })),
);
const InfinitePractice = lazy(() =>
  import('./engine/InfinitePractice').then((m) => ({
    default: m.InfinitePractice,
  })),
);

type View =
  | { kind: 'home' }
  | { kind: 'lesson'; id: string }
  | { kind: 'practice' }
  | { kind: 'infinite' }
  | { kind: 'progress' };

/**
 * Raíz de la app: muestra el splash ~2s al abrir y enruta entre el Home (mapa
 * de curso), una lección y los modos de práctica.
 */
export function App() {
  const t = useT();
  const { getLesson } = useContent();
  const [view, setView] = useState<View>({ kind: 'home' });
  const [showSplash, setShowSplash] = useState(true);
  const goHome = () => setView({ kind: 'home' });

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {renderView(view, setView, goHome, t, getLesson)}
      <AnimatePresence>{showSplash && <Splash />}</AnimatePresence>
    </>
  );
}

function renderView(
  view: View,
  setView: (v: View) => void,
  goHome: () => void,
  t: (key: string, vars?: Record<string, string | number>) => string,
  getLesson: (id: string) => Lesson | undefined,
) {
  if (view.kind === 'lesson') {
    const lesson = getLesson(view.id);
    if (lesson) {
      return (
        <Suspense fallback={<Loading label={t('loading.lesson')} />}>
          <LessonPlayer lesson={lesson} onExit={goHome} />
        </Suspense>
      );
    }
  }

  if (view.kind === 'practice') {
    return (
      <Suspense fallback={<Loading label={t('loading.practice')} />}>
        <PracticeSession onExit={goHome} />
      </Suspense>
    );
  }

  if (view.kind === 'infinite') {
    return (
      <Suspense fallback={<Loading label={t('loading.infinite')} />}>
        <InfinitePractice onExit={goHome} />
      </Suspense>
    );
  }

  if (view.kind === 'progress') {
    return <ProgressScreen onBack={goHome} />;
  }

  return (
    <Home
      onPlay={(id) => setView({ kind: 'lesson', id })}
      onPractice={() => setView({ kind: 'practice' })}
      onInfinite={() => setView({ kind: 'infinite' })}
      onProgress={() => setView({ kind: 'progress' })}
    />
  );
}

function Home({
  onPlay,
  onPractice,
  onInfinite,
  onProgress,
}: {
  onPlay: (id: string) => void;
  onPractice: () => void;
  onInfinite: () => void;
  onProgress: () => void;
}) {
  const t = useT();
  const { courses } = useContent();
  const xp = useLessonStore((s) => s.xp);
  const streak = useLessonStore((s) => s.streak.count);
  const pending = useLessonStore((s) => selectDuePractice(s).length);

  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const activeCourse = courses.find((c) => c.id === courseId) ?? courses[0];

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-8">
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Mascot mood="neutral" size={64} />
          <div>
            <h1 className="font-display text-3xl font-extrabold">{APP_NAME}</h1>
            <p className="text-ink/60">{t('app.tagline')}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <MuteToggle />
            <LangToggle />
          </div>
          <button
            onClick={onProgress}
            aria-label={t('home.viewProgress')}
            className="flex gap-2 rounded-full p-1 transition-transform hover:scale-105"
          >
            <Pill icon={<Star className="h-4 w-4" />} value={`${xp} XP`} />
            <Pill icon={<Flame className="h-4 w-4" />} value={`${streak}`} />
          </button>
        </div>
      </header>

      <PracticeCard pending={pending} onPractice={onPractice} />

      <button
        onClick={onInfinite}
        className="mt-3 flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-soft transition-shadow hover:shadow-pop"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-coral text-white">
          <InfinityIcon className="h-6 w-6" />
        </span>
        <span className="flex-1">
          <span className="block font-display text-lg font-bold">
            {t('home.infiniteTitle')}
          </span>
          <span className="block text-sm text-ink/60">
            {t('home.infiniteDesc')}
          </span>
        </span>
      </button>

      {courses.length > 1 && (
        <nav className="mt-8 flex flex-wrap gap-2" aria-label={t('home.coursesAria')}>
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setCourseId(c.id)}
              className={`rounded-full px-4 py-2 font-display text-sm font-bold shadow-soft transition-colors ${
                c.id === activeCourse?.id
                  ? 'bg-coral text-white'
                  : 'bg-white text-ink hover:bg-black/5'
              }`}
            >
              {c.title}
            </button>
          ))}
        </nav>
      )}

      <main className="mt-8">
        {activeCourse && <CourseMap course={activeCourse} onPlay={onPlay} />}
      </main>

      <ResetButton />
    </div>
  );
}

function MuteToggle() {
  const t = useT();
  const [muted, setLocalMuted] = useState(isMuted());
  return (
    <button
      onClick={() => {
        const next = !muted;
        setMuted(next);
        setLocalMuted(next);
      }}
      aria-label={muted ? t('sound.unmute') : t('sound.mute')}
      className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink/60 shadow-soft transition-colors hover:text-coral"
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}

function LangToggle() {
  const { locale, setLocale } = useLocale();
  const langs: ('es' | 'en')[] = ['es', 'en'];
  return (
    <div className="inline-flex overflow-hidden rounded-full bg-white shadow-soft">
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`px-3 py-1 text-xs font-bold transition-colors ${
            locale === l ? 'bg-turquoise text-white' : 'text-ink/60 hover:bg-black/5'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function PracticeCard({
  pending,
  onPractice,
}: {
  pending: number;
  onPractice: () => void;
}) {
  const t = useT();
  const none = pending === 0;
  return (
    <button
      onClick={onPractice}
      disabled={none}
      className={`mt-8 flex w-full items-center gap-4 rounded-2xl p-4 text-left shadow-soft transition-shadow ${
        none ? 'cursor-not-allowed bg-white/50 opacity-70' : 'bg-white hover:shadow-pop'
      }`}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-turquoise text-white">
        <Dumbbell className="h-6 w-6" />
      </span>
      <span className="flex-1">
        <span className="block font-display text-lg font-bold">
          {t('home.practiceTitle')}
        </span>
        <span className="block text-sm text-ink/60">
          {none ? t('home.practiceNone') : t('home.practicePending', { n: pending })}
        </span>
      </span>
    </button>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-3 text-ink/50">
        <Mascot mood="thinking" size={80} />
        <p className="animate-pulse font-display">{label}</p>
      </div>
    </div>
  );
}

function Pill({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-display font-bold shadow-soft">
      <span className="text-honey-deep">{icon}</span>
      {value}
    </span>
  );
}

function ResetButton() {
  const t = useT();
  const clearProgress = useLessonStore((s) => s.clearProgress);
  return (
    <div className="mt-10 text-center">
      <Button
        variant="ghost"
        className="text-xs text-ink/40"
        onClick={() => {
          if (confirm(t('home.resetConfirm'))) clearProgress();
        }}
      >
        {t('home.reset')}
      </Button>
    </div>
  );
}
