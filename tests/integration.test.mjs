import test, { before } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(new URL("../functions/", import.meta.url));
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
initializeApp({ projectId: "kameleon-test" });
const db = getFirestore();

const FN = "http://127.0.0.1:5001/kameleon-test/asia-south1";
const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";

async function signUp(email) {
  const r = await fetch(`${AUTH}/accounts:signUp?key=x`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123", returnSecureToken: true }),
  });
  const j = await r.json();
  return { uid: j.localId, token: j.idToken };
}
async function call(name, data, token) {
  const r = await fetch(`${FN}/${name}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ data }),
  });
  return r.json();
}
const stockOf = async (id) => (await db.doc(`products/${id}`).get()).data().variants[0].stock;
const seedProduct = (id, stock) =>
  db.doc(`products/${id}`).set({
    name: "Vesti", price: 1000, published: true,
    variants: [{ sku: `${id}-W`, size: "Free Size", colour: "White", stock }],
  });
const base = (productId, qty, key) => ({
  idempotencyKey: key, payment: "cod",
  items: [{ productId, sku: `${productId}-W`, qty }],
  contact: { name: "Alice A", email: "a@example.com", phone: "9876543210" },
  address: { line1: "12 Temple Street", city: "Chennai", state: "Tamil Nadu", pincode: "600001" },
});
const webhook = (payload, secret = "test_webhook_secret") => {
  const body = JSON.stringify(payload);
  return fetch(`${FN}/razorpayWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-razorpay-signature": createHmac("sha256", secret).update(body).digest("hex") },
    body,
  });
};
const seedPending = async (id, uid, productId, rzOrder, total = 1099) =>
  db.doc(`orders/${id}`).set({
    uid, total, stockReserved: true,
    items: [{ productId, sku: `${productId}-W`, qty: 1, price: 1000 }],
    payment: { method: "razorpay", status: "pending", razorpayOrderId: rzOrder, razorpayPaymentId: null },
    fulfilment: { status: "placed" },
  });

async function signIn(email) {
  const r = await fetch(`${AUTH}/accounts:signInWithPassword?key=x`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123", returnSecureToken: true }),
  });
  return (await r.json()).idToken;
}

let alice, bob, boss;
before(async () => {
  alice = await signUp("alice@example.com");
  bob = await signUp("bob@example.com");
  const b = await signUp("boss@example.com");
  await getAuth().setCustomUserClaims(b.uid, { admin: true });
  boss = { uid: b.uid, token: await signIn("boss@example.com") }; // fresh token carries the claim
});

test("createOrder rejects anonymous callers", async () => {
  const r = await call("createOrder", base("x", 1, "key-anon-0001"));
  assert.equal(r.error?.status, "UNAUTHENTICATED");
});

test("COD order is priced by the server, reserves stock, and retries are idempotent", async () => {
  await seedProduct("p1", 3);
  const payload = { ...base("p1", 1, "key-cod-0001"), items: [{ productId: "p1", sku: "p1-W", qty: 1, price: 1 }] };
  const a = await call("createOrder", payload, alice.token);
  assert.equal(a.result.total, 1099); // ₹1 client price ignored; ₹1000 + ₹99 shipping
  assert.equal(await stockOf("p1"), 2);
  const o = (await db.doc(`orders/${a.result.orderId}`).get()).data();
  assert.equal(o.payment.status, "cod_pending");
  assert.equal(o.fulfilment.status, "confirmed");

  const b = await call("createOrder", payload, alice.token);
  assert.equal(b.result.orderId, a.result.orderId);
  assert.equal(await stockOf("p1"), 2);
});

test("cannot order more than is in stock", async () => {
  await seedProduct("p2", 1);
  const r = await call("createOrder", base("p2", 2, "key-over-0001"), alice.token);
  assert.equal(r.error?.status, "FAILED_PRECONDITION");
  assert.equal(await stockOf("p2"), 1);
});

test("two simultaneous buyers of the last item: exactly one wins", async () => {
  await seedProduct("p3", 1);
  const [x, y] = await Promise.all([
    call("createOrder", base("p3", 1, "key-race-0001"), alice.token),
    call("createOrder", base("p3", 1, "key-race-0002"), bob.token),
  ]);
  assert.equal([x, y].filter((r) => r.result).length, 1);
  assert.equal(await stockOf("p3"), 0);
});

