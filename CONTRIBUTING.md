# Contribuir a Salo / Contributing to Salo

¡Gracias por querer aportar! Se aceptan **problemas, lecciones y mejoras de
código**. / Thanks for helping! We welcome **problem reports, new lessons, and
code improvements**.

## Licencia de las contribuciones / Contribution license

Al enviar un cambio (issue, PR, lección…) aceptas que se publique bajo la
**[PolyForm Noncommercial License 1.0.0](./LICENSE.md)** del proyecto. Salo es
de uso **no comercial**: la idea es que sea gratis y de calidad para quien no
puede pagar, y que **nadie saque provecho lucrativo** de él.

## Cómo aportar / How to contribute

1. **Abre un issue** para reportar un bug, proponer una lección o discutir una
   mejora antes de un PR grande.
2. Haz un **fork**, crea una rama y envía un **Pull Request**.
3. Antes de abrir el PR, pasa todos los controles:

   ```bash
   npm run check            # tipos + lint
   npm run validate:content # valida lecciones y cursos (ES y EN)
   npm test                 # tests
   ```

   Un PR con estos tres en verde es mucho más fácil de revisar y aceptar.

## Escribir lecciones / Authoring lessons

- Las lecciones son **datos** (`src/content/lessons/*.json`), validados con Zod
  (`src/engine/schema.ts`). El esquema es la fuente de verdad.
- Regístralas en el curso correspondiente (`src/content/courses/*.json`).
- Si añades la versión en inglés, va en `src/content/lessons/en/` con el
  **mismo `id`** (y el curso en `src/content/courses/en/`).
- Hay una guía de autoría en `.claude/skills/lesson-author/SKILL.md` (modelo
  pedagógico, arco de la lección, sintaxis KaTeX, estructura de pistas).
- Reglas que impone el validador: 4–14 steps, textos ≤500 caracteres, ≥1
  pregunta por cada 3 steps, máx. 2 exposiciones seguidas.
- **Contenido propio o de fuentes con licencia abierta** (p. ej. OpenStax,
  CC), siempre transformado a formato interactivo. Nunca copiar lecciones,
  textos ni ilustraciones de plataformas con copyright.

## Convenciones de código / Code conventions

- TypeScript estricto; tipos derivados de Zod (`z.infer`), no duplicados.
- Componentes funcionales con hooks; un widget = un archivo, lazy-loaded.
- Los widgets nunca importan lógica de lección: reciben props y emiten eventos.
- Accesibilidad mínima: manejable por teclado, contraste AA.
- Textos de interfaz siempre vía i18n (`useT`), en ES y EN.

## Idioma / Language

Puedes escribir issues y PRs en español o en inglés. / You may write issues and
PRs in Spanish or English.
