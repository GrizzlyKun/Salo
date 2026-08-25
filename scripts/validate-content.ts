/**
 * Valida TODOS los JSON de lecciones contra el esquema Zod.
 * Ejecutar antes de dar por terminado cualquier hito:
 *   npm run check && npm run validate:content
 *
 * También comprueba invariantes que el esquema por sí solo no captura:
 *  - ids de step únicos dentro de cada lección
 *  - ids de lección únicos globalmente
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { lessonSchema, courseSchema } from '../src/engine/schema.ts';
import { hasProblemTemplate } from '../src/engine/generate.ts';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, '..', 'src', 'content');
const lessonsDir = join(contentDir, 'lessons');

let errors = 0;
const lessonIds = new Set<string>();

const files = readdirSync(lessonsDir).filter((f) => f.endsWith('.json'));

if (files.length === 0) {
  console.error('⚠️  No se encontraron lecciones en', lessonsDir);
  process.exit(1);
}

for (const file of files) {
  const path = join(lessonsDir, file);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.error(`✗ ${file}: JSON inválido — ${(e as Error).message}`);
    errors++;
    continue;
  }

  const result = lessonSchema.safeParse(raw);
  if (!result.success) {
    console.error(`✗ ${file}:`);
    for (const issue of result.error.issues) {
      console.error(`    · ${issue.path.join('.')}: ${issue.message}`);
    }
    errors++;
    continue;
  }

  const lesson = result.data;

  if (lessonIds.has(lesson.id)) {
    console.error(`✗ ${file}: id de lección duplicado "${lesson.id}"`);
    errors++;
  }
  lessonIds.add(lesson.id);

  const stepIds = new Set<string>();
  for (const step of lesson.steps) {
    if (stepIds.has(step.id)) {
      console.error(`✗ ${file}: id de step duplicado "${step.id}"`);
      errors++;
    }
    stepIds.add(step.id);
    if (
      step.type === 'question' &&
      step.templateId &&
      !hasProblemTemplate(step.templateId)
    ) {
      console.error(
        `✗ ${file}: pregunta "${step.id}" usa templateId desconocido "${step.templateId}"`,
      );
      errors++;
    }
  }

  console.log(`✓ ${file} — "${lesson.title}" (${lesson.steps.length} steps)`);
}

// --- Cursos ---
const coursesDir = join(contentDir, 'courses');
const referencedLessons = new Set<string>();
const courseFiles = readdirSync(coursesDir).filter((f) => f.endsWith('.json'));

for (const file of courseFiles) {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(coursesDir, file), 'utf8'));
  } catch (e) {
    console.error(`✗ courses/${file}: JSON inválido — ${(e as Error).message}`);
    errors++;
    continue;
  }
  const result = courseSchema.safeParse(raw);
  if (!result.success) {
    console.error(`✗ courses/${file}:`);
    for (const issue of result.error.issues) {
      console.error(`    · ${issue.path.join('.')}: ${issue.message}`);
    }
    errors++;
    continue;
  }
  for (const unit of result.data.units) {
    for (const ref of unit.lessonIds) {
      if (!lessonIds.has(ref)) {
        console.error(
          `✗ courses/${file}: unidad "${unit.id}" referencia lección inexistente "${ref}"`,
        );
        errors++;
      }
      referencedLessons.add(ref);
    }
  }
  console.log(
    `✓ courses/${file} — "${result.data.title}" (${result.data.units.length} unidades)`,
  );
}

// Lecciones huérfanas (no aparecen en ningún curso).
for (const lessonId of lessonIds) {
  if (!referencedLessons.has(lessonId)) {
    console.error(`⚠️  Lección huérfana (sin curso): "${lessonId}"`);
    errors++;
  }
}

// --- Traducciones al inglés (opcionales) ---
let enLessonCount = 0;
let enCourseCount = 0;
try {
  const enDir = join(lessonsDir, 'en');
  for (const file of readdirSync(enDir).filter((f) => f.endsWith('.json'))) {
    const result = lessonSchema.safeParse(
      JSON.parse(readFileSync(join(enDir, file), 'utf8')),
    );
    if (!result.success) {
      console.error(`✗ lessons/en/${file}:`);
      for (const issue of result.error.issues) {
        console.error(`    · ${issue.path.join('.')}: ${issue.message}`);
      }
      errors++;
      continue;
    }
    if (!lessonIds.has(result.data.id)) {
      console.error(
        `✗ lessons/en/${file}: id "${result.data.id}" no existe en español (los ids deben coincidir)`,
      );
      errors++;
    }
    for (const step of result.data.steps) {
      if (
        step.type === 'question' &&
        step.templateId &&
        !hasProblemTemplate(step.templateId)
      ) {
        console.error(
          `✗ lessons/en/${file}: templateId desconocido "${step.templateId}"`,
        );
        errors++;
      }
    }
    enLessonCount++;
  }
} catch {
  /* sin carpeta lessons/en */
}
try {
  const enDir = join(coursesDir, 'en');
  for (const file of readdirSync(enDir).filter((f) => f.endsWith('.json'))) {
    const result = courseSchema.safeParse(
      JSON.parse(readFileSync(join(enDir, file), 'utf8')),
    );
    if (!result.success) {
      console.error(`✗ courses/en/${file}: curso inválido`);
      errors++;
      continue;
    }
    enCourseCount++;
  }
} catch {
  /* sin carpeta courses/en */
}
if (enLessonCount > 0 || enCourseCount > 0) {
  console.log(
    `✓ inglés: ${enLessonCount} lección(es) y ${enCourseCount} curso(s)`,
  );
}

if (errors > 0) {
  console.error(`\n${errors} error(es) de contenido.`);
  process.exit(1);
}
console.log(
  `\n✓ ${files.length} lección(es) y ${courseFiles.length} curso(s) válidos.`,
);