test("webhook: bad signature rejected; wrong amount ignored; capture is idempotent", async () => {
  await seedProduct("p4", 5);
  await seedPending("ord-w1", alice.uid, "p4", "order_W1");
  const evt = (amount) => ({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: "order_W1", amount } } } });

  assert.equal((await webhook(evt(109900), "wrong")).status, 401);
  await webhook(evt(100)); // tampered amount
  assert.equal((await db.doc("orders/ord-w1").get()).data().payment.status, "pending");

  assert.equal((await webhook(evt(109900))).status, 200);
  assert.equal((await webhook(evt(109900))).status, 200); // Razorpay redelivery
  const o = (await db.doc("orders/ord-w1").get()).data();
  assert.equal(o.payment.status, "paid");
  assert.equal(o.payment.razorpayPaymentId, "pay_1");
  assert.equal(o.fulfilment.status, "confirmed");
});

test("webhook payment.failed releases stock exactly once", async () => {
  await seedProduct("p5", 2);
  await seedPending("ord-w2", alice.uid, "p5", "order_W2");
  const evt = { event: "payment.failed", payload: { payment: { entity: { id: "pay_2", order_id: "order_W2", amount: 109900 } } } };
  await webhook(evt);
  await webhook(evt);
  assert.equal(await stockOf("p5"), 3); // 2 + 1 returned, not +2
  assert.equal((await db.doc("orders/ord-w2").get()).data().payment.status, "failed");
});

test("verifyPayment: valid signature marks paid; other users and bad signatures are refused", async () => {
  await seedProduct("p6", 5);
  await seedPending("ord-v1", alice.uid, "p6", "order_V1");
  const sig = (o, p) => createHmac("sha256", "test_key_secret").update(`${o}|${p}`).digest("hex");
  const body = (signature) => ({ orderId: "ord-v1", razorpayOrderId: "order_V1", razorpayPaymentId: "pay_v1", razorpaySignature: signature });

  assert.equal((await call("verifyPayment", body(sig("order_V1", "pay_v1")), bob.token)).error?.status, "NOT_FOUND");
  assert.equal((await call("verifyPayment", body("deadbeef"), alice.token)).error?.status, "FAILED_PRECONDITION");
  assert.equal((await db.doc("orders/ord-v1").get()).data().payment.status, "pending");

  const ok = await call("verifyPayment", body(sig("order_V1", "pay_v1")), alice.token);
  assert.equal(ok.result.status, "paid");
  assert.equal((await db.doc("orders/ord-v1").get()).data().payment.status, "paid");
});

test("late payment on a lapsed reservation with no stock left is flagged for refund, not fulfilled", async () => {
  await seedProduct("p7", 0);
  await db.doc("orders/ord-late").set({
    uid: alice.uid, total: 1099, stockReserved: false,
    items: [{ productId: "p7", sku: "p7-W", qty: 1, price: 1000 }],
    payment: { method: "razorpay", status: "pending", razorpayOrderId: "order_L1", razorpayPaymentId: null },
    fulfilment: { status: "placed" },
  });
  await webhook({ event: "payment.captured", payload: { payment: { entity: { id: "pay_l", order_id: "order_L1", amount: 109900 } } } });
  const o = (await db.doc("orders/ord-late").get()).data();
  assert.equal(o.payment.status, "paid_needs_refund");
  assert.equal(o.fulfilment.status, "cancelled");
  assert.equal(await stockOf("p7"), 0);
});

test("admin-only callables reject normal customers", async () => {
  const s = await call("adjustStock", { productId: "p1", sku: "p1-W", newStock: 999 }, alice.token);
  assert.equal(s.error?.status, "PERMISSION_DENIED");
  const a = await call("setAdminRole", { email: "alice@example.com", admin: true }, alice.token);
  assert.equal(a.error?.status, "PERMISSION_DENIED");
  assert.equal(await stockOf("p1"), 2);
});

const seedOrder = (id, over = {}) =>
  db.doc(`orders/${id}`).set({
    uid: alice.uid, total: 1099, stockReserved: true,
    items: [{ productId: "pa", sku: "pa-W", qty: 2, price: 1000 }],
    payment: { method: "razorpay", status: "paid", razorpayOrderId: "order_A", razorpayPaymentId: "pay_a" },
    fulfilment: { status: "confirmed", trackingId: null, carrier: null },
    ...over,
  });
