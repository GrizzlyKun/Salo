import { questionStepSchema, type QuestionStep } from './schema';
import type { Locale } from '../i18n/i18n';

/**
 * Motor de generación procedural de problemas (100% offline, sin IA).
 *
 * Patrón (respaldado por la investigación): plantillas parametrizadas donde la
 * respuesta la calcula el CÓDIGO y los distractores encarnan errores reales.
 * Con semilla aleatoria + anti-repetición, un solo tipo de problema produce
 * ejercicios infinitos y variados — así la práctica no se vuelve pesada.
 *
 * Bilingüe: cada plantilla redacta en ES/EN según `ctx.locale`. La respuesta
 * (que calcula el código) es idéntica en ambos idiomas.
 */

export type Difficulty = 'facil' | 'media' | 'dificil';

export interface GenContext {
  rng: () => number;
  difficulty: Difficulty;
  locale: Locale;
}

/** Elige texto según idioma. */
const L = (ctx: GenContext, es: string, en: string): string =>
  ctx.locale === 'en' ? en : es;

/** Especificación de un problema; el motor la valida y la vuelve QuestionStep. */
export interface ProblemSpec {
  signature: string;
  prompt: string;
  feedback: { correct: string; incorrect: string };
  hints: string[];
  numeric?: { answer: string; tolerance?: number };
  choices?: { text: string; correct: boolean }[];
}

export interface ProblemTemplate {
  id: string;
  title: Record<Locale, string>;
  skill: Record<Locale, string>;
  build: (ctx: GenContext) => ProblemSpec;
}

export interface GeneratedProblem {
  step: QuestionStep;
  signature: string;
}

/* --------------------------- utilidades RNG --------------------------- */

/** PRNG con semilla (mulberry32): determinista y suficiente para variar. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randInt = (rng: () => number, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

function shuffle<T>(rng: () => number, xs: readonly T[]): T[] {
  const arr = [...xs];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function token(rng: () => number): string {
  return ('00000' + Math.floor(rng() * 2_176_782_336).toString(36)).slice(-6);
}

/* ----------------------- ensamblado + validación ---------------------- */

function toStep(
  templateId: string,
  spec: ProblemSpec,
  rng: () => number,
): QuestionStep {
  const id = `gen-${templateId}-${token(rng)}`;
  if (spec.numeric) {
    return questionStepSchema.parse({
      type: 'question',
      id,
      variant: 'numeric-input',
      prompt: spec.prompt,
      answer: spec.numeric.answer,
      tolerance: spec.numeric.tolerance ?? 0,
      feedback: spec.feedback,
      hints: spec.hints,
    });
  }
  const choices = shuffle(rng, spec.choices ?? []);
  const built = choices.map((c, i) => ({ id: `c${i}`, text: c.text }));
  const correctIdx = choices.findIndex((c) => c.correct);
  return questionStepSchema.parse({
    type: 'question',
    id,
    variant: 'multiple-choice',
    prompt: spec.prompt,
    choices: built,
    answerId: `c${correctIdx}`,
    feedback: spec.feedback,
    hints: spec.hints,
  });
}

/** Rango de magnitud según dificultad (para números). */
function band(d: Difficulty): { min: number; max: number } {
  return d === 'facil'
    ? { min: 2, max: 9 }
    : d === 'dificil'
      ? { min: 8, max: 30 }
      : { min: 4, max: 15 };
}

/* ------------------------------ plantillas ---------------------------- */

const SP = { es: 'Productos notables', en: 'Special products' };
const FAC = { es: 'Factorización', en: 'Factoring' };
const EXPR = { es: 'Expresiones', en: 'Expressions' };

