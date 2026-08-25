import { Fragment } from 'react';
import { InlineMath } from 'react-katex';
// El CSS de KaTeX viaja con el chunk del reproductor (no en el bundle inicial).
import 'katex/dist/katex.min.css';

interface MathTextProps {
  children: string;
  className?: string;
}

type Token = { math: boolean; value: string };

/**
 * Tokeniza texto con LaTeX inline delimitado por "$...$".
 * "$$" se trata como un signo de dólar literal en el texto.
 */
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let buffer = '';
  let inMath = false;
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (ch === '$') {
      // "$$" fuera de una fórmula = dólar literal.
      if (!inMath && input[i + 1] === '$') {
        buffer += '$';
        i += 2;
        continue;
      }
      tokens.push({ math: inMath, value: buffer });
      buffer = '';
      inMath = !inMath;
      i += 1;
      continue;
    }
    buffer += ch;
    i += 1;
  }
  tokens.push({ math: inMath, value: buffer });
  return tokens;
}

/** Renderiza texto con fórmulas LaTeX inline entre signos de dólar. */
export function MathText({ children, className }: MathTextProps) {
  return (
    <span className={className}>
      {tokenize(children).map((token, i) =>
        token.math ? (
          <InlineMath key={i} math={token.value} />
        ) : (
          <Fragment key={i}>{token.value}</Fragment>
        ),
      )}
    </span>
  );
}
