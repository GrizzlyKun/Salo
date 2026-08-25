import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store de progreso y de la lección activa.
 *
 * La firma pública se mantiene estable aunque más adelante migremos a un
 * backend (decisión 2026-08). El log de intentos alimenta el modo práctica y,
 * en el futuro, al tutor socrático (Módulo 4).
 */

export interface Attempt {
  lessonId: string;
  stepId: string;
  /** Respuesta cruda emitida por la UI. */
  answer: string;
  correct: boolean;
  hintsUsed: number;
  /** Tiempo empleado en el step, en ms. */
  timeMs: number;
  at: number;
}

interface AnsweredState {
  answer: string;
  correct: boolean;
  hintsUsed: number;
}

interface StreakState {
  count: number;
  /** Día ISO (YYYY-MM-DD) de la última actividad. */
  lastActiveDay: string | null;
}

/** Agenda de repaso de una pregunta fallada (repetición espaciada Leitner). */
export interface ReviewState {
  /** Caja Leitner: sube al acertar en práctica, vuelve a 0 al fallar. */
  box: number;
  /** Momento (ms epoch) a partir del cual la pregunta vuelve a tocar. */
  dueAt: number;
}

const MAX_ATTEMPTS_LOGGED = 200;
const DAY_MS = 86_400_000;
/** Intervalo hasta el próximo repaso según la caja alcanzada (ms). */
const LEITNER_INTERVALS_MS = [0, 1 * DAY_MS, 3 * DAY_MS, 7 * DAY_MS];
/** Al llegar a esta caja la pregunta se da por dominada y sale del repaso. */
const GRADUATE_BOX = LEITNER_INTERVALS_MS.length;

/**
 * Transición Leitner pura. Devuelve la nueva agenda de una pregunta, o `null`
 * si debe salir del repaso (nunca fallada, o ya dominada).
 *  · fallo   → caja 0, vence ya
 *  · acierto de pregunta agendada → sube de caja y se aleja en el tiempo
 *  · acierto de pregunta no agendada, o que se gradúa → fuera del repaso
 */
export function nextReview(
  current: ReviewState | undefined,
  correct: boolean,
  now: number = Date.now(),
): ReviewState | null {
  if (!correct) return { box: 0, dueAt: now };
  if (!current) return null;
  const nextBox = current.box + 1;
  if (nextBox >= GRADUATE_BOX) return null;
  return { box: nextBox, dueAt: now + LEITNER_INTERVALS_MS[nextBox]! };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b) - Date.parse(a);
  return Math.round(ms / 86_400_000);
}

interface LessonState {
  /* --- Progreso persistente --- */
  xp: number;
  completedLessonIds: string[];
  streak: StreakState;
  /** Agenda de repaso por id de pregunta (repetición espaciada). */
  reviews: Record<string, ReviewState>;
  attempts: Attempt[];

  /* --- Lección activa (efímera) --- */
  activeLessonId: string | null;
  completedStepIds: string[];
  answered: Record<string, AnsweredState>;

  /* --- Acciones --- */
  startLesson: (lessonId: string) => void;
  completeStep: (stepId: string) => void;
  recordAnswer: (input: {
    lessonId: string;
    stepId: string;
    answer: string;
    correct: boolean;
    hintsUsed: number;
    timeMs: number;
  }) => void;
  completeLesson: (lessonId: string, xp: number) => void;
  clearProgress: () => void;
}

export const useLessonStore = create<LessonState>()(
  persist(
    (set) => ({
      xp: 0,
      completedLessonIds: [],
      streak: { count: 0, lastActiveDay: null },
      reviews: {},
      attempts: [],

      activeLessonId: null,
      completedStepIds: [],
      answered: {},

      startLesson: (lessonId) =>
        set({
          activeLessonId: lessonId,
          completedStepIds: [],
          answered: {},
        }),

      completeStep: (stepId) =>
        set((s) =>
          s.completedStepIds.includes(stepId)
            ? s
            : { completedStepIds: [...s.completedStepIds, stepId] },
        ),

      recordAnswer: ({ lessonId, stepId, answer, correct, hintsUsed, timeMs }) =>
        set((s) => {
          const now = Date.now();
          const attempt: Attempt = {
            lessonId,
            stepId,
            answer,
            correct,
            hintsUsed,
            timeMs,
            at: now,
          };

          // Repetición espaciada (Leitner), ver `nextReview`.
          const reviews = { ...s.reviews };
          const updated = nextReview(reviews[stepId], correct, now);
          if (updated) reviews[stepId] = updated;
          else delete reviews[stepId];

          return {
            answered: {
              ...s.answered,
              [stepId]: { answer, correct, hintsUsed },
            },
            attempts: [attempt, ...s.attempts].slice(0, MAX_ATTEMPTS_LOGGED),
            reviews,
          };
        }),

      completeLesson: (lessonId, xp) =>
        set((s) => {
          const alreadyDone = s.completedLessonIds.includes(lessonId);
          const day = today();
          const prev = s.streak.lastActiveDay;

          let count = s.streak.count;
          if (prev === null) count = 1;
          else if (prev !== day) {
            count = daysBetween(prev, day) === 1 ? count + 1 : 1;
          }

          return {
            xp: s.xp + (alreadyDone ? 0 : xp),
            completedLessonIds: alreadyDone
              ? s.completedLessonIds
              : [...s.completedLessonIds, lessonId],
            streak: { count, lastActiveDay: day },
          };
        }),

      clearProgress: () =>
        set({
          xp: 0,
          completedLessonIds: [],
          streak: { count: 0, lastActiveDay: null },
          reviews: {},
          attempts: [],
          activeLessonId: null,
          completedStepIds: [],
          answered: {},
        }),
    }),
    {
      name: 'lumen-progress',
      version: 2,
      // La lección activa es efímera: no se persiste.
      partialize: (s) => ({
        xp: s.xp,
        completedLessonIds: s.completedLessonIds,
        streak: s.streak,
        reviews: s.reviews,
        attempts: s.attempts,
      }),
      // v1 guardaba `failedQuestionIds: string[]`; se convierte a agenda de
      // repaso con todas las falladas vencidas (dueAt 0 = tocan ya).
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2) {
          const failed = (state.failedQuestionIds as string[] | undefined) ?? [];
          const reviews: Record<string, ReviewState> = {};
          for (const id of failed) reviews[id] = { box: 0, dueAt: 0 };
          state.reviews = reviews;
          delete state.failedQuestionIds;
        }
        return state as unknown as LessonState;
      },
    },
  ),
);

/**
 * Ids de preguntas que TOCA repasar ahora (dueAt vencido), de la más antigua a
 * la más reciente. Base del modo práctica.
 */
export function selectDuePractice(
  state: Pick<LessonState, 'reviews'>,
  now: number = Date.now(),
): string[] {
  return Object.entries(state.reviews)
    .filter(([, r]) => r.dueAt <= now)
    .sort((a, b) => a[1].dueAt - b[1].dueAt)
    .map(([id]) => id);
}
