import { getSettings } from "@/services/content";

export async function AnnouncementBar() {
  const { announcement } = await getSettings();
  if (!announcement) return null;
  return <div className="bg-brand px-4 py-2 text-center text-xs tracking-wide text-white">{announcement}</div>;
}
