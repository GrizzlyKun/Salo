import { motion } from 'framer-motion';
import { Check, Lock, Play, Star } from 'lucide-react';
import { courseOrder, useContent } from '../content';
import type { Course } from '../engine/schema';
import { useLessonStore } from '../engine/useLessonStore';

type NodeStatus = 'completed' | 'available' | 'locked';

/**
 * Mapa de un curso tipo camino. Las lecciones se desbloquean en orden: una
 * queda disponible cuando la anterior del curso está completada. La primera
 * siempre está disponible. Errar no bloquea nada — solo completar avanza.
 */
export function CourseMap({
  course,
  onPlay,
}: {
  course: Course;
  onPlay: (id: string) => void;
}) {
  const { getLesson } = useContent();
  const completed = useLessonStore((s) => s.completedLessonIds);
  const order = courseOrder(course);

  const statusOf = (id: string): NodeStatus => {
    if (completed.includes(id)) return 'completed';
    const idx = order.indexOf(id);
    if (idx <= 0) return 'available';
    const prev = order[idx - 1]!;
    return completed.includes(prev) ? 'available' : 'locked';
  };

  return (
    <div className="space-y-10">
      {course.units.map((unit) => (
        <section key={unit.id}>
          <h2 className="mb-4 text-center font-display text-sm font-bold uppercase tracking-wide text-ink/50">
            {unit.title}
          </h2>
          <ol className="space-y-4">
            {unit.lessonIds.map((lessonId, i) => {
              const lesson = getLesson(lessonId);
              if (!lesson) return null;
              const status = statusOf(lessonId);
              const align = i % 2 === 0 ? 'justify-start' : 'justify-end';
              return (
                <li key={lessonId} className={`flex ${align}`}>
                  <LessonNode
                    title={lesson.title}
                    summary={lesson.summary}
                    xp={lesson.xp}
                    status={status}
                    onClick={() => status !== 'locked' && onPlay(lessonId)}
                  />
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

function LessonNode({
  title,
  summary,
  xp,
  status,
  onClick,
}: {
  title: string;
  summary?: string;
  xp: number;
  status: NodeStatus;
  onClick: () => void;
}) {
  const locked = status === 'locked';
  const done = status === 'completed';

  return (
    <motion.button
      whileTap={locked ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={locked}
      aria-label={`${title}${locked ? ' (bloqueada)' : ''}`}
      className={`flex w-full max-w-sm items-center gap-4 rounded-2xl p-4 text-left shadow-soft transition-shadow ${
        locked
          ? 'cursor-not-allowed bg-white/50 opacity-60'
          : 'bg-white hover:shadow-pop'
      }`}
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-white ${
          done ? 'bg-turquoise' : locked ? 'bg-ink/30' : 'bg-coral'
        }`}
      >
        {done ? (
          <Check className="h-6 w-6" />
        ) : locked ? (
          <Lock className="h-5 w-5" />
        ) : (
          <Play className="h-6 w-6" />
        )}
      </span>
      <span className="flex-1">
        <span className="block font-display text-lg font-bold">{title}</span>
        {summary && (
          <span className="block text-sm text-ink/60">{summary}</span>
        )}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-honey-deep">
        <Star className="h-4 w-4" />
        {xp}
      </span>
    </motion.button>
  );
}
