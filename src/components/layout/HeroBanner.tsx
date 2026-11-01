"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Slide { src: string; alt: string; href: string }

/** Full-width image slider. Banner artwork carries its own headline and button, so no text overlay. */
export function HeroBanner({ slides, interval = 5000 }: { slides: Slide[]; interval?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;
  const go = (d: number) => setI((c) => (c + d + n) % n);

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => setI((c) => (c + 1) % n), interval);
    return () => clearInterval(t);
  }, [n, paused, interval]);

  if (!n) return null;
  return (
    <section
      aria-roledescription="carousel" aria-label="Featured collections"
      className="relative overflow-hidden bg-neutral-100"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    >
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, idx) => (
          <Link key={s.src} href={s.href} tabIndex={idx === i ? 0 : -1} aria-hidden={idx !== i}
            className="relative block aspect-[2/1] w-full shrink-0">
            <Image src={s.src} alt={s.alt} fill sizes="100vw" priority={idx === 0} className="object-cover" />
          </Link>
        ))}
      </div>

      {n > 1 && (
        <>
          <button type="button" aria-label="Previous banner" onClick={() => go(-1)}
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 bg-white/80 p-2 hover:bg-white md:block">
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Next banner" onClick={() => go(1)}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 bg-white/80 p-2 hover:bg-white md:block">
            <ChevronRight size={20} />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {slides.map((s, idx) => (
              <button key={s.src} type="button" aria-label={`Go to banner ${idx + 1}`} aria-current={idx === i}
                onClick={() => setI(idx)}
                className={`h-1.5 transition-all ${idx === i ? "w-6 bg-brand" : "w-1.5 bg-brand/40"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