const fulfil = (orderId, status, extra = {}) => call("updateFulfilment", { orderId, status, ...extra }, boss.token);
const orderOf = async (id) => (await db.doc(`orders/${id}`).get()).data();

test("fulfilment: admins only, in order, tracking required to ship", async () => {
  await seedProduct("pa", 5);
  await seedOrder("ord-f1");
  assert.equal((await call("updateFulfilment", { orderId: "ord-f1", status: "packed" }, alice.token)).error?.status, "PERMISSION_DENIED");
  assert.equal((await fulfil("ord-f1", "delivered")).error?.status, "FAILED_PRECONDITION"); // skipping steps
  assert.equal((await fulfil("ord-f1", "packed")).result.ok, true);
  assert.equal((await fulfil("ord-f1", "shipped")).error?.status, "INVALID_ARGUMENT"); // no tracking
  assert.equal((await fulfil("ord-f1", "shipped", { trackingId: "TRK123", carrier: "DTDC" })).result.ok, true);
  assert.equal((await fulfil("ord-f1", "delivered")).result.ok, true);
  const o = await orderOf("ord-f1");
  assert.deepEqual([o.fulfilment.status, o.fulfilment.trackingId, o.fulfilment.carrier], ["delivered", "TRK123", "DTDC"]);
});

test("COD payment flips to paid only on delivery", async () => {
  await seedOrder("ord-cod", { payment: { method: "cod", status: "cod_pending", razorpayOrderId: null, razorpayPaymentId: null } });
  await fulfil("ord-cod", "packed");
  await fulfil("ord-cod", "shipped", { trackingId: "T1" });
  assert.equal((await orderOf("ord-cod")).payment.status, "cod_pending");
  await fulfil("ord-cod", "delivered");
  assert.equal((await orderOf("ord-cod")).payment.status, "paid");
});

test("unpaid orders cannot be fulfilled", async () => {
  await seedOrder("ord-unpaid", { payment: { method: "razorpay", status: "pending", razorpayOrderId: "o", razorpayPaymentId: null } });
  assert.equal((await fulfil("ord-unpaid", "packed")).error?.status, "FAILED_PRECONDITION");
});

test("cancel restores stock once, flags refund for paid orders, and refuses shipped orders", async () => {
  await seedProduct("pb", 3);
  await seedOrder("ord-c1", { items: [{ productId: "pb", sku: "pb-W", qty: 2, price: 1000 }] });
  assert.equal((await call("cancelOrder", { orderId: "ord-c1" }, alice.token)).error?.status, "PERMISSION_DENIED");
  assert.equal((await call("cancelOrder", { orderId: "ord-c1" }, boss.token)).result.ok, true);
  assert.equal(await stockOf("pb"), 5);
  const o = await orderOf("ord-c1");
  assert.deepEqual([o.fulfilment.status, o.refundDue, o.stockReserved], ["cancelled", true, false]);
  assert.equal((await call("cancelOrder", { orderId: "ord-c1" }, boss.token)).error?.status, "FAILED_PRECONDITION");
  assert.equal(await stockOf("pb"), 5); // not restored twice

  await seedOrder("ord-c2", { fulfilment: { status: "shipped" } });
  assert.equal((await call("cancelOrder", { orderId: "ord-c2" }, boss.token)).error?.status, "FAILED_PRECONDITION");
});

test("refund guards: COD refused, locked orders refused, over-refund refused", async () => {
  await seedOrder("ord-r1", { payment: { method: "cod", status: "cod_pending", razorpayOrderId: null, razorpayPaymentId: null } });
  assert.equal((await call("refundOrder", { orderId: "ord-r1" }, boss.token)).error?.status, "FAILED_PRECONDITION");
  await seedOrder("ord-r2", { payment: { method: "razorpay", status: "paid", razorpayOrderId: "o", razorpayPaymentId: "p", refundLock: true } });
  assert.match((await call("refundOrder", { orderId: "ord-r2" }, boss.token)).error?.message, /in progress/);
  await seedOrder("ord-r3", { payment: { method: "razorpay", status: "partially_refunded", razorpayOrderId: "o", razorpayPaymentId: "p", refundedAmount: 1000 } });
  assert.match((await call("refundOrder", { orderId: "ord-r3", amount: 500 }, boss.token)).error?.message, /At most ₹99/);
  assert.equal((await call("refundOrder", { orderId: "ord-r3" }, alice.token)).error?.status, "PERMISSION_DENIED");
});

