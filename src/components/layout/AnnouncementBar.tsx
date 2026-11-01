import Link from "next/link";
import { getSettings } from "@/services/content";

const svg = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

/** Scrolling announcement strip. Admin enters several messages separated by "|". */
export async function AnnouncementBar() {
  const { announcement, instagram, youtube } = await getSettings();
  if (!announcement) return null;
  const messages = announcement.split("|").map((m) => m.trim()).filter(Boolean);

  // Repeat the messages back to back so one track always out-measures the screen; no stretched gaps.
  const repeated = Array.from({ length: Math.ceil(8 / messages.length) }, () => messages).flat();
  const track = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {repeated.map((m, i) => (
        <li key={i} className="whitespace-nowrap px-8">{m}</li>
      ))}
    </ul>
  );

  return (
    <div className="flex h-10 items-center bg-brand text-[11px] uppercase tracking-[0.12em] text-white">
      <div className="hidden shrink-0 items-center gap-4 pl-8 pr-4 md:flex">
        <a href={instagram || "https://www.instagram.com"} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <svg {...svg}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" /></svg>
        </a>
        <a href={youtube || "https://www.youtube.com"} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
          <svg {...svg}><path d="M22.5 7.2a2.5 2.5 0 0 0-1.8-1.8C19.1 5 12 5 12 5s-7.100 0-8.700.4A2.500 2.500 0 0 0 1.500 7.200C1 8.800 1 12 1 12s0 3.200.5 4.800a2.500 2.500 0 0 0 1.800 1.800C4.900 19 12 19 12 19s7.100 0 8.700-.4a2.500 2.500 0 0 0 1.800-1.800c.5-1.600.5-4.800.5-4.800s0-3.200-.5-4.800z" /><path d="m10 15 5-3-5-3z" fill="currentColor" /></svg>
        </a>
      </div>

      <div className="marquee group relative min-w-0 flex-1 overflow-hidden" role="marquee" aria-label="Announcements">
        <div style={{ animationDuration: `${repeated.length * 6}s` }} className="marquee-track flex w-max group-hover:[animation-play-state:paused]">
          {track(false)}
          {track(true)}
        </div>
      </div>

      <nav aria-label="Top links" className="hidden shrink-0 items-center gap-5 pl-4 pr-8 md:flex">
        <Link href="/about">About</Link>
        <Link href="/contact">Contact Us</Link>
      </nav>
    </div>
  );
}
