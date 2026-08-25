import { describe, it, expect } from 'vitest';
import { nextReview, selectDuePractice, type ReviewState } from './useLessonStore';

const NOW = 1_000_000_000_000;
const DAY = 86_400_000;

describe('nextReview — repetición espaciada Leitner', () => {
  it('al fallar agenda la caja 0 con vencimiento inmediato', () => {
    expect(nextReview(undefined, false, NOW)).toEqual({ box: 0, dueAt: NOW });
  });

  it('acertar una pregunta nunca agendada no la mete al repaso', () => {
    expect(nextReview(undefined, true, NOW)).toBeNull();
  });

  it('acertar sube de caja y aleja el vencimiento', () => {
    const r0: ReviewState = { box: 0, dueAt: NOW };
    const r1 = nextReview(r0, true, NOW)!;
    expect(r1.box).toBe(1);
    expect(r1.dueAt).toBe(NOW + 1 * DAY);

    const r2 = nextReview(r1, true, NOW)!;
    expect(r2.box).toBe(2);
    expect(r2.dueAt).toBe(NOW + 3 * DAY);
  });

  it('la última caja gradúa la pregunta (sale del repaso)', () => {
    const r3: ReviewState = { box: 3, dueAt: NOW };
    expect(nextReview(r3, true, NOW)).toBeNull();
  });

  it('fallar reinicia a la caja 0 aunque estuviera avanzada', () => {
    const r2: ReviewState = { box: 2, dueAt: NOW + 3 * DAY };
    expect(nextReview(r2, false, NOW)).toEqual({ box: 0, dueAt: NOW });
  });
});

describe('selectDuePractice', () => {
  const state = {
    reviews: {
      vencida: { box: 1, dueAt: NOW - DAY },
      justo: { box: 0, dueAt: NOW },
      futura: { box: 2, dueAt: NOW + 3 * DAY },
    } as Record<string, ReviewState>,
  };

  it('devuelve solo las vencidas, de la más antigua a la más reciente', () => {
    expect(selectDuePractice(state, NOW)).toEqual(['vencida', 'justo']);
  });

  it('no devuelve nada si aún no vence ninguna', () => {
    expect(selectDuePractice(state, NOW - 10 * DAY)).toEqual([]);
  });
});
