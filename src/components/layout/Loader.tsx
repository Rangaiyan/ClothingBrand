"use client";

import dynamic from "next/dynamic";
import animation from "@/assets/loader.json";

// Lottie is only needed once a loader shows, so keep it out of the main bundle.
// Until it arrives render nothing (the white backdrop stays), so no second spinner flashes.
const Lottie = dynamic(() => import("lottie-react").then((m) => m.Lottie), {
  ssr: false,
  loading: () => null,
});

/** Brand loader. `fullScreen` centres it over the viewport; otherwise it sits inline. */
export function Loader({ fullScreen = false, size = 240 }: { fullScreen?: boolean; size?: number }) {
  return (
    <div
      role="status" aria-live="polite" aria-label="Loading"
      className={fullScreen ? "fixed inset-0 z-[100] grid place-items-center bg-white" : "grid place-items-center py-12"}
    >
      <div className="grid place-items-center" style={{ width: size, height: size * 0.75 }}>
        <Lottie src={animation} loop autoplay />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
