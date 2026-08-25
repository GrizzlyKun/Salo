import type { Step } from './schema';
import { MathText } from '../components/ui/MathText';
import { WidgetHost } from '../widgets/WidgetHost';
import { QuestionView } from './QuestionView';

interface StepRendererProps {
  lessonId: string;
  step: Step;
  solved: boolean;
  onSolved: () => void;
}

/** Renderiza un step según su `type`. Las preguntas delegan en QuestionView. */
export function StepRenderer({
  lessonId,
  step,
  solved,
  onSolved,
}: StepRendererProps) {
  switch (step.type) {
    case 'exposition':
      return (
        <p className="text-lg leading-relaxed">
          <MathText>{step.text}</MathText>
        </p>
      );

    case 'widget':
      return (
        <figure className="space-y-2">
          <WidgetHost name={step.widget} props={step.props} />
          {step.caption && (
            <figcaption className="text-center text-sm text-ink/60">
              <MathText>{step.caption}</MathText>
            </figcaption>
          )}
        </figure>
      );

    case 'question':
      return (
        <QuestionView
          lessonId={lessonId}
          step={step}
          solved={solved}
          onSolved={onSolved}
        />
      );
  }
}