const evalDifferenceOfSquares: ProblemTemplate = {
  id: 'eval-diferencia-cuadrados',
  title: { es: 'Diferencia de cuadrados (cálculo)', en: 'Difference of squares (compute)' },
  skill: SP,
  build: (ctx) => {
    const { rng } = ctx;
    const { min, max } = band(ctx.difficulty);
    const a = randInt(rng, min + 1, max);
    const b = randInt(rng, min, a - 1);
    return {
      signature: `eval:${a},${b}`,
      prompt: L(
        ctx,
        `Usa la diferencia de cuadrados para calcular $${a}^2 - ${b}^2$.`,
        `Use the difference of squares to compute $${a}^2 - ${b}^2$.`,
      ),
      numeric: { answer: String(a * a - b * b) },
      feedback: {
        correct: L(
          ctx,
          `¡Eso es! $(${a}+${b})(${a}-${b}) = ${a * a - b * b}$.`,
          `That's it! $(${a}+${b})(${a}-${b}) = ${a * a - b * b}$.`,
        ),
        incorrect: L(
          ctx,
          'Multiplica la suma por la diferencia: $(a+b)(a-b)$, sin elevar al cuadrado.',
          'Multiply the sum by the difference: $(a+b)(a-b)$, no squaring needed.',
        ),
      },
      hints:
        ctx.locale === 'en'
          ? ['Don’t square; use $(a+b)(a-b)$.', `Here $a=${a}$ and $b=${b}$.`]
          : ['No eleves al cuadrado; usa $(a+b)(a-b)$.', `Aquí $a=${a}$ y $b=${b}$.`],
    };
  },
};

const expandPerfectSquare: ProblemTemplate = {
  id: 'binomio-cuadrado-perfecto',
  title: { es: 'Binomio al cuadrado (desarrollo)', en: 'Square of a binomial (expand)' },
  skill: SP,
  build: (ctx) => {
    const { rng } = ctx;
    const { max } = band(ctx.difficulty);
    const n = randInt(rng, 2, Math.min(12, max));
    const neg = rng() < 0.5;
    const s = neg ? '-' : '+';
    const mid = 2 * n;
    const n2 = n * n;
    const correct = `$x^2 ${s} ${mid}x + ${n2}$`;
    return {
      signature: `sq:${s}${n}`,
      prompt: L(ctx, `Desarrolla $(x ${s} ${n})^2$.`, `Expand $(x ${s} ${n})^2$.`),
      choices: [
        { text: correct, correct: true },
        { text: `$x^2 + ${n2}$`, correct: false },
        { text: `$x^2 ${s} ${n}x + ${n2}$`, correct: false },
        { text: `$x^2 ${s} ${mid}x - ${n2}$`, correct: false },
      ],
      feedback: {
        correct: L(
          ctx,
          `¡Sí! $(x ${s} ${n})^2 = x^2 ${s} ${mid}x + ${n2}$: no olvides el $2ab$.`,
          `Yes! $(x ${s} ${n})^2 = x^2 ${s} ${mid}x + ${n2}$: don't forget the $2ab$ term.`,
        ),
        incorrect: L(
          ctx,
          'Recuerda $(x \\pm n)^2 = x^2 \\pm 2nx + n^2$. El término del medio es $2n$.',
          'Remember $(x \\pm n)^2 = x^2 \\pm 2nx + n^2$. The middle term is $2n$.',
        ),
      },
      hints:
        ctx.locale === 'en'
          ? ['Four pieces, not two: the middle term is missing.', `Middle is $2 \\cdot ${n} = ${mid}$.`]
          : ['Son cuatro piezas, no dos: falta el término del medio.', `El del medio es $2 \\cdot ${n} = ${mid}$.`],
    };
  },
};

const factorTrinomial: ProblemTemplate = {
  id: 'factorizar-trinomio',
  title: { es: 'Factorizar trinomios', en: 'Factoring trinomials' },
  skill: FAC,
  build: (ctx) => {
    const { rng } = ctx;
    const r = randInt(rng, 2, 5);
    const s = randInt(rng, r + 1, 8);
    const b = r + s;
    const c = r * s;
    return {
      signature: `tri:${r},${s}`,
      prompt: L(ctx, `Factoriza $x^2 + ${b}x + ${c}$.`, `Factor $x^2 + ${b}x + ${c}$.`),
      choices: [
        { text: `$(x+${r})(x+${s})$`, correct: true },
        { text: `$(x+1)(x+${c})$`, correct: false },
        { text: `$(x+${r})(x-${s})$`, correct: false },
      ],
      feedback: {
        correct: L(
          ctx,
          `¡Perfecto! $${r}\\cdot ${s} = ${c}$ y $${r}+${s} = ${b}$.`,
          `Perfect! $${r}\\cdot ${s} = ${c}$ and $${r}+${s} = ${b}$.`,
        ),
        incorrect: L(
          ctx,
          `Busca dos números que multiplicados den $${c}$ y sumados den $${b}$.`,
          `Find two numbers that multiply to $${c}$ and add to $${b}$.`,
        ),
      },
      hints:
        ctx.locale === 'en'
          ? [`List the factor pairs of $${c}$.`, `Which pair adds to $${b}$?`]
          : [`Lista los pares que multiplican $${c}$.`, `De esos, ¿cuál suma $${b}$?`],
    };
  },
};

