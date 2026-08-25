import { motion } from 'framer-motion';

export type MascotMood =
  | 'neutral'
  | 'thinking'
  | 'celebrating'
  | 'encouraging'
  | 'sleeping';

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

/**
 * "Lume", la mascota. SVG propio (no copiar marcas ajenas). Un blob cálido
 * con expresiones según el estado emocional del feedback.
 */
export function Mascot({ mood = 'neutral', size = 72, className }: MascotProps) {
  const bob =
    mood === 'celebrating'
      ? { y: [0, -8, 0] }
      : mood === 'thinking'
        ? { rotate: [0, -4, 4, 0] }
        : { y: [0, -2, 0] };

  return (
    <motion.svg
      role="img"
      aria-label={`Mascota ${mood}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      animate={bob}
      transition={{
        duration: mood === 'celebrating' ? 0.6 : 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* cuerpo */}
      <ellipse cx="50" cy="55" rx="34" ry="32" fill="#FFC94D" />
      <ellipse cx="50" cy="58" rx="24" ry="22" fill="#FFE29E" />

      {/* mejillas */}
      <circle cx="28" cy="60" r="6" fill="#FFB4A9" opacity="0.7" />
      <circle cx="72" cy="60" r="6" fill="#FFB4A9" opacity="0.7" />

      <Face mood={mood} />

      {/* antena/luz */}
      <line x1="50" y1="24" x2="50" y2="14" stroke="#E8A92E" strokeWidth="3" />
      <motion.circle
        cx="50"
        cy="11"
        r="4"
        fill="#FF7A6B"
        animate={
          mood === 'sleeping' ? { opacity: 0.3 } : { opacity: [0.6, 1, 0.6] }
        }
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.svg>
  );
}

function Face({ mood }: { mood: MascotMood }) {
  if (mood === 'sleeping') {
    return (
      <>
        <path
          d="M38 52 q5 4 10 0"
          stroke="#3B3A4A"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M52 52 q5 4 10 0"
          stroke="#3B3A4A"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <text x="70" y="40" fontSize="12" fill="#3B3A4A">
          z
        </text>
      </>
    );
  }

  const smile =
    mood === 'celebrating'
      ? 'M38 62 q12 14 24 0'
      : mood === 'encouraging'
        ? 'M40 62 q10 8 20 0'
        : mood === 'thinking'
          ? 'M42 64 q8 2 16 0'
          : 'M42 63 q8 6 16 0';

  return (
    <>
      <circle cx="40" cy="50" r="4" fill="#3B3A4A" />
      <circle cx="60" cy="50" r="4" fill="#3B3A4A" />
      {mood === 'thinking' && (
        <circle cx="60" cy="50" r="4" fill="none" stroke="#3B3A4A" />
      )}
      <path
        d={smile}
        stroke="#3B3A4A"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}
