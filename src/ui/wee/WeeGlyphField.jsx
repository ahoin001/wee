import React, { useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m } from 'framer-motion';
import { createWeeTransition } from '../../design/weeMotion';

const MotionSpan = m.span;

let glyphSeq = 0;

function nextGlyphId() {
  glyphSeq += 1;
  return `g${glyphSeq}`;
}

/**
 * Keep stable ids for the unchanged prefix and suffix.
 * The middle span is replaced so only the edited characters enter or exit.
 * @param {{ id: string, char: string }[]} tokens
 * @param {string} next
 */
export function reconcileGlyphTokens(tokens, next) {
  const prev = tokens.map((token) => token.char).join('');
  if (prev === next) return tokens;

  const max = Math.min(prev.length, next.length);
  let head = 0;
  while (head < max && prev[head] === next[head]) head += 1;

  let tail = 0;
  while (
    tail < prev.length - head &&
    tail < next.length - head &&
    prev[prev.length - 1 - tail] === next[next.length - 1 - tail]
  ) {
    tail += 1;
  }

  const prefix = tokens.slice(0, head);
  const suffix = tail ? tokens.slice(tokens.length - tail) : [];
  const middle = next.slice(head, next.length - tail).split('').map((char) => ({
    id: nextGlyphId(),
    char,
  }));
  return [...prefix, ...middle, ...suffix];
}

/**
 * Visual letters for a focused text field. The native input remains the value owner.
 * Glyphs mount only while `active` is true.
 */
function WeeGlyphField({
  value = '',
  active = false,
  masked = false,
  reducedMotion = false,
  className = '',
}) {
  const tokensRef = useRef([]);
  const [tokens, setTokens] = useState([]);
  const enter = createWeeTransition('pillOpen', { reducedMotion });
  const exit = createWeeTransition('pillClose', { reducedMotion });

  useLayoutEffect(() => {
    if (!active || reducedMotion) {
      tokensRef.current = [];
      setTokens([]);
      return;
    }
    const next = reconcileGlyphTokens(tokensRef.current, String(value ?? ''));
    tokensRef.current = next;
    setTokens(next);
  }, [active, reducedMotion, value]);

  if (!active || reducedMotion) return null;

  return (
    <span
      className={`pointer-events-none absolute inset-0 flex items-center overflow-hidden ${className}`.trim()}
      aria-hidden
    >
      <span className="flex min-w-0 items-center overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {tokens.map((token) => (
            <MotionSpan
              key={token.id}
              className="inline-block whitespace-pre"
              initial={{ opacity: 0, y: 6, scale: 0.62, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{
                opacity: 0,
                y: -5,
                scale: 0.7,
                filter: 'blur(3px)',
                transition: exit,
              }}
              transition={enter}
            >
              {masked ? '•' : token.char}
            </MotionSpan>
          ))}
        </AnimatePresence>
      </span>
    </span>
  );
}

WeeGlyphField.propTypes = {
  value: PropTypes.string,
  active: PropTypes.bool,
  masked: PropTypes.bool,
  reducedMotion: PropTypes.bool,
  className: PropTypes.string,
};

export default WeeGlyphField;
