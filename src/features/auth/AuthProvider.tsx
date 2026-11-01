"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: isFirebaseConfigured });

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      setState({ user, loading: false });
      if (user) void ensureProfile(user);
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

async function ensureProfile(user: User) {
  try {
    const ref = doc(getDb(), "users", user.uid);
    if ((await getDoc(ref)).exists()) return;
    // merge + no empty name, so this can never overwrite a name written by register().
    await setDoc(ref, { ...(user.displayName ? { name: user.displayName } : {}), email: user.email ?? "", createdAt: serverTimestamp() }, { merge: true });
  } catch {
    // Non-fatal: the profile is retried on the next sign-in.
  }
}
