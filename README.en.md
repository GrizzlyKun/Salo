# Salo

[Español](./README.md) · **English**

**Learn math by solving problems.**

Salo is an **active** math-learning web app inspired by the Brilliant × Duolingo
philosophy: no videos or walls of text, but manipulable widgets, instant
feedback, and visual intuition. It's an **offline-first PWA** — free,
installable, and bilingual (Spanish/English).

- 🌐 **Live:** <https://salomath.netlify.app>
- 📦 **Repository:** <https://github.com/GrizzlyKun/Salo>
- 🧠 **Project memory for working on it:** [`CLAUDE.md`](./CLAUDE.md)
  (read it at the start of any development session).

---

## 🎯 Vision

The whole product is an **engine that renders declarative content (JSON)**.
Lessons are **data, not code**. Learning is active: every question teaches
something, feedback explains the *why*, and mistakes don't penalize.

Hybrid pedagogy: **inside the lesson, Brilliant-style** (intuition through
widgets and visual explanations) and **outside, Duolingo-style** (short
sessions, an unlockable course map, XP, streaks, spaced repetition). **No hearts
or lives** — getting it wrong costs nothing and teaches a lot.

---

## ✨ Current status (what's built)

**Content** — 3 courses, **18 bilingual lessons** (EN/ES):
- **Essential algebra** (3 units, 12 lessons): number line (negatives, signed
  add/subtract, fractions, absolute value, inequalities); special products and
  factoring (distributive, common factor, difference of squares, square of a
  binomial, factoring trinomials); equations and exponents.
- **Essential arithmetic** (fractions/decimals, percentages).
- **Visual geometry** (rectangle/triangle areas, Pythagoras).

**Manipulable widgets** (4, generic and reusable, lazy-loaded): `number-line`,
`square-difference`, `area-model`, `geo-figure`.

**Engine and modes:**
- Conversation-style lesson player with feedback, progressive hints, optional
  tutor.
- **100% deterministic answer checking** (algebraic equivalence via `mathjs`,
  `mathjs/number` build for a tiny bundle). Never via AI.
- **Spaced repetition** (Leitner boxes); review can present **fresh variants** of
  missed questions (same concept, new numbers).
- **Endless practice**: 14 procedural templates with seeded RNG +
  anti-repetition and misconception-based distractors. With difficulty levels.
- Course map with **unlockable nodes**, **XP**, **streaks**, and a **progress
  screen**.

**AI as progressive enhancement** (optional, `src/ai/`): abstract client
(Anthropic API or local Ollama via env var), parameterized variation generator
(the AI proposes params/prompt; **code computes the answer**), and a **Socratic
tutor** that appears after 2 wrong attempts. The app is complete and excellent
**without AI and offline**.

**Design ("warmth"):** cream/coral/turquoise/honey palette, an SVG mascot with
moods, warm randomized microcopy, confetti, **soft sounds** (Web Audio, no
files) with a mute toggle, and a 2s **splash** on open.

**Platform:** offline-first PWA (`vite-plugin-pwa`, full precache, installable),
**EN/ES i18n** with a button, static deploy on Netlify with **auto-deploy from
GitHub**, and **CI** (GitHub Actions) validating every PR.

---

## 🧰 Stack

Vite · React 18 · TypeScript (strict) · Tailwind · Framer Motion · Zustand
(persist) · Zod · KaTeX (`react-katex`) · mathjs · canvas-confetti ·
lucide-react · vite-plugin-pwa · Vitest.

---

## 🚀 Development

Requirements: **Node 20+**.

```bash
npm install
npm run dev               # dev server
npm run build             # production build (dist/)
npm run preview           # serve the build

npm run check             # tsc --noEmit && eslint
npm run validate:content  # validate lessons & courses (ES and EN) against the Zod schema
npm test                  # tests (vitest) — 51 tests
```

Before finishing any change: `npm run check && npm run validate:content &&
npm test`.

---

## 🗂️ Project layout

