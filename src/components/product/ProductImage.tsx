import Image from "next/image";

const TINTS = ["#e9ece8", "#efece6", "#e4e9e6", "#ece8e4"];

// Solid-colour placeholder until product photography is uploaded to Storage.
export function ProductImage({
  src,
  name,
  seed = 0,
  sizes,
  priority,
}: {
  src?: string;
  name: string;
  seed?: number;
  sizes?: string;
  priority?: boolean;
}) {
  if (src) {
    return (
      <Image src={src} alt={name} fill sizes={sizes} priority={priority} className="object-cover" />
    );
  }
  return (
    <div
      role="img"
      aria-label={name}
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: TINTS[seed % TINTS.length] }}
    >
      <span className="font-serif text-2xl tracking-[0.3em] text-brand/40">KAMELEON</span>
    </div>
  );
}
