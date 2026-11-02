import { getSettings } from "@/services/content";

/** Scrolling announcement strip. Admin enters several messages separated by "|". */
export async function AnnouncementBar() {
  const { announcement } = await getSettings();
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
      <div className="marquee group relative min-w-0 flex-1 overflow-hidden" role="marquee" aria-label="Announcements">
        <div style={{ animationDuration: `${repeated.length * 6}s` }} className="marquee-track flex w-max group-hover:[animation-play-state:paused]">
          {track(false)}
          {track(true)}
        </div>
      </div>

    </div>
  );
}
