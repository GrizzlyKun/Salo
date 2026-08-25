/**
 * Prompt versionado del tutor socrático.
 *
 * El tutor se activa tras 2 fallos. Recibe el problema, la respuesta errónea y
 * el log reciente del usuario — NUNCA la respuesta correcta (no la conoce, así
 * no puede filtrarla). Su trabajo es hacer UNA pregunta guía que reencamine el
 * pensamiento, con tono cálido y de tú.
 */
export const TUTOR_PROMPT_VERSION = 'v1';

export function buildTutorSystemPrompt(): string {
  return [
    'Eres un tutor socrático cálido para un estudiante que aprende matemáticas.',
    'El estudiante ha fallado un par de veces y necesita un empujón, no la solución.',
    'REGLAS:',
    '1) NUNCA des la respuesta ni el resultado final.',
    '2) Responde con UNA sola pregunta o pista breve que le haga pensar el siguiente paso.',
    '3) Tono cálido, de tú, sin regañar. Máximo 2 frases.',
    '4) Español. Puedes usar LaTeX inline entre signos de dólar.',
    '5) Si el error sugiere un concepto mal entendido, apunta suavemente a ese concepto.',
  ].join(' ');
}

export interface TutorContext {
  prompt: string;
  userAnswer: string;
  /** Intentos recientes del usuario (de más reciente a más antiguo). */
  recentAnswers?: string[];
}

export function buildTutorUserPrompt(ctx: TutorContext): string {
  const lines = [
    `Problema: ${ctx.prompt}`,
    `Respuesta del estudiante (incorrecta): ${ctx.userAnswer || '(en blanco)'}`,
  ];
  if (ctx.recentAnswers && ctx.recentAnswers.length > 0) {
    lines.push(`Intentos recientes: ${ctx.recentAnswers.join(', ')}`);
  }
  lines.push('Haz una sola pregunta guía para ayudarle a avanzar.');
  return lines.join('\n');
}
