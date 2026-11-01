import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";
import type { LoginInput, RegisterInput } from "@/validations/auth";

export const login = ({ email, password }: LoginInput) =>
  signInWithEmailAndPassword(getFirebaseAuth(), email, password);

export async function register({ name, email, password }: RegisterInput) {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  await updateProfile(cred.user, { displayName: name });
  // Sign-in fires before displayName is set, so the profile doc may have been created
  // with an empty name. Merge the real name in.
  await setDoc(doc(getDb(), "users", cred.user.uid), { name }, { merge: true });
  return cred;
}

export const loginWithGoogle = () => signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
export const resetPassword = (email: string) => sendPasswordResetEmail(getFirebaseAuth(), email);
export const logout = () => signOut(getFirebaseAuth());

// Maps Firebase error codes to messages safe to show customers.
export function authMessage(err: unknown) {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found"))
    return "Incorrect email or password.";
  if (code.includes("email-already-in-use")) return "An account with this email already exists.";
  if (code.includes("popup-closed")) return "Sign-in was cancelled.";
  if (err instanceof Error && err.message.includes("not configured")) return err.message;
  return "Something went wrong. Please try again.";
}