const factorDifferenceOfSquares: ProblemTemplate = {
  id: 'factorizar-diferencia-cuadrados',
  title: { es: 'Factorizar diferencia de cuadrados', en: 'Factoring a difference of squares' },
  skill: FAC,
  build: (ctx) => {
    const { rng } = ctx;
    const k = randInt(rng, 2, 12);
    const sq = k * k;
    return {
      signature: `dsq:${k}`,
      prompt: L(ctx, `Factoriza $x^2 - ${sq}$.`, `Factor $x^2 - ${sq}$.`),
      choices: [
        { text: `$(x+${k})(x-${k})$`, correct: true },
        { text: `$(x-${k})^2$`, correct: false },
        { text: `$(x+${k})^2$`, correct: false },
      ],
      feedback: {
        correct: L(
          ctx,
          `¡Sí! $${sq} = ${k}^2$, así que es $(x+${k})(x-${k})$.`,
          `Yes! $${sq} = ${k}^2$, so it's $(x+${k})(x-${k})$.`,
        ),
        incorrect: L(
          ctx,
          `¿Qué número al cuadrado da $${sq}$? Ese es tu $b$ en $(x+b)(x-b)$.`,
          `What number squared gives $${sq}$? That's your $b$ in $(x+b)(x-b)$.`,
        ),
      },
      hints:
        ctx.locale === 'en'
          ? [`$${sq} = ${k}^2$.`, 'Difference of squares: $(x+b)(x-b)$.']
          : [`$${sq} = ${k}^2$.`, 'Diferencia de cuadrados: $(x+b)(x-b)$.'],
    };
  },
};

const sumOfSquares: ProblemTemplate = {
  id: 'suma-de-cuadrados',
  title: { es: 'Suma de cuadrados (la trampa)', en: 'Sum of squares (the trap)' },
  skill: FAC,
  build: (ctx) => {
    const { rng } = ctx;
    const k = randInt(rng, 2, 12);
    const sq = k * k;
    return {
      signature: `sos:${k}`,
      prompt: L(
        ctx,
        `¿Cómo se factoriza $x^2 + ${sq}$ con números reales?`,
        `How do you factor $x^2 + ${sq}$ over the real numbers?`,
      ),
      choices: [
        { text: L(ctx, 'No se puede factorizar', 'It can’t be factored'), correct: true },
        { text: `$(x+${k})(x-${k})$`, correct: false },
        { text: `$(x+${k})^2$`, correct: false },
      ],
      feedback: {
        correct: L(
          ctx,
          '¡Exacto! Una SUMA de cuadrados no se factoriza con reales (solo la diferencia).',
          'Exactly! A SUM of squares doesn’t factor over the reals (only the difference does).',
        ),
        incorrect: L(
          ctx,
          'Ojo: $(x+b)(x-b)$ da una RESTA de cuadrados. Una suma no se factoriza en reales.',
          'Careful: $(x+b)(x-b)$ gives a DIFFERENCE of squares. A sum doesn’t factor over the reals.',
        ),
      },
      hints:
        ctx.locale === 'en'
          ? ['The difference factors; the sum doesn’t.', 'Multiply $(x+b)(x-b)$: you get $x^2 - b^2$, not $+$.']
          : ['La diferencia de cuadrados sí; la suma no.', 'Multiplica $(x+b)(x-b)$: te sale $x^2 - b^2$, no $+$.'],
    };
  },
};

