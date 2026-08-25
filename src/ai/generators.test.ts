import { describe, it, expect } from 'vitest';
import {
  extractJson,
  buildVariationStep,
  generateVariation,
  templates,
} from './generators';
import type { AIClient } from './client';
import { numericInputSchema } from '../engine/schema';

const dos = templates['difference-of-squares']!;

const fakeClient = (reply: string): AIClient => ({
  provider: 'fake',
  complete: async () => reply,
});

describe('extractJson', () => {
  it('parsea JSON limpio', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });
  it('extrae JSON rodeado de texto o markdown', () => {
    expect(extractJson('claro:\n```json\n{"a":2}\n```')).toEqual({ a: 2 });
  });
  it('devuelve undefined si no hay JSON válido', () => {
    expect(extractJson('sin json aquí')).toBeUndefined();
    expect(extractJson('{roto')).toBeUndefined();
  });
});

describe('buildVariationStep — la respuesta la calcula el código', () => {
  it('calcula la respuesta a partir de los params', () => {
    const step = buildVariationStep(dos, { a: 12, b: 5 });
    expect(step.answer).toBe('119'); // 144 - 25
    expect(step.variant).toBe('numeric-input');
    // El resultado cumple el MISMO esquema que el contenido de autor.
    expect(numericInputSchema.safeParse(step).success).toBe(true);
  });

  it('ignora cualquier respuesta sugerida por la IA (usa el enunciado, no la solución)', () => {
    const step = buildVariationStep(
      dos,
      { a: 7, b: 3 },
      'Enunciado propuesto por la IA',
    );
    expect(step.prompt).toBe('Enunciado propuesto por la IA');
    expect(step.answer).toBe('40'); // 49 - 9, calculado por el código
  });
});

describe('generateVariation', () => {
  it('usa params válidos de la IA y calcula la respuesta', async () => {
    const client = fakeClient('{"params":{"a":9,"b":4},"prompt":"Calcula"}');
    const step = await generateVariation('difference-of-squares', { client });
    expect(step.answer).toBe('65'); // 81 - 16
    expect(step.prompt).toBe('Calcula');
  });

  it('cae al modo offline si la IA da params inválidos', async () => {
    // a < b viola el refine → se reintenta y finalmente se generan params locales.
    const client = fakeClient('{"params":{"a":2,"b":9}}');
    const step = await generateVariation('difference-of-squares', {
      client,
      retries: 1,
    });
    expect(numericInputSchema.safeParse(step).success).toBe(true);
    expect(Number.isFinite(Number(step.answer))).toBe(true);
  });

  it('funciona sin IA (client null) con params locales válidos', async () => {
    const step = await generateVariation('perfect-square-middle', {
      client: null,
    });
    expect(numericInputSchema.safeParse(step).success).toBe(true);
    // término del medio = 2n, siempre par
    expect(Number(step.answer) % 2).toBe(0);
  });

  it('lanza si la plantilla no existe', async () => {
    await expect(generateVariation('no-existe', { client: null })).rejects.toThrow();
  });
});
