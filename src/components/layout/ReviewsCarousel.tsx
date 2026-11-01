"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ReviewCard {
  id: string; rating: number; title: string; body: string; authorName: string;
  product?: { name: string; slug: string };
}

/** Single-row review slider: auto-advances, pauses on hover/touch, chevrons step one card, loops at the ends. */
export function ReviewsCarousel({ reviews, interval = 4000 }: { reviews: ReviewCard[]; interval?: number }) {
  const track = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);

  function step(dir: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const amount = (card?.offsetWidth ?? 320) + 24; // card width + gap
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  useEffect(() => {
    if (paused || reviews.length < 2) return;
    const t = setInterval(() => step(1), interval);
    return () => clearInterval(t);
  }, [paused, interval, reviews.length]);

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
      <ul ref={track} aria-roledescription="carousel" aria-label="Customer reviews"
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {reviews.map((r) => (
          <li key={r.id} className="flex w-[85%] shrink-0 snap-start flex-col border border-line p-6 sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
            <p className="text-brand" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<span className="text-neutral-300">{"★".repeat(5 - r.rating)}</span></p>
            <h3 className="mt-3 font-sans text-sm font-medium">{r.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{r.body}</p>
            <p className="mt-4 text-xs text-muted">
              {r.authorName}
              {r.product && <> · <Link href={`/products/${r.product.slug}`} className="underline underline-offset-4">{r.product.name}</Link></>}
            </p>
          </li>
        ))}
      </ul>

      {reviews.length > 1 && (
        <>
          <button type="button" aria-label="Previous reviews" onClick={() => step(-1)}
            className="absolute -left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center border border-line bg-white shadow-sm hover:bg-neutral-50 md:-left-5">
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Next reviews" onClick={() => step(1)}
            className="absolute -right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center border border-line bg-white shadow-sm hover:bg-neutral-50 md:-right-5">
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}
