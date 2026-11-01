import test, { before, after } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, addDoc, collection } from "firebase/firestore";

let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "kameleon-test",
    firestore: { rules: readFileSync("../firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await setDoc(doc(d, "products/live"), { published: true, price: 100 });
    await setDoc(doc(d, "products/draft"), { published: false, price: 100 });
    await setDoc(doc(d, "orders/o1"), { uid: "alice", total: 500 });
    await setDoc(doc(d, "coupons/SAVE10"), { value: 10 });
    await setDoc(doc(d, "users/alice"), { name: "Alice" });
    await setDoc(doc(d, "reviews/pub"), { productId: "live", published: true, rating: 5 });
    await setDoc(doc(d, "reviews/hidden"), { productId: "live", published: false, rating: 5 });
  });
});
after(() => env.cleanup());

const alice = () => env.authenticatedContext("alice").firestore();
const bob = () => env.authenticatedContext("bob").firestore();
const admin = () => env.authenticatedContext("root", { admin: true }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

test("public reads published products only; drafts need admin", async () => {
  await assertSucceeds(getDoc(doc(anon(), "products/live")));
  await assertFails(getDoc(doc(anon(), "products/draft")));
  await assertSucceeds(getDoc(doc(admin(), "products/draft")));
});

test("customers cannot write products, prices or stock", async () => {
  await assertFails(updateDoc(doc(alice(), "products/live"), { price: 1 }));
  await assertFails(setDoc(doc(anon(), "products/new"), { published: true }));
  await assertSucceeds(updateDoc(doc(admin(), "products/live"), { price: 120 }));
});

test("orders: owner and admin read; others cannot; nobody writes from the client", async () => {
  await assertSucceeds(getDoc(doc(alice(), "orders/o1")));
  await assertFails(getDoc(doc(bob(), "orders/o1")));
  await assertSucceeds(getDoc(doc(admin(), "orders/o1")));
  await assertFails(updateDoc(doc(alice(), "orders/o1"), { total: 1 }));
  await assertFails(setDoc(doc(admin(), "orders/o2"), { uid: "x" }));
});

test("coupons are admin-only", async () => {
  await assertFails(getDoc(doc(alice(), "coupons/SAVE10")));
  await assertSucceeds(getDoc(doc(admin(), "coupons/SAVE10")));
});

test("users: own profile only, and no self-granted role fields", async () => {
  await assertSucceeds(getDoc(doc(alice(), "users/alice")));
  await assertFails(getDoc(doc(bob(), "users/alice")));
  await assertSucceeds(setDoc(doc(alice(), "users/alice"), { name: "Alice B" }));
  await assertFails(setDoc(doc(alice(), "users/alice"), { name: "A", admin: true }));
  await assertFails(setDoc(doc(alice(), "users/alice"), { name: "A", role: "admin" }));
});

test("carts and wishlists are private to the owner", async () => {
  await assertSucceeds(setDoc(doc(alice(), "carts/alice"), { lines: [] }));
  await assertFails(getDoc(doc(bob(), "carts/alice")));
  await assertFails(setDoc(doc(bob(), "wishlists/alice"), { ids: [] }));
});

test("reviews need a matching uid and a 1-5 rating", async () => {
  const ok = { uid: "alice", productId: "live", rating: 5, title: "t", body: "b", authorName: "A", createdAt: 1 };
  await assertSucceeds(addDoc(collection(alice(), "reviews"), ok));
  await assertFails(addDoc(collection(alice(), "reviews"), { ...ok, rating: 9 }));
  await assertFails(addDoc(collection(bob(), "reviews"), ok));
  await assertFails(addDoc(collection(anon(), "reviews"), ok));
});

test("reviews: public reads published only; only admins add or hide reviews", async () => {
  await assertSucceeds(getDoc(doc(anon(), "reviews/pub")));
  await assertFails(getDoc(doc(anon(), "reviews/hidden")));
  await assertSucceeds(getDoc(doc(admin(), "reviews/hidden")));
  const adminReview = { productId: "live", authorName: "Ravi", rating: 4, title: "t", body: "b", published: true, source: "admin", createdAt: 1 };
  await assertSucceeds(addDoc(collection(admin(), "reviews"), adminReview));
  await assertFails(addDoc(collection(alice(), "reviews"), adminReview));
  await assertSucceeds(updateDoc(doc(admin(), "reviews/hidden"), { published: true }));
});

test("reviews reject oversized text", async () => {
  const ok = { uid: "alice", productId: "live", rating: 4, title: "t", body: "b", authorName: "A", createdAt: 1 };
  await assertFails(addDoc(collection(alice(), "reviews"), { ...ok, body: "x".repeat(2001) }));
  await assertFails(addDoc(collection(alice(), "reviews"), { ...ok, title: 5 }));
});

test("newsletter: anyone can subscribe with a valid email, nobody can read", async () => {
  await assertSucceeds(addDoc(collection(anon(), "newsletterSubscribers"), { email: "a@b.co", createdAt: 1 }));
  await assertFails(addDoc(collection(anon(), "newsletterSubscribers"), { email: "nope", createdAt: 1 }));
  await assertFails(getDoc(doc(anon(), "newsletterSubscribers/x")));
});

test("inventory logs are admin-read, never client-written", async () => {
  await assertSucceeds(getDoc(doc(admin(), "inventoryLogs/x")));
  await assertFails(getDoc(doc(alice(), "inventoryLogs/x")));
  await assertFails(setDoc(doc(admin(), "inventoryLogs/x"), { delta: 1 }));
});