const orderOfOperations: ProblemTemplate = {
  id: 'orden-de-operaciones',
  title: { es: 'Orden de operaciones', en: 'Order of operations' },
  skill: { es: 'Aritmética', en: 'Arithmetic' },
  build: (ctx) => {
    const { rng } = ctx;
    const { min, max } = band(ctx.difficulty);
    const a = randInt(rng, min, max);
    const b = randInt(rng, 2, 9);
    const c = randInt(rng, 2, 9);
    const forms = [
      { text: `${a} + ${b} \\times ${c}`, val: a + b * c },
      { text: `(${a} + ${b}) \\times ${c}`, val: (a + b) * c },
      { text: `${a} \\times ${b} + ${c}`, val: a * b + c },
    ];
    const f = forms[randInt(rng, 0, forms.length - 1)]!;
    return {
      signature: `ooo:${f.text}`,
      prompt: L(
        ctx,
        `Calcula respetando el orden de operaciones: $${f.text}$.`,
        `Compute, respecting order of operations: $${f.text}$.`,
      ),
      numeric: { answer: String(f.val) },
      feedback: {
        correct: L(
          ctx,
          '¡Bien! Primero paréntesis y multiplicaciones; después sumas y restas.',
          'Nice! Parentheses and multiplication first; then addition and subtraction.',
        ),
        incorrect: L(
          ctx,
          'No vayas de izquierda a derecha sin más: primero paréntesis y $\\times$, luego $+$ y $-$.',
          'Don’t just go left to right: parentheses and $\\times$ first, then $+$ and $-$.',
        ),
      },
      hints:
        ctx.locale === 'en'
          ? ['Multiply before adding (unless parentheses).', 'Solve it piece by piece.']
          : ['Multiplica antes de sumar (salvo paréntesis).', 'Resuélvelo por partes.'],
    };
  },
};

const multiplyFractions: ProblemTemplate = {
  id: 'multiplicar-fracciones',
  title: { es: 'Multiplicar fracciones', en: 'Multiplying fractions' },
  skill: { es: 'Fracciones', en: 'Fractions' },
  build: (ctx) => {
    const { rng } = ctx;
    const b = randInt(rng, 2, 6);
    const d = randInt(rng, 2, 6);
    const a = randInt(rng, 1, b - 1);
    const c = randInt(rng, 1, d - 1);
    return {
      signature: `mulf:${a}/${b}*${c}/${d}`,
      prompt: L(
        ctx,
        `Calcula $\\frac{${a}}{${b}} \\times \\frac{${c}}{${d}}$ (fracción o decimal).`,
        `Compute $\\frac{${a}}{${b}} \\times \\frac{${c}}{${d}}$ (fraction or decimal).`,
      ),
      numeric: { answer: `${a * c}/${b * d}` },
      feedback: {
        correct: L(
          ctx,
          `¡Eso es! Multiplicas arriba con arriba y abajo con abajo: $\\frac{${a * c}}{${b * d}}$.`,
          `That's it! Multiply tops together and bottoms together: $\\frac{${a * c}}{${b * d}}$.`,
        ),
        incorrect: L(
          ctx,
          'Multiplica los numeradores entre sí y los denominadores entre sí (sin denominador común).',
          'Multiply the numerators together and the denominators together (no common denominator needed).',
        ),
      },
      hints:
        ctx.locale === 'en'
          ? ['Numerator $\\times$ numerator, denominator $\\times$ denominator.', `$\\frac{${a}\\cdot ${c}}{${b}\\cdot ${d}}$`]
          : ['Numerador $\\times$ numerador, denominador $\\times$ denominador.', `$\\frac{${a}\\cdot ${c}}{${b}\\cdot ${d}}$`],
    };
  },
};

const simpleProbability: ProblemTemplate = {
  id: 'probabilidad-simple',
  title: { es: 'Probabilidad simple', en: 'Simple probability' },
  skill: { es: 'Probabilidad', en: 'Probability' },
  build: (ctx) => {
    const { rng } = ctx;
    const r = randInt(rng, 1, 5);
    const b = randInt(rng, 1, 5);
    const total = r + b;
    return {
      signature: `prob:${r},${b}`,
      prompt: L(
        ctx,
        `Una bolsa tiene ${r} bolas rojas y ${b} azules. Sacas una al azar: ¿probabilidad de que sea roja? (fracción o decimal)`,
        `A bag has ${r} red balls and ${b} blue ones. You draw one at random: probability it's red? (fraction or decimal)`,
      ),
      numeric: { answer: `${r}/${total}` },
      feedback: {
        correct: L(
          ctx,
          `¡Sí! Casos favorables entre totales: $\\frac{${r}}{${total}}$.`,
          `Yes! Favorable over total outcomes: $\\frac{${r}}{${total}}$.`,
        ),
        incorrect: L(
          ctx,
          'Probabilidad = (casos favorables) / (casos totales). ¿Cuántas bolas hay en total?',
          'Probability = (favorable) / (total). How many balls are there in total?',
        ),
      },
      hints:
        ctx.locale === 'en'
          ? [`There are ${total} balls in total.`, `Red over total: $\\frac{${r}}{${total}}$.`]
          : [`Hay ${total} bolas en total.`, `Rojas entre total: $\\frac{${r}}{${total}}$.`],
    };
  },
};

