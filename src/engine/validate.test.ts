import { describe, it, expect } from 'vitest';
import { checkAnswer, numericallyEqual } from './validate';
import type {
  MultipleChoiceStep,
  NumericInputStep,
  ManipulativeStep,
} from './schema';

const feedback = { correct: 'bien', incorrect: 'casi' };

describe('numericallyEqual', () => {
  it('equipara fracciones y decimales', () => {
    expect(numericallyEqual('1/2', '0.5')).toBe(true);
    expect(numericallyEqual('0.5', '1/2')).toBe(true);
  });

  it('resuelve expresiones equivalentes', () => {
    expect(numericallyEqual('2^3', '8')).toBe(true);
    expect(numericallyEqual('sqrt(9)', '3')).toBe(true);
    expect(numericallyEqual('(4-1)*2', '6')).toBe(true);
  });

  it('rechaza valores distintos', () => {
    expect(numericallyEqual('1/3', '0.3')).toBe(false);
    expect(numericallyEqual('5', '6')).toBe(false);
  });

  it('respeta la tolerancia', () => {
    expect(numericallyEqual('0.333', '1/3', 0.01)).toBe(true);
    expect(numericallyEqual('0.333', '1/3', 0)).toBe(false);
  });

  it('no explota con entradas no evaluables', () => {
    expect(numericallyEqual('hola', '3')).toBe(false);
  });
});

describe('checkAnswer — multiple-choice', () => {
  const step: MultipleChoiceStep = {
    type: 'question',
    id: 'q1',
    variant: 'multiple-choice',
    prompt: '¿Cuánto es $2+2$?',
    feedback,
    hints: [],
    choices: [
      { id: 'a', text: '3' },
      { id: 'b', text: '4' },
    ],
    answerId: 'b',
  };

  it('acepta la opción correcta', () => {
    expect(checkAnswer(step, 'b').correct).toBe(true);
  });
  it('rechaza la incorrecta', () => {
    expect(checkAnswer(step, 'a').correct).toBe(false);
  });
});

describe('checkAnswer — numeric-input', () => {
  const step: NumericInputStep = {
    type: 'question',
    id: 'q2',
    variant: 'numeric-input',
    prompt: 'Resuelve',
    feedback,
    hints: [],
    answer: '1/2',
    tolerance: 0,
  };

  it('acepta forma equivalente', () => {
    expect(checkAnswer(step, '0.5').correct).toBe(true);
  });
  it('rechaza vacío', () => {
    expect(checkAnswer(step, '   ').correct).toBe(false);
  });
});

describe('checkAnswer — manipulative', () => {
  const step: ManipulativeStep = {
    type: 'question',
    id: 'q3',
    variant: 'manipulative',
    prompt: 'Arrastra',
    feedback,
    hints: [],
    widget: 'square-difference',
    props: {},
    answer: '(a+b)(a-b)',
  };

  it('normaliza mayúsculas/espacios', () => {
    expect(checkAnswer(step, '  (A+B)(A-B) ').correct).toBe(true);
  });
});
