# Salo — Plataforma de Aprendizaje Interactivo

> **Nombre del producto: Salo** (antes "Lumen" durante el desarrollo inicial). El nombre visible está en `src/i18n/i18n.ts` (`APP_NAME`), `index.html` y el manifest de `vite.config.ts`. La clave del store en localStorage sigue siendo `lumen-progress` (no renombrar: perdería el progreso guardado de los usuarios).

> Archivo de memoria del proyecto para Claude Code. Léelo al inicio de cada sesión.
> **Mantenlo actualizado:** al completar hitos, tomar decisiones de arquitectura o cambiar convenciones, actualiza la sección correspondiente y el Roadmap.

## Visión

Clon local open-source inspirado en la filosofía de Brilliant.org: aprendizaje **activo** de matemáticas, álgebra y programación mediante resolución de problemas, widgets manipulables, feedback inmediato e intuición visual. Nada de videos ni textos largos.

**Principio rector:** todo el producto es un motor que renderiza contenido declarativo (JSON). Las lecciones son datos, no código.

**Nota legal:** inspiración en la filosofía pedagógica y patrones de interacción de Brilliant — NUNCA copiar sus lecciones, textos, ilustraciones ni marca. Contenido propio o adaptado de fuentes con licencia abierta (ej. OpenStax, CC).

## Stack Técnico

- **Build:** Vite + React 18 + TypeScript (estricto)
- **Estilos:** Tailwind CSS + tokens propios en `src/design-system/`
- **Animación:** Framer Motion (springs, no easings lineales)
- **Matemáticas:** KaTeX vía `react-katex` para render; `mathjs` para validación de equivalencia algebraica
- **Estado:** Zustand + middleware `persist` (localStorage). Sin backend en MVP.
- **Validación de esquemas:** Zod (fuente de verdad de tipos del contenido)
- **Iconos:** Lucide React
- **Geometría interactiva (si aplica):** JSXGraph envuelto en componente React, o SVG nativo
- **Celebraciones:** canvas-confetti
- **IA (Módulo 4):** cliente abstracto — API Anthropic o Ollama local, seleccionable por variable de entorno

## Arquitectura de Módulos

### Módulo 1 — Content Engine (esquema de lecciones)
- JSON puro validado con Zod en `src/engine/schema.ts`
- Una lección = secuencia de `steps` con unión discriminada por `type`:
  - `exposition` — texto breve con LaTeX inline (`$...$`)
  - `widget` — referencia por nombre al registry + `props`
  - `question` — variantes: `multiple-choice`, `numeric-input`, `manipulative`
- Cada question incluye: `answer`, `feedback.correct` / `feedback.incorrect` (explicación intuitiva, no formal), `hints[]` (revelado progresivo)
- Diseñado para que un LLM lo genere: campos con `.describe()` de Zod, estructuras estrictas
- Lecciones en `src/content/lessons/*.json`

### Módulo 2 — Lesson Player
- `<LessonPlayer lesson={...} />` en `src/engine/`
- Flujo tipo conversación: los steps anteriores permanecen visibles arriba; cada step nuevo entra animado
- "Continuar" bloqueado hasta responder la pregunta activa
- Validación determinista SIEMPRE (comparación exacta o `mathjs` para equivalencia). Nunca validar respuestas con LLM.
- Store Zustand: `completeStep`, `recordAnswer`, `streak`, log de intentos (step, respuesta, hints usados, tiempo) — este log alimenta al tutor IA

### Módulo 3 — Widget Registry
- `src/widgets/registry.ts`: mapa `string → React.lazy(componente)`
- Widgets reciben `props` del JSON y emiten `onInteraction` para preguntas manipulativas
- Primer widget: `square-difference` (diferencia de cuadrados) — SVG con sliders para a y b, animación de reorganización al rectángulo (a+b)(a−b)
- Widgets genéricos reutilizables > widgets de un solo uso (una recta numérica sirve para fracciones, desigualdades, valor absoluto…)

