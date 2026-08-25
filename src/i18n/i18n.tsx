/* Este módulo agrupa a propósito el provider, los hooks y las utilidades i18n.
   La regla solo afecta al hot-reload (DX), no al comportamiento. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Internacionalización ligera (ES/EN), sin librerías: diccionario incorporado
 * + botón. Funciona 100% offline. `activeLocale` es un espejo a nivel de módulo
 * para usos no reactivos (p. ej. el microcopy aleatorio en manejadores).
 */
export type Locale = 'es' | 'en';

export const APP_NAME = 'Salo';
const STORAGE_KEY = 'salo-locale';

function detectInitial(): Locale {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  }
  if (
    typeof navigator !== 'undefined' &&
    navigator.language.toLowerCase().startsWith('es')
  ) {
    return 'es';
  }
  return 'en';
}

export let activeLocale: Locale = detectInitial();

/* --------------------------- diccionario UI --------------------------- */

const ui: Record<Locale, Record<string, string>> = {
  es: {
    'app.tagline': 'Aprende resolviendo, no mirando.',
    'nav.exit': 'Salir',
    'nav.back': 'Volver',
    'nav.finish': '¡Terminar!',
    'nav.changeType': 'Cambiar tipo',
    'home.practiceTitle': 'Modo práctica',
    'home.practiceNone': 'Sin preguntas pendientes — ¡vas al día!',
    'home.practicePending': 'Repasa {n} pregunta(s) que fallaste.',
    'home.infiniteTitle': 'Práctica infinita',
    'home.infiniteDesc': 'Ejercicios generados sin fin, siempre distintos.',
    'home.reset': 'Reiniciar progreso',
    'home.resetConfirm': '¿Borrar todo tu progreso?',
    'home.viewProgress': 'Ver tu progreso',
    'home.coursesAria': 'Cursos',
    'loading.lesson': 'Preparando la lección…',
    'loading.practice': 'Preparando el repaso…',
    'loading.infinite': 'Preparando ejercicios…',
    'lesson.retry': 'Sin prisa — inténtalo otra vez.',
    'lesson.tutorAsk': 'Pedir ayuda al tutor',
    'lesson.tutorThinking': 'Pensando…',
    'lesson.tutorError':
      'El tutor no está disponible ahora. ¡Sigue intentándolo con las pistas! 💛',
    'lesson.answerPlaceholder': 'Tu respuesta',
    'lesson.answerAria': 'Respuesta numérica',
    'complete.xpEarned': 'XP ganado',
    'complete.xpTotal': 'XP total',
    'complete.streak': 'Racha',
    'practice.label': 'Práctica',
    'practice.from': 'De:',
    'practice.variant': 'variante',
    'practice.emptyTitle': 'Nada que repasar',
    'practice.emptyDesc':
      'Cuando falles alguna pregunta aparecerá aquí para repasarla. ¡Vas al día! 🎉',
    'practice.doneReviewed': 'Repasaste {n} pregunta(s).',
    'infinite.subtitle':
      'Ejercicios sin fin, siempre distintos. Sin prisa y sin puntos.',
    'infinite.difficulty': 'Dificultad',
    'infinite.easy': 'Fácil',
    'infinite.medium': 'Media',
    'infinite.hard': 'Difícil',
    'infinite.solved': '{n} resueltos',
    'progress.title': 'Tu progreso',
    'progress.days': 'día(s)',
    'progress.streakZero': 'Completa una lección para empezar tu racha.',
    'progress.streakActive': '¡Racha activa hoy! 🔥',
    'progress.streakReturn': 'Vuelve hoy para mantenerla viva.',
    'progress.xpTotal': 'XP total',
    'progress.accuracy': 'Precisión',
    'progress.reviewsToday': 'Repasos hoy',
    'progress.lessons': 'Lecciones',
    'progress.inReviewNone': 'Nada en repaso ahora mismo.',
    'progress.inReview': '{n} pregunta(s) en tu ciclo de repaso.',
    'progress.noAnswers':
      'Aún no has respondido preguntas. ¡Empieza una lección!',
  },
  en: {
    'app.tagline': 'Learn by solving, not watching.',
    'nav.exit': 'Exit',
    'nav.back': 'Back',
    'nav.finish': 'Finish!',
    'nav.changeType': 'Change type',
    'home.practiceTitle': 'Practice mode',
    'home.practiceNone': "No pending questions — you're all caught up!",
    'home.practicePending': 'Review {n} question(s) you missed.',
    'home.infiniteTitle': 'Endless practice',
    'home.infiniteDesc': 'Endlessly generated exercises, always different.',
    'home.reset': 'Reset progress',
    'home.resetConfirm': 'Erase all your progress?',
    'home.viewProgress': 'View your progress',
    'home.coursesAria': 'Courses',
    'loading.lesson': 'Preparing the lesson…',
    'loading.practice': 'Preparing your review…',
    'loading.infinite': 'Preparing exercises…',
    'lesson.retry': 'No rush — try again.',
    'lesson.tutorAsk': 'Ask the tutor',
    'lesson.tutorThinking': 'Thinking…',
    'lesson.tutorError':
      "The tutor isn't available right now. Keep going with the hints! 💛",
    'lesson.answerPlaceholder': 'Your answer',
    'lesson.answerAria': 'Numeric answer',
    'complete.xpEarned': 'XP earned',
    'complete.xpTotal': 'Total XP',
    'complete.streak': 'Streak',
    'practice.label': 'Practice',
    'practice.from': 'From:',
    'practice.variant': 'variant',
    'practice.emptyTitle': 'Nothing to review',
    'practice.emptyDesc':
      "When you miss a question it'll show up here to review. You're all caught up! 🎉",
    'practice.doneReviewed': 'You reviewed {n} question(s).',
    'infinite.subtitle':
      'Endless exercises, always different. No rush, no points.',
    'infinite.difficulty': 'Difficulty',
    'infinite.easy': 'Easy',
    'infinite.medium': 'Medium',
    'infinite.hard': 'Hard',
    'infinite.solved': '{n} solved',
    'progress.title': 'Your progress',
    'progress.days': 'day(s)',
    'progress.streakZero': 'Complete a lesson to start your streak.',
    'progress.streakActive': 'Streak active today! 🔥',
    'progress.streakReturn': 'Come back today to keep it alive.',
    'progress.xpTotal': 'Total XP',
    'progress.accuracy': 'Accuracy',
    'progress.reviewsToday': 'Reviews today',
    'progress.lessons': 'Lessons',
    'progress.inReviewNone': 'Nothing in review right now.',
    'progress.inReview': '{n} question(s) in your review cycle.',
    'progress.noAnswers': "You haven't answered any questions yet. Start a lesson!",
  },
};

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let s = ui[locale][key] ?? ui.es[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}

