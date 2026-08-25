# Salo

[Español](./README.md) · **English**

**Learn math by solving problems.**

Salo is an **active** math-learning web app inspired by the Brilliant × Duolingo
philosophy: no videos or walls of text, but manipulable widgets, instant
feedback, and visual intuition. It's an **offline-first PWA** — free,
installable, and bilingual (Spanish/English).

## ✨ Features

- **Interactive, declarative lessons** (JSON validated with Zod) built from short
  expositions, widgets, and questions.
- **100% deterministic answer checking** (algebraic equivalence via mathjs) —
  never done by AI.
- **Reusable manipulable widgets** (number line, difference of squares, area
  model, geometric figures).
- **Spaced repetition** (Leitner boxes) and **endless practice** with
  procedurally generated problems that are always different.
- **Optional Socratic tutor** (AI as progressive enhancement; the app is fully
  functional offline and without AI).
- **Bilingual EN/ES** with one button; works **offline** after the first visit.

## 🚀 Development

Requirements: Node 20+.

```bash
npm install
npm run dev            # dev server
npm run build          # production build (dist/)
npm run preview        # serve the build

npm run check          # tsc --noEmit && eslint
npm run validate:content  # validate every lesson/course (ES and EN)
npm test               # tests (vitest)
```

## 🧱 Architecture (overview)

- `src/engine/` — Zod schema (`schema.ts`), `LessonPlayer`, answer validation,
  store (Zustand + persist), procedural generation.
- `src/widgets/` — widget registry (lazy) + one file per widget.
- `src/content/` — lessons (`lessons/`, `lessons/en/`) and courses
  (`courses/`, `courses/en/`).
- `src/i18n/` — lightweight EN/ES internationalization.
- `src/ai/` — optional AI layer (abstract Anthropic/Ollama client).

More detail in [`CLAUDE.md`](./CLAUDE.md).

## 🤝 Contributing

Contributions are welcome! You can contribute **bug reports, lessons, or
improvements**. Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before you start.

## 📄 License

This project uses the **[PolyForm Noncommercial License 1.0.0](./LICENSE.md)**.

In short: **you may freely use, study, modify and share Salo for any
NONCOMMERCIAL purpose** (personal, educational, non-profit, public
institutions…). **Commercial / for-profit use is not permitted.** By
contributing, you agree your contribution is distributed under this same
license.
