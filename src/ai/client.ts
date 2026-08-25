/**
 * Capa de IA — cliente abstracto (Módulo 4).
 *
 * REGLA DE ORO: la IA es mejora progresiva. La app es completa y excelente sin
 * ella (lecciones, hints, feedback y validación funcionan 100% offline). Este
 * cliente solo se activa si hay un proveedor configurado por variable de
 * entorno; si no, `getAIClient()` devuelve `null` y la UI oculta lo que dependa
 * de IA.
 *
 * Proveedores (VITE_AI_PROVIDER):
 *   - "anthropic": API de Anthropic vía SDK oficial.
 *   - "ollama":    modelo local (privacidad, sin coste, offline en LAN).
 */

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CompleteOptions {
  system?: string;
  messages: AIMessage[];
  maxTokens?: number;
  /** Aborta la petición si el usuario navega fuera, etc. */
  signal?: AbortSignal;
}

export interface AIClient {
  readonly provider: string;
  complete(opts: CompleteOptions): Promise<string>;
}

const env = import.meta.env;
const provider = (env.VITE_AI_PROVIDER as string | undefined)?.toLowerCase();

/** ¿Hay un proveedor de IA configurado? La UI usa esto para mostrar u ocultar. */
export function isAIEnabled(): boolean {
  return getAIClient() !== null;
}

let cached: AIClient | null | undefined;

export function getAIClient(): AIClient | null {
  if (cached !== undefined) return cached;
  cached = createClient();
  return cached;
}

function createClient(): AIClient | null {
  switch (provider) {
    case 'anthropic': {
      const apiKey = env.VITE_ANTHROPIC_API_KEY as string | undefined;
      if (!apiKey) return null;
      const model = (env.VITE_AI_MODEL as string | undefined) ?? 'claude-opus-4-8';
      return new AnthropicClient(apiKey, model);
    }
    case 'ollama': {
      const url =
        (env.VITE_OLLAMA_URL as string | undefined) ?? 'http://localhost:11434';
      const model = (env.VITE_AI_MODEL as string | undefined) ?? 'llama3.1';
      return new OllamaClient(url, model);
    }
    default:
      return null;
  }
}

/**
 * Proveedor Anthropic. El SDK se importa de forma DIFERIDA dentro de `complete`
 * para no engordar el bundle: solo se descarga cuando el usuario pide ayuda de
 * IA por primera vez.
 *
 * Nota de seguridad: llamar a la API desde el navegador expone la clave
 * (`dangerouslyAllowBrowser`). Es aceptable para uso local/personal de esta app;
 * un despliegue multiusuario debería enrutar por un backend propio.
 */
class AnthropicClient implements AIClient {
  readonly provider = 'anthropic';
  constructor(
    private apiKey: string,
    private model: string,
  ) {}

  async complete({ system, messages, maxTokens = 1024, signal }: CompleteOptions) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true,
    });
    // Sin temperature/top_p: Opus 4.8/4.7 los rechazan (400).
    const resp = await client.messages.create(
      {
        model: this.model,
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      },
      { signal },
    );
    return resp.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();
  }
}

/** Proveedor Ollama local. Sin clave; habla con el demonio en localhost. */
class OllamaClient implements AIClient {
  readonly provider = 'ollama';
  constructor(
    private url: string,
    private model: string,
  ) {}

  async complete({ system, messages, maxTokens = 1024, signal }: CompleteOptions) {
    const res = await fetch(`${this.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...messages,
        ],
        options: { num_predict: maxTokens },
      }),
    });
    if (!res.ok) {
      throw new Error(`Ollama respondió ${res.status}`);
    }
    const data = (await res.json()) as { message?: { content?: string } };
    return (data.message?.content ?? '').trim();
  }
}