### Módulo 4 — AI Layer (post-MVP del motor)
- `src/ai/`: `client.ts` (proveedor abstracto), `prompts/` (versionados), `generators.ts`, `tutor.ts`
- **Patrón clave:** la IA genera problemas *parametrizados* (`params: {a: 7, b: 3}` + plantilla); la respuesta correcta la calcula el código a partir de los params. La IA nunca produce la solución.
- Todo JSON generado por IA pasa por el esquema Zod; lo inválido se rechaza y se reintenta
- Tutor socrático: se activa tras 2 fallos; recibe problema + respuesta errónea + log reciente del usuario

## Modelo Pedagógico: Híbrido Brilliant × Duolingo

- **Interior de la lección (Brilliant):** construir intuición con widgets manipulables y explicaciones visuales; cada pregunta enseña algo nuevo; el feedback siempre explica el "por qué".
- **Exterior de la lección (Duolingo):** sesiones de 3-5 min (8-12 steps máx.); mapa de curso tipo camino con nodos desbloqueables (`course.json`: unidades → lecciones en orden); XP por lección; rachas diarias; mascota reactiva; **modo práctica** con repetición espaciada de preguntas falladas.
- **SIN corazones/vidas:** errar cuesta cero y enseña mucho. No adoptar mecánicas de frustración diseñadas para monetizar.
- Metadata de lección en el esquema: `xp`, `durationMinutes`, `unitId`, `order`.
- El store registra fallos por pregunta para alimentar el modo práctica.

## Sistema de Diseño ("ternura")

Referencia emocional: Duolingo. Referencia de sobriedad estructural: Brilliant.

- **Paleta:** fondo crema `#FDF8F3`; acentos coral, turquesa, amarillo miel; `rounded-2xl`; sombras suaves, sin bordes duros
- **Tipografía:** Nunito o Quicksand (títulos), Inter (cuerpo)
- **Mascota:** componente `<Mascot mood="..." />` en SVG con estados: `neutral`, `thinking`, `celebrating`, `encouraging`, `sleeping`. Aparece junto al feedback.
- **Microcopy:** centralizado en `src/design-system/copy.ts`, tono cálido, con variaciones aleatorias ("¡Casi! Mira esto de nuevo 👀" en vez de "Incorrecto")
- **Microinteracciones:** springs de Framer Motion; confetti al completar lección; barra de progreso con "pop"
- **Sonido:** pling suave al acertar, con toggle de silencio

## Estructura de Carpetas

```
src/
├── content/lessons/*.json     # lecciones declarativas
├── engine/                    # schema.ts (Zod), LessonPlayer, StepRenderer, validación, useLessonStore
├── widgets/                   # registry.ts + un archivo por widget
├── ai/                        # client, prompts/, generators, tutor (Módulo 4)
├── design-system/             # tokens, copy.ts, Mascot
└── components/ui/             # MathText, Button, FeedbackCard, HintReveal
```

## Portabilidad y Misión de Acceso

**Misión:** app gratuita y de la misma calidad que las de pago, accesible para quien no puede pagar una suscripción. Esto convierte el modo offline en requisito de primera clase, no en extra.

- **Objetivo primario: PWA offline-first** con `vite-plugin-pwa` — instalable en Android/iOS/escritorio, funciona sin conexión tras la primera visita. Progreso en localStorage/IndexedDB del dispositivo. ✅ _Implementado (2026-08-24): manifest, iconos, SW con precache total y autoUpdate._
- **Hosting:** build estático (`vite build` → `dist/`) desplegable gratis en GitHub Pages / Netlify / Cloudflare Pages. Cero coste de servidor.
- **Escritorio portable (post-MVP):** Tauri (~10MB, corre desde USB sin instalar). No usar Electron.
- **Distribución extrema:** la app estática debe poder servirse desde una Raspberry Pi o compartirse como ZIP (aulas sin internet).
- **Regla de oro: la app debe ser completa y excelente SIN la capa de IA.** La IA (Módulo 4) es mejora progresiva cuando hay conexión — nunca una dependencia del flujo principal. Lecciones, hints, feedback y validación funcionan 100% offline.
- Presupuesto de rendimiento: debe correr fluido en Android de gama baja. Vigilar peso del bundle (lazy-load de widgets ya lo ayuda; evitar librerías pesadas).

