import { z } from 'zod';

/**
 * Esquema del contenido de Lumen (fuente de verdad de tipos).
 *
 * Todo el producto es un motor que renderiza contenido declarativo. Las
 * lecciones son DATOS, no código. Este esquema está diseñado para que un LLM
 * pueda generarlo: cada campo lleva `.describe()` y las estructuras son
 * estrictas. Los tipos de TypeScript se derivan con `z.infer` — nunca se
 * duplican a mano.
 */

/* ------------------------------------------------------------------ */
/* Piezas compartidas                                                  */
/* ------------------------------------------------------------------ */

const id = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, 'Usa minúsculas, números y guiones (kebab-case)')
  .describe('Identificador estable en kebab-case, único dentro de la lección');

const richText = z
  .string()
  .min(1)
  .max(500, 'Texto demasiado largo (máx. 500 caracteres): parte la idea en dos steps')
  .describe(
    'Texto breve (≤500 caracteres). Admite LaTeX inline entre signos de dólar, p. ej. "$a^2-b^2$".',
  );

export const feedbackSchema = z
  .object({
    correct: richText.describe(
      'Explicación intuitiva del PORQUÉ está bien (no una fórmula formal).',
    ),
    incorrect: richText.describe(
      'Explicación cálida que reencamina el pensamiento, sin dar la respuesta directa.',
    ),
  })
  .strict();

const hints = z
  .array(richText)
  .default([])
  .describe(
    'Pistas de revelado progresivo, de más sutil a más explícita. Puede ir vacío.',
  );

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

export const expositionStepSchema = z
  .object({
    type: z.literal('exposition'),
    id,
    text: richText.describe('Contenido expositivo breve con LaTeX inline.'),
  })
  .strict()
  .describe('Un fragmento de texto que introduce o conecta ideas.');

export const widgetStepSchema = z
  .object({
    type: z.literal('widget'),
    id,
    widget: z
      .string()
      .min(1)
      .describe('Nombre del widget registrado en el registry.'),
    props: z
      .record(z.unknown())
      .default({})
      .describe('Props que se pasan tal cual al componente del widget.'),
    caption: richText
      .optional()
      .describe('Pie opcional que acompaña al widget.'),
  })
  .strict()
  .describe('Referencia a un widget manipulable, sin pregunta asociada.');

/* --- Variantes de pregunta --- */

const questionBase = {
  type: z.literal('question'),
  id,
  prompt: richText.describe('Enunciado de la pregunta.'),
  feedback: feedbackSchema,
  hints,
  templateId: id
    .optional()
    .describe(
      'Plantilla de generación procedural. Si se indica, el modo práctica ' +
        'ofrece VARIANTES nuevas de esta pregunta en el repaso espaciado.',
    ),
};

export const multipleChoiceSchema = z
  .object({
    ...questionBase,
    variant: z.literal('multiple-choice'),
    choices: z
      .array(
        z
          .object({
            id,
            text: richText.describe('Texto de la opción (admite LaTeX).'),
          })
          .strict(),
      )
      .min(2)
      .describe('Opciones a elegir; al menos dos.'),
    answerId: id.describe('El `id` de la opción correcta.'),
  })
  .strict();

export const numericInputSchema = z
  .object({
    ...questionBase,
    variant: z.literal('numeric-input'),
    answer: z
      .string()
      .min(1)
      .describe(
        'Respuesta correcta como expresión evaluable por mathjs, p. ej. "1/2", "3", "sqrt(2)".',
      ),
    tolerance: z
      .number()
      .nonnegative()
      .default(0)
      .describe('Tolerancia absoluta permitida al comparar numéricamente.'),
    unit: z
      .string()
      .optional()
      .describe('Unidad mostrada junto al campo (solo visual).'),
  })
  .strict();

