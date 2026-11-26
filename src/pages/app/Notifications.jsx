import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useWalletNotifications } from '@/hooks/useWalletNotifications';
import { dateTime } from '@/lib/wallet-api';

export default function Notifications() {
  const { notices, unread, markRead, isPending, error } = useWalletNotifications('customer');
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);
  const readAll = async () => { setBusy(true); try { await markRead(notices); } catch(err) { setActionError(err); } finally { setBusy(false); } };
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-4 h-4 text-[#396978]/75" />
        <h2 className="text-xl font-semibold text-[#22303a]/85" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Notifications</h2>
      </div>
      {(error || actionError) && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{(error || actionError).message}</p>}
      {unread > 0 && <button className="mb-5 rounded-lg bg-[#396978] px-4 py-2 text-sm text-white disabled:opacity-50" disabled={busy} onClick={readAll}>Mark all read</button>}
      {isPending ? <p className="text-sm text-[#66737c]">Loading notifications…</p> : notices.length ? <div className="divide-y divide-[#e5dfd5] rounded-xl border border-[#e5dfd5] bg-white px-5">{notices.map(n => <article className="py-5" key={n.id}><h3 className="text-base text-[#22303a]">{!n.read && <span className="mr-2 rounded bg-[#eef5f8] px-2 py-1 text-xs text-[#396978]">New</span>}{n.title}</h3><p className="mt-2 text-sm leading-6 text-[#66737c]">{n.body}</p><time className="mt-3 block text-xs text-[#8d979d]">{dateTime(n.created_at)}</time></article>)}</div> : !error && <div className="rounded-xl border border-[#e5dfd5] bg-white p-10 text-center">
        <Bell className="mx-auto mb-3 h-10 w-10 text-[#C9A84C]/35" />
        <p className="text-sm text-[#8d979d]">No notifications yet.</p>
      </div>}
    </div>
  );
}
