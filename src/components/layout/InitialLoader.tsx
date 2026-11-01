"use client";

import { useEffect, useState } from "react";
import { Loader } from "@/components/layout/Loader";

const MIN_MS = 900;

/** Full-screen brand loader shown on the first page load, then faded out once the page is ready. */
export function InitialLoader() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    const start = performance.now();
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    const finish = () => {
      const wait = Math.max(0, MIN_MS - (performance.now() - start));
      t1 = setTimeout(() => {
        setPhase("fade");
        t2 = setTimeout(() => setPhase("gone"), 400);
      }, wait);
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    return () => {
      window.removeEventListener("load", finish);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <div className={`transition-opacity duration-[400ms] ${phase === "fade" ? "pointer-events-none opacity-0" : "opacity-100"}`}>
      <Loader fullScreen />
    </div>
  );
}
