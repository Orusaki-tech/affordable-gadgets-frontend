type MaterialIconProps = {
  name: string;
  className?: string;
  filled?: boolean;
  ariaHidden?: boolean;
};

/** Material Symbols Outlined glyph (stylesheet loaded in root layout). */
export function MaterialIcon({
  name,
  className = '',
  filled = false,
  ariaHidden = true,
}: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`.trim()}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden={ariaHidden || undefined}
    >
      {name}
    </span>
  );
}
