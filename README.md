# Salo

https://salomath.netlify.app/

**Español** · [English](./README.en.md)

**Aprende matemáticas resolviendo problemas. / Learn math by solving problems.**

Salo es una app web de aprendizaje **activo** de matemáticas, inspirada en la
filosofía de Brilliant × Duolingo: nada de vídeos ni textos largos, sino
widgets manipulables, feedback inmediato e intuición visual. Es una **PWA
offline-first**, gratuita, instalable y bilingüe (ES/EN).

> Salo is an interactive math-learning PWA: manipulable widgets, instant
> feedback, spaced repetition, and endless procedurally-generated practice.
> Free, installable, works offline, bilingual (Spanish/English).

## ✨ Características

- **Lecciones interactivas** declarativas (JSON validado con Zod) con
  exposiciones breves, widgets y preguntas.
- **Validación 100% determinista** de respuestas (equivalencia algebraica con
  mathjs) — nunca con IA.
- **Widgets manipulables** reutilizables (recta numérica, diferencia de
  cuadrados, modelo de áreas, figuras geométricas).
- **Repetición espaciada** (cajas Leitner) y **práctica infinita** con problemas
  generados proceduralmente, siempre distintos.
- **Tutor socrático** opcional (IA como mejora progresiva; la app es completa
  sin conexión y sin IA).
- **Bilingüe ES/EN** con un botón; funciona **sin conexión** tras la primera
  visita.

## 🚀 Desarrollo

Requisitos: Node 20+.

```bash
npm install
npm run dev            # servidor de desarrollo
npm run build          # build de producción (dist/)
npm run preview        # sirve el build

npm run check          # tsc --noEmit && eslint
npm run validate:content  # valida todas las lecciones/cursos (ES y EN)
npm test               # tests (vitest)
```

## 🧱 Arquitectura (resumen)

- `src/engine/` — esquema Zod (`schema.ts`), `LessonPlayer`, validación de
  respuestas, store (Zustand + persist), generación procedural.
- `src/widgets/` — registro de widgets (lazy) + un archivo por widget.
- `src/content/` — lecciones (`lessons/`, `lessons/en/`) y cursos
  (`courses/`, `courses/en/`).
- `src/i18n/` — internacionalización ligera ES/EN.
- `src/ai/` — capa de IA opcional (cliente abstracto Anthropic/Ollama).

Más detalle en [`CLAUDE.md`](./CLAUDE.md).

## 🤝 Contribuir

¡Bienvenidas las contribuciones! Puedes aportar **problemas, lecciones o
mejoras**. Lee [`CONTRIBUTING.md`](./CONTRIBUTING.md) antes de empezar.

## 📄 Licencia

Este proyecto usa la **[PolyForm Noncommercial License 1.0.0](./LICENSE.md)**.

En corto: **puedes usar, estudiar, modificar y compartir Salo libremente para
cualquier fin NO comercial** (uso personal, educativo, ONG, instituciones
públicas…). **No está permitido el uso comercial / lucrativo.** Al contribuir,
aceptas que tu aportación se distribuya bajo esta misma licencia.

> In short: free to use, study, modify and share for any **noncommercial**
> purpose. **Commercial/for-profit use is not permitted.**