## Tooling de Claude Code (plan por fases)

Principio: cada herramienta llega cuando resuelve un dolor real, no antes. Los checks deterministas valen más que agentes revisores.

- **Fase 0 (ya):** este `CLAUDE.md` + scripts en `package.json`:
  - `"check": "tsc --noEmit && eslint ."`
  - `"validate:content": "tsx scripts/validate-content.ts"` — valida TODOS los JSON de lecciones contra el esquema Zod. Ejecutar `npm run check && npm run validate:content` antes de dar por terminado cualquier hito.
  - Vitest para la lógica de validación de respuestas (equivalencias con mathjs) desde el día 1.
  - Hook de Claude Code que ejecute ambos scripts como quality gate al finalizar tareas.
- **Fase UI (cuando exista interfaz):** Playwright MCP para verificar visualmente widgets SVG en viewport móvil. Es el ÚNICO servidor MCP del proyecto — no añadir Git/Fetch MCP (redundantes con las capacidades nativas; MCP cuesta contexto).
- **Fase contenido (al escribir lecciones en volumen):** skill `lesson-author` en `.claude/skills/` — guía de autoría (modelo pedagógico, sintaxis KaTeX, estructura de hints) + validación Zod integrada.
- **Fase PWA:** `size-limit` en el check (presupuesto de bundle para gama baja); auditoría de service worker; tests a11y con axe-core, complementados por un subagente revisor de accesibilidad.
- NO crear subagentes para el trabajo central (widgets, engine) — las convenciones de este archivo bastan.

## Convenciones de Código

- TypeScript estricto; tipos derivados de Zod con `z.infer` — no duplicar tipos a mano
- Componentes funcionales, hooks; sin clases
- Un widget = un archivo; lazy-loaded desde el registry
- Los widgets NUNCA importan lógica de lección; solo reciben props y emiten eventos
- Commits pequeños y descriptivos; español o inglés consistente (elegir uno)
- Accesibilidad mínima: widgets manejables por teclado, contraste AA

## Roadmap / Estado

- [x] **M1:** Esquema Zod completo + 1 lección de ejemplo en JSON _(2026-08-24)_
- [x] **M2:** LessonPlayer con steps `exposition` + `multiple-choice` + `numeric-input`, feedback, hints, store persistente (walking skeleton de punta a punta) _(2026-08-24)_
- [x] **M3:** Widget registry + widget `square-difference` funcionando (lazy-loaded, con variante `manipulative`) _(2026-08-24)_
- [x] Sistema de diseño v1: tokens Tailwind, Mascot, copy.ts, confetti _(2026-08-24)_
- [x] Curso piloto → **3 cursos, 18 lecciones**; 4 widgets genéricos (`square-difference`, `number-line`, `area-model`, `geo-figure`). Cursos: "Álgebra esencial" (3 unidades, 12), "Aritmética esencial" (3) y "Geometría visual" (3) _(2026-08-24)_
- [x] **M4:** AI Layer — cliente abstracto (Anthropic/Ollama por env), generador de variaciones parametrizadas (respuesta calculada por código, JSON validado con Zod) y tutor socrático tras 2 fallos _(2026-08-24)_
- [x] Rachas diarias y pantalla de progreso _(2026-08-24; `ProgressScreen`: racha con estado, XP, avance del curso, precisión y estado de repaso)_
- [x] Mapa de curso tipo camino (nodos desbloqueables) + XP _(2026-08-24; `course.json` + `CourseMap`, desbloqueo por orden del curso)_
- [x] Modo práctica con repetición espaciada de preguntas falladas _(2026-08-24; cajas Leitner en el store —`nextReview`/`selectDuePractice`— y `PracticeSession`). Si la pregunta tiene `templateId`, el repaso muestra una **variante nueva** (mismos conceptos, otros números) y agenda contra el id original (`QuestionView.recordStepId`)._
- [x] Generación procedural + práctica infinita _(2026-08-24; `engine/generate.ts`: plantillas parametrizadas con RNG sembrado, anti-repetición y distractores por misconception; `InfinitePractice` con dificultad. **14 plantillas** en 8 habilidades: productos notables, factorización, aritmética/orden de operaciones, fracciones, ecuaciones, expresiones, rectas, geometría, estadística y probabilidad. El test parametrizado valida cada plantilla generando 25 problemas)_
- [ ] (Futuro) Backend opcional para multiusuario; guía de contribución para creadores de lecciones

