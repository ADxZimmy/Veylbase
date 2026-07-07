interface BrandMarkProps {
  size?: number;
  className?: string;
}

// Inline SVG mirror of public/icon.svg — the hexagon "veil" mark (parting veil,
// reveal pin, hexagon frame). Rendered directly rather than via next/image so it
// stays crisp at any size and needs no image-optimizer exceptions for SVG. Safe
// in both server and client components. Keep this in sync with public/icon.svg.
export function BrandMark({ size = 30, className }: BrandMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label="Veylbase"
    >
      <rect width="512" height="512" rx="72" fill="#0b0a07" />
      {/* parting veil */}
      <path
        d="M250 150 C232 156 214 168 203 190 C183 226 170 262 176 306 C180 326 194 338 210 342 C228 326 240 302 244 272 C247 242 248 196 250 150 Z"
        fill="#2b2718"
      />
      <path
        d="M262 150 C280 156 298 168 309 190 C329 226 342 262 336 306 C332 326 318 338 302 342 C284 326 272 302 268 272 C265 242 264 196 262 150 Z"
        fill="#2b2718"
      />
      {/* inner chevron */}
      <path
        d="M202 322 L236 322 L256 346 L276 322 L310 322"
        fill="none"
        stroke="#ffd208"
        strokeWidth="16"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      {/* reveal pin */}
      <rect x="248" y="200" width="16" height="140" rx="8" fill="#ffd208" />
      <circle cx="256" cy="206" r="25" fill="#ffd208" />
      {/* hexagon frame */}
      <path
        d="M256 60 L425.7 158 L425.7 354 L256 452 L86.3 354 L86.3 158 Z"
        fill="none"
        stroke="#ffd208"
        strokeWidth="30"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