test("admin can adjust stock (logged) and grant admin; role changes take effect", async () => {
  await seedProduct("pc", 4);
  assert.equal((await call("adjustStock", { productId: "pc", sku: "pc-W", newStock: 10, note: "recount" }, boss.token)).result.ok, true);
  assert.equal(await stockOf("pc"), 10);
  const log = await db.collection("inventoryLogs").where("productId", "==", "pc").get();
  assert.equal(log.docs[0].data().delta, 6);
  assert.equal((await call("setAdminRole", { email: "bob@example.com", admin: true }, boss.token)).result.ok, true);
});

test("Cash on Delivery can be switched off and the server enforces it", async () => {
  await seedProduct("pd", 3);
  await db.doc("storeSettings/main").set({ codEnabled: false });
  const r = await call("createOrder", base("pd", 1, "key-nocod-0001"), alice.token);
  assert.match(r.error?.message, /Cash on Delivery is not available/);
  assert.equal(await stockOf("pd"), 3);
  await db.doc("storeSettings/main").set({ codEnabled: true });
  assert.ok((await call("createOrder", base("pd", 1, "key-nocod-0002"), alice.token)).result);
});

test("a failed payment gives the coupon redemption back, once", async () => {
  await seedProduct("pe", 3);
  await db.doc("coupons/SAVE").set({ code: "SAVE", usedCount: 1, active: true });
  await db.doc(`coupons/SAVE/redemptions/${alice.uid}`).set({ count: 1 });
  await seedPending("ord-cp", alice.uid, "pe", "order_CP");
  await db.doc("orders/ord-cp").update({ couponCode: "SAVE" });
  const evt = { event: "payment.failed", payload: { payment: { entity: { id: "pay_cp", order_id: "order_CP", amount: 109900 } } } };
  await webhook(evt);
  await webhook(evt);
  assert.equal((await db.doc("coupons/SAVE").get()).data().usedCount, 0);
  assert.equal((await db.doc(`coupons/SAVE/redemptions/${alice.uid}`).get()).data().count, 0);
  // the customer retries and pays after all: the coupon is consumed again and the order is fulfilled
  await webhook({ event: "payment.captured", payload: { payment: { entity: { id: "pay_cp2", order_id: "order_CP", amount: 109900 } } } });
  assert.equal((await db.doc("coupons/SAVE").get()).data().usedCount, 1);
  assert.equal((await orderOf("ord-cp")).payment.status, "paid");
  assert.equal(await stockOf("pe"), 3); // released (+1) then re-reserved (-1)
});

test("team: list admins, add by email, unknown email, and no self-removal", async () => {
  const listed = (await call("listAdmins", null, boss.token)).result.admins.map((a) => a.email);
  assert.ok(listed.includes("boss@example.com"));
  assert.equal((await call("listAdmins", null, alice.token)).error?.status, "PERMISSION_DENIED");

  assert.equal((await call("setAdminRole", { email: "nobody@example.com", admin: true }, boss.token)).error?.status, "NOT_FOUND");
  assert.match((await call("setAdminRole", { email: "boss@example.com", admin: false }, boss.token)).error?.message, /own admin access/);

  // grant, then revoke, a second admin; their other claims are preserved
  await getAuth().setCustomUserClaims(alice.uid, { vip: true });
  assert.equal((await call("setAdminRole", { email: "alice@example.com", admin: true }, boss.token)).result.ok, true);
  let claims = (await getAuth().getUser(alice.uid)).customClaims;
  assert.deepEqual(claims, { vip: true, admin: true });
  assert.equal((await call("setAdminRole", { email: "alice@example.com", admin: false }, boss.token)).result.ok, true);
  claims = (await getAuth().getUser(alice.uid)).customClaims;
  assert.deepEqual(claims, { vip: true, admin: false });
});
