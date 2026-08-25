# Salo

https://salomath.netlify.app/

**Español** · [English](./README.en.md)

**Aprende matemáticas resolviendo problemas. / Learn math by solving problems.**

Salo es una app web de aprendizaje **activo** de matemáticas, inspirada en la
filosofía de Brilliant × Duolingo: nada de vídeos ni textos largos, sino
widgets manipulables, feedback inmediato e intuición visual. Es una **PWA
offline-first**, gratuita, instalable y bilingüe (ES/EN).

- 🌐 **En producción:** <https://salomath.netlify.app>
- 📦 **Repositorio:** <https://github.com/GrizzlyKun/Salo>
- 🧠 **Memoria del proyecto para trabajar en él:** [`CLAUDE.md`](./CLAUDE.md)
  (léelo al iniciar cualquier sesión de desarrollo).

---

## 🎯 Visión

Todo el producto es un **motor que renderiza contenido declarativo (JSON)**. Las
lecciones son **datos, no código**. El aprendizaje es activo: cada pregunta
enseña algo, el feedback explica el *porqué* y los errores no penalizan.

Modelo pedagógico híbrido: **interior de la lección al estilo Brilliant**
(intuición con widgets y explicaciones visuales) y **exterior al estilo
Duolingo** (sesiones cortas, mapa de curso desbloqueable, XP, rachas, repetición
espaciada). **Sin corazones ni vidas**: equivocarse cuesta cero y enseña.

---

## ✨ Estado actual (qué hay hecho)

**Contenido** — 3 cursos, **18 lecciones bilingües** (ES/EN):
- **Álgebra esencial** (3 unidades, 12 lecciones): recta numérica (negativos,
  suma/resta con signo, fracciones, valor absoluto, desigualdades); productos
  notables y factorización (distributiva, factor común, diferencia de cuadrados,
  binomio al cuadrado, factorizar trinomios); ecuaciones y potencias.
- **Aritmética esencial** (fracciones/decimales, porcentajes).
- **Geometría visual** (áreas de rectángulo/triángulo, Pitágoras).

**Widgets manipulables** (4, genéricos y reutilizables, lazy-loaded):
`number-line`, `square-difference`, `area-model`, `geo-figure`.

**Motor y modos:**
- Reproductor de lecciones tipo conversación con feedback, pistas progresivas y
  tutor opcional.
- **Validación 100% determinista** de respuestas (equivalencia algebraica con
  `mathjs`, build `mathjs/number` para bundle mínimo). Nunca con IA.
- **Repetición espaciada** (cajas Leitner); el repaso puede mostrar **variantes
  nuevas** de las preguntas falladas (mismo concepto, otros números).
- **Práctica infinita**: 14 plantillas procedurales con RNG sembrado +
  anti-repetición y distractores basados en errores reales. Con dificultad.
- Mapa de curso con **nodos desbloqueables**, **XP**, **rachas** y **pantalla de
  progreso**.

**IA como mejora progresiva** (opcional, `src/ai/`): cliente abstracto
(API Anthropic u Ollama local por variable de entorno), generador de variaciones
parametrizadas (la IA propone params/enunciado; **el código calcula la
respuesta**) y **tutor socrático** que se activa tras 2 fallos. La app es
completa y excelente **sin IA y sin conexión**.

**Diseño ("ternura"):** paleta crema/coral/turquesa/miel, mascota SVG con
estados, microcopy cálido y aleatorio, confetti, **sonidos suaves** (Web Audio,
sin archivos) con toggle de silencio, y **splash** de 2 s al abrir.

**Plataforma:** PWA offline-first (`vite-plugin-pwa`, precache completo,
instalable), **i18n ES/EN** con botón, deploy estático en Netlify con
**auto-deploy desde GitHub**, y **CI** (GitHub Actions) que valida cada PR.

---

## 🧰 Stack

Vite · React 18 · TypeScript (estricto) · Tailwind · Framer Motion · Zustand
(persist) · Zod · KaTeX (`react-katex`) · mathjs · canvas-confetti ·
lucide-react · vite-plugin-pwa · Vitest.

---

## 🚀 Desarrollo

Requisitos: **Node 20+**.

```bash
npm install
npm run dev               # servidor de desarrollo
npm run build             # build de producción (dist/)
npm run preview           # sirve el build

npm run check             # tsc --noEmit && eslint
npm run validate:content  # valida lecciones y cursos (ES y EN) contra el esquema Zod
npm test                  # tests (vitest) — 51 tests
```

Antes de dar por terminado cualquier cambio: `npm run check && npm run
validate:content && npm test`.

---

## 🗂️ Estructura del proyecto