## Decisiones Tomadas (log)

- 2026-08: JSON puro sobre MDX para el MVP (menos complejidad de build)
- 2026-08: Vite sobre Next.js (MVP local, sin SSR)
- 2026-08: Validación de respuestas 100% determinista; IA solo para generación de contenido y tutoría
- 2026-08: Zustand + localStorage; la firma del store se mantiene al migrar a backend
- 2026-08: PWA offline-first como objetivo de distribución primario; Tauri como opción de escritorio post-MVP
- 2026-08: La IA es mejora progresiva — la app completa debe funcionar sin conexión y sin IA
- 2026-08-24: ~~`mathjs` completo infla el bundle principal (~379 kB gzip). Deuda técnica: migrar a la factory `mathjs/number`.~~ **RESUELTO (2026-08-24):** validación usa `mathjs/number` con solo las dependencias aritméticas necesarias (`src/engine/math.ts`) y el `LessonPlayer` (con mathjs + KaTeX) se carga lazy. Bundle inicial: 381 → **107 kB gzip**. Para añadir funciones al validador (log, trig…), importar su `*Dependencies` en `math.ts`.
- 2026-08-24: Validación de `multiple-choice` (answerId ∈ choices) se hace con `superRefine` sobre la unión, no con `.refine` por miembro — `z.discriminatedUnion` no admite `ZodEffects` como miembro.
- 2026-08-24: El esquema impone las reglas de autoría que promete la skill `lesson-author`: 4–14 steps, textos ≤500 caracteres, ≥1 pregunta por cada 3 steps y máx. 2 exposiciones consecutivas (`superRefine` en `lessonSchema`). Fijadas con tests en `schema.test.ts`.
- 2026-08-24: Modo práctica = repetición espaciada Leitner (cajas 0→3, intervalos 0/1/3/7 días; al graduar sale del repaso). Lógica pura en `nextReview`/`selectDuePractice` (store v2, migración desde `failedQuestionIds`). El fallo reinicia a caja 0.
- 2026-08-24: PWA offline-first con `vite-plugin-pwa` (`registerType: autoUpdate`). Precache completo (JS/CSS/HTML/fuentes KaTeX, ~1.9 MiB) → funciona 100% sin conexión tras la 1ª visita. Iconos generados con `@vite-pwa/assets-generator` desde `public/favicon.svg`. Sin badge en-app para evitar doble registro del SW.
- 2026-08-24: Renombrado a **Salo** + splash de 2s al abrir (`components/Splash.tsx`).
- 2026-08-24: i18n ES/EN ligero sin librerías (`src/i18n/i18n.tsx`): diccionario incorporado + `useT()` + `LocaleProvider` + botón ES/EN en el Home; idioma persistido (`salo-locale`), por defecto según el navegador. El microcopy vive ahí y `design-system/copy.ts` lo reexporta.
- 2026-08-24: **Contenido bilingüe (Fase B) completa.** ES en `content/lessons/*.json` y `content/courses/*.json`; EN en `content/lessons/en/*.json` y `content/courses/en/*.json` (mismos ids). El loader (`content/index.ts`) expone `useContent()` con helpers ligados al idioma y **fallback a ES** si falta una traducción; los componentes lo consumen. Las 14 plantillas procedurales redactan ES/EN vía `ctx.locale` (título/skill son `{es,en}`); `createProblemGenerator` recibe `locale`. `validate-content` valida también `en/` y exige paridad de ids. No hay traductor en vivo offline que respete las matemáticas: las traducciones se escriben en build.
- 2026-08-24: Repaso espaciado con variantes. Las preguntas pueden declarar `templateId` (opcional en el esquema); en el repaso, `PracticeSession` genera una variante procedural de esa plantilla pero registra el intento contra el id ORIGINAL (`QuestionView.recordStepId`), de modo que las cajas Leitner siguen agendadas por concepto. El loader y `validate-content` verifican que cada `templateId` exista. Etiquetadas: diferencia de cuadrados (cálculo y factorización), binomio cuadrado perfecto, factorizar trinomios.
- 2026-08-24: Generación procedural offline en `engine/generate.ts` (independiente de la capa IA). Patrón recomendado por la literatura (plantillas parametrizadas + verificación programática): el código calcula la respuesta y los distractores encarnan errores reales; RNG sembrado (mulberry32) + anti-repetición por firma. Cada plantilla = práctica infinita. `QuestionView` acepta `persist={false}` para no ensuciar XP/repaso con preguntas efímeras. Amplía contenido sin autorar lecciones a mano.
- 2026-08-24: Contenido multi-materia. El loader carga varios cursos desde `src/content/courses/*.json` (antes un único `course.json`); `courses: Course[]` y `courseOrder(course)`. El Home muestra un selector de curso (pestañas) y `CourseMap` recibe el curso. `validate-content` valida todos los cursos y avisa de lecciones huérfanas. Widget nuevo `geo-figure` (rectángulo con rejilla + triángulo rectángulo) para áreas y Pitágoras.
- 2026-08-24: M4 (IA) implementado. Cliente abstracto `src/ai/client.ts` (Anthropic vía SDK con `dangerouslyAllowBrowser` + dynamic import para no tocar el bundle inicial; u Ollama local), seleccionable con `VITE_AI_PROVIDER`. Modelo por defecto `claude-opus-4-8` (override con `VITE_AI_MODEL`); sin `temperature` (Opus 4.8 la rechaza). Generador: la IA solo propone `params`+enunciado, el código calcula la respuesta y todo pasa por el esquema Zod; hay fallback offline con params locales. Tutor socrático: no recibe la respuesta correcta, solo problema+error+log. Config en `.env.example`. Consultar la skill `claude-api` para IDs de modelo y uso del SDK.
- 2026-08-25: **Publicado.** En producción en Netlify (<https://salomath.netlify.app>) con **auto-deploy desde GitHub** (<https://github.com/GrizzlyKun/Salo>). Licencia **PolyForm Noncommercial 1.0.0** (`LICENSE.md`): uso no comercial, contribuciones bienvenidas. `README.md`/`README.en.md` (bilingües y detallados), `CONTRIBUTING.md`, plantillas de issues/PR en `.github/`, y **CI** (`.github/workflows/ci.yml`: check + validate:content + test + build en cada push/PR). La clave del store en localStorage sigue siendo `lumen-progress` (no renombrar).
- 2026-08-25: Fix móvil — el `numeric-input` usaba `inputMode="decimal"` (sin `−` ni `/`); ahora `inputMode="text"` (permite negativos y fracciones).
- 2026-08-25: UX navegación — botón de **Inicio** (`components/ui/HomeButton.tsx`) siempre visible arriba en lección, práctica y práctica infinita (vuelve al menú en un toque). En práctica infinita, la sesión recibe `onBack` (elegir tipo) y `onHome` (inicio).
- 2026-08-25: **Sonidos** (`design-system/sound.ts`) con Web Audio API (sin archivos, offline): pling al acertar, tono grave suave al fallar, arpegio C–E–G al completar. Toggle de silencio en el Home (persistido en `salo-muted`); el sonido de completar suena aun con `prefers-reduced-motion`.
