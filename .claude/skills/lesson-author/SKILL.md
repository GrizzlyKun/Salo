---
name: lesson-author
description: Autoría de lecciones para Lumen — el proceso completo para escribir, editar o revisar lecciones interactivas en JSON. Usa esta skill SIEMPRE que la tarea involucre crear una lección nueva, añadir o modificar steps, preguntas, hints o feedback, revisar contenido pedagógico existente, planificar una unidad del curso, o convertir material externo (ej. OpenStax) al formato de Lumen — aunque el usuario no mencione la palabra "lección" (ej. "añade contenido sobre ecuaciones", "crea la unidad de fracciones", "el feedback de este paso suena seco").
---

# Lesson Author — Autoría de Lecciones de Lumen

Guía para escribir lecciones que enseñen de verdad. Una lección de Lumen no es un texto con preguntas: es una experiencia interactiva donde el usuario **descubre** la idea manipulándola. Brilliant por dentro, Duolingo por fuera.

## Proceso (siempre en este orden)

1. **Lee la fuente de verdad:** `src/engine/schema.ts` define los tipos de step y sus límites exactos. Ante cualquier duda entre esta guía y el esquema, gana el esquema.
2. **Revisa los widgets disponibles** en `src/widgets/registry.ts`. Diseña la lección alrededor de un widget existente si es posible. Si el concepto exige un widget nuevo, propónlo ANTES de escribir la lección (widget genérico reutilizable > widget de un solo uso).
3. **Diseña el arco** (ver abajo) antes de escribir JSON.
4. **Escribe el JSON** en `src/content/lessons/<id>.json` (id en kebab-case = nombre del archivo).
5. **Regístrala** en la unidad correspondiente de `src/content/course.json` (el orden en `lessonIds` es el orden de desbloqueo).
6. **Valida:** `npm run validate:content` debe pasar en verde. Si falla, arregla el contenido, no el validador.

## El arco de una buena lección (8–12 steps, 3–5 min)

1. **Gancho visual** (`exposition`, 1 step): una pregunta o imagen mental intrigante. Nunca una definición.
2. **Manipulación libre** (`widget`): el usuario juega ANTES de que le expliquen nada. El caption invita a explorar.
3. **Primera pregunta fácil** sobre lo que acaba de ver/tocar. Debe ser casi imposible fallarla si manipuló el widget: construye confianza.
4. **El momento "ajá"** (`exposition` + `widget` o pregunta): la idea central emerge de lo observado. Aquí vive la magia de la lección.
5. **Aplicación con sustancia**: usar la idea para algo con valor propio (un truco mental, un caso real).
6. **Transferencia o contraejemplo**: detectar cuándo NO aplica, o aplicarla en una forma nueva. Es la pregunta que más enseña.
7. **Cierre celebratorio** (`exposition`, 1 step): reconoce el logro, nombra lo aprendido sin formalismo, y anticipa qué sigue.

Reglas duras (el validador las impone): 4–14 steps, mínimo 1 pregunta por cada 3 steps, textos ≤500 caracteres. Objetivo real: que ningún step pase de 2–3 frases.

## Cómo escribir cada pieza

**Exposiciones.** Una sola idea por step. Si necesitas "y además...", son dos steps. Intuición primero, término técnico después (o nunca). Prohibido: párrafos, definiciones formales de entrada, "en matemáticas se denomina...".

**Preguntas.** Cada pregunta enseña algo nuevo — nunca dos preguntas idénticas con otros números (eso es el modo práctica, no la lección). La dificultad sube en escalera: fácil → media → transferencia.

**Distractores (multiple-choice).** Cada opción incorrecta representa un error conceptual REAL que un estudiante cometería (ej.: para $a^2-b^2$, el distractor $(a-b)^2$ captura la confusión clásica). Nada de relleno absurdo. 3 opciones suelen bastar; 4–5 solo si hay 3–4 errores conceptuales genuinos.

**Feedback.** `correct`: celebra + refuerza el porqué en una frase ("¡Eso es! El área no cambió al reorganizar: solo la forma"). `incorrect`: amable, sin castigo, orienta el razonamiento SIN dar la respuesta — idealmente una pregunta que reencamina ("¿Cómo se calcula el área de un rectángulo?"). Nunca "Incorrecto." a secas.

**Hints (máx. 3).** Revelado progresivo: (1) sutil — señala dónde mirar, (2) media — da el primer paso, (3) directa — deja la respuesta a un paso trivial. El último hint NUNCA es la respuesta literal.

**Voz.** Cálida, cómplice, de tú. Emojis con moderación (0–1 por step, con propósito: 👀 ✨ 🎉). Celebra el error como parte del proceso. Referencia de tono: `src/design-system/copy.ts`.

## KaTeX en JSON — reglas técnicas

- LaTeX inline entre `$...$`. No hay modo display: si una fórmula necesita protagonismo, es señal de que falta un widget o una figura.
- **En JSON las barras se escapan dobles:** `$x \\cdot y$`, `$\\frac{a}{b}$`, `$\\times$`. Barra simple = JSON inválido o render roto.
- Comandos seguros habituales: `\\cdot`, `\\times`, `\\frac{}{}`, `\\sqrt{}`, `^`, `_`. Verifica cualquier comando exótico renderizando antes de commitear.
- Números y variables sueltas dentro de una frase también van en `$...$` ($a = 5$), para consistencia tipográfica.

## Errores comunes (revisa esta lista antes de validar)

- Lección "pasiva": tres exposiciones seguidas sin interacción. Máximo 2 `exposition` consecutivas.
- Pregunta antes del widget que da el contexto para responderla.
- `answerId` que no coincide con ningún `id` de `choices` (el validador lo caza, pero revisa).
- Feedback incorrecto que regala la respuesta → mata el reintento.
- Olvidar registrar la lección en `course.json` → queda inalcanzable (el validador lo caza).
- Copiar estructura/textos de Brilliant u otra fuente con copyright. Inspiración pedagógica sí; contenido, jamás. Fuentes abiertas OK (OpenStax CC-BY) siempre transformadas a formato interactivo, nunca pegadas.

## Definición de "terminada"

Una lección está lista cuando: `npm run validate:content` pasa ✅, el arco completo está presente, cada distractor encarna un error real, todo el feedback explica el porqué, y al leerla en voz alta suena a un amigo entusiasta explicándote algo — no a un libro de texto.
