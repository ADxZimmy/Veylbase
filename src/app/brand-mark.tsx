import Image from "next/image";

interface BrandMarkProps {
  size?: number;
  className?: string;
}

// The Veylbase hexagon "veil" mark. Sourced from the raster brand art in
// /public/brand-mark.png (the same artwork the favicon set is generated from).
// Rendered via next/image at an explicit size for the top bar, footers, and 404.
export function BrandMark({ size = 30, className }: BrandMarkProps) {
  return (
    <Image
      src="/brand-mark.png"
      alt="Veylbase"
      width={size}
      height={size}
      className={className}
    />
  );
}
