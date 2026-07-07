interface BrandMarkProps {
  size?: number;
  className?: string;
}

// Inline SVG mirror of public/icon.svg. Rendered directly (rather than via
// next/image) so the brand mark stays crisp at any size and needs no image
// optimizer exceptions for SVG. Safe in both server and client components.
export function BrandMark({ size = 30, className }: BrandMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Veylbase"
    >
      <rect width="64" height="64" rx="12" fill="#000000" />
      <path d="M16 14h10l6 28 6-28h10L37 50H27L16 14Z" fill="#FFD208" />
      <path
        d="M19 14h7l6 28 6-28h7"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.72"
        strokeWidth="2"
      />
    </svg>
  );
}