export const manipulativeSchema = z
  .object({
    ...questionBase,
    variant: z.literal('manipulative'),
    widget: z
      .string()
      .min(1)
      .describe('Widget que captura la interacción y emite la respuesta.'),
    props: z.record(z.unknown()).default({}),
    answer: z
      .string()
      .min(1)
      .describe('Respuesta esperada, comparada de forma determinista.'),
  })
  .strict();

export const questionStepSchema = z
  .discriminatedUnion('variant', [
    multipleChoiceSchema,
    numericInputSchema,
    manipulativeSchema,
  ])
  .superRefine((q, ctx) => {
    // El answerId debe apuntar a una opción real (no capturable por el tipo).
    if (
      q.variant === 'multiple-choice' &&
      !q.choices.some((c) => c.id === q.answerId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'answerId debe coincidir con el id de una de las choices',
        path: ['answerId'],
      });
    }
  })
  .describe('Una pregunta con feedback y pistas; bloquea el avance.');

export const stepSchema = z.union([
  expositionStepSchema,
  widgetStepSchema,
  questionStepSchema,
]);

/* ------------------------------------------------------------------ */
/* Lección                                                             */
/* ------------------------------------------------------------------ */

export const lessonSchema = z
  .object({
    id,
    title: z.string().min(1).describe('Título mostrado de la lección.'),
    unitId: id.describe('Unidad del curso a la que pertenece.'),
    order: z
      .number()
      .int()
      .nonnegative()
      .describe('Posición dentro de la unidad (para el mapa del curso).'),
    xp: z
      .number()
      .int()
      .positive()
      .describe('XP otorgado al completar la lección.'),
    durationMinutes: z
      .number()
      .positive()
      .describe('Duración estimada; objetivo 3-5 min.'),
    summary: z
      .string()
      .optional()
      .describe('Resumen de una línea para el mapa del curso.'),
    steps: z
      .array(stepSchema)
      .min(4)
      .max(14)
      .describe('Secuencia de steps; sesión corta (8-12 recomendado).'),
  })
  .strict()
  .superRefine((lesson, ctx) => {
    const steps = lesson.steps;

    // Densidad de práctica: al menos 1 pregunta por cada 3 steps.
    const questions = steps.filter((s) => s.type === 'question').length;
    const minQuestions = Math.ceil(steps.length / 3);
    if (questions < minQuestions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Faltan preguntas: ${questions}/${minQuestions} (mín. 1 por cada 3 steps). La lección es demasiado pasiva.`,
        path: ['steps'],
      });
    }

    // Nunca más de 2 exposiciones seguidas (evita "muro de texto").
    let run = 0;
    for (let i = 0; i < steps.length; i++) {
      run = steps[i]!.type === 'exposition' ? run + 1 : 0;
      if (run === 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Más de 2 exposiciones consecutivas: intercala interacción.',
          path: ['steps', i],
        });
      }
    }
  });

/* ------------------------------------------------------------------ */
/* Curso                                                               */
/* ------------------------------------------------------------------ */

export const unitSchema = z
  .object({
    id,
    title: z.string().min(1),
    lessonIds: z
      .array(id)
      .min(1)
      .describe('Lecciones de la unidad, en orden de desbloqueo.'),
  })
  .strict();

export const courseSchema = z
  .object({
    id,
    title: z.string().min(1),
    units: z.array(unitSchema).min(1),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Tipos derivados                                                     */
/* ------------------------------------------------------------------ */

export type Feedback = z.infer<typeof feedbackSchema>;
export type ExpositionStep = z.infer<typeof expositionStepSchema>;
export type WidgetStep = z.infer<typeof widgetStepSchema>;
export type MultipleChoiceStep = z.infer<typeof multipleChoiceSchema>;
export type NumericInputStep = z.infer<typeof numericInputSchema>;
export type ManipulativeStep = z.infer<typeof manipulativeSchema>;
export type QuestionStep = z.infer<typeof questionStepSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type Course = z.infer<typeof courseSchema>;

export const isQuestion = (step: Step): step is QuestionStep =>
  step.type === 'question';