```
src/
├── engine/                     # the core (content = data)
│   ├── schema.ts               # Zod schema (source of truth for types)
│   ├── LessonPlayer.tsx        # lesson player (conversation flow)
│   ├── StepRenderer.tsx        # renders each step by type
│   ├── QuestionView.tsx        # questions: MC, numeric, manipulative + tutor
│   ├── validate.ts             # deterministic checking (mathjs)
│   ├── math.ts                 # minimal mathjs/number instance
│   ├── useLessonStore.ts       # Zustand + persist: XP, streaks, Leitner review
│   ├── generate.ts             # procedural generation (14 templates)
│   ├── PracticeSession.tsx     # spaced repetition (with variants)
│   └── InfinitePractice.tsx    # endless practice by type + difficulty
├── widgets/                    # registry.ts (lazy) + one file per widget
├── content/
│   ├── lessons/*.json          # lessons (Spanish)
│   ├── lessons/en/*.json       # translations (same id)
│   ├── courses/*.json          # courses (Spanish)
│   ├── courses/en/*.json       # courses (English)
│   └── index.ts                # per-locale loader + useContent() + checks
├── i18n/i18n.tsx               # EN/ES internationalization (dictionary + hook)
├── ai/                         # optional AI layer (client, prompts, generators, tutor)
├── design-system/             # Mascot, copy.ts (microcopy), sound.ts
└── components/                 # app-level: CourseMap, ProgressScreen, Splash, ui/
scripts/validate-content.ts     # validates all content (used by CI)
.github/workflows/ci.yml        # CI: check + validate:content + test + build
netlify.toml, public/_redirects, public/_headers   # deployment
```

---

## 📚 Content model

A **lesson** is a JSON validated with Zod (`src/engine/schema.ts`) with metadata
(`id`, `title`, `unitId`, `order`, `xp`, `durationMinutes`, `summary`) and a
sequence of **steps** (discriminated union by `type`):

- `exposition` — short text with inline LaTeX between `$...$`.
- `widget` — reference by name to the registry + `props`.
- `question` — variants `multiple-choice`, `numeric-input`, `manipulative`; each
  with `feedback.correct/incorrect`, `hints[]` and, optionally, `templateId` (to
  offer procedural variants during review).

A **course** (`courses/*.json`) groups units → `lessonIds` (unlock order).

**Rules enforced by the validator** (see `schema.ts` and
`validate-content.ts`): 4–14 steps per lesson, text ≤500 chars, ≥1 question per
3 steps, max 2 consecutive expositions, unique step ids, existing `templateId`
and `lessonIds`, and **id parity** between ES and EN.

**How to add a lesson:**
1. Create `src/content/lessons/<id>.json` (kebab-case = file name).
2. Register it in the matching course (`src/content/courses/*.json`).
3. (Optional) English version at `lessons/en/<id>.json` with the **same id**.
4. `npm run validate:content` must pass.
5. Full authoring guide: `.claude/skills/lesson-author/SKILL.md`.

---

## 🌍 i18n (EN/ES)

Built-in dictionary in `src/i18n/i18n.tsx` (no libraries): `useT()` for strings,
`LocaleProvider`, an EN/ES button on the Home, persisted locale (`salo-locale`)
defaulting to the browser's. **No live translation** — UI strings and bilingual
content are written at build time (offline and exact, without breaking the
math). English content lives in the `en/` folders, and the loader **falls back
to Spanish** if a translation is missing.

---

## 🤖 AI layer (optional)

Configured via env vars (see `.env.example`). Copy to `.env.local`:

```
VITE_AI_PROVIDER=anthropic   # "anthropic" | "ollama" | empty to disable
VITE_ANTHROPIC_API_KEY=...   # local/personal use only (the key ships to the browser)
# VITE_AI_MODEL=claude-opus-4-8
# VITE_OLLAMA_URL=http://localhost:11434
```

Unset, AI simply doesn't appear: lessons, hints, feedback, checking, and
practice all work the same. The Anthropic SDK is dynamically imported so it
doesn't bloat the initial bundle.

---

## 🚢 Deployment

Static build (`vite build` → `dist/`) served on **Netlify** with **auto-deploy
from GitHub**: every `git push` to `main` rebuilds and publishes. Config in
`netlify.toml` (command, Node 20, headers) and `public/_redirects` /
`public/_headers` (SPA fallback + service-worker / manifest caching).

---

## 🤝 Contributing

Bug reports, lessons, and improvements are welcome. Read
[`CONTRIBUTING.md`](./CONTRIBUTING.md). Every PR goes through CI
(`check` + `validate:content` + `test` + `build`).

## 📄 License

**[PolyForm Noncommercial License 1.0.0](./LICENSE.md)**: free to use, study,
modify and share for any **noncommercial** purpose (personal, educational,
non-profit, public institutions). **Commercial / for-profit use is not
permitted.** Contributing means accepting this license.

---

## 🧭 Roadmap / next steps

Pending ideas (non-blocking; the app is already complete):
- More content: hook lessons for topics that currently only have procedural
  practice (order of operations, two-step equations, slope, mean, probability);
  expand geometry (perimeter, circle, volume); a **programming** pillar
  (needs a trace/execution widget).
- **AI Phase 4**: a word-problem authoring layer (online), validated by code.
- Polish: **a11y** audit (axe-core), a dedicated streaks screen, more
  micro-interactions.
- Platform post-MVP: **Tauri** (portable desktop), optional multi-user backend.
