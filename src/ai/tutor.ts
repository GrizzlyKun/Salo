import { getAIClient, type AIClient } from './client';
import {
  buildTutorSystemPrompt,
  buildTutorUserPrompt,
  type TutorContext,
} from './prompts/tutor';

/**
 * Tutor socrático (Módulo 4). Se activa tras 2 fallos. Devuelve UNA pregunta
 * guía; nunca la respuesta. Mejora progresiva: si no hay IA configurada,
 * devuelve `null` y la UI simplemente no ofrece el tutor.
 */
export async function getTutorHint(
  ctx: TutorContext,
  options: { client?: AIClient | null; signal?: AbortSignal } = {},
): Promise<string | null> {
  const client = options.client ?? getAIClient();
  if (!client) return null;

  const text = await client.complete({
    system: buildTutorSystemPrompt(),
    messages: [{ role: 'user', content: buildTutorUserPrompt(ctx) }],
    maxTokens: 200,
    signal: options.signal,
  });
  return text.trim() || null;
}

export type { TutorContext };
