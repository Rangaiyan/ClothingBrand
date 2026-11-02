import { ViewTransition } from "react";

// A template remounts on every navigation, so the old page fades out and the new one
// fades in. Only the page area animates; the header and footer stay put.
export default function StoreTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