const meanOfThree: ProblemTemplate = {
  id: 'media-aritmetica',
  title: { es: 'Media (promedio)', en: 'Mean (average)' },
  skill: { es: 'Estadística', en: 'Statistics' },
  build: (ctx) => {
    const { rng } = ctx;
    let x = 1;
    let y = 1;
    let z = 1;
    for (let i = 0; i < 20; i++) {
      x = randInt(rng, 1, 10);
      y = randInt(rng, 1, 10);
      z = randInt(rng, 1, 10);
      if ((x + y + z) % 3 === 0) break;
    }
    const mean = (x + y + z) / 3;
    return {
      signature: `mean:${x},${y},${z}`,
      prompt: L(
        ctx,
        `¿Cuál es la media de $${x}$, $${y}$ y $${z}$?`,
        `What is the mean of $${x}$, $${y}$ and $${z}$?`,
      ),
      numeric: { answer: String(mean) },
      feedback: {
        correct: L(
          ctx,
          `¡Bien! Sumas ($${x + y + z}$) y divides entre la cantidad ($3$): $${mean}$.`,
          `Nice! Add them up ($${x + y + z}$) and divide by how many ($3$): $${mean}$.`,
        ),
        incorrect: L(
          ctx,
          'La media es la suma de todos dividida entre cuántos son.',
          'The mean is the sum of all values divided by how many there are.',
        ),
      },
      hints:
        ctx.locale === 'en'
          ? [`Sum: $${x}+${y}+${z} = ${x + y + z}$.`, 'Divide by $3$.']
          : [`Suma: $${x}+${y}+${z} = ${x + y + z}$.`, 'Divide entre $3$.'],
    };
  },
};

const twoStepEquation: ProblemTemplate = {
  id: 'ecuacion-dos-pasos',
  title: { es: 'Ecuación de dos pasos', en: 'Two-step equation' },
  skill: { es: 'Ecuaciones', en: 'Equations' },
  build: (ctx) => {
    const { rng } = ctx;
    const a = randInt(rng, 2, 6);
    const x = randInt(rng, 1, 9);
    const b = randInt(rng, 1, 12);
    const c = a * x + b;
    return {
      signature: `2step:${a},${x},${b}`,
      prompt: L(ctx, `Resuelve: $${a}x + ${b} = ${c}$.`, `Solve: $${a}x + ${b} = ${c}$.`),
      numeric: { answer: String(x) },
      feedback: {
        correct: L(
          ctx,
          `¡Perfecto! Restas $${b}$ y divides entre $${a}$: $x = ${x}$.`,
          `Perfect! Subtract $${b}$, then divide by $${a}$: $x = ${x}$.`,
        ),
        incorrect: L(
          ctx,
          `Primero resta $${b}$ en ambos lados; luego divide entre $${a}$.`,
          `First subtract $${b}$ from both sides; then divide by $${a}$.`,
        ),
      },
      hints:
        ctx.locale === 'en'
          ? [`Subtract $${b}$: $${a}x = ${c - b}$.`, `Divide by $${a}$.`]
          : [`Resta $${b}$: $${a}x = ${c - b}$.`, `Divide entre $${a}$.`],
    };
  },
};

