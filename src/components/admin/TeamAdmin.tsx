"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { listAdmins, setAdminRole } from "@/features/admin/callables";
import { errMsg } from "@/features/admin/hooks";
import { btn, Field, Input, Notice, PageHeader } from "./ui";

type Admin = { uid: string; email: string; name: string };

export function TeamAdmin() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const refresh = useCallback(() => {
    listAdmins().then((r) => setAdmins(r.admins)).catch((e) => setMsg({ kind: "error", text: errMsg(e) }));
  }, []);
  useEffect(refresh, [refresh]);

  async function change(target: string, admin: boolean) {
    setBusy(true); setMsg(null);
    try {
      await setAdminRole({ email: target.trim(), admin });
      setMsg({ kind: "ok", text: admin ? `${target} is now an admin. They must sign out and back in.` : `${target} is no longer an admin.` });
      if (admin) setEmail("");
      refresh();
    } catch (e) {
      setMsg({ kind: "error", text: errMsg(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Team" />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <form
        className="mb-8 flex max-w-xl flex-wrap items-end gap-3 border border-line bg-white p-5"
        onSubmit={(e) => { e.preventDefault(); if (email.trim()) void change(email, true); }}
      >
        <div className="min-w-[14rem] flex-1">
          <Field label="Add an admin by email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" /></Field>
        </div>
        <button className={btn} disabled={busy || !email.trim()}>Make admin</button>
        <p className="w-full text-xs text-muted">They need an account first (they can register on the store). After you add them, they must sign out and back in.</p>
      </form>

      <ul className="max-w-xl divide-y divide-line border border-line bg-white">
        {admins?.map((a) => (
          <li key={a.uid} className="flex items-center justify-between gap-4 p-4 text-sm">
            <span>
              <span className="block font-medium">{a.name || a.email}</span>
              {a.name && <span className="text-xs text-muted">{a.email}</span>}
              {a.uid === user?.uid && <span className="ml-2 text-xs text-muted">(you)</span>}
            </span>
            {a.uid !== user?.uid && (
              <button className="text-red-700 underline" disabled={busy}
                onClick={() => { if (confirm(`Remove admin access for ${a.email}?`)) void change(a.email, false); }}>
                Remove
              </button>
            )}
          </li>
        ))}
        {admins === null && <li className="p-4 text-sm text-muted">Loading…</li>}
        {admins?.length === 0 && <li className="p-4 text-sm text-muted">No admins found.</li>}
      </ul>
    </>
  );
}
