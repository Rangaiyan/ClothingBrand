"use client";

import { useEffect, useState } from "react";
import { onSnapshot, type Query } from "firebase/firestore";

export type Row<T> = T & { id: string };

/** Live Firestore query. `key` must change whenever the query does. */
export function useCollection<T>(make: () => Query, key: string) {
  const [state, setState] = useState<{ rows: Row<T>[]; loading: boolean; error: string }>({
    rows: [], loading: true, error: "",
  });
  useEffect(() => {
    return onSnapshot(
      make(),
      (snap) => setState({ rows: snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })), loading: false, error: "" }),
      (e) => setState({ rows: [], loading: false, error: e.message }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

export function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong.";
}
