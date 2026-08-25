import { evaluate } from './math';
import type { QuestionStep } from './schema';

/**
 * Validación de respuestas 100% DETERMINISTA.
 *
 * Regla de arquitectura: las respuestas NUNCA se validan con un LLM. Aquí se
 * comparan de forma exacta o por equivalencia algebraica con mathjs.
 */

export interface CheckResult {
  correct: boolean;
  /** Motivo legible para depuración/telemetría, no para el usuario. */
  reason?: string;
}

/** Evalúa una expresión a número; devuelve null si no es evaluable. */
function toNumber(expr: string): number | null {
  try {
    const value = evaluate(expr);
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * ¿Son `a` y `b` equivalentes como números? Compara por evaluación numérica
 * con una tolerancia (absoluta o relativa para magnitudes grandes).
 */
export function numericallyEqual(
  a: string,
  b: string,
  tolerance = 0,
): boolean {
  const na = toNumber(a);
  const nb = toNumber(b);
  if (na === null || nb === null) return false;
  const diff = Math.abs(na - nb);
  const scale = Math.max(1, Math.abs(na), Math.abs(nb));
  const eps = Math.max(tolerance, 1e-9 * scale);
  return diff <= eps;
}

/** Normaliza texto para comparaciones exactas (trim + minúsculas). */
function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Comprueba la respuesta del usuario contra un step de pregunta.
 * `answer` es siempre lo que emite la UI:
 *  - multiple-choice → id de la opción elegida
 *  - numeric-input  → texto tal cual escribió el usuario
 *  - manipulative   → cadena emitida por el widget
 */
export function checkAnswer(step: QuestionStep, answer: string): CheckResult {
  switch (step.variant) {
    case 'multiple-choice': {
      const correct = answer === step.answerId;
      return { correct, reason: correct ? undefined : 'opción distinta' };
    }
    case 'numeric-input': {
      const trimmed = answer.trim();
      if (trimmed === '') return { correct: false, reason: 'vacío' };
      const correct = numericallyEqual(trimmed, step.answer, step.tolerance);
      return { correct, reason: correct ? undefined : 'valor distinto' };
    }
    case 'manipulative': {
      const correct = normalize(answer) === normalize(step.answer);
      return { correct, reason: correct ? undefined : 'estado distinto' };
    }
  }
}
