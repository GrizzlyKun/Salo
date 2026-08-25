/**
 * Prompt versionado para generar variaciones de problemas.
 *
 * Patrón clave (CLAUDE.md): la IA SOLO propone `params` dentro de rangos y una
 * redacción fresca del enunciado. NUNCA calcula ni incluye la respuesta —
 * eso lo hace el código a partir de los params. Así la validación sigue siendo
 * 100% determinista.
 */
export const GENERATE_VARIATION_PROMPT_VERSION = 'v1';

export function buildVariationSystemPrompt(): string {
  return [
    'Eres un generador de ejercicios de matemáticas para una app de aprendizaje.',
    'Tu ÚNICA tarea es proponer parámetros nuevos dentro de los rangos dados y',
    'redactar el enunciado en español, cálido y breve.',
    'NUNCA calcules ni incluyas la respuesta: de eso se encarga el sistema.',
    'Responde SOLO con un objeto JSON válido, sin texto adicional ni markdown,',
    'con esta forma exacta: {"params": { ... }, "prompt": "..."}.',
    'El enunciado puede usar LaTeX inline entre signos de dólar.',
  ].join(' ');
}

export function buildVariationUserPrompt(brief: string): string {
  return brief;
}