const evaluateExpression: ProblemTemplate = {
  id: 'evaluar-expresion',
  title: { es: 'Evaluar una expresión', en: 'Evaluate an expression' },
  skill: EXPR,
  build: (ctx) => {
    const { rng } = ctx;
    const m = randInt(rng, 2, 9);
    const k = randInt(rng, 1, 9);
    const x = randInt(rng, 1, 9);
    return {
      signature: `eval-expr:${m},${k},${x}`,
      prompt: L(
        ctx,
        `Si $x = ${x}$, ¿cuánto vale $${m}x + ${k}$?`,
        `If $x = ${x}$, what is $${m}x + ${k}$?`,
      ),
      numeric: { answer: String(m * x + k) },
      feedback: {
        correct: L(
          ctx,
          `¡Eso es! $${m}\\cdot ${x} + ${k} = ${m * x + k}$.`,
          `That's it! $${m}\\cdot ${x} + ${k} = ${m * x + k}$.`,
        ),
        incorrect: L(
          ctx,
          `Sustituye $x$ por $${x}$ y calcula: $${m}\\cdot ${x} + ${k}$.`,
          `Substitute $${x}$ for $x$ and compute: $${m}\\cdot ${x} + ${k}$.`,
        ),
      },
      hints:
        ctx.locale === 'en'
          ? [`Replace $x$ with $${x}$.`, `First $${m}\\cdot ${x}$, then add $${k}$.`]
          : [`Cambia $x$ por $${x}$.`, `Primero $${m}\\cdot ${x}$, luego suma $${k}$.`],
    };
  },
};

const combineLikeTerms: ProblemTemplate = {
  id: 'terminos-semejantes',
  title: { es: 'Términos semejantes', en: 'Like terms' },
  skill: EXPR,
  build: (ctx) => {
    const { rng } = ctx;
    const p = randInt(rng, 2, 6);
    let q = randInt(rng, 2, 6);
    if (p === 2 && q === 2) q = 3;
    const c = randInt(rng, 1, 9);
    return {
      signature: `like:${p},${q},${c}`,
      prompt: L(
        ctx,
        `Simplifica $${p}x + ${c} + ${q}x$.`,
        `Simplify $${p}x + ${c} + ${q}x$.`,
      ),
      choices: [
        { text: `$${p + q}x + ${c}$`, correct: true },
        { text: `$${p + q + c}x$`, correct: false },
        { text: `$${p * q}x + ${c}$`, correct: false },
      ],
      feedback: {
        correct: L(
          ctx,
          `¡Sí! Solo se juntan las $x$: $${p}x + ${q}x = ${p + q}x$; el $${c}$ queda aparte.`,
          `Yes! Only the $x$ terms combine: $${p}x + ${q}x = ${p + q}x$; the $${c}$ stays apart.`,
        ),
        incorrect: L(
          ctx,
          'Suma solo los términos con $x$. El número suelto no se mezcla con las $x$.',
          'Add only the $x$ terms. The plain number doesn’t mix with the $x$ terms.',
        ),
      },
      hints:
        ctx.locale === 'en'
          ? [`$${p}x + ${q}x = ${p + q}x$.`, `The $${c}$ has no $x$: it stays on its own.`]
          : [`$${p}x + ${q}x = ${p + q}x$.`, `El $${c}$ no lleva $x$: se queda solo.`],
    };
  },
};

const slopeTwoPoints: ProblemTemplate = {
  id: 'pendiente-dos-puntos',
  title: { es: 'Pendiente entre dos puntos', en: 'Slope between two points' },
  skill: { es: 'Rectas', en: 'Lines' },
  build: (ctx) => {
    const { rng } = ctx;
    const x1 = randInt(rng, -4, 4);
    let x2 = x1;
    for (let i = 0; i < 10 && x2 === x1; i++) x2 = randInt(rng, -4, 4);
    if (x2 === x1) x2 = x1 + 1;
    const m = randInt(rng, -3, 3);
    const y1 = randInt(rng, -4, 4);
    const y2 = y1 + m * (x2 - x1);
    return {
      signature: `slope:${x1},${y1},${x2},${y2}`,
      prompt: L(
        ctx,
        `¿Cuál es la pendiente de la recta que pasa por $(${x1}, ${y1})$ y $(${x2}, ${y2})$?`,
        `What is the slope of the line through $(${x1}, ${y1})$ and $(${x2}, ${y2})$?`,
      ),
      numeric: { answer: String(m) },
      feedback: {
        correct: L(
          ctx,
          `¡Perfecto! Pendiente $= \\frac{${y2} - (${y1})}{${x2} - (${x1})} = ${m}$.`,
          `Perfect! Slope $= \\frac{${y2} - (${y1})}{${x2} - (${x1})} = ${m}$.`,
        ),
        incorrect: L(
          ctx,
          'Pendiente $=$ (cambio en $y$) dividido por (cambio en $x$).',
          'Slope $=$ (change in $y$) divided by (change in $x$).',
        ),
      },
      hints:
        ctx.locale === 'en'
          ? ['Divide the change in $y$ by the change in $x$.', 'Keep the same point first in both.']
          : ['Divide la diferencia de $y$ entre la diferencia de $x$.', 'Respeta el orden: el mismo punto primero arriba y abajo.'],
    };
  },
};