/* --------------------------- microcopy cálido ------------------------- */

const microcopy: Record<Locale, Record<string, readonly string[]>> = {
  es: {
    correct: ['¡Exacto! 🎉', '¡Eso es! ✨', '¡Lo tienes! 💪', '¡Brillante! 🌟', '¡Perfecto! 👏'],
    incorrect: ['¡Casi! Mira esto de nuevo 👀', 'No del todo, pero vas bien 🤔', 'Uy, casi. Probemos otra vez 🌱', 'Buen intento — afinemos la idea 🔍'],
    encourage: ['Tú puedes con esto 💛', 'Un paso a la vez 🐢', 'Piensa despacio, no hay prisa ✨'],
    hintButton: ['¿Una pista?', 'Dame una pista', 'Ayúdame un poco'],
    continue: ['Continuar', 'Siguiente', 'Vamos'],
    check: ['Comprobar', 'Revisar'],
    lessonComplete: ['¡Lección completada! 🎊', '¡Lo lograste! 🏆', '¡Nivel superado! ⭐'],
  },
  en: {
    correct: ['Exactly! 🎉', "That's it! ✨", 'You got it! 💪', 'Brilliant! 🌟', 'Perfect! 👏'],
    incorrect: ['So close! Take another look 👀', 'Not quite, but you’re on track 🤔', 'Almost — let’s try again 🌱', 'Nice try — let’s sharpen it 🔍'],
    encourage: ['You can do this 💛', 'One step at a time 🐢', 'Think slowly, no rush ✨'],
    hintButton: ['A hint?', 'Give me a hint', 'Help me a little'],
    continue: ['Continue', 'Next', "Let's go"],
    check: ['Check', 'Review'],
    lessonComplete: ['Lesson complete! 🎊', 'You did it! 🏆', 'Level cleared! ⭐'],
  },
};

const pick = (xs: readonly string[]): string =>
  xs[Math.floor(Math.random() * xs.length)]!;

/** Microcopy aleatorio en el idioma activo (API estable para los componentes). */
export const randomCopy = {
  correct: () => pick(microcopy[activeLocale].correct!),
  incorrect: () => pick(microcopy[activeLocale].incorrect!),
  encourage: () => pick(microcopy[activeLocale].encourage!),
  hintButton: () => pick(microcopy[activeLocale].hintButton!),
  continue: () => pick(microcopy[activeLocale].continue!),
  check: () => pick(microcopy[activeLocale].check!),
  lessonComplete: () => pick(microcopy[activeLocale].lessonComplete!),
};

/* ------------------------------ contexto ------------------------------ */

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
}
const LocaleContext = createContext<LocaleCtx>({
  locale: activeLocale,
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(activeLocale);

  const setLocale = (l: Locale) => {
    activeLocale = l;
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* almacenamiento no disponible */
    }
    setLocaleState(l);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleCtx {
  return useContext(LocaleContext);
}

/** Devuelve una función `t` ligada al idioma actual (reactiva al cambiarlo). */
export function useT(): (
  key: string,
  vars?: Record<string, string | number>,
) => string {
  const { locale } = useContext(LocaleContext);
  return (key, vars) => translate(locale, key, vars);
}
