import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'choice';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Estado visual para las opciones de multiple-choice. */
  state?: 'idle' | 'correct' | 'incorrect' | 'selected';
}

const base =
  'font-display font-bold rounded-2xl px-5 py-3 transition-colors ' +
  'disabled:opacity-40 disabled:cursor-not-allowed select-none ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-turquoise-soft';

const variants: Record<Variant, string> = {
  primary: 'bg-coral text-white shadow-pop hover:bg-coral-deep',
  secondary: 'bg-turquoise text-white shadow-soft hover:bg-turquoise-deep',
  ghost: 'bg-transparent text-ink hover:bg-black/5',
  choice:
    'w-full text-left bg-white text-ink shadow-soft border-2 border-transparent ' +
    'hover:border-turquoise-soft',
};

const states: Record<NonNullable<ButtonProps['state']>, string> = {
  idle: '',
  selected: 'border-turquoise ring-2 ring-turquoise-soft',
  correct: 'border-turquoise bg-turquoise-soft/40',
  incorrect: 'border-coral bg-coral-soft/40',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', state = 'idle', className = '', ...props }, ref) => (
    <motion.button
      ref={ref}
      whileTap={props.disabled ? undefined : { scale: 0.96 }}
      className={`${base} ${variants[variant]} ${
        variant === 'choice' ? states[state] : ''
      } ${className}`}
      // framer-motion tipa algunos handlers distinto; separamos lo que choca.
      {...(props as React.ComponentProps<typeof motion.button>)}
    />
  ),
);

Button.displayName = 'Button';
