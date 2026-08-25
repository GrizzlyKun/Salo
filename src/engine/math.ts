import {
  create,
  type FactoryFunctionMap,
  evaluateDependencies,
  addDependencies,
  subtractDependencies,
  multiplyDependencies,
  divideDependencies,
  powDependencies,
  unaryMinusDependencies,
  unaryPlusDependencies,
  modDependencies,
  sqrtDependencies,
  absDependencies,
} from 'mathjs/number';

/**
 * Instancia mínima de mathjs para validar respuestas.
 *
 * Usamos el build `mathjs/number` (sin matrices, complejos, bignumber ni
 * unidades) y solo las dependencias aritméticas que aparecen en el contenido.
 * Esto reduce drásticamente el bundle frente a `import { evaluate } from
 * 'mathjs'` — importante para el presupuesto de gama baja.
 *
 * Operaciones soportadas: + − × ÷ ^ (potencia), paréntesis, signo unario,
 * `mod`, `sqrt`, `abs`. Si algún contenido futuro necesita más funciones
 * (p. ej. `log`, trigonometría), añádelas aquí importando su *Dependencies.
 */
// El .d.ts del build `mathjs/number` tipa estas dependencias como
// `FactoryFunctionMap | undefined`; en runtime siempre están definidas.
const math = create({
  evaluateDependencies,
  addDependencies,
  subtractDependencies,
  multiplyDependencies,
  divideDependencies,
  powDependencies,
  unaryMinusDependencies,
  unaryPlusDependencies,
  modDependencies,
  sqrtDependencies,
  absDependencies,
} as FactoryFunctionMap);

export const evaluate = math.evaluate;
