'use client';

/** Inline n/max counter for Studio fields that map to backend CharField limits. */
export function StudioCharCount({ length, max }: { length: number; max: number }) {
  const over = length > max;
  return (
    <span
      className={`studio-char-count${over ? ' studio-char-count--over' : ''}`}
      aria-live="polite"
    >
      ({length}/{max})
    </span>
  );
}
