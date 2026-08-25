import { z } from 'zod';
import { numericInputSchema, type NumericInputStep } from '../engine/schema';
import { getAIClient, type AIClient } from './client';
import {
  buildVariationSystemPrompt,
  buildVariationUserPrompt,
} from './prompts/generateVariation';

/**
 * Generador de variaciones de problemas.
 *
 * Cada plantilla define: un esquema Zod de `params` (con rangos), cómo calcular
 * la respuesta a partir de los params (SOLO código) y cómo redactar el
 * enunciado por defecto. La IA, si está disponible, propone params y una
 * redacción nueva; el código valida y calcula la respuesta. Sin IA, los params
 * se generan localmente: las variaciones también funcionan offline.
 */
export interface ProblemTemplate<P> {
  id: string;
  title: string;
  paramsSchema: z.ZodType<P>;
  /** Instrucciones para que la IA proponga params + enunciado. */
  brief: string;
  /** Respuesta determinista (expresión evaluable por mathjs). */
  computeAnswer: (params: P) => string;
  /** Enunciado por defecto (usado offline o si la IA no da uno válido). */
  buildPrompt: (params: P) => string;
  /** Genera params válidos localmente (sin IA). */
  randomParams: () => P;
  feedback: (params: P) => { correct: string; incorrect: string };
  hints: (params: P) => string[];
  tolerance?: number;
}

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const differenceOfSquares: ProblemTemplate<{ a: number; b: number }> = {
  id: 'difference-of-squares',
  title: 'Diferencia de cuadrados (cálculo)',
  paramsSchema: z
    .object({
      a: z.number().int().min(2).max(20),
      b: z.number().int().min(1).max(19),
    })
    .refine((p) => p.a > p.b, { message: 'a debe ser mayor que b' }),
  brief:
    'Rangos: a entero de 6 a 20, b entero de 1 a a-1. El ejercicio pide usar la ' +
    'diferencia de cuadrados para calcular a^2 - b^2. Ejemplo de params: {"a": 12, "b": 5}.',
  computeAnswer: (p) => String(p.a * p.a - p.b * p.b),
  buildPrompt: (p) =>
    `Usa la diferencia de cuadrados para calcular $${p.a}^2 - ${p.b}^2$.`,
  randomParams: () => {
    const a = randInt(6, 20);
    const b = randInt(1, a - 1);
    return { a, b };
  },
  feedback: (p) => ({
    correct: `¡Eso es! $(${p.a}+${p.b})(${p.a}-${p.b}) = ${p.a * p.a - p.b * p.b}$.`,
    incorrect: 'Multiplica la suma por la diferencia: $(a+b)(a-b)$, sin elevar al cuadrado.',
  }),
  hints: (p) => [
    'No eleves al cuadrado; usa $(a+b)(a-b)$.',
    `Aquí $a=${p.a}$ y $b=${p.b}$.`,
  ],
};

const perfectSquareMiddle: ProblemTemplate<{ n: number }> = {
  id: 'perfect-square-middle',
  title: 'Término del medio de un cuadrado',
  paramsSchema: z.object({ n: z.number().int().min(2).max(15) }),
  brief:
    'Rango: n entero de 2 a 15. El ejercicio pide el coeficiente del término del ' +
    'medio (el de x) al desarrollar (x+n)^2. Ejemplo de params: {"n": 7}.',
  computeAnswer: (p) => String(2 * p.n),
  buildPrompt: (p) =>
    `Al desarrollar $(x+${p.n})^2$, ¿cuál es el coeficiente del término del medio (el de $x$)?`,
  randomParams: () => ({ n: randInt(2, 15) }),
  feedback: (p) => ({
    correct: `¡Sí! El término del medio es $2ab = 2\\cdot ${p.n} = ${2 * p.n}$.`,
    incorrect: 'Recuerda $(x+n)^2 = x^2 + 2nx + n^2$: el del medio es $2n$.',
  }),
  hints: (p) => ['Son las dos piezas rectangulares del cuadrado.', `$2 \\cdot ${p.n} = ?$`],
};

// El registro es heterogéneo (cada plantilla tiene su propio tipo de params);
// se type-erasa con `any` a propósito. Las funciones internas siguen tipadas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const templates: Record<string, ProblemTemplate<any>> = {
  [differenceOfSquares.id]: differenceOfSquares,
  [perfectSquareMiddle.id]: perfectSquareMiddle,
};

/** Extrae el primer objeto JSON de un texto (tolera texto o markdown alrededor). */
export function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return undefined;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

function slug(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Ensambla y VALIDA un NumericInputStep a partir de params ya validados. */
export function buildVariationStep<P>(
  template: ProblemTemplate<P>,
  params: P,
  promptText?: string,
): NumericInputStep {
  const candidate = {
    type: 'question' as const,
    id: `gen-${template.id}-${slug()}`,
    variant: 'numeric-input' as const,
    prompt: promptText?.trim() || template.buildPrompt(params),
    answer: template.computeAnswer(params),
    tolerance: template.tolerance ?? 0,
    feedback: template.feedback(params),
    hints: template.hints(params),
  };
  // El resultado pasa por el MISMO esquema que el contenido de autor.
  return numericInputSchema.parse(candidate);
}

/**
 * Genera una variación. Con IA: pide params + enunciado, valida params contra el
 * esquema y reintenta si vienen mal. Sin IA (o si todo falla): genera params
 * localmente. La respuesta SIEMPRE la calcula el código.
 */
export async function generateVariation(
  templateId: string,
  options: { client?: AIClient | null; retries?: number; signal?: AbortSignal } = {},
): Promise<NumericInputStep> {
  const template = templates[templateId];
  if (!template) throw new Error(`Plantilla desconocida: ${templateId}`);

  const client = options.client ?? getAIClient();
  const retries = options.retries ?? 2;

  if (client) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const raw = await client.complete({
          system: buildVariationSystemPrompt(),
          messages: [{ role: 'user', content: buildVariationUserPrompt(template.brief) }],
          maxTokens: 300,
          signal: options.signal,
        });
        const json = extractJson(raw) as
          | { params?: unknown; prompt?: unknown }
          | undefined;
        const parsed = template.paramsSchema.safeParse(json?.params);
        if (parsed.success) {
          const promptText =
            typeof json?.prompt === 'string' ? json.prompt : undefined;
          return buildVariationStep(template, parsed.data, promptText);
        }
      } catch {
        // fallo de red/parseo → siguiente intento o fallback offline
      }
    }
  }

  // Fallback determinista, siempre disponible.
  return buildVariationStep(template, template.randomParams());
}
