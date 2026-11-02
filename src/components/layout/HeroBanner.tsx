"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Slide { src: string; alt: string; href: string }

/**
 * Image slider. The artwork carries its own headline, so there is no text overlay.
 * It sits inside the same container as the category cards below, so the edges line up.
 */
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
      aria-roledescription="carousel" aria-label="Featured"
      className="mx-auto max-w-[1440px] px-4 pt-4 md:px-8 md:pt-6"
    >
      <div
        className="relative overflow-hidden bg-neutral-100"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      >
        <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides.map((s, idx) => (
            <Link key={s.src} href={s.href} tabIndex={idx === i ? 0 : -1} aria-hidden={idx !== i}
              className="relative block aspect-[1758/895] w-full shrink-0">
              <Image src={s.src} alt={s.alt} fill priority={idx === 0} sizes="(min-width: 1440px) 1376px, 100vw" className="object-cover" />
            </Link>
          ))}
        </div>

        {n > 1 && (
          <>
            <button type="button" aria-label="Previous banner" onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 hover:bg-white md:left-3 md:p-2">
              <ChevronLeft className="size-3.5 md:size-5" />
            </button>
            <button type="button" aria-label="Next banner" onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 hover:bg-white md:right-3 md:p-2">
              <ChevronRight className="size-3.5 md:size-5" />
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
      </div>
    </section>
  );
}
