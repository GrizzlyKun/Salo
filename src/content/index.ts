import {
  lessonSchema,
  courseSchema,
  isQuestion,
  type Lesson,
  type Course,
  type QuestionStep,
} from '../engine/schema';
import { hasProblemTemplate } from '../engine/generate';
import { useLocale, type Locale } from '../i18n/i18n';

/**
 * Carga y valida el contenido en tiempo de build, por idioma.
 *
 * El español vive en `content/lessons/*.json` y `content/courses/*.json`.
 * El inglés (opcional) en `content/lessons/en/*.json` y `content/courses/en/*.json`.
 * Si una lección/curso no tiene versión en inglés, se usa la española como
 * fallback: la app nunca queda con huecos.
 */
function parseLessons(mods: Record<string, unknown>): Lesson[] {
  return Object.entries(mods)
    .map(([path, mod]) => {
      const raw = (mod as { default: unknown }).default;
      const result = lessonSchema.safeParse(raw);
      if (!result.success) {
        throw new Error(
          `Lección inválida en ${path}:\n${result.error.toString()}`,
        );
      }
      return result.data;
    })
    .sort((a, b) => a.order - b.order);
}

function parseCourses(mods: Record<string, unknown>): Course[] {
  return Object.entries(mods).map(([path, mod]) => {
    const raw = (mod as { default: unknown }).default;
    const result = courseSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(`Curso inválido en ${path}:\n${result.error.toString()}`);
    }
    return result.data;
  });
}

const esLessons = parseLessons(
  import.meta.glob('./lessons/*.json', { eager: true }),
);
const enLessonsRaw = parseLessons(
  import.meta.glob('./lessons/en/*.json', { eager: true }),
);
const esCourses = parseCourses(
  import.meta.glob('./courses/*.json', { eager: true }),
);
const enCoursesRaw = parseCourses(
  import.meta.glob('./courses/en/*.json', { eager: true }),
);

// Completa el inglés con fallback al español por id.
const enLessonById = new Map(enLessonsRaw.map((l) => [l.id, l]));
const enLessons = esLessons.map((l) => enLessonById.get(l.id) ?? l);
const enCourseById = new Map(enCoursesRaw.map((c) => [c.id, c]));
const enCourses = esCourses.map((c) => enCourseById.get(c.id) ?? c);

const lessonsByLocale: Record<Locale, Lesson[]> = {
  es: esLessons,
  en: enLessons,
};
const coursesByLocale: Record<Locale, Course[]> = {
  es: esCourses.slice().sort(byTitle),
  en: enCourses.slice().sort(byTitle),
};

function byTitle(a: Course, b: Course): number {
  return a.title.localeCompare(b.title);
}

/* --- Validaciones cruzadas (fallan el build si algo no cuadra) --- */

// Cada lección debe pertenecer a algún curso; cada curso referencia lecciones
// existentes; cada templateId debe existir. (Basta comprobar el español, que es
// la fuente canónica de estructura; el inglés reusa los mismos ids.)
{
  const lessonIds = new Set(esLessons.map((l) => l.id));
  const referenced = new Set<string>();
  for (const course of esCourses) {
    for (const unit of course.units) {
      for (const id of unit.lessonIds) {
        if (!lessonIds.has(id)) {
          throw new Error(`Curso "${course.id}" referencia lección inexistente "${id}"`);
        }
        referenced.add(id);
      }
    }
  }
  for (const lesson of esLessons) {
    if (!referenced.has(lesson.id)) {
      throw new Error(`Lección huérfana (sin curso): "${lesson.id}"`);
    }
    for (const step of lesson.steps) {
      if (isQuestion(step) && step.templateId && !hasProblemTemplate(step.templateId)) {
        throw new Error(
          `Lección "${lesson.id}", pregunta "${step.id}": templateId desconocido "${step.templateId}"`,
        );
      }
    }
  }
}

/* --- Índice de preguntas por idioma (para el modo práctica) --- */

export interface LocatedQuestion {
  lessonId: string;
  lessonTitle: string;
  step: QuestionStep;
}

function buildQuestionIndex(lessons: Lesson[]): Map<string, LocatedQuestion> {
  const index = new Map<string, LocatedQuestion>();
  for (const lesson of lessons) {
    for (const step of lesson.steps) {
      if (isQuestion(step)) {
        index.set(step.id, {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          step,
        });
      }
    }
  }
  return index;
}

const questionIndexByLocale: Record<Locale, Map<string, LocatedQuestion>> = {
  es: buildQuestionIndex(esLessons),
  en: buildQuestionIndex(enLessons),
};

/* --- API por idioma --- */

export function courseOrder(course: Course): string[] {
  return course.units.flatMap((u) => u.lessonIds);
}

export function getCourses(locale: Locale): Course[] {
  return coursesByLocale[locale];
}

export function getLesson(locale: Locale, id: string): Lesson | undefined {
  return lessonsByLocale[locale].find((l) => l.id === id);
}

export function findQuestion(
  locale: Locale,
  stepId: string,
): LocatedQuestion | undefined {
  return questionIndexByLocale[locale].get(stepId);
}

export function lessonCount(): number {
  return esLessons.length;
}

/** Helpers ligados al idioma activo, para componentes. */
export function useContent() {
  const { locale } = useLocale();
  return {
    locale,
    courses: getCourses(locale),
    getLesson: (id: string) => getLesson(locale, id),
    findQuestion: (id: string) => findQuestion(locale, id),
    lessonCount: lessonCount(),
  };
}
