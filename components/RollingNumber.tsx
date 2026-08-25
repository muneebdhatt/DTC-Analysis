'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Renders a formatted value one character at a time, and animates only
 * the characters that actually changed since the last poll.
 *
 * This is the whole point of the demo made visible: when the pipeline
 * writes a new number, you see which digits moved. Animating the entire
 * value on every refresh would be decoration — animating only what
 * changed is information.
 */
export default function RollingNumber({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const previous = useRef(value);
  const [moved, setMoved] = useState<boolean[]>([]);

  useEffect(() => {
    if (previous.current === value) return;

    const before = previous.current;
    // Compare from the right: digits grow leftward, so right-aligning the
    // comparison keeps "$9,984" → "$10,412" from flagging every character.
    const offset = value.length - before.length;
    setMoved(
      value.split('').map((ch, i) => {
        const j = i - offset;
        return j < 0 || before[j] !== ch;
      })
    );

    previous.current = value;
    const timer = setTimeout(() => setMoved([]), 900);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <span className={className} aria-label={value}>
      {value.split('').map((ch, i) => (
        <span
          key={`${i}-${ch}`}
          aria-hidden="true"
          className={moved[i] ? 'digit digit-moved' : 'digit'}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
}
