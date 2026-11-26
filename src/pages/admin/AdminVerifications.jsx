import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, CheckCircle2, XCircle, Clock, Eye, RefreshCw,
  FileText, ChevronDown, ChevronUp, AlertCircle, ExternalLink
} from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

const STATUS_STYLES = {
  not_submitted: { label: 'Not Submitted', color: 'text-[#57534c]', bg: 'bg-[#f7f5f0]' },
  pending:       { label: 'Pending',        color: 'text-amber-700',  bg: 'bg-amber-400/10' },
  under_review:  { label: 'Under Review',   color: 'text-amber-800',   bg: 'bg-amber-50' },
  verified:      { label: 'Verified',       color: 'text-emerald-700', bg: 'bg-emerald-400/10' },
  rejected:      { label: 'Rejected',       color: 'text-red-700',    bg: 'bg-red-400/10' },
};

const FILTERS = ['all', 'pending', 'under_review', 'verified', 'rejected'];

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.not_submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold ${s.bg} ${s.color}`}>
      {s.label}
    </span>
  );
}

function DocLink({ path, label }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!path) return <span className="text-sm text-[#57534c]">—</span>;

  const getUrl = async () => {
    setLoading(true);
    const { data } = await supabase.storage
      .from('verification-documents')
      .createSignedUrl(path, 60 * 10); // 10-min signed URL
    if (data?.signedUrl) {
      setUrl(data.signedUrl);
      window.open(data.signedUrl, '_blank');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={getUrl}
      disabled={loading}
      className="flex items-center gap-1.5 text-sm text-[#57534c] hover:underline disabled:opacity-50"
    >
      <FileText className="w-3.5 h-3.5" />
      {loading ? 'Loading...' : label}
      <ExternalLink className="w-3 h-3" />
    </button>
  );
}

function ReviewModal({ record, onClose, onUpdate }) {
  const [notes, setNotes] = useState(record.reviewer_notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const act = async (newStatus) => {
    setError('');
    setLoading(true);
    const { error: err } = await supabase
      .from('user_verifications')
      .update({
        status: newStatus,
        reviewer_notes: notes.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', record.id);
    setLoading(false);
    if (err) { setError(err.message); return; }
    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-[#e3e0da] bg-[#ffffff] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-1 text-2xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Review Verification
        </h2>
        <p className="mb-5 text-base text-[#57534c]">{record.email}</p>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#e3e0da] bg-[#f7f5f0] p-3">
            <p className="text-sm tracking-widest text-[#57534c]">RSA ID NUMBER</p>
            <p className="mt-1 font-mono text-base text-[#26231f]">{record.id_number ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-[#e3e0da] bg-[#f7f5f0] p-3">
            <p className="text-sm tracking-widest text-[#57534c]">SUBMITTED</p>
            <p className="mt-1 text-base text-[#26231f]">
              {record.submitted_at ? new Date(record.submitted_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <p className="text-sm tracking-widest text-[#57534c]">DOCUMENTS</p>
          <div className="flex gap-4">
            <DocLink path={record.id_document_url} label="ID Document" />
            <DocLink path={record.utility_bill_url} label="Utility Bill" />
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-bold tracking-widest text-[#57534c]">REVIEWER NOTES (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add a note for this decision..."
            className="w-full rounded-xl border border-[#e3e0da] bg-[#f7f5f0] px-4 py-3 text-base text-[#26231f] placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#a47c2e] resize-none"
          />
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => act('rejected')}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 py-3 text-base font-bold text-red-700 transition-colors hover:bg-red-400/20 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button
            onClick={() => act('under_review')}
            disabled={loading || record.status === 'under_review'}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-3 text-base font-bold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
          >
            <Clock className="w-4 h-4" /> Mark Under Review
          </button>
          <button
            onClick={() => act('verified')}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 py-3 text-base font-bold text-emerald-700 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve
          </button>
        </div>

        <button onClick={onClose} className="mt-4 w-full text-center text-sm text-[#57534c] hover:text-[#57534c]">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminVerifications() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [sort, setSort] = useState({ col: 'submitted_at', dir: 'desc' });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    // Join with auth.users email via a Postgres view isn't available directly,
    // so we fetch verifications and then batch-fetch emails via RPC or store email on submit
    const query = supabase
      .from('user_verifications')
      .select('*')
      .order(sort.col, { ascending: sort.dir === 'asc' });

    if (filter !== 'all') query.eq('status', filter);

    const { data } = await query;
    setRecords(data ?? []);
    setLoading(false);
  }, [filter, sort]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const toggleSort = (col) => {
    setSort((s) => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'desc' });
  };

  const SortIcon = ({ col }) =>
    sort.col === col
      ? sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3 opacity-20" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Verifications</h1>
          <p className="mt-1 text-base text-[#57534c]">{records.length} record{records.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={fetchRecords}
          className="flex items-center gap-2 rounded-xl border border-[#e3e0da] bg-[#f7f5f0] px-4 py-2 text-sm font-bold text-[#57534c] hover:text-[#26231f] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm font-bold capitalize transition-colors ${
              filter === f
                ? 'bg-[#ffffff] text-[#57534c]'
                : 'text-[#57534c] hover:text-[#57534c] border border-[#e3e0da]'
            }`}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e3e0da]">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-[#e3e0da] bg-[#ffffff]">
                {[
                  { label: 'User ID', col: 'user_id' },
                  { label: 'ID Number', col: 'id_number' },
                  { label: 'Status', col: 'status' },
                  { label: 'Submitted', col: 'submitted_at' },
                  { label: 'Documents', col: null },
                  { label: 'Actions', col: null },
                ].map(({ label, col }) => (
                  <th
                    key={label}
                    onClick={col ? () => toggleSort(col) : undefined}
                    className={`px-4 py-3 text-left text-sm font-bold tracking-widest text-[#57534c] ${col ? 'cursor-pointer hover:text-[#57534c] select-none' : ''}`}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {col && <SortIcon col={col} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#57534c] text-base">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#57534c] text-base">No records found.</td>
                </tr>
              ) : records.map((r) => (
                <tr key={r.id} className="border-b border-[#e3e0da] bg-[#ffffff] hover:bg-[#f7f5f0] transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-[#57534c]">{r.user_id.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-[#26231f]">{r.id_number ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-[#57534c]">
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <DocLink path={r.id_document_url} label="ID Doc" />
                      <DocLink path={r.utility_bill_url} label="Utility Bill" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(r)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#dedbd4] bg-[#ffffff] px-3 py-1.5 text-sm font-bold text-[#57534c] transition-colors hover:bg-[#ffffff]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ReviewModal
          record={selected}
          onClose={() => setSelected(null)}
          onUpdate={fetchRecords}
        />
      )}
    </div>
  );
}
