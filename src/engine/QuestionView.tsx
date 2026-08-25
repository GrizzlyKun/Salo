import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { QuestionStep } from './schema';
import { checkAnswer } from './validate';
import { useLessonStore } from './useLessonStore';
import { MathText } from '../components/ui/MathText';
import { Button } from '../components/ui/Button';
import { FeedbackCard } from '../components/ui/FeedbackCard';
import { HintReveal } from '../components/ui/HintReveal';
import { randomCopy } from '../design-system/copy';
import { WidgetHost } from '../widgets/WidgetHost';
import { isAIEnabled } from '../ai/client';
import { getTutorHint } from '../ai/tutor';
import { useT } from '../i18n/i18n';

interface QuestionViewProps {
  lessonId: string;
  step: QuestionStep;
  solved: boolean;
  onSolved: () => void;
  /**
   * Si es false, no se registra el intento en el store. Lo usa la práctica
   * infinita: sus preguntas son efímeras y no deben alimentar XP ni el repaso
   * espaciado (sus ids no existen en el contenido).
   */
  persist?: boolean;
  /**
   * Id con el que registrar el intento (por defecto `step.id`). El repaso lo usa
   * para agendar contra la pregunta ORIGINAL aunque se muestre una variante
   * generada con otro id.
   */
  recordStepId?: string;
}

/**
 * Pregunta activa. Valida SIEMPRE de forma determinista. Errar no penaliza:
 * el feedback explica el porqué y se puede reintentar tantas veces como haga
 * falta. Cada intento se registra en el store (alimenta modo práctica y tutor).
 */
export function QuestionView({
  lessonId,
  step,
  solved,
  onSolved,
  persist = true,
  recordStepId,
}: QuestionViewProps) {
  const t = useT();
  const recordAnswer = useLessonStore((s) => s.recordAnswer);

  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<'correct' | 'incorrect' | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const startedAt = useRef(Date.now());

  // Tutor socrático (mejora progresiva; solo si hay IA configurada).
  const aiEnabled = isAIEnabled();
  const [tutor, setTutor] = useState<{
    loading: boolean;
    text: string | null;
    error: boolean;
  }>({ loading: false, text: null, error: false });

  const headline = useMemo(
    () =>
      status === 'correct'
        ? randomCopy.correct()
        : status === 'incorrect'
          ? randomCopy.incorrect()
          : '',
    [status],
  );

  const submit = (answer: string) => {
    if (solved || answer.trim() === '') return;
    const { correct } = checkAnswer(step, answer);
    setStatus(correct ? 'correct' : 'incorrect');
    if (!correct) setWrongCount((n) => n + 1);
    if (persist) {
      recordAnswer({
        lessonId,
        stepId: recordStepId ?? step.id,
        answer,
        correct,
        hintsUsed: revealedHints,
        timeMs: Date.now() - startedAt.current,
      });
    }
    if (correct) onSolved();
  };

  const askTutor = async () => {
    setTutor({ loading: true, text: null, error: false });
    try {
      // El tutor recibe el problema, la respuesta errónea y los intentos
      // recientes del usuario en este step — nunca la respuesta correcta.
      const recentAnswers = useLessonStore
        .getState()
        .attempts.filter((a) => a.stepId === step.id)
        .slice(0, 4)
        .map((a) => a.answer);
      const text = await getTutorHint({
        prompt: step.prompt,
        userAnswer: draft,
        recentAnswers,
      });
      setTutor({ loading: false, text, error: text === null });
    } catch {
      setTutor({ loading: false, text: null, error: true });
    }
  };

  // Ofrecer al tutor tras 2 fallos, si hay IA y aún no se ha resuelto.
  const showTutorOffer = aiEnabled && !solved && wrongCount >= 2;

  return (
    <div className="space-y-4">
      <p className="font-display text-lg font-bold">
        <MathText>{step.prompt}</MathText>
      </p>

      {step.variant === 'multiple-choice' && (
        <div className="grid gap-2">
          {step.choices.map((choice) => {
            const isAnswer = choice.id === step.answerId;
            const isPicked = draft === choice.id;
            const state =
              solved && isAnswer
                ? 'correct'
                : status === 'incorrect' && isPicked
                  ? 'incorrect'
                  : isPicked
                    ? 'selected'
                    : 'idle';
            return (
              <Button
                key={choice.id}
                variant="choice"
                state={state}
                disabled={solved}
                onClick={() => {
                  setDraft(choice.id);
                  submit(choice.id);
                }}
              >
                <MathText>{choice.text}</MathText>
              </Button>
            );
          })}
        </div>
      )}

      {step.variant === 'numeric-input' && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
        >
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={draft}
            disabled={solved}
            onChange={(e) => {
              setDraft(e.target.value);
              if (status) setStatus(null);
            }}
            placeholder={t('lesson.answerPlaceholder')}
            aria-label={t('lesson.answerAria')}
            className="flex-1 rounded-2xl border-2 border-transparent bg-white px-4 py-3 shadow-soft focus:border-turquoise focus:outline-none"
          />
          {step.unit && (
            <span className="self-center text-ink/60">{step.unit}</span>
          )}
          <Button type="submit" disabled={solved || draft.trim() === ''}>
            {randomCopy.check()}
          </Button>
        </form>
      )}

      {step.variant === 'manipulative' && (
        <div className="space-y-3">
          <WidgetHost
            name={step.widget}
            props={step.props}
            onInteraction={setDraft}
          />
          <div className="flex justify-end">
            <Button disabled={solved} onClick={() => submit(draft)}>
              {randomCopy.check()}
            </Button>
          </div>
        </div>
      )}

      <HintReveal
        hints={step.hints}
        revealed={revealedHints}
        onReveal={() =>
          setRevealedHints((n) => Math.min(step.hints.length, n + 1))
        }
      />

      <FeedbackCard
        status={status}
        headline={headline}
        explanation={
          status === 'correct'
            ? step.feedback.correct
            : status === 'incorrect'
              ? step.feedback.incorrect
              : ''
        }
      />

      {status === 'incorrect' && !solved && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-ink/60"
        >
          {t('lesson.retry')}
        </motion.p>
      )}

      {showTutorOffer && (
        <div className="space-y-2">
          {!tutor.text && (
            <Button
              variant="secondary"
              disabled={tutor.loading}
              onClick={askTutor}
              className="text-sm"
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                {tutor.loading ? t('lesson.tutorThinking') : t('lesson.tutorAsk')}
              </span>
            </Button>
          )}

          <AnimatePresence>
            {tutor.text && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 rounded-2xl bg-turquoise-soft/40 p-3 text-sm"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-turquoise-deep" />
                <MathText>{tutor.text}</MathText>
              </motion.div>
            )}
          </AnimatePresence>

          {tutor.error && (
            <p className="text-sm text-ink/50">{t('lesson.tutorError')}</p>
          )}
        </div>
      )}
    </div>
  );
}
