import { describe, it, expect } from 'vitest';
import {
  createProblemGenerator,
  problemTemplates,
  mulberry32,
} from './generate';
import { questionStepSchema } from './schema';
import { checkAnswer } from './validate';

describe('mulberry32', () => {
  it('es determinista con la misma semilla', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('plantillas de problemas', () => {
  for (const template of problemTemplates) {
    it(`"${template.id}" produce problemas válidos y resolubles`, () => {
      const gen = createProblemGenerator(template.id, { seed: 7 });
      for (let i = 0; i < 25; i++) {
        const { step } = gen.next();
        // 1) cumple el mismo esquema que el contenido de autor
        expect(questionStepSchema.safeParse(step).success).toBe(true);
        if (step.variant === 'multiple-choice') {
          // 2) opciones únicas y una sola correcta apunta a una choice real
          const texts = step.choices.map((c) => c.text);
          expect(new Set(texts).size).toBe(texts.length);
          expect(step.choices.some((c) => c.id === step.answerId)).toBe(true);
          // 3) la respuesta marcada se valida como correcta
          expect(checkAnswer(step, step.answerId).correct).toBe(true);
        } else {
          // 3) la respuesta calculada se valida como correcta
          expect(checkAnswer(step, step.answer).correct).toBe(true);
        }
      }
    });
  }
});

describe('anti-repetición', () => {
  it('no repite la firma dentro de la ventana reciente', () => {
    // eval-diferencia-cuadrados tiene muchas combinaciones → sin repetición seguida
    const gen = createProblemGenerator('eval-diferencia-cuadrados', {
      seed: 123,
      recentWindow: 6,
    });
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) seen.push(gen.next().signature);
    expect(new Set(seen).size).toBe(seen.length);
  });
});

describe('createProblemGenerator', () => {
  it('lanza si la plantilla no existe', () => {
    expect(() => createProblemGenerator('no-existe')).toThrow();
  });

  it('es reproducible con la misma semilla', () => {
    const a = createProblemGenerator('binomio-cuadrado-perfecto', { seed: 99 });
    const b = createProblemGenerator('binomio-cuadrado-perfecto', { seed: 99 });
    expect(a.next().signature).toBe(b.next().signature);
  });
});