```
src/
├── engine/                     # el corazón (contenido = datos)
│   ├── schema.ts               # esquema Zod (fuente de verdad de tipos)
│   ├── LessonPlayer.tsx        # reproductor de lección (flujo conversación)
│   ├── StepRenderer.tsx        # renderiza cada step por tipo
│   ├── QuestionView.tsx        # preguntas: MC, numérica, manipulativa + tutor
│   ├── validate.ts             # validación determinista (mathjs)
│   ├── math.ts                 # instancia mínima de mathjs/number
│   ├── useLessonStore.ts       # Zustand + persist: XP, rachas, repaso Leitner
│   ├── generate.ts             # generación procedural (14 plantillas)
│   ├── PracticeSession.tsx     # repaso espaciado (con variantes)
│   └── InfinitePractice.tsx    # práctica infinita por tipo + dificultad
├── widgets/                    # registry.ts (lazy) + un archivo por widget
├── content/
│   ├── lessons/*.json          # lecciones (español)
│   ├── lessons/en/*.json       # traducciones (mismo id)
│   ├── courses/*.json          # cursos (español)
│   ├── courses/en/*.json       # cursos (inglés)
│   └── index.ts                # loader por idioma + useContent() + validaciones
├── i18n/i18n.tsx               # internacionalización ES/EN (diccionario + hook)
├── ai/                         # capa de IA opcional (client, prompts, generators, tutor)
├── design-system/             # Mascot, copy.ts (microcopy), sound.ts
└── components/                 # App-level: CourseMap, ProgressScreen, Splash, ui/
scripts/validate-content.ts     # valida todo el contenido (lo usa el CI)
.github/workflows/ci.yml        # CI: check + validate:content + test + build
netlify.toml, public/_redirects, public/_headers   # despliegue
```

---

## 📚 Modelo de contenido

Una **lección** es un JSON validado con Zod (`src/engine/schema.ts`) con
metadata (`id`, `title`, `unitId`, `order`, `xp`, `durationMinutes`, `summary`)
y una secuencia de **steps** (unión discriminada por `type`):

- `exposition` — texto breve con LaTeX inline entre `$...$`.
- `widget` — referencia por nombre al registry + `props`.
- `question` — variantes `multiple-choice`, `numeric-input`, `manipulative`;
  cada una con `feedback.correct/incorrect`, `hints[]` y, opcional, `templateId`
  (para ofrecer variantes procedurales en el repaso).

Un **curso** (`courses/*.json`) agrupa unidades → `lessonIds` (orden de
desbloqueo).

**Reglas que impone el validador** (ver `schema.ts` y `validate-content.ts`):
4–14 steps por lección, textos ≤500 caracteres, ≥1 pregunta por cada 3 steps,
máx. 2 exposiciones consecutivas, ids de step únicos, `templateId` y `lessonIds`
existentes, y **paridad de ids** entre ES y EN.

**Cómo añadir una lección:**
1. Crea `src/content/lessons/<id>.json` (kebab-case = nombre de archivo).
2. Regístrala en el curso correspondiente (`src/content/courses/*.json`).
3. (Opcional) versión en inglés en `lessons/en/<id>.json` con el **mismo id**.
4. `npm run validate:content` debe pasar en verde.
5. Guía de autoría completa: `.claude/skills/lesson-author/SKILL.md`.

---

## 🌍 i18n (ES/EN)

Diccionario incorporado en `src/i18n/i18n.tsx` (sin librerías): `useT()` para
textos, `LocaleProvider`, botón ES/EN en el Home, idioma persistido
(`salo-locale`) y por defecto según el navegador. **No hay traducción en vivo**:
las cadenas de UI y el contenido bilingüe se escriben en build (offline y
exacto, sin romper las matemáticas). El contenido en inglés vive en las
carpetas `en/` y el loader hace **fallback a español** si falta una traducción.

---

## 🤖 Capa de IA (opcional)

Configurable por variables de entorno (ver `.env.example`). Copia a `.env.local`:

```
VITE_AI_PROVIDER=anthropic   # "anthropic" | "ollama" | vacío para desactivar
VITE_ANTHROPIC_API_KEY=...   # solo uso local/personal (la clave viaja al navegador)
# VITE_AI_MODEL=claude-opus-4-8
# VITE_OLLAMA_URL=http://localhost:11434
```

Sin configurar, la IA simplemente no aparece: lecciones, hints, feedback,
validación y práctica funcionan igual. El SDK de Anthropic se carga de forma
diferida (dynamic import) para no engordar el bundle inicial.

---

## 🚢 Despliegue

Build estático (`vite build` → `dist/`) servido en **Netlify** con **auto-deploy
desde GitHub**: cada `git push` a `main` reconstruye y publica. Config en
`netlify.toml` (comando, Node 20, cabeceras) y `public/_redirects` /
`public/_headers` (fallback SPA + caché del service worker / manifest).

---

## 🤝 Contribuir

Se aceptan **problemas, lecciones y mejoras**. Lee
[`CONTRIBUTING.md`](./CONTRIBUTING.md). Cada PR pasa por el CI
(`check` + `validate:content` + `test` + `build`).

## 📄 Licencia

**[PolyForm Noncommercial License 1.0.0](./LICENSE.md)**: libre para usar,
estudiar, modificar y compartir con fines **no comerciales** (personal,
educativo, ONG, instituciones públicas). **No se permite el uso comercial /
lucrativo.** Contribuir implica aceptar esta licencia.

---

## 🧭 Roadmap / próximos pasos

Ideas pendientes (no bloqueantes; la app ya es completa):
- Más contenido: lecciones-gancho para temas que hoy solo tienen práctica
  procedural (orden de operaciones, ecuaciones de dos pasos, pendiente, media,
  probabilidad); ampliar geometría (perímetro, círculo, volumen); pilar de
  **programación** (requiere un widget de trazado/ejecución).
- **IA Fase 4**: capa de redacción de problemas de palabras (online), validada
  por código.
- Pulido: auditoría de **a11y** (axe-core), pantalla dedicada de rachas, más
  microinteracciones.
- Post-MVP de plataforma: **Tauri** (escritorio portable), backend opcional
  multiusuario.