const rectanglePerimeter: ProblemTemplate = {
  id: 'perimetro-rectangulo',
  title: { es: 'Perímetro del rectángulo', en: 'Rectangle perimeter' },
  skill: { es: 'Geometría', en: 'Geometry' },
  build: (ctx) => {
    const { rng } = ctx;
    const { max } = band(ctx.difficulty);
    const a = randInt(rng, 2, max);
    const b = randInt(rng, 2, max);
    return {
      signature: `perim:${a},${b}`,
      prompt: L(
        ctx,
        `¿Cuál es el perímetro de un rectángulo de base $${a}$ y altura $${b}$?`,
        `What is the perimeter of a rectangle with base $${a}$ and height $${b}$?`,
      ),
      numeric: { answer: String(2 * (a + b)) },
      feedback: {
        correct: L(
          ctx,
          `¡Bien! Perímetro $= 2(${a} + ${b}) = ${2 * (a + b)}$.`,
          `Nice! Perimeter $= 2(${a} + ${b}) = ${2 * (a + b)}$.`,
        ),
        incorrect: L(
          ctx,
          'El perímetro suma los cuatro lados: $2 \\times (\\text{base} + \\text{altura})$.',
          'The perimeter adds all four sides: $2 \\times (\\text{base} + \\text{height})$.',
        ),
      },
      hints:
        ctx.locale === 'en'
          ? ['Add all four sides.', `$2 \\times (${a} + ${b})$`]
          : ['Suma los cuatro lados.', `$2 \\times (${a} + ${b})$`],
    };
  },
};

export const problemTemplates: ProblemTemplate[] = [
  evalDifferenceOfSquares,
  expandPerfectSquare,
  factorTrinomial,
  factorDifferenceOfSquares,
  sumOfSquares,
  orderOfOperations,
  multiplyFractions,
  simpleProbability,
  meanOfThree,
  twoStepEquation,
  evaluateExpression,
  combineLikeTerms,
  slopeTwoPoints,
  rectanglePerimeter,
];

export function getTemplate(id: string): ProblemTemplate | undefined {
  return problemTemplates.find((t) => t.id === id);
}

export function hasProblemTemplate(id: string): boolean {
  return problemTemplates.some((t) => t.id === id);
}

/**
 * Crea un generador con estado para un tipo de problema. `next()` devuelve un
 * problema nuevo evitando repetir la firma de los últimos generados.
 */
export function createProblemGenerator(
  templateId: string,
  opts: {
    seed?: number;
    difficulty?: Difficulty;
    locale?: Locale;
    recentWindow?: number;
  } = {},
): { next: () => GeneratedProblem } {
  const template = getTemplate(templateId);
  if (!template) throw new Error(`Plantilla desconocida: ${templateId}`);

  const rng = mulberry32(opts.seed ?? (Date.now() >>> 0));
  const difficulty = opts.difficulty ?? 'media';
  const locale = opts.locale ?? 'es';
  const windowSize = opts.recentWindow ?? 6;
  const recent: string[] = [];

  const next = (): GeneratedProblem => {
    let spec = template.build({ rng, difficulty, locale });
    for (let i = 0; i < 20 && recent.includes(spec.signature); i++) {
      spec = template.build({ rng, difficulty, locale });
    }
    recent.push(spec.signature);
    if (recent.length > windowSize) recent.shift();
    return { step: toStep(template.id, spec, rng), signature: spec.signature };
  };

  return { next };
}
