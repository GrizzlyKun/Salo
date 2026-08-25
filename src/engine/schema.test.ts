import { describe, it, expect } from 'vitest';
import { lessonSchema, type Step } from './schema';

/**
 * Estos tests fijan el contrato que la skill `lesson-author` promete que "el
 * validador impone". Si alguien relaja el esquema, estos tests lo avisan.
 */

const exposition = (id: string, text = 'Una idea breve.'): Step => ({
  type: 'exposition',
  id,
  text,
});

const question = (id: string): Step => ({
  type: 'question',
  id,
  variant: 'multiple-choice',
  prompt: '¿$2+2$?',
  choices: [
    { id: 'a', text: '3' },
    { id: 'b', text: '4' },
  ],
  answerId: 'b',
  feedback: { correct: 'bien', incorrect: 'casi' },
  hints: [],
});

const lesson = (steps: Step[]) => ({
  id: 'demo',
  title: 'Demo',
  unitId: 'u1',
  order: 0,
  xp: 10,
  durationMinutes: 3,
  steps,
});

describe('lessonSchema — estructura', () => {
  it('acepta una lección bien formada', () => {
    const ok = lesson([
      exposition('s1'),
      question('s2'),
      exposition('s3'),
      question('s4'),
    ]);
    expect(lessonSchema.safeParse(ok).success).toBe(true);
  });

  it('rechaza menos de 4 steps', () => {
    const bad = lesson([exposition('s1'), question('s2'), exposition('s3')]);
    expect(lessonSchema.safeParse(bad).success).toBe(false);
  });
});

describe('lessonSchema — densidad de preguntas', () => {
  it('exige al menos 1 pregunta por cada 3 steps', () => {
    // 6 steps, solo 1 pregunta → necesita 2.
    const bad = lesson([
      exposition('s1'),
      question('s2'),
      exposition('s3'),
      exposition('s4'),
      exposition('s5'),
      exposition('s6'),
    ]);
    expect(lessonSchema.safeParse(bad).success).toBe(false);
  });
});

describe('lessonSchema — muro de texto', () => {
  it('rechaza 3 exposiciones consecutivas', () => {
    const bad = lesson([
      exposition('s1'),
      exposition('s2'),
      exposition('s3'),
      question('s4'),
    ]);
    expect(lessonSchema.safeParse(bad).success).toBe(false);
  });

  it('permite exactamente 2 exposiciones consecutivas', () => {
    const ok = lesson([
      exposition('s1'),
      exposition('s2'),
      question('s3'),
      question('s4'),
    ]);
    expect(lessonSchema.safeParse(ok).success).toBe(true);
  });
});

describe('lessonSchema — límites de texto', () => {
  it('rechaza textos de más de 500 caracteres', () => {
    const bad = lesson([
      exposition('s1', 'a'.repeat(501)),
      question('s2'),
      exposition('s3'),
      question('s4'),
    ]);
    expect(lessonSchema.safeParse(bad).success).toBe(false);
  });
});

describe('lessonSchema — multiple-choice', () => {
  it('rechaza answerId que no existe entre las choices', () => {
    const badQuestion: Step = {
      type: 'question',
      id: 'q',
      variant: 'multiple-choice',
      prompt: '¿?',
      choices: [
        { id: 'a', text: '3' },
        { id: 'b', text: '4' },
      ],
      answerId: 'zzz',
      feedback: { correct: 'bien', incorrect: 'casi' },
      hints: [],
    };
    const bad = lesson([
      exposition('s1'),
      badQuestion,
      exposition('s3'),
      question('s4'),
    ]);
    expect(lessonSchema.safeParse(bad).success).toBe(false);
  });
});
